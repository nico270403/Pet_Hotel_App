// // // import express from "express";
// // // import pool from "../db.js";

// // // const router = express.Router();

// // // router.post("/", async (req, res) => {
// // //   try {
// // //     const { user_id, hotel_id, pet_type, check_in, check_out } = req.body;

// // //     const conflict = await pool.query(
// // //       `SELECT * FROM reservations
// // //        WHERE hotel_id = $1
// // //        AND NOT ($3 < check_in OR $2 > check_out)`,
// // //       [hotel_id, check_in, check_out]
// // //     );

// // //     if (conflict.rows.length > 0) {
// // //       return res.json({
// // //         success: false,
// // //         message: "Hotelul nu este disponibil în perioada selectată."
// // //       });
// // //     }

// // //     const insert = await pool.query(
// // //       `INSERT INTO reservations (user_id, hotel_id, pet_type, check_in, check_out)
// // //        VALUES ($1, $2, $3, $4, $5)
// // //        RETURNING *`,
// // //       [user_id, hotel_id, pet_type, check_in, check_out]
// // //     );

// // //     res.json({
// // //       success: true,
// // //       message: "Rezervarea a fost creată cu succes!",
// // //       reservation: insert.rows[0]
// // //     });

// // //   } catch (err) {
// // //     console.error(err);
// // //     res.status(500).json({ error: "Eroare la /book" });
// // //   }
// // // });

// // // export default router;

// // // routes/bookings.js - RUTĂ NOUĂ PENTRU REZERVĂRI + EMAIL
// // import express from 'express';
// // import db from '../db.js';
// // import nodemailer from 'nodemailer';

// // const router = express.Router();

// // // 🆕 CONFIGURARE EMAIL (PENTRU GMAIL)
// // const transporter = nodemailer.createTransport({
// //   service: 'gmail',
// //   auth: {
// //     user: 'nicoletactanac@gmail.com', 
// //     pass: 'fmvt mjxa urxs myzh' 
// //   }
// // });

// // // RUTA POST /api/book

// //   // POST /api/bookings (Creează o rezervare) - VERSIUNE CORECTĂ
// // app.post('/api/bookings', async (req, res) => {
// //   try {
// //     const {
// //       hotel_id,
// //       user_id = 1, // Dacă nu vine, folosește 1 ca default
// //       pet_type = 'câine',
// //       pet_name = 'Animal necunoscut',
// //       owner_name = 'Client',
// //       owner_email,
// //       check_in, // ATENȚIE: Frontend trimite check_in (nu start_date)
// //       check_out, // ATENȚIE: Frontend trimite check_out (nu end_date)
// //       price
// //     } = req.body;

// //     console.log('📅 Creare rezervare cu datele:', req.body);

// //     // Verifică câmpurile obligatorii
// //     if (!owner_email) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Adresa de email este obligatorie'
// //       });
// //     }

// //     if (!check_in || !check_out) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Datele de check-in și check-out sunt obligatorii'
// //       });
// //     }

// //     // Calculează prețul dacă nu vine
// //     let price_total = price;
// //     if (!price_total) {
// //       const start = new Date(check_in);
// //       const end = new Date(check_out);
// //       const diffTime = Math.abs(end - start);
// //       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// //       const dailyRate = pet_type === 'câine' ? 50 : 30; // RON/zi
// //       price_total = diffDays * dailyRate;
// //     }

// //     // === IMPORTANT: GĂSEȘTE SAU CREAZĂ ANIMALUL ===
// //     let animal_id;
    
// //     // 1. Încearcă să găsești animalul existent
// //     const animalResult = await pool.query(
// //       `SELECT id FROM animals 
// //        WHERE user_id = $1 AND (name = $2 OR type = $3)
// //        LIMIT 1`,
// //       [user_id, pet_name, pet_type]
// //     );
    
// //     if (animalResult.rows.length > 0) {
// //       // Folosește animalul existent
// //       animal_id = animalResult.rows[0].id;
// //     } else {
// //       // 2. Creează un animal nou
// //       const newAnimalResult = await pool.query(
// //         `INSERT INTO animals (user_id, name, type, created_at)
// //          VALUES ($1, $2, $3, NOW())
// //          RETURNING id`,
// //         [user_id, pet_name, pet_type]
// //       );
// //       animal_id = newAnimalResult.rows[0].id;
// //     }

