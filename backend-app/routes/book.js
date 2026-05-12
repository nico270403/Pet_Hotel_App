import express from "express";
import pool from "../db.js"; 
import nodemailer from "nodemailer";
import { Expo } from 'expo-server-sdk';

let expo = new Expo();


const router = express.Router();

router.post("/bookings", async (req, res) => {
  try {
    const {
      hotel_id,
      user_id,
      pet_name,
      pet_type,
      owner_name,
      owner_email,
      check_in,
      check_out,
      price
    } = req.body;

    console.log("📅 Creare rezervare cu datele:", req.body);

    if (!check_in || !check_out) {
      return res.status(400).json({
        success: false,
        message: "Datele de check-in și check-out sunt obligatorii"
      });
    }

    if (!hotel_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Hotelul și utilizatorul sunt obligatorii"
      });
    }

    const start_date = check_in;
    const end_date = check_out;
    const price_total = price ?? 0;


    const animalResult = await pool.query(
      `SELECT id FROM animals WHERE name = $1 LIMIT 1`,
      [pet_name]
    );

    let animal_id;
    if (animalResult.rows.length > 0) {
      animal_id = animalResult.rows[0].id;
    } else {
      const newAnimal = await pool.query(
        `INSERT INTO animals (name) VALUES ($1) RETURNING id`,
        [pet_name]
      );
      animal_id = newAnimal.rows[0].id;
    }


    // 1. Aflăm capacitatea maximă a hotelului
    const hotelInfo = await pool.query(`SELECT name, capacity FROM hotels WHERE id = $1`, [hotel_id]);
    const hotelCapacity = hotelInfo.rows[0]?.capacity || 5; 
    const nume_hotel_verificat = hotelInfo.rows[0]?.name || "Hotel necunoscut";

    // 2. Numărăm câte rezervări active se suprapun cu perioada cerută
    const overlapCheck = await pool.query(`
      SELECT COUNT(*) as occupied_spots 
      FROM bookings 
      WHERE hotel_id = $1 
        AND status IN ('pending', 'approved', 'paid')
        AND start_date < $3 
        AND end_date > $2
    `, [hotel_id, start_date, end_date]);

    const occupiedSpots = parseInt(overlapCheck.rows[0].occupied_spots);

    // 3. Dacă locurile ocupate sunt egale sau mai mari decât capacitatea, blocăm rezervarea
    if (occupiedSpots >= hotelCapacity) {
      console.log(`⚠️ Hotelul ${nume_hotel_verificat} este PLIN! (${occupiedSpots}/${hotelCapacity} locuri ocupate)`);
      return res.status(400).json({
        success: false,
        message: `Ne pare rău, dar ${nume_hotel_verificat} nu mai are locuri disponibile în perioada selectată. Încearcă alte date sau alt hotel!`
      });
    }

    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        hotel_id, user_id, animal_id, pet_name, pet_type, start_date, end_date, 
        price_total, currency, status, owner_email, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id`,
      [hotel_id, user_id, animal_id, pet_name, pet_type, start_date, end_date, price_total, "RON", "pending", owner_email]
    );

    const bookingId = bookingResult.rows[0].id;

    const hotelResult = await pool.query(
      `SELECT name FROM hotels WHERE id = $1`,
      [hotel_id]
    );

    const hotel_name = hotelResult.rows[0]?.name || "Hotel necunoscut";


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
        to: process.env.EMAIL_ADMIN,
        subject: `Confirmă cererea lui ${owner_name} la hotel ${hotel_name}`,
        html: `
          <h2>Rezervare nouă</h2>
          <p><strong>Hotel:</strong> ${hotel_name}</p>
          <p>Animal: ${pet_name} (${pet_type})</p>
          <p>Proprietar: ${owner_name} (${owner_email})</p>
          <p>Perioada: ${check_in} - ${check_out}</p>
          <p><strong>Preț total:</strong> ${price_total} RON</p>
          <p>
            <a href="${process.env.BACKEND_URL}/api/book/${bookingId}/accept">✅ Aprobați</a>
            <a href="${process.env.BACKEND_URL}/api/book/${bookingId}/reject">❌ Respingeți</a>
          </p>
        `
      });
      console.log("✅ Email trimis cu succes către admin!");
    } catch (emailErr) {
      console.warn("⚠️ Rezervarea a fost salvată, dar emailul nu a putut fi trimis:", emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Rezervarea a fost creată cu succes!",
      bookingId: bookingId
    });

  } catch (error) {
    console.error("❌ Eroare creare rezervare:", error);
    return res.status(500).json({
      success: false,
      message: "Eroare internă la creare rezervare"
    });
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
          subject: "Rezervarea ta a fost aprobată ✅",
          html: `<h2>Rezervarea ta a fost aprobată!</h2>
//             <p><strong>Hotel:</strong> ${hotel_name}</p>
//             <p>Perioada: ${booking.start_date} - ${booking.end_date}</p>
//             <p><strong>Preț total:</strong>
//               ${booking.price_total} RON
//             </p>
//             <p>Status: <strong>Aprobată</strong></p>
//             <p>Te așteptăm cu drag! 🐾</p>
//           `
        });
      } catch (err) { console.warn("⚠️ Email user Netrimis:", err.message); }
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
        console.log("📱 Notificare Push trimisă automat cu succes!");
      }
    } catch (pushErr) {
      console.warn("⚠️ Eroare la trimiterea notificării push:", pushErr.message);
    }
    }
    res.send("<h2>✅ Rezervarea a fost aprobată</h2>");
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
          subject: "Rezervarea ta a fost respinsă ❌",
          html: `<h2>Rezervarea ta a fost respinsă!</h2>
                  <p>Ne pare rău!</p>
                  <p>îți mulțumim că ne-ai ales! Data viitoare este cu noroc! 🐾</p>`
        });
      } catch (err) { console.warn("⚠️ Email user netrimis:", err.message); }
    }
    res.send("<h2>Rezervarea a fost respinsă ❌</h2>");
  } catch (err) {
    res.status(500).send("Eroare la respingere");
  }
});

router.get("/unavailable-dates/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;

    // 1. Aflăm capacitatea hotelului
    const hotelInfo = await pool.query(`SELECT capacity FROM hotels WHERE id = $1`, [hotelId]);
    const capacity = hotelInfo.rows[0]?.capacity || 5;

    // 2. Luăm toate rezervările active pentru acest hotel
    const bookings = await pool.query(`
      SELECT start_date, end_date
      FROM bookings
      WHERE hotel_id = $1 AND status IN ('pending', 'approved', 'paid')
    `, [hotelId]);

    // 3. Calculăm câte animale sunt cazate în fiecare noapte
    const occupancy = {};
    bookings.rows.forEach(b => {
      let current = new Date(b.start_date);
      const end = new Date(b.end_date);
      
      // Iterăm prin fiecare noapte a rezervării
      while(current < end) {
        const dateStr = current.toISOString().split('T')[0]; // ex: "2026-05-21"
        occupancy[dateStr] = (occupancy[dateStr] || 0) + 1;
        current.setDate(current.getDate() + 1);
      }
    });

    // 4. Filtrăm doar zilele unde s-a atins capacitatea maximă
    const fullDates = Object.keys(occupancy).filter(date => occupancy[date] >= capacity);

    res.json({ success: true, fullDates });
  } catch (err) {
    console.error("Eroare unavailable dates:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
