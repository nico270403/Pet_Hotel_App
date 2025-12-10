import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { user_id, hotel_id, pet_type, check_in, check_out } = req.body;

    const conflict = await pool.query(
      `SELECT * FROM reservations
       WHERE hotel_id = $1
       AND NOT ($3 < check_in OR $2 > check_out)`,
      [hotel_id, check_in, check_out]
    );

    if (conflict.rows.length > 0) {
      return res.json({
        success: false,
        message: "Hotelul nu este disponibil în perioada selectată."
      });
    }

    const insert = await pool.query(
      `INSERT INTO reservations (user_id, hotel_id, pet_type, check_in, check_out)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, hotel_id, pet_type, check_in, check_out]
    );

    res.json({
      success: true,
      message: "Rezervarea a fost creată cu succes!",
      reservation: insert.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la /book" });
  }
});

export default router;