// //     console.log(`✅ Animal ID: ${animal_id} (nume: ${pet_name}, tip: ${pet_type})`);

// //     // === CREEAZĂ REZERVAREA ===
// //     const bookingResult = await pool.query(
// //       `INSERT INTO bookings 
// //        (hotel_id, user_id, animal_id, start_date, end_date, 
// //         price_total, currency, status, created_at)
// //        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
// //        RETURNING id`,
// //       [hotel_id, user_id, animal_id, check_in, check_out,
// //        price_total, 'RON', 'pending']
// //     );

// //     const bookingId = bookingResult.rows[0].id;
// //     console.log(`✅ Rezervare creată cu ID: ${bookingId}`);

// //     // === OBȚINE DETALIILE COMPLETE ===
// //     const detailsResult = await pool.query(
// //       `SELECT 
// //          b.*,
// //          u.name as owner_name_db,
// //          u.email as owner_email_db,
// //          a.name as pet_name_db,
// //          a.type as pet_type_db,
// //          h.name as hotel_name
// //        FROM bookings b
// //        JOIN users u ON b.user_id = u.id
// //        JOIN animals a ON b.animal_id = a.id
// //        JOIN hotels h ON b.hotel_id = h.id
// //        WHERE b.id = $1`,
// //       [bookingId]
// //     );

// //     const bookingDetails = detailsResult.rows[0] || {};

// //     // === RĂSPUNS SUCCES ===
// //     res.json({
// //       success: true,
// //       message: 'Rezervare creată cu succes!',
// //       bookingId: bookingId,
// //       booking: {
// //         id: bookingId,
// //         hotel_name: bookingDetails.hotel_name || 'Hotel necunoscut',
// //         pet_name: bookingDetails.pet_name_db || pet_name,
// //         start_date: check_in,
// //         end_date: check_out,
// //         price_total: price_total
// //       }
// //     });

// //   } catch (error) {
// //     console.error('❌ Error creating booking:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Eroare la crearea rezervării',
// //       error: error.message,
// //       hint: 'Verifică structura tabelei bookings și conexiunea la DB'
// //     });
// //   }
// // });

// // // 🆕 RUTĂ PENTRU APROBARE REZERVARE (când dai click în email)
// // router.get('/:id/accept', async (req, res) => {
// //   try {
// //     const { id } = req.params;
    
// //     // Actualizează statusul în baza de date
// //     await db.query(
// //       'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
// //       ['approved', id]
// //     );

// //     // Găsește emailul clientului pentru a-l notifica
// //     const bookingResult = await db.query(
// //       'SELECT owner_email, owner_name, hotel_id FROM bookings WHERE id = $1',
// //       [id]
// //     );
    
// //     if (bookingResult.rows.length > 0) {
// //       const { owner_email, owner_name, hotel_id } = bookingResult.rows[0];
      
// //       // Trimite email de confirmare clientului
// //       const mailOptions = {
// //         from: 'nicoletactana2704@gmail.com',
// //         to: owner_email,
// //         subject: '✅ Rezervarea ta a fost aprobată!',
// //         html: `
// //           <div style="font-family: Arial, sans-serif;">
// //             <h2 style="color: #10b981;">Bună, ${owner_name}!</h2>
// //             <p>Rezervarea ta (#${id}) a fost <strong>APROBATĂ</strong>! 🎉</p>
// //             <p>Te așteptăm la hotel în data stabilită.</p>
// //             <p>Pentru detalii suplimentare, te rugăm să ne contactezi.</p>
// //           </div>
// //         `
// //       };
      
// //       await transporter.sendMail(mailOptions);
// //     }

