// backend-app/routes/chat.js
import express from "express";
import pool from "../db.js";
import { askModel } from "./llm-ollama-extractor.js"; // ← IMPORT DIN ACELAȘI FOLDER!
import fs from "fs";

const router = express.Router();
const systemPrompt = fs.readFileSync("./prompts/chat_system.txt", "utf8");

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({ 
        text: "Vă rog să scrieți un mesaj.",
        intent: "unknown" 
      });
    }

    console.log("📩 Mesaj primit:", message);

    // 1. Extrage parametrii
    const aiIntent = await askModel([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]);
    
    console.log("🎯 Intent extras:", aiIntent);

    if (!aiIntent || !aiIntent.intent) {
      return res.json({ 
        text: "Nu am înțeles cererea. Poți reformula?",
        intent: "unknown" 
      });
    }

    // 2. CĂUTARE - Folosește tabela care există!
    if (aiIntent.intent === "search") {
      // VARIANTA 1: Dacă ai tabela 'hotels' (care există)
      let query = `SELECT * FROM hotels WHERE 1=1`;
      const params = [];
      let paramIndex = 1;

      if (aiIntent.city) {
        query += ` AND city ILIKE $${paramIndex}`;
        params.push(`%${aiIntent.city}%`);
        paramIndex++;
      }
      
      // Dacă tabela hotels nu are pet_types, ignorăm filtrul
      // Dacă vrei să filtrezi și după animale, adaugă coloana pet_types
      
      query += ` ORDER BY rating DESC LIMIT 10`;
      
      console.log("🔍 Query:", query, "Params:", params);

      const hotels = await pool.query(query, params);
      
      console.log(`✅ Găsite ${hotels.rows.length} hoteluri`);

      // Generează răspuns
      let responseText = "";
      if (hotels.rows.length === 0) {
        responseText = "Nu am găsit hoteluri.";
      } else {
        responseText = `Am găsit ${hotels.rows.length} hoteluri`;
        if (aiIntent.city) responseText += ` în ${aiIntent.city}`;
        if (aiIntent.pet_type) responseText += ` pentru ${aiIntent.pet_type}`;
      }

      return res.json({
        text: responseText,
        data: hotels.rows,
        intent: "search"
      });
    }

    // 3. REZERVARE
    if (aiIntent.intent === "book") {
      return res.json({
        text: "Înțeleg că vrei să faci o rezervare. Te rog să specifici hotelul și datele.",
        intent: "book"
      });
    }

    // 4. NECUNOSCUT
    res.json({ 
      text: "Nu am înțeles. Poți să reformulezi? (ex: 'Caut hotel în București')",
      intent: "unknown" 
    });

  } catch (err) {
    console.error("❌ Eroare în /chat:", err);
    res.status(500).json({ 
      text: "Eroare tehnică.",
      intent: "error"
    });
  }
});

export default router;