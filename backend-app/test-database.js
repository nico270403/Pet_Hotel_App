// Rulează: node test-database.js
import db from './db.js';

async function testDatabase() {
  console.log("\n🔍 TESTARE BAZĂ DE DATE\n");

  try {
    // 1. Verifică animalele
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 ANIMALE ÎNREGISTRATE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const animals = await db.query('SELECT * FROM animals ORDER BY id');
    console.table(animals.rows);
    console.log(`Total: ${animals.rows.length} animale\n`);

    // 2. Verifică hotelurile
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🏨 HOTELURI ÎNREGISTRATE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const hotels = await db.query('SELECT * FROM hotels ORDER BY city, name');
    console.table(hotels.rows);
    console.log(`Total: ${hotels.rows.length} hoteluri\n`);

    // 3. Verifică relațiile hotel-animal
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔗 HOTELURI ȘI ANIMALELE ACCEPTATE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const hotelAnimals = await db.query(`
      SELECT 
        h.name as hotel,
        h.city,
        STRING_AGG(a.name, ', ' ORDER BY a.name) as animale_acceptate
      FROM hotels h
      LEFT JOIN hotel_animals ha ON h.id = ha.hotel_id
      LEFT JOIN animals a ON ha.animal_id = a.id
      GROUP BY h.id, h.name, h.city
      ORDER BY h.city, h.name
    `);
    console.table(hotelAnimals.rows);

    // 4. Test specific: hoteluri pentru arici în Timișoara
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🦔 TEST: Hoteluri pentru ARICI în TIMIȘOARA:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const testQuery = await db.query(`
      SELECT DISTINCT h.id, h.name, h.city, h.rating
      FROM hotels h
      JOIN hotel_animals ha ON h.id = ha.hotel_id
      JOIN animals a ON ha.animal_id = a.id
      WHERE LOWER(a.name) = 'arici'
        AND h.city = 'Timișoara'
    `);
    
    if (testQuery.rows.length === 0) {
      console.log("❌ NU există hoteluri pentru arici în Timișoara!");
      console.log("\n💡 Soluții:");
      console.log("   1. Adaugă 'arici' în tabela animals");
      console.log("   2. Creează hoteluri în Timișoara");
      console.log("   3. Conectează hotelurile cu animalul 'arici' în hotel_animals");
    } else {
      console.log("✅ Găsite:");
      console.table(testQuery.rows);
    }

    // 5. Verifică toate orașele disponibile
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📍 ORAȘE DISPONIBILE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const cities = await db.query(`
      SELECT city, COUNT(*) as nr_hoteluri
      FROM hotels
      GROUP BY city
      ORDER BY nr_hoteluri DESC
    `);
    console.table(cities.rows);

  } catch (error) {
    console.error("\n❌ EROARE:", error.message);
    console.error(error);
  } finally {
    await db.end();
    console.log("\n✅ Test finalizat!\n");
  }
}

testDatabase();