// //     // Arată o pagină frumoasă de confirmare
// //     res.send(`
// //       <!DOCTYPE html>
// //       <html>
// //       <head>
// //         <title>Rezervare aprobată</title>
// //         <style>
// //           body { font-family: Arial; text-align: center; padding: 50px; }
// //           .success { color: #10b981; font-size: 48px; }
// //           h1 { color: #1f2937; }
// //         </style>
// //       </head>
// //       <body>
// //         <div class="success">✅</div>
// //         <h1>Rezervare aprobată!</h1>
// //         <p>Rezervarea #${id} a fost aprobată cu succes.</p>
// //         <p>Clientul a fost notificat prin email.</p>
// //       </body>
// //       </html>
// //     `);

// //   } catch (error) {
// //     console.error('Eroare la aprobare:', error);
// //     res.status(500).send('Eroare la aprobarea rezervării');
// //   }
// // });

// // // 🆕 RUTĂ PENTRU RESPINGERE REZERVARE
// // router.get('/:id/reject', async (req, res) => {
// //   try {
// //     const { id } = req.params;
    
// //     await db.query(
// //       'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
// //       ['rejected', id]
// //     );

// //     // ... similar cu /accept, dar cu mesaj de respingere

// //     res.send(`
// //       <!DOCTYPE html>
// //       <html>
// //       <head>
// //         <title>Rezervare respinsă</title>
// //       </head>
// //       <body style="font-family: Arial; text-align: center; padding: 50px;">
// //         <div style="color: #ef4444; font-size: 48px;">❌</div>
// //         <h1>Rezervare respinsă</h1>
// //         <p>Rezervarea #${id} a fost respinsă.</p>
// //         <p>Clientul va fi notificat.</p>
// //       </body>
// //       </html>
// //     `);

// //   } catch (error) {
// //     console.error('Eroare la respingere:', error);
// //     res.status(500).send('Eroare la respingerea rezervării');
// //   }
// // });

// // export default router;

// import express from 'express';
// import pool from '../db.js'; // Folosește pool nu db
// import nodemailer from 'nodemailer';

// const router = express.Router();

// // 🆕 CONFIGURARE EMAIL (PENTRU GMAIL)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'nicoletactanac@gmail.com', 
//     pass: 'fmvt mjxa urxs myzh' 
//   }
// });

// // POST /api/book/bookings - VERSIUNE CORECTĂ
// router.post('/bookings', async (req, res) => {
//   try {
//     const {
//       hotel_id,
//       user_id = 1, // Dacă nu vine, folosește 1 ca default
//       pet_type = 'câine',
//       pet_name = 'Animal necunoscut',
//       owner_name = 'Client',
//       owner_email,
//       check_in, // ATENȚIE: Frontend trimite check_in (nu start_date)
//       check_out, // ATENȚIE: Frontend trimite check_out (nu end_date)
//       price
//     } = req.body;

//     console.log('📅 Creare rezervare cu datele:', req.body);

//     // Verifică câmpurile obligatorii
//     if (!owner_email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Adresa de email este obligatorie'
//       });
//     }

//      if (!check_in || !check_out) {
//        return res.status(400).json({
//          success: false,
//          message: 'Datele de check-in și check-out sunt obligatorii'
//        });
//     }

//     // Calculează prețul dacă nu vine
//     let price_total = price;
//     if (!price_total) {
//       const start = new Date(start_date);
//       const end = new Date(end_date);
//       const diffTime = Math.abs(end - start);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       const dailyRate = pet_type === 'câine' ? 50 : 30; // RON/zi
//       price_total = diffDays * dailyRate;
//     }

//     // === IMPORTANT: GĂSEȘTE SAU CREAZĂ ANIMALUL ===
//     let animal_id;
    
//     // 1. Încearcă să găsești animalul existent
//     const animalResult = await pool.query(
//       `SELECT id FROM animals 
//        WHERE user_id = $1 AND (name ILIKE $2 OR type ILIKE $3)
//        LIMIT 1`,
//       [user_id, pet_name, pet_type]
//     );
    
//     if (animalResult.rows.length > 0) {
//       // Folosește animalul existent
//       animal_id = animalResult.rows[0].id;
//       console.log(`✅ Animal găsit cu ID: ${animal_id}`);
//     } else {
//       // 2. Creează un animal nou
//       const newAnimalResult = await pool.query(
//         `INSERT INTO animals (user_id, name, type, created_at)
//          VALUES ($1, $2, $3, NOW())
//          RETURNING id`,
//         [user_id, pet_name, pet_type]
//       );
//       animal_id = newAnimalResult.rows[0].id;
//       console.log(`✅ Animal nou creat cu ID: ${animal_id}`);
//     }

