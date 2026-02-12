import express from "express";
import pool from "../db.js"; 
import nodemailer from "nodemailer";

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

    
    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        hotel_id, user_id, animal_id, start_date, end_date, 
        price_total, currency, status, owner_email, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING id`,
      [hotel_id, user_id, animal_id, start_date, end_date, price_total, "RON", "pending", owner_email]
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

export default router;
