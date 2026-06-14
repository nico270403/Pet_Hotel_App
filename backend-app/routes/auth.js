import express from "express";
import pool from "../db.js";
import { Expo } from 'expo-server-sdk';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

let expo = new Expo();
const router = express.Router();

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  return passwordRegex.test(password);
};

router.post("/register", async (req, res) => {
  const { name, email, password, phone, role } = req.body; 

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Adresa de email nu este validă." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ 
      success: false, 
      message: "Parola trebuie să aibă minim 12 caractere, o literă mare, o literă mică, o cifră și un caracter special." 
    });
  }

  const userRole = role === 'manager' ? 'manager' : 'client';

  try {
    const saltRounds=10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, phone, role`,
      [name, email, hashedPassword, phone || null, userRole]
    );
    
    res.json({ success: true, user: { ...result.rows[0], hotel_ids: [] } });
  } catch (err) {
    console.error("Eroare Register:", err);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: "Acest email este deja folosit!" });
    }
    res.status(500).json({ success: false, message: "Eroare la înregistrare" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query( "SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (match){
         let hotels = [];

        if (user.role === 'manager') {
          const hotelsResult = await pool.query(
            "SELECT id, name FROM hotels WHERE manager_id = $1",
            [user.id]
          );
          hotels = hotelsResult.rows;
        }

        res.json({ 
          success: true, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            phone: user.phone,
            role: user.role,         
            hotels: hotels 
          } 
        });
    } else {
      res.status(401).json({ success: false, message: "Email sau parolă incorectă" });
    }
  } } catch (err) {
    console.error("Eroare Login:", err);
    res.status(500).json({ error: "Eroare server la login" });
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'adresa.ta@gmail.com',
    pass: 'parola_de_aplicatie_gmail' 
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Adresa de email nu este validă." });
  }

  try {
    const userExists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Nu există niciun cont asociat acestei adrese de e-mail." });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date(Date.now() + 15 * 60000);
    await pool.query(
      "UPDATE users SET reset_code = $1, reset_code_expires = $2 WHERE email = $3",
      [resetCode, expireTime, email]
    );


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Cod de resetare a parolei",
      html: `
        <h2>Resetare Parolă</h2>
        <p>Codul tău pentru resetarea parolei este: <strong style="font-size: 20px;">${resetCode}</strong></p>
        <p>Acest cod este valabil 15 minute. Dacă nu ai cerut tu resetarea, te rugăm să ignori acest mesaj.</p>
      `
    });
    res.json({ success: true, message: "Codul a fost trimis pe adresa de e-mail introdusă." });
  } catch (err) {
    console.error("Eroare la forgot-password:", err);
    res.status(500).json({ success: false, message: "Eroare server." });
  }
});

router.post("/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND reset_code = $2 AND reset_code_expires > NOW()",
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Codul este incorect sau a expirat." });
    }

    res.json({ success: true, message: "Cod valid." });
  } catch (err) {
    console.error("Eroare la verify-code:", err);
    res.status(500).json({ success: false, message: "Eroare internă." });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ success: false, message: "Parola nouă nu îndeplinește condițiile de securitate. Aceasta trebuie să fie de minim 12 caractere și să conțină cel puțin: o literă mică, o literă mare, o cifră și un caracter special(!?:;.)." });
  }

  try {
    const valid = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND reset_code = $2 AND reset_code_expires > NOW()",
      [email, code]
    );

    if (valid.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Cod invalid sau expirat." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      "UPDATE users SET password_hash = $1, reset_code = NULL, reset_code_expires = NULL WHERE email = $2",
      [hashedPassword, email]
    );

    res.json({ success: true, message: "Parola a fost schimbată cu succes!" });
  } catch (err) {
    console.error("Eroare la reset-password:", err);
    res.status(500).json({ success: false, message: "Eroare internă." });
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
    res.json({ success: true, message: "Token salvat cu succes" });
  } catch (err) {
    console.error("Eroare salvare push token:", err);
    res.status(500).json({ success: false, error: "Eroare internă" });
  }
});

router.get("/test-push/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query("SELECT expo_push_token FROM users WHERE id = $1", [userId]);
    const pushToken = result.rows[0]?.expo_push_token;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      return res.status(400).send(`Userul nu are un token valid setat.`);
    }

    let messages = [{
      to: pushToken,
      sound: 'default',
      title: 'Pet Hotel',
      body: 'Yey! Funcționează perfect!',
      data: { redirectTo: 'MyBookings' },
    }];

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    res.send(`Notificare trimisă cu succes!`);
  } catch (error) {
    console.error(error);
    res.status(500).send(`Eroare: ${error.message}`);
  }
});

export default router;