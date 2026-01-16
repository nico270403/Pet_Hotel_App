import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import pkg from "pg";
import hotelImagesRoutes from "./routes/hotelImages.js";
import chatRoutes from "./routes/chat.js";
import bookRoutes from "./routes/book.js";


//dotenv.config();
const { Pool } = pkg;

const app = express();

// CORS SUPER PERMISIV
app.use(cors({
  origin: true, // Permite TOATE originile
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pentru a permite toate request-urile
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use("/api/hotel_images", hotelImagesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/book", bookRoutes);


// Conectare DB cu fallback
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'app_hotel',
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 5000, // 5 sec timeout
  idleTimeoutMillis: 30000,
});

// Test conexiune DB
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conectat la PostgreSQL - TEST SUCCESS');
  } catch (err) {
    console.error('❌ Eroare conectare PostgreSQL:', err.message);
  } finally {
    if (client) client.release();
  }
};

testConnection();


app.use((req, res, next) => {
  console.log(`📍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`📍 Client IP: ${req.ip} | Headers:`, req.headers['origin'] || 'no-origin');
  next();
});
// ROUTES SIMPLE

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend merge perfect!", 
    status: "success",
    timestamp: new Date().toISOString()
  });
});

// Health check pentru frontend
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "API Health OK", 
    status: "success",
    database: "connected"
  });
});

// Get all hotels - SIMPLU
app.get("/api/hotels", async (req, res) => {
  try {
    console.log("📡 Cerere pentru hoteluri primită");
    
    const result = await pool.query(`
      SELECT id, name, short_description, city, rating, image_url
      FROM hotels 
      ORDER BY rating DESC
    `);
    
    console.log(`✅ Trimit ${result.rows.length} hoteluri`);
    
    res.json({
      success: true,
      hotels: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error("❌ Eroare la getHotels:", error);
    res.status(500).json({
      success: false,
      error: "Database error",
      message: error.message
    });
  }
});

// Get hotel by ID
app.get("/api/hotels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    res.json({ hotel: result.rows[0] });
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Create booking
// app.post('/api/bookings', async (req, res) => {
//   try {
//     const {
//       hotel_id,
//       user_id,
//       animal_id,  // IMPORTANT: Acum primești direct animal_id din frontend
//       start_date,
//       end_date,
//       price_total,
//       currency = 'RON',
//       status = 'pending',
//       services = []
//     } = req.body;

//     console.log('📅 Creare rezervare cu datele:', req.body);

//     // 1. Inserează rezervarea în baza de date (fără pet_name!)
//     const bookingResult = await pool.query(
//       `INSERT INTO bookings 
//        (hotel_id, user_id, animal_id, start_date, end_date, 
//         price_total, currency, status, created_at)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
//        RETURNING id`,
//       [hotel_id, user_id, animal_id, start_date, end_date,
//        price_total, currency, status]
//     );
    
//     res.json({ 
//       success: true,
//       booking: result.rows[0],
//       message: "Rezervare creată cu succes!"
//     });
//   } catch (error) {
//     console.error("Error creating booking:", error);
//     res.status(500).json({ 
//       success: false,
//       error: "Database error" 
//     });
//   }
// });

// Pornire server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Ascultă pe toate interfețele

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend Server pornit!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Rețea: http://172.20.10.2:${PORT}`); 
  console.log(`📍 Accesibil de pe orice dispozitiv din rețea`);
});