//     // === CREEAZĂ REZERVAREA ===
//     const bookingResult = await pool.query(
//       `INSERT INTO bookings 
//        (hotel_id, user_id, animal_id, start_date, end_date, 
//         price_total, currency, status, created_at)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
//        RETURNING id`,
//       [hotel_id, user_id, animal_id, check_in, check_out,
//        price_total, 'RON', 'pending']
//     );

//     const bookingId = bookingResult.rows[0].id;
//     console.log(`✅ Rezervare creată cu ID: ${bookingId}`);

//     // === TRIMITE EMAIL CĂTRE TINE (admin) ===
//     try {
//       const adminMailOptions = {
//         from: 'nicoletactana2704@gmail.com',
//         to: 'nicoletactana2704@gmail.com',
//         subject: `✅ CERERE REZERVARE #${bookingId}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px;">
//             <h2 style="color: #2563eb;">📋 Cerere rezervare nouă</h2>
//             <p><strong>Booking ID:</strong> ${bookingId}</p>
//             <p><strong>Hotel ID:</strong> ${hotel_id}</p>
//             <p><strong>Client:</strong> ${owner_name} (${owner_email})</p>
//             <p><strong>Animal:</strong> ${pet_name} - ${pet_type}</p>
//             <p><strong>Perioada:</strong> ${start_date} - ${end_date}</p>
//             <p><strong>Preț:</strong> ${price_total} RON</p>
            
//             <hr style="margin: 30px 0;">
            
//             <h3>⏱️ Acțiuni rapide:</h3>
//             <div style="margin: 20px 0;">
//               <a href="http://172.20.10.2:3000/api/book/${bookingId}/accept" 
//                  style="background-color: #10b981; color: white; padding: 12px 24px; 
//                         text-decoration: none; border-radius: 8px; margin-right: 10px;">
//                 ✅ APROBĂ REZERVAREA
//               </a>
              
//               <a href="http://172.20.10.2:3000/api/book/${bookingId}/reject" 
//                  style="background-color: #ef4444; color: white; padding: 12px 24px; 
//                         text-decoration: none; border-radius: 8px;">
//                 ❌ RESPINGE REZERVAREA
//               </a>
//             </div>
//           </div>
//         `
//       };
      
//       await transporter.sendMail(adminMailOptions);
//       console.log('✅ Email trimis către admin');
//     } catch (emailError) {
//       console.error('❌ Eroare la trimiterea email-ului admin:', emailError);
//     }

//     // === TRIMITE EMAIL CĂTRE CLIENT ===
//     try {
//       const clientMailOptions = {
//         from: 'nicoletactana2704@gmail.com',
//         to: owner_email,
//         subject: `📅 Cererea ta de rezervare #${bookingId} a fost primită`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px;">
//             <h2 style="color: #2563eb;">Bună, ${owner_name}!</h2>
//             <p>Am primit cererea ta de rezervare pentru <strong>${pet_name}</strong>.</p>
            
//             <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <p><strong>📋 Booking ID:</strong> ${bookingId}</p>
//               <p><strong>📅 Perioadă:</strong> ${check_in} - ${check_out}</p>
//               <p><strong>💰 Preț total:</strong> ${price_total} RON</p>
//             </div>
            
//             <p>✅ <strong>Următorul pas:</strong> Vei primi în scurt timp un email cu confirmarea finală.</p>
//             <p>Dacă ai întrebări, răspunde la acest email.</p>
//           </div>
//         `
//       };
      
//       await transporter.sendMail(clientMailOptions);
//       console.log('✅ Email trimis către client');
//     } catch (emailError) {
//       console.error('❌ Eroare la trimiterea email-ului client:', emailError);
//     }

//     // === RĂSPUNS SUCCES ===
//     res.json({
//       success: true,
//       message: 'Rezervare creată cu succes! Email-uri trimise.',
//       bookingId: bookingId,
//       booking: {
//         id: bookingId,
//         pet_name: pet_name,
//         pet_type: pet_type,
//         start_date: start_date,
//         end_date: end_date,
//         price_total: price_total
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error creating booking:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Eroare la crearea rezervării',
//       error: error.message
//     });
//   }
// });

