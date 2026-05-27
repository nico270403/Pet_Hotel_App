// import express from 'express';
// import pool from '../db.js';

// const router = express.Router();

// router.get('/:hotelId', async (req, res) => {
//   const { hotelId } = req.params;
//   const { startDate, endDate } = req.query; 

//   try {
//     const hotelResult = await pool.query('SELECT name, capacity FROM hotels WHERE id = $1', [hotelId]);
//     if (hotelResult.rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Hotelul nu a fost găsit.' });
//     }
//     const hotel = hotelResult.rows[0];

//     let venitQuery = `SELECT COALESCE(SUM(price_total), 0) AS venit_total FROM bookings WHERE hotel_id = $1`;
//     let venitParams = [hotelId];

//     if (startDate && endDate) {
//       venitQuery += ` AND start_date <= $3 AND end_date >= $2`;
//       venitParams.push(startDate, endDate);
//     } else {
//       venitQuery += ` AND start_date >= DATE_TRUNC('month', CURRENT_DATE)`;
//     }

//     const venitResult = await pool.query(venitQuery, venitParams);
//     const venitTotal = parseFloat(venitResult.rows[0].venit_total);

//     const toateRezervarile = await pool.query(`
//       SELECT id, start_date, end_date, pet_name, price_total 
//       FROM bookings 
//       WHERE hotel_id = $1
//       ORDER BY start_date ASC
//     `, [hotelId]);

//     res.json({
//       success: true,
//       hotelName: hotel.name,
//       stats: {
//         capacitateTotala: hotel.capacity,
//         venitCalculat: venitTotal
//       },
//       bookingIntervals: toateRezervarile.rows 
//     });

//   } catch (error) {
//     console.error("❌ Eroare la dashboard:", error);
//     res.status(500).json({ success: false, message: 'Eroare internă a serverului.' });
//   }
// });

// router.post('/create-hotel', async (req, res) => {
//   const { name, city, phone, capacity, address, short_description, userId, animals } = req.body;

//   if (!name || !capacity || !userId) {
//     return res.status(400).json({ success: false, message: 'Te rog completează câmpurile obligatorii.' });
//   }

//   const client = await pool.connect(); 
//   try {
//     await client.query('BEGIN');

//     const hotelQuery = `
//       INSERT INTO hotels (name, city, phone, capacity, address, short_description)
//       VALUES ($1, $2, $3, $4, $5, $6)
//       RETURNING id;
//     `;
//     const hotelResult = await client.query(hotelQuery, [name, city, phone, parseInt(capacity), address, short_description]);
//     const newHotelId = hotelResult.rows[0].id;

//     await client.query(`UPDATE users SET hotel_id = $1 WHERE id = $2;`, [newHotelId, userId]);

//     if (animals && animals.length > 0) {
//       for (const animalName of animals) {
//         let animalId;
//         const animalRes = await client.query(`SELECT id FROM animals WHERE LOWER(name) = LOWER($1)`, [animalName]);
        
//         if (animalRes.rows.length > 0) {
//           animalId = animalRes.rows[0].id;
//         } else {
//           const newAnimal = await client.query(`INSERT INTO animals (name) VALUES ($1) RETURNING id`, [animalName]);
//           animalId = newAnimal.rows[0].id;
//         }
        
//         await client.query(`
//           INSERT INTO hotel_animals (hotel_id, animal_id) 
//           VALUES ($1, $2) ON CONFLICT DO NOTHING
//         `, [newHotelId, animalId]);
//       }
//     }

//     await client.query('COMMIT');
//     res.status(201).json({
//       success: true,
//       message: 'Hotelul și preferințele au fost salvate!',
//       hotelId: newHotelId
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error("❌ Eroare la crearea hotelului:", error);
//     res.status(500).json({ success: false, message: 'Eroare la salvarea în baza de date.' });
//   } finally {
//     client.release();
//   }
// });


// router.get('/:hotelId', async (req, res) => {
//   const { hotelId } = req.params;
//   const { startDate, endDate } = req.query;

