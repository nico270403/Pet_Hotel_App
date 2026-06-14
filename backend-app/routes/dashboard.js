import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/create-hotel', upload.fields([
  { name: 'mainImage', maxCount: 1 }, 
  { name: 'gallery', maxCount: 15 }
]), async (req, res) => {
  try {
    const { 
      userId, email, name, phone, website, 
      county, city, address, latitude, longitude, 
      capacity, price, short_description, long_description 
    } = req.body;

    let animals = [];
    try {
      animals = JSON.parse(req.body.animals);
    } catch (e) {}

    let mainImageUrl = null;
    if (req.files && req.files['mainImage']) {
      mainImageUrl = `http://172.20.10.2:3000/uploads/${req.files['mainImage'][0].filename}`; 
    }

    const hotelResult = await pool.query(
      `INSERT INTO hotels 
      (name, city, county, address, phone, capacity, manager_id, image_url, email, website, latitude, longitude, price_per_day, short_description, long_description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [
        name, 
        city, 
        county || '', 
        address || '', 
        phone, 
        capacity ? parseInt(capacity) : 0, 
        userId, 
        mainImageUrl,
        email || '',
        website || '',
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        price ? parseFloat(price) : null,
        short_description || '',
        long_description || ''
      ]
    );

    const newHotelId = hotelResult.rows[0].id;

    if (animals && animals.length > 0) {
      const animalIdsResult = await pool.query(
        'SELECT id FROM animals WHERE name = ANY($1)', 
        [animals]
      );
      for (const row of animalIdsResult.rows) {
        await pool.query(
          "INSERT INTO hotel_animals (hotel_id, animal_id) VALUES ($1, $2)",
          [newHotelId, row.id]
        );
      }
    }

    if (req.files && req.files['gallery']) {
      for (const file of req.files['gallery']) {
        const galleryUrl = `http://172.20.10.2:3000/uploads/${file.filename}`;
        await pool.query(
          "INSERT INTO hotel_images (hotel_id, image_url) VALUES ($1, $2)",
          [newHotelId, galleryUrl]
        );
      }
    }

    res.json({ success: true, hotelId: newHotelId, message: "Hotel și imagini salvate cu succes!" });
  } catch (err) {
    console.error("Eroare la creare hotel:", err);
    res.status(500).json({ success: false, message: "Eroare internă a serverului." });
  }
});