// // 🆕 RUTĂ PENTRU APROBARE REZERVARE (când dai click în email)
// router.get('/:id/accept', async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Actualizează statusul în baza de date
//     await pool.query(
//       'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
//       ['approved', id]
//     );

//     // Găsește detaliile rezervării pentru a notifica clientul
//     const bookingResult = await pool.query(
//       `SELECT b.*, u.email as owner_email, u.name as owner_name, 
//               a.name as pet_name, h.name as hotel_name
//        FROM bookings b
//        LEFT JOIN users u ON b.user_id = u.id
//        LEFT JOIN animals a ON b.animal_id = a.id
//        LEFT JOIN hotels h ON b.hotel_id = h.id
//        WHERE b.id = $1`,
//       [id]
//     );
    
//     if (bookingResult.rows.length > 0 && bookingResult.rows[0].owner_email) {
//       const { owner_email, owner_name, pet_name, hotel_name } = bookingResult.rows[0];
      
//       // Trimite email de confirmare clientului
//       const mailOptions = {
//         from: 'nicoletactana2704@gmail.com',
//         to: owner_email,
//         subject: '✅ Rezervarea ta a fost aprobată!',
//         html: `
//           <div style="font-family: Arial, sans-serif;">
//             <h2 style="color: #10b981;">Bună, ${owner_name}!</h2>
//             <p>Rezervarea ta (#${id}) pentru <strong>${pet_name}</strong> a fost <strong>APROBATĂ</strong>! 🎉</p>
//             <p>Te așteptăm la <strong>${hotel_name}</strong> în data stabilită.</p>
//             <p>Pentru detalii suplimentare, te rugăm să ne contactezi.</p>
//           </div>
//         `
//       };
      
//       await transporter.sendMail(mailOptions);
//     }

//     // Arată o pagină frumoasă de confirmare
//     res.send(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Rezervare aprobată</title>
//         <style>
//           body { 
//             font-family: Arial, sans-serif; 
//             text-align: center; 
//             padding: 50px;
//             background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
//           }
//           .container {
//             max-width: 600px;
//             margin: 0 auto;
//             background: white;
//             padding: 40px;
//             border-radius: 16px;
//             box-shadow: 0 8px 30px rgba(0,0,0,0.1);
//           }
//           .success { 
//             color: #10b981; 
//             font-size: 64px; 
//             margin-bottom: 20px;
//           }
//           h1 { 
//             color: #1f2937; 
//             margin-bottom: 20px;
//             font-size: 28px;
//           }
//           p {
//             color: #6b7280;
//             line-height: 1.6;
//             font-size: 16px;
//           }
//           .back-btn {
//             display: inline-block;
//             margin-top: 30px;
//             padding: 12px 24px;
//             background: #2563eb;
//             color: white;
//             text-decoration: none;
//             border-radius: 8px;
//             font-weight: 600;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="success">✅</div>
//           <h1>Rezervare aprobată!</h1>
//           <p>Rezervarea #${id} a fost aprobată cu succes.</p>
//           <p>Clientul a fost notificat prin email.</p>
//           <a href="/" class="back-btn">Înapoi la site</a>
//         </div>
//       </body>
//       </html>
//     `);

//   } catch (error) {
//     console.error('Eroare la aprobare:', error);
//     res.status(500).send(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Eroare</title>
//         <style>
//           body { font-family: Arial; text-align: center; padding: 50px; }
//           .error { color: #ef4444; font-size: 48px; }
//         </style>
//       </head>
//       <body>
//         <div class="error">❌</div>
//         <h1>Eroare la aprobarea rezervării</h1>
//         <p>${error.message}</p>
//       </body>
//       </html>
//     `);
//   }
// });

// // 🆕 RUTĂ PENTRU RESPINGERE REZERVARE
// router.get('/:id/reject', async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     await pool.query(
//       'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
//       ['rejected', id]
//     );