//   try {
//     const hotelResult = await pool.query('SELECT name, capacity FROM hotels WHERE id = $1', [hotelId]);
//     if (hotelResult.rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Hotelul nu a fost găsit.' });
//     }
//     const hotel = hotelResult.rows[0];

//     const toateRezervarile = await pool.query(`
//       SELECT id, start_date, end_date, pet_name, price_total 
//       FROM bookings 
//       WHERE hotel_id = $1
//       ORDER BY start_date ASC
//     `, [hotelId]);

//     let venitTotal = 0;
    
//     let filterStart = new Date();
//     filterStart.setDate(1);
//     filterStart.setHours(0,0,0,0);
//     let filterEnd = new Date();
//     filterEnd.setHours(23,59,59,999);

//     if (startDate && endDate) {
//       filterStart = new Date(startDate);
//       filterStart.setHours(0,0,0,0);
//       filterEnd = new Date(endDate);
//       filterEnd.setHours(23,59,59,999);
//     }

//     toateRezervarile.rows.forEach(b => {
//       const bStart = new Date(b.start_date);
//       bStart.setHours(0,0,0,0);
//       const bEnd = new Date(b.end_date);
//       bEnd.setHours(0,0,0,0);

//       const totalZileRezervare = Math.floor((bEnd - bStart) / (1000 * 60 * 60 * 24)) + 1;
//       const pretPeZi = parseFloat(b.price_total) / totalZileRezervare;

//       const maxStart = Math.max(filterStart.getTime(), bStart.getTime());
//       const minEnd = Math.min(filterEnd.getTime(), bEnd.getTime());

//       if (maxStart <= minEnd) {
//         const zileSuprapuse = Math.floor((minEnd - maxStart) / (1000 * 60 * 60 * 24)) + 1;
//         venitTotal += (pretPeZi * zileSuprapuse);
//       }
//     });

//     res.json({
//       success: true,
//       hotelName: hotel.name,
//       stats: {
//         capacitateTotala: hotel.capacity,
//         venitCalculat: venitTotal
//       },
//       bookingIntervals: toateRezervarile.rows 
//     });

//   } catch (error) {
//     console.error("❌ Eroare la dashboard:", error);
//     res.status(500).json({ success: false, message: 'Eroare internă a serverului.' });
//   }
// });


// router.post('/add-booking', async (req, res) => {
//   const { hotel_id, pet_name, start_date, end_date, price_total } = req.body;

//   if (!hotel_id || !pet_name || !start_date || !end_date || !price_total) {
//     return res.status(400).json({ success: false, message: 'Date incomplete.' });
//   }

//   try {
//     const hotelResult = await pool.query('SELECT capacity FROM hotels WHERE id = $1', [hotel_id]);
//     const capacity = hotelResult.rows[0].capacity;

//     const overlapping = await pool.query(`
//         SELECT start_date, end_date FROM bookings 
//         WHERE hotel_id = $1 AND start_date <= $3 AND end_date >= $2
//     `, [hotel_id, end_date, start_date]);

//     let isOverbooked = false;
//     let checkDate = new Date(start_date);
//     checkDate.setHours(0,0,0,0);
//     const stopDate = new Date(end_date);
//     stopDate.setHours(0,0,0,0);
    
//     while (checkDate <= stopDate) {
//         let occupied = 0;
//         overlapping.rows.forEach(b => {
//             const s = new Date(b.start_date); s.setHours(0,0,0,0);
//             const e = new Date(b.end_date); e.setHours(0,0,0,0);
//             if (checkDate >= s && checkDate <= e) occupied++;
//         });
        
//         if (occupied >= capacity) {
//             isOverbooked = true;
//             break;
//         }
//         checkDate.setDate(checkDate.getDate() + 1);
//     }

//     if (isOverbooked) {
//         return res.status(400).json({ success: false, message: 'Capacitate depășită! Hotelul este plin în una sau mai multe zile selectate.' });
//     }

