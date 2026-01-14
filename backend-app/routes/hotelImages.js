// hotelImages.js - CORECTAT
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/:hotelId", async (req, res) => {
  try {
    // verific hotelId
    const hotelId = parseInt(req.params.hotelId);
    
    if (isNaN(hotelId)) {
      return res.status(400).json({ 
        error: "ID hotel invalid" 
      });
    }

    const result = await pool.query(
      "SELECT * FROM hotel_images WHERE hotel_id = $1",
      [hotelId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la imagini hotel:", err);
    res.status(500).json({ 
      error: "Eroare server",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;


