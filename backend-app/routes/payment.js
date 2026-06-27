import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import Stripe from "stripe";
import pool from "../db.js";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 
const router = express.Router();


router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;
    
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error(`Suma invalidă primită: ${amount}`);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100), 
      currency: "ron",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Eroare Stripe pe Backend:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put("/mark-paid/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  try {
    await pool.query("UPDATE bookings SET status = 'paid' WHERE id = $1", [bookingId]);
    
    console.log(`✅ Rezervarea ${bookingId} a fost marcată ca plătită!`);
    res.json({ success: true, message: "Rezervarea a fost marcată ca plătită!" });
  } catch (error) {
    console.error("❌ Eroare la actualizarea bazei de date:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;