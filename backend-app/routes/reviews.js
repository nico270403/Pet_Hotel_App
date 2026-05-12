import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { hotel_id, user_id, booking_id, rating, comment } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Inserăm recenzia
    await client.query(
      "INSERT INTO reviews (hotel_id, user_id, booking_id, rating, comment) VALUES ($1, $2, $3, $4, $5)",
      [hotel_id, user_id, booking_id, rating, comment]
    );

    // 2. Marcăm rezervarea ca fiind evaluată
    await client.query("UPDATE bookings SET reviewed = TRUE WHERE id = $1", [booking_id]);

    // 3. Recalculăm media rating-ului pentru hotel
    const avgRes = await client.query(
      "SELECT AVG(rating) as new_rating FROM reviews WHERE hotel_id = $1",
      [hotel_id]
    );
    
    const newRating = parseFloat(avgRes.rows[0].new_rating).toFixed(1);

    // 4. Actualizăm rating-ul în tabela hotels
    await client.query("UPDATE hotels SET rating = $1 WHERE id = $2", [newRating, hotel_id]);

    await client.query('COMMIT');
    res.json({ success: true, newRating });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Eroare la salvarea recenziei" });
  } finally {
    client.release();
  }
});

// Rută pentru a citi recenziile unui hotel specific
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;
    const result = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.hotel_id = $1
       ORDER BY r.created_at DESC`,
      [hotelId]
    );
    res.json({ success: true, reviews: result.rows });
  } catch (err) {
    console.error("Eroare la aducerea recenziilor:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

export default router;