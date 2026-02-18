import express from "express";
import pool from "../db.js";

const router = express.Router();


router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password_hash = $2", 
      [email, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          phone: user.phone 
        } 
      });
    } else {
      res.status(401).json({ success: false, message: "Email sau parolă incorectă" });
    }
  } catch (err) {
    console.error("Eroare Login:", err);
    res.status(500).json({ error: "Eroare server la login" });
  }
});


router.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body; 

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, phone`,
      [name, email, password, phone || null]
    );
    
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Eroare Register:", err);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: "Acest email este deja folosit!" });
    }
    res.status(500).json({ success: false, message: "Eroare la înregistrare" });
  }
});


router.get("/my-bookings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT b.*, h.name as hotel_name, h.city 
       FROM bookings b 
       JOIN hotels h ON b.hotel_id = h.id 
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
      [userId]
    );
    
    res.json({ bookings: result.rows });
  } catch (err) { 
    console.error("Eroare Istoric:", err);
    res.status(500).json({ error: "Nu am putut încărca istoricul" }); 
  }
});

export default router;