//     await pool.query(
//       `INSERT INTO bookings (hotel_id, pet_name, start_date, end_date, price_total)
//        VALUES ($1, $2, $3, $4, $5)`,
//       [hotel_id, pet_name, start_date, end_date, price_total]
//     );

//     res.status(201).json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Eroare la salvarea în baza de date.' });
//   }
// });

// router.put('/update-hotel/:hotelId', async (req, res) => {
//   const { name, city, phone, capacity, address, short_description, long_description, email, website, image_url, animals } = req.body;
//   const hotelId = req.params.hotelId;
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');
    
//     await client.query(
//       `UPDATE hotels SET name=$1, city=$2, phone=$3, capacity=$4, address=$5, short_description=$6, long_description=$7, email=$8, website=$9, image_url=$10 WHERE id=$11`,
//       [name, city, phone, parseInt(capacity), address, short_description, long_description, email, website, image_url, hotelId]
//     );

//     if (animals && Array.isArray(animals)) {
//       await client.query('DELETE FROM hotel_animals WHERE hotel_id = $1', [hotelId]);
      
//       for (const animalName of animals) {
//         let animalId;
//         const animalRes = await client.query(`SELECT id FROM animals WHERE LOWER(name) = LOWER($1)`, [animalName]);
//         if (animalRes.rows.length > 0) animalId = animalRes.rows[0].id;
//         else {
//           const newAnimal = await client.query(`INSERT INTO animals (name) VALUES ($1) RETURNING id`, [animalName]);
//           animalId = newAnimal.rows[0].id;
//         }
//         await client.query(`INSERT INTO hotel_animals (hotel_id, animal_id) VALUES ($1, $2)`, [hotelId, animalId]);
//       }
//     }

//     await client.query('COMMIT');
//     res.json({ success: true, message: "Date actualizate cu succes!" });
//   } catch (err) {
//     await client.query('ROLLBACK');
//     res.status(500).json({ error: err.message });
//   } finally {
//     client.release();
//   }
// });



// export default router;


import express from 'express';
import pool from '../db.js';

const router = express.Router();

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
  const { hotel_id, pet_name, start_date, end_date, price_total, animal_id } = req.body;

  if (!hotel_id || !pet_name || !start_date || !end_date || price_total === undefined || !animal_id) {
    return res.status(400).json({ success: false, message: 'Date incomplete.' });
  }

  try {
    const hotelResult = await pool.query('SELECT capacity FROM hotels WHERE id = $1', [hotel_id]);
    const capacity = hotelResult.rows[0].capacity;

    const overlapping = await pool.query(`
        SELECT start_date, end_date FROM bookings 
        WHERE hotel_id = $1 AND start_date <= $3 AND end_date >= $2
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
        return res.status(400).json({ success: false, message: 'Capacitate depășită! Hotelul este plin în una sau mai multe zile selectate.' });
    }

    await pool.query(
      `INSERT INTO bookings (hotel_id, animal_id, pet_name, start_date, end_date, price_total, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'RON', 'approved')`,
      [hotel_id, animal_id, pet_name, start_date, end_date, price_total]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Eroare la salvarea în baza de date.' });
  }
});
router.get('/hotel-details/:hotelId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hotels WHERE id = $1', [req.params.hotelId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nu s-a găsit hotelul" });
    }
    res.json(result.rows[0]);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: err.message }); 
  }
});

router.put('/update-hotel/:hotelId', async (req, res) => {
  const { name, city, phone, capacity, address, short_description, long_description, email, website, image_url } = req.body;
  const hotelId = req.params.hotelId;

  try {
    await pool.query(
      `UPDATE hotels SET name=$1, city=$2, phone=$3, capacity=$4, address=$5, short_description=$6, long_description=$7, email=$8, website=$9, image_url=$10 WHERE id=$11`,
      [name, city, phone, capacity ? parseInt(capacity) : 0, address, short_description, long_description, email, website, image_url, hotelId]
    );
    res.json({ success: true, message: "Date actualizate cu succes!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
export default router;