router.get('/accepted-animals/:hotelId', async (req, res) => {
  try {
    let result = await pool.query(
      `SELECT a.id, a.name 
       FROM animals a 
       JOIN hotel_animals ha ON a.id = ha.animal_id 
       WHERE ha.hotel_id = $1`, 
      [req.params.hotelId]
    );
    
    if (result.rows.length === 0) {
      result = await pool.query(`SELECT id, name FROM animals`);
    }
    
    res.json({ success: true, animals: result.rows });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/:hotelId', async (req, res) => {
  const { hotelId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const hotelResult = await pool.query('SELECT name, capacity FROM hotels WHERE id = $1', [hotelId]);
    if (hotelResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotelul nu a fost găsit.' });
    }
    const hotel = hotelResult.rows[0];

    const toateRezervarile = await pool.query(`
      SELECT b.id, b.start_date, b.end_date, b.pet_name, b.price_total, b.status, a.name as species_name 
      FROM bookings b
      LEFT JOIN animals a ON b.animal_id = a.id
      WHERE b.hotel_id = $1
      ORDER BY b.start_date ASC
    `, [hotelId]);

    let venitTotal = 0;
    
    const getDaysArray = (start, end) => {
        let arr = [];
        let dt = new Date(start);
        dt.setHours(12, 0, 0, 0); 
        let endDt = new Date(end);
        endDt.setHours(12, 0, 0, 0);
        
        while (dt <= endDt) {
            let year = dt.getFullYear();
            let month = String(dt.getMonth() + 1).padStart(2, '0');
            let day = String(dt.getDate()).padStart(2, '0');
            arr.push(`${year}-${month}-${day}`);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    };

    const formatLocal = (dt) => {
        let y = dt.getFullYear();
        let m = String(dt.getMonth() + 1).padStart(2, '0');
        let d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    let fStartStr, fEndStr;
    if (startDate && endDate) {
        fStartStr = startDate;
        fEndStr = endDate;
    } else {
        let today = new Date();
        let firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        let lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fStartStr = formatLocal(firstDay);
        fEndStr = formatLocal(lastDay);
    }

    toateRezervarile.rows.forEach(b => {
        if (b.status !== 'approved') return; 
        const bookingDays = getDaysArray(b.start_date, b.end_date);
        const pretPeZi = parseFloat(b.price_total) / bookingDays.length;

        let zileSuprapuse = 0;
        bookingDays.forEach(dayStr => {
            if (dayStr >= fStartStr && dayStr <= fEndStr) {
                zileSuprapuse++;
            }
        });

        venitTotal += (pretPeZi * zileSuprapuse);
    });

    res.json({
      success: true,
      hotelName: hotel.name,
      stats: {
        capacitateTotala: hotel.capacity,
        venitCalculat: Math.round(venitTotal)
      },
      bookingIntervals: toateRezervarile.rows 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Eroare internă a serverului.' });
  }
});

router.post('/add-booking', async (req, res) => {
  const { hotel_id, pet_name, pet_type, owner_email, start_date, end_date, price_total, animal_id } = req.body;

  if (!hotel_id || !pet_name || !start_date || !end_date || price_total === undefined || !animal_id) {
    return res.status(400).json({ success: false, message: 'Date incomplete.' });
  }

  try {
    const hotelResult = await pool.query('SELECT capacity FROM hotels WHERE id = $1', [hotel_id]);
    const capacity = hotelResult.rows[0].capacity;

    const overlapping = await pool.query(`
        SELECT start_date, end_date FROM bookings 
        WHERE hotel_id = $1 AND status != 'anulat' AND start_date <= $3 AND end_date >= $2
    `, [hotel_id, end_date, start_date]);

    let isOverbooked = false;
    let checkDate = new Date(start_date);
    checkDate.setHours(0,0,0,0);
    const stopDate = new Date(end_date);
    stopDate.setHours(0,0,0,0);
    
    while (checkDate <= stopDate) {
        let occupied = 0;
        overlapping.rows.forEach(b => {
            const s = new Date(b.start_date); s.setHours(0,0,0,0);
            const e = new Date(b.end_date); e.setHours(0,0,0,0);
            if (checkDate >= s && checkDate <= e) occupied++;
        });
        
        if (occupied >= capacity) {
            isOverbooked = true;
            break;
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }

    if (isOverbooked) {
        return res.status(400).json({ success: false, message: 'Capacitate depășită! Hotelul este plin în una sau mai multe zile.' });
    }

    await pool.query(
      `INSERT INTO bookings (hotel_id, animal_id, pet_name, pet_type, owner_email, start_date, end_date, price_total, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'RON', 'approved')`,
      [hotel_id, animal_id, pet_name, pet_type, owner_email, start_date, end_date, price_total]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Eroare la salvarea în baza de date.' });
  }
});

router.put('/booking/:id/status', async (req, res) => {
  const { status } = req.body;
  const bookingId = req.params.id;

  try {
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, bookingId]);

    if (status === 'anulat') {
      const bookingInfo = await pool.query(`
        SELECT b.start_date, b.end_date, b.pet_name, b.owner_email, h.name as hotel_name 
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        WHERE b.id = $1
      `, [bookingId]);

      if (bookingInfo.rows.length > 0) {
        const booking = bookingInfo.rows[0];

        if (booking.owner_email && booking.owner_email.includes('@')) {
          try {
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            await transporter.sendMail({
              from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
              to: booking.owner_email,
              subject: "Rezervare Anulată ",
              html: `
                <h2>Rezervare a fost anulată</h2>
                <p>Ne pare rău, dar managerul hotelului <strong>${booking.hotel_name}</strong> a fost nevoit să anuleze rezervarea pentru <strong>${booking.pet_name}</strong>.</p>
                <p><strong>Perioada anulată:</strong> ${new Date(booking.start_date).toLocaleDateString('ro-RO')} - ${new Date(booking.end_date).toLocaleDateString('ro-RO')}</p>
                <p>Dacă ai achitat sejurul, unitatea de cazare vă va contacta în cel mai scurt timp posibil.</p>
                <p>Îți mulțumim pentru înțelegere.</p>
              `
            });
          } catch (emailErr) {
            console.warn("Eroare la trimitere email anulare:", emailErr.message);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Eroare la actualizare status:", error);
    res.status(500).json({ success: false, message: 'Eroare la actualizare status.' });
  }
});

router.delete('/booking/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Eroare la ștergere.' });
  }
});

router.get('/hotel-details/:hotelId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hotels WHERE id = $1', [req.params.hotelId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nu s-a găsit hotelul" });
    }

    const hotelData = result.rows[0];

    const animalsResult = await pool.query(`
      SELECT a.name 
      FROM animals a 
      JOIN hotel_animals ha ON a.id = ha.animal_id 
      WHERE ha.hotel_id = $1
    `, [req.params.hotelId]);
    
    hotelData.animals = animalsResult.rows.map(row => row.name);

    res.json(hotelData);
  } catch (err) { 
    console.error("Eroare la extragere detalii hotel:", err);
    res.status(500).json({ error: err.message }); 
  }
});

router.put('/update-hotel/:hotelId', upload.fields([
  { name: 'mainImage', maxCount: 1 }, 
  { name: 'gallery', maxCount: 15 }
]), async (req, res) => {
  const hotelId = parseInt(req.params.hotelId);
  
  const { 
    email, name, phone, website, 
    county, city, address, latitude, longitude, 
    capacity, price, short_description, long_description 
  } = req.body;
  
  let animals = [];
  try {
    animals = JSON.parse(req.body.animals);
  } catch (e) {}

  try {
    let mainImageUrlUpdate = '';
    let mainImageParam = [];
    if (req.files && req.files['mainImage']) {
      const newImageUrl = `http://172.20.10.2:3000/uploads/${req.files['mainImage'][0].filename}`;
      mainImageUrlUpdate = ', image_url=$14'; 
      mainImageParam = [newImageUrl];
    }

    const queryParams = [
      name, city, phone, capacity ? parseInt(capacity) : 0, address || '', 
      short_description || '', long_description || '', email || '', website || '', county || '',
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      price ? parseFloat(price) : null
    ];
    
    let queryStr = `UPDATE hotels SET name=$1, city=$2, phone=$3, capacity=$4, address=$5, short_description=$6, long_description=$7, email=$8, website=$9, county=$10, latitude=$11, longitude=$12, price_per_day=$13`;
    
    if (mainImageUrlUpdate) {
      queryStr += mainImageUrlUpdate;
      queryParams.push(mainImageParam[0]);
    }
    
    queryStr += ` WHERE id=$${queryParams.length + 1}`;
    queryParams.push(hotelId);

    await pool.query(queryStr, queryParams);

    await pool.query('DELETE FROM hotel_animals WHERE hotel_id = $1', [hotelId]);
    
    if (animals && animals.length > 0) {
      const animalIdsResult = await pool.query(
        'SELECT id FROM animals WHERE name = ANY($1::text[])', 
        [animals]
      );
      for (const row of animalIdsResult.rows) {
        await pool.query(
          "INSERT INTO hotel_animals (hotel_id, animal_id) VALUES ($1, $2)",
          [hotelId, row.id]
        );
      }
    }

    if (req.files && req.files['gallery']) {
      for (const file of req.files['gallery']) {
        const galleryUrl = `http://172.20.10.2:3000/uploads/${file.filename}`;
        await pool.query(
          "INSERT INTO hotel_images (hotel_id, image_url) VALUES ($1, $2)",
          [hotelId, galleryUrl]
        );
      }
    }

    res.json({ success: true, message: "Date actualizate cu succes!" });
  } catch (err) {
    console.error("Eroare la update hotel:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;