//     // Găsește detaliile rezervării pentru a notifica clientul
//     const bookingResult = await pool.query(
//       `SELECT b.*, u.email as owner_email, u.name as owner_name, 
//               a.name as pet_name, h.name as hotel_name
//        FROM bookings b
//        LEFT JOIN users u ON b.user_id = u.id
//        LEFT JOIN animals a ON b.animal_id = a.id
//        LEFT JOIN hotels h ON b.hotel_id = h.id
//        WHERE b.id = $1`,
//       [id]
//     );
    
//     if (bookingResult.rows.length > 0 && bookingResult.rows[0].owner_email) {
//       const { owner_email, owner_name, pet_name, hotel_name } = bookingResult.rows[0];
      
//       const mailOptions = {
//         from: 'nicoletactana2704@gmail.com',
//         to: owner_email,
//         subject: '❌ Rezervarea ta nu a putut fi aprobată',
//         html: `
//           <div style="font-family: Arial, sans-serif;">
//             <h2 style="color: #ef4444;">Bună, ${owner_name}!</h2>
//             <p>Ne pare rău, dar rezervarea ta <strong>#${id}</strong> pentru <strong>${pet_name}</strong> la <strong>${hotel_name}</strong> nu a putut fi aprobată.</p>
//             <p>Pentru detalii suplimentare, te rugăm să ne contactezi.</p>
//             <p>Ne cerem scuze pentru neplăcerile create.</p>
//           </div>
//         `
//       };
      
//       await transporter.sendMail(mailOptions);
//     }

//     res.send(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Rezervare respinsă</title>
//         <style>
//           body { 
//             font-family: Arial, sans-serif; 
//             text-align: center; 
//             padding: 50px;
//             background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
//           }
//           .container {
//             max-width: 600px;
//             margin: 0 auto;
//             background: white;
//             padding: 40px;
//             border-radius: 16px;
//             box-shadow: 0 8px 30px rgba(0,0,0,0.1);
//           }
//           .rejected { 
//             color: #ef4444; 
//             font-size: 64px; 
//             margin-bottom: 20px;
//           }
//           h1 { 
//             color: #1f2937; 
//             margin-bottom: 20px;
//             font-size: 28px;
//           }
//           p {
//             color: #6b7280;
//             line-height: 1.6;
//             font-size: 16px;
//           }
//           .back-btn {
//             display: inline-block;
//             margin-top: 30px;
//             padding: 12px 24px;
//             background: #2563eb;
//             color: white;
//             text-decoration: none;
//             border-radius: 8px;
//             font-weight: 600;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="rejected">❌</div>
//           <h1>Rezervare respinsă</h1>
//           <p>Rezervarea #${id} a fost respinsă.</p>
//           <p>Clientul a fost notificat prin email.</p>
//           <a href="/" class="back-btn">Înapoi la site</a>
//         </div>
//       </body>
//       </html>
//     `);

//   } catch (error) {
//     console.error('Eroare la respingere:', error);
//     res.status(500).send('Eroare la respingerea rezervării');
//   }
// });

// export default router;


import express from "express";
import pool from "../db.js"; // ajustează dacă ai alt path
import nodemailer from "nodemailer";

const router = express.Router();

/* =====================================================
   POST /api/book/bookings
   Creează rezervare + animal (dacă nu există)
   ===================================================== */
