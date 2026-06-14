import express from "express";
import pool from "../db.js";
import nodemailer from "nodemailer";
import { Expo } from 'expo-server-sdk';
import { isValidDate } from "./dateValidator.js";

let expo = new Expo();
const router = express.Router();

const parseD = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateRO = (d) => {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};


router.post("/bookings", async (req, res) => {
  try {
    const {
      hotel_id, user_id, pet_name, pet_type,
      owner_name, owner_email, owner_phone, check_in, check_out, price
    } = req.body;

    if (!check_in || !check_out) {
      return res.status(400).json({ success: false, message: "Datele sunt obligatorii." });
    }

    if (!isValidDate(check_in) || !isValidDate(check_out)) {
      return res.status(400).json({ success: false, message: "Dată introdusă eronat." });
    }

    const inDate = parseD(check_in);
    const outDate = parseD(check_out);

    if (outDate <= inDate) {
      return res.status(400).json({ success: false, message: "Check-out trebuie să fie după check-in." });
    }

    const durationDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hotelInfo = await pool.query(`SELECT h.name, h.capacity, u.email as manager_email FROM hotels h LEFT JOIN users u ON h.manager_id=u.id WHERE h.id = $1 `, [hotel_id]);
    const hotelCapacity = hotelInfo.rows[0]?.capacity || 5;
    const hotelName = hotelInfo.rows[0]?.name;
    const managerEmail = hotelInfo.rows[0]?.manager_email;
    const targetEmail = managerEmail ? managerEmail : process.env.EMAIL_ADMIN;

    const allBookings = await pool.query(`
      SELECT start_date, end_date 
      FROM bookings 
      WHERE hotel_id = $1 
        AND status IN ('pending', 'approved', 'paid')
        AND end_date >= CURRENT_DATE
    `, [hotel_id]);

    const occupancy = {};
    const incrementDate = (d) => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; };

    allBookings.rows.forEach(b => {
      let curr = new Date(b.start_date);
      const end = new Date(b.end_date);
      while (curr < end) {
        const dStr = formatD(curr);
        occupancy[dStr] = (occupancy[dStr] || 0) + 1;
        curr = incrementDate(curr);
      }
    });

    const isSlotAvailable = (startD, duration) => {
      let curr = new Date(startD);
      for (let i = 0; i < duration; i++) {
        if ((occupancy[formatD(curr)] || 0) >= hotelCapacity) return false;
        curr = incrementDate(curr);
      }
      return true;
    };

    const isRequestedAvailable = isSlotAvailable(inDate, durationDays);

    if (!isRequestedAvailable) {
      let nextSlotStart = new Date(inDate);
      nextSlotStart.setDate(nextSlotStart.getDate() + 1);
      let nextFound = null;
      for (let i = 0; i < 90; i++) { 
        if (isSlotAvailable(nextSlotStart, durationDays)) {
          nextFound = new Date(nextSlotStart);
          break;
        }
        nextSlotStart.setDate(nextSlotStart.getDate() + 1);
      }

      let prevSlotStart = new Date(inDate);
      prevSlotStart.setDate(prevSlotStart.getDate() - 1);
      let prevFound = null;
      for (let i = 0; i < 90; i++) {
        if (prevSlotStart < today) break;
        if (isSlotAvailable(prevSlotStart, durationDays)) {
          prevFound = new Date(prevSlotStart);
          break;
        }
        prevSlotStart.setDate(prevSlotStart.getDate() - 1);
      }

      let suggestionMsg = "";
      if (prevFound || nextFound) {
        suggestionMsg += `\n\n💡 Sugestii libere pentru ${durationDays} nopți:`;
        
        if (prevFound) {
          const prevEnd = new Date(prevFound);
          prevEnd.setDate(prevEnd.getDate() + durationDays);
          suggestionMsg += `\n⏪ ${formatDateRO(prevFound)} - ${formatDateRO(prevEnd)}`;
        }
        if (nextFound) {
          const nextEnd = new Date(nextFound);
          nextEnd.setDate(nextEnd.getDate() + durationDays);
          suggestionMsg += `\n⏩ ${formatDateRO(nextFound)} - ${formatDateRO(nextEnd)}`;
        }
      }

      return res.status(400).json({
        success: false,
        message: `Din păcate, ${hotelName} nu are suficiente locuri în perioada dorită.` + suggestionMsg
      });
    }

    const allAnimalsResult = await pool.query(`SELECT id, name FROM animals`);
    const normalizedInput = pet_type.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const matchedAnimal = allAnimalsResult.rows.find(a => 
      a.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalizedInput
    );

    if (!matchedAnimal) {
      return res.status(400).json({ success: false, message: `Specia "${pet_type}" nu este recunoscută.` });
    }

    const relationCheck = await pool.query(
      `SELECT * FROM hotel_animals WHERE hotel_id = $1 AND animal_id = $2`,
      [hotel_id, matchedAnimal.id]
    );

    if (relationCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: `Acest hotel nu acceptă ${pet_type}.` });
    }

    const price_total = price || 100;

    const result = await pool.query(
      `INSERT INTO bookings (
        hotel_id, user_id, animal_id, pet_name, pet_type, start_date, end_date, 
        price_total, currency, status, owner_email, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id`,
      [
        hotel_id, user_id, matchedAnimal.id, pet_name, pet_type, 
        check_in, check_out, price_total, "RON", "pending", owner_email
      ]
    );

    const bookingId = result.rows[0].id;

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
        to: targetEmail,
        subject: `Cerere de cazare! `,
        html: `
          <h2>Rezervare nouă.</h2>
          <p><strong>Hotel:</strong> ${hotelName}</p>
          <p><strong>Animal:</strong> ${pet_name} (${pet_type})</p>
          <p><strong>Proprietar:</strong> ${owner_name} (${owner_email})</p>
          <p><strong>Perioada:</strong> ${check_in} - ${check_out}</p>
          <p><strong>Preț total:</strong> ${price_total} RON</p>
          <p>
            <a href="${process.env.BACKEND_URL}/api/book/${bookingId}/accept" style="padding: 10px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">✅ Aprobați</a>
            <a href="${process.env.BACKEND_URL}/api/book/${bookingId}/reject" style="padding: 10px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">❌ Respingeți</a>
          </p>
        `
      });
    } catch (emailErr) {
      console.warn("Eroare la trimiterea emailului către manager:", emailErr.message);
    }

    return res.json({ success: true, bookingId: bookingId });

  } catch (err) {
    console.error("Eroare la crearea rezervării:", err);
    return res.status(500).json({ success: false, message: "Eroare internă la procesarea rezervării." });
  }
});

