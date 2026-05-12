import express from "express";
import pool from "../db.js";
import { Expo } from 'expo-server-sdk'


let expo = new Expo();

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

// Rută pentru salvarea token-ului de notificări
router.post("/update-push-token", async (req, res) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({ success: false, message: "Lipsesc datele" });
  }

  try {
    await pool.query(
      "UPDATE users SET expo_push_token = $1 WHERE id = $2", 
      [token, userId]
    );
    console.log(`📱 Token Push actualizat pentru userul ${userId}`);
    res.json({ success: true, message: "Token salvat cu succes" });
  } catch (err) {
    console.error("❌ Eroare salvare push token:", err);
    res.status(500).json({ success: false, error: "Eroare internă" });
  }
});


// Rută pentru a testa trimiterea unei notificări
router.get("/test-push/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Luăm token-ul userului din baza de date
    const result = await pool.query("SELECT expo_push_token FROM users WHERE id = $1", [userId]);
    const pushToken = result.rows[0]?.expo_push_token;

    // 2. Verificăm dacă token-ul există și e valid
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      return res.status(400).send(`❌ Userul ${userId} nu are un token valid setat.`);
    }

    // 3. Creăm mesajul notificării
    let messages = [{
      to: pushToken,
      sound: 'default',
      title: '🐾 Pet Hotel',
      body: 'Yey! Funcționează perfect! Prima ta notificare push!',
      data: { redirectTo: 'MyBookings' },
    }];

    // 4. Trimitem mesajul
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    res.send(`<h2>✅ Notificare trimisă cu succes către telefonul tău!</h2><p>Verifică ecranul telefonului!</p>`);
  } catch (error) {
    console.error(error);
    res.status(500).send(`Eroare: ${error.message}`);
  }
});


export default router;