router.post("/bookings", async (req, res) => {
  try {
    const {
      hotel_id,
      user_id,
      pet_name,
      pet_type,
      owner_name,
      owner_email,
      check_in,
      check_out,
      price
    } = req.body;

    console.log("📅 Creare rezervare cu datele:", req.body);

    /* ================= VALIDARE ================= */
    if (!check_in || !check_out) {
      return res.status(400).json({
        success: false,
        message: "Datele de check-in și check-out sunt obligatorii"
      });
    }

    if (!hotel_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Hotelul și utilizatorul sunt obligatorii"
      });
    }

    /* ================= MAPARE FRONTEND → DB ================= */
    const start_date = check_in;
    const end_date = check_out;
    const price_total = price ?? 0;

    /* ================= ANIMAL ================= */
    // verificăm dacă animalul există deja pentru user


    const animalResult = await pool.query(
          `SELECT id FROM animals WHERE name = $1 LIMIT 1`,
          [pet_name]
          );


    let animal_id;

    if (animalResult.rows.length > 0) {
      animal_id = animalResult.rows[0].id;
    } else {
      const newAnimal = await pool.query(
        `INSERT INTO animals (name)
         VALUES ($1)
         RETURNING id`,
        [pet_name]
      );
      animal_id = newAnimal.rows[0].id;
    }

    /* ================= BOOKING ================= */
    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        hotel_id,
        user_id,
        animal_id,
        start_date,
        end_date,
        price_total,
        currency,
        status,
        owner_email,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING id`,
      [
        hotel_id,
        user_id,
        animal_id,
        start_date,
        end_date,
        price_total,
        "RON",
        "pending",
        owner_email
      ]
    );

    const bookingId = bookingResult.rows[0].id;

    const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});


    // /* ================= EMAIL (simplu) ================= */
    // if (owner_email) {
    //   const transporter = nodemailer.createTransport({
    //     service: "gmail",
    //     auth: {
    //       user: process.env.EMAIL_USER,
    //       pass: process.env.EMAIL_PASS
    //     }
    //   });

    //   await transporter.sendMail({
    //     from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
    //     to: process.env.EMAIL_USER,
    //     subject: "Rezervare înregistrată",
    //     html: `
    //       <h2>Rezervare înregistrată</h2>
    //       <p>Bună, ${owner_name}!</p>
    //       <p>Rezervarea ta a fost înregistrată cu succes.</p>
    //       <ul>
    //         <li><strong>Animal:</strong> ${pet_name} (${pet_type})</li>
    //         <li><strong>Perioada:</strong> ${start_date} - ${end_date}</li>
    //         <li><strong>Status:</strong> în așteptare</li>
    //       </ul>
    //     `
    //   });
    // }


  /* ================= EMAIL ADMIN ================= */
// if (
//   process.env.EMAIL_USER &&
//   process.env.EMAIL_PASS &&
//   process.env.ADMIN_EMAIL &&
//   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ADMIN_EMAIL)
// ) {
//   try {
//     const adminTransporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       }
//     });

//     await adminTransporter.sendMail({
//       from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
//       to: process.env.ADMIN_EMAIL,
//       subject: "📌 `Confirmă cererea lui ${owner_name} la hotel ${hotel_id}`",
//       html: `
//         <h2>Rezervare nouă</h2>
//         <ul>
//           <li>Animal: ${pet_name} (${pet_type})</li>
//           <li>Proprietar: ${owner_name} (${owner_email})</li>
//           <li>Perioada: ${check_in} - ${check_out}</li>
//            <p>
//               <a href="${process.env.FRONTEND_URL}/api/book/${bookingId}/approve">✅ Aprobați</a>
//               <a href="${process.env.FRONTEND_URL}/api/book/${bookingId}/reject">❌ Respingeți</a>
//             </p>
//         </ul>
//       `
//     });

//     console.log("📧 Email admin trimis cu succes");
//   } catch (adminMailError) {
//     console.warn("⚠️ Email admin NEtrimis:", adminMailError.message);
//   }
// } else {
//   console.warn("⚠️ Email admin dezactivat (credite lipsă sau email invalid)");
// }


    await transporter.sendMail({
      from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_ADMIN,
      subject: `Confirmă cererea lui ${owner_name} la hotel ${hotel_id}`,
      html: `
        <h2>Rezervare nouă</h2>
        <p>Animal: ${pet_name} (${pet_type})</p>
        <p>Proprietar: ${owner_name} (${owner_email})</p>
        <p>Perioada: ${check_in} - ${check_out}</p>
        <p>
          <a href="${process.env.BACKEND_URL}/api/book/${bookingId}/accept">✅ Aprobați</a>
          <a href="${process.env.BACKEND_URL}/api/book/${bookingId}/reject">❌ Respingeți</a>
        </p>
      `
    });

//     /* ================= RĂSPUNS ================= */
//     return res.status(201).json({
//       success: true,
//       message: "Rezervare creată cu succes",
//       booking_id: bookingId
//     });

   } catch (error) {
     console.error("❌ Eroare creare rezervare:", error);
     return res.status(500).json({
       success: false,
       message: "Eroare internă la creare rezervare"
     });
  }
 });

/* =====================================================
   GET /api/book/:id/accept
   ===================================================== */

   /*
router.get("/:id/accept", async (req, res) => {
 try {
    const { id } = req.params;

    // 1️⃣ actualizează status
    await pool.query(
      `UPDATE bookings SET status = 'approved' WHERE id = $1 RETURNING *`,
      [id]
    );

    const booking = (await pool.query(`SELECT * FROM bookings WHERE id=$1`, [id])).rows[0];
if (booking.owner_email) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
          to: booking.owner_email,
          subject: "Rezervarea ta a fost aprobată ✅",
          html: `
            <h2>Rezervarea ta a fost aprobată!</h2>
            <p>Hotel ID: ${booking.hotel_id}</p>
            <p>Perioada: ${booking.start_date} - ${booking.end_date}</p>
          `
        });
      } catch (err) {
        console.warn("⚠️ Email user NEtrimis:", err.message);
      }
    }

    res.send("<h2>✅ Rezervarea a fost aprobată</h2>");
  } catch (err) {
    res.status(500).send("Eroare la aprobare");
  }
});

/* =====================================================
   GET /api/book/:id/reject
   ===================================================== */

   /*
router.get("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ actualizează status
    await pool.query(
      `UPDATE bookings SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [id]
    );

    const booking = (await pool.query(`SELECT * FROM bookings WHERE id=$1`, [id])).rows[0];

    // 2️⃣ trimite email către user
    if (booking.owner_email) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
          to: booking.owner_email,
          subject: "Rezervarea ta a fost respinsă ❌",
          html: `
            <h2>Rezervarea ta a fost respinsă!</h2>
            <p>Hotel ID: ${booking.hotel_id}</p>
            <p>Perioada: ${booking.start_date} - ${booking.end_date}</p>
          `
        });
      } catch (err) {
        console.warn("⚠️ Email user NEtrimis:", err.message);
      }
    }

    res.send("<h2>❌ Rezervarea a fost respinsă</h2>");
  } catch (err) {
    res.status(500).send("Eroare la respingere");
  }
});


*/
router.get("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;

    // actualizare status
    const result = await pool.query(
      `UPDATE bookings SET status = 'approved' WHERE id=$1 RETURNING *`,
      [id]
    );

    const booking = result.rows[0];

    const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});


    // trimite email user
    if (booking.owner_email) {
      try {
        await transporter.sendMail({
          from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
          to: booking.owner_email,
          subject: "Rezervarea ta a fost aprobată ✅",
          html: `
            <h2>Rezervarea ta a fost aprobată!</h2>
            <p>Hotel ID: ${booking.hotel_id}</p>
            <p>Perioada: ${booking.start_date} - ${booking.end_date}</p>
          `
        });
      } catch (err) {
        console.warn("⚠️ Email user NEtrimis:", err.message);
      }
    }

    res.send("<h2>✅ Rezervarea a fost aprobată</h2>");
  } catch (err) {
    res.status(500).send("Eroare la aprobare");
  }
});


router.get("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    // actualizare status
    const result = await pool.query(
      `UPDATE bookings SET status = 'rejected' WHERE id=$1 RETURNING *`,
      [id]
    );

    const booking = result.rows[0];

    const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});

    // trimite email user
    if (booking.owner_email) {
      try {
        await transporter.sendMail({
          from: `"Pet Hotel" <${process.env.EMAIL_USER}>`,
          to: booking.owner_email,
          subject: "Rezervarea ta a fost respinsa ❌",
          html: `
            <h2>Rezervarea ta a fost aprobată!</h2>
            <p>Hotel ID: ${booking.hotel_id}</p>
            <p>Perioada: ${booking.start_date} - ${booking.end_date}</p>
          `
        });
      } catch (err) {
        console.warn("⚠️ Email user Netrimis:", err.message);
      }
    }

    res.send("<h2>Rezervarea a fost respinsă ❌</h2>");
  } catch (err) {
    res.status(500).send("Eroare la aprobare");
  }
});

export default router;