router.get("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE bookings SET status = 'approved' WHERE id=$1 RETURNING *`,
      [id]
    );
    const booking = result.rows[0];

    const hotelResult = await pool.query(
      `SELECT name FROM hotels WHERE id = $1`,
      [booking.hotel_id]
    );
    const hotel_name = hotelResult.rows[0]?.name || "Hotel necunoscut";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    if (booking.owner_email) {
      try {
        await transporter.sendMail({
          from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
          to: booking.owner_email,
          subject: "Rezervare aprobată ✅",
          html: `
            <h2>Rezervarea ta a fost aprobată!</h2>
            <p><strong>Hotel:</strong> ${hotel_name}</p>
            <p><strong>Perioada:</strong> ${new Date(booking.start_date).toLocaleDateString('ro-RO')} - ${new Date(booking.end_date).toLocaleDateString('ro-RO')}</p>
            <p><strong>Animal:</strong> ${booking.pet_name} (${booking.pet_type})</p>
            <p><strong>Preț total:</strong> ${parseFloat(booking.price_total).toFixed(0)} RON</p>
            <p>Status:</strong> <strong style="color: #10b981;">Aprobată</strong></p>
            <p>Te așteptăm cu drag! 🐾</p>
          `
        });
      } catch (err) { 
        console.warn("Eroare la trimitere email către utilizator:", err.message); 
      }
      
      try {
        const userRes = await pool.query("SELECT expo_push_token FROM users WHERE id = $1", [booking.user_id]);
        const pushToken = userRes.rows[0]?.expo_push_token;

        if (pushToken && Expo.isExpoPushToken(pushToken)) {
          let messages = [{
            to: pushToken,
            sound: 'default',
            title: '✅ Rezervare Aprobată!',
            body: `Rezervarea ta la ${hotel_name} a fost confirmată. Te așteptăm!`,
            data: { redirectTo: 'MyBookings' },
          }];
          
          let chunks = expo.chunkPushNotifications(messages);
          for (let chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
          }
        }
      } catch (pushErr) {
        console.warn("Eroare la trimiterea notificării push:", pushErr.message);
      }
    }
    res.send("<h2>✅ Rezervarea a fost aprobată cu succes!</h2>");
  } catch (err) {
    res.status(500).send("Eroare la aprobare");
  }
});

router.get("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE bookings SET status = 'rejected' WHERE id=$1 RETURNING *`,
      [id]
    );
    const booking = result.rows[0];

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    if (booking.owner_email) {
      try {
        await transporter.sendMail({
          from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
          to: booking.owner_email,
          subject: "Rezervare respinsă ❌",
          html: `
            <h2>Rezervarea ta a fost respinsă!</h2>
            <p>Ne pare rău!</p>
            <p>Îți mulțumim că ne-ai ales! Data viitoare este cu noroc! 🐾</p>
          `
        });
      } catch (err) { 
        console.warn("Eroare la trimitere email către utilizator:", err.message); 
      }
    }
    res.send("<h2>Rezervarea a fost respinsă ❌</h2>");
  } catch (err) {
    res.status(500).send("Eroare la respingere");
  }
});

router.get("/unavailable-dates/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotelInfo = await pool.query(`SELECT capacity FROM hotels WHERE id = $1`, [hotelId]);
    const capacity = hotelInfo.rows[0]?.capacity || 5;

    const bookings = await pool.query(`
      SELECT start_date, end_date
      FROM bookings
      WHERE hotel_id = $1 AND status IN ('pending', 'approved', 'paid')
    `, [hotelId]);

    const occupancy = {};
    bookings.rows.forEach(b => {
      let current = new Date(b.start_date);
      const end = new Date(b.end_date);
      
      while(current < end) {
        const dateStr = formatD(current); 
        occupancy[dateStr] = (occupancy[dateStr] || 0) + 1;
        current.setDate(current.getDate() + 1);
      }
    });

    const fullDates = Object.keys(occupancy).filter(date => occupancy[date] >= capacity);

    res.json({ success: true, fullDates });
  } catch (err) {
    console.error("Eroare fetch unavailable dates:", err);
    res.status(500).json({ success: false });
  }
});

export default router;