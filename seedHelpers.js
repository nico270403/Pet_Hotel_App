// seedHelpers.js
import db from "./database";

export const addHotelDirect = async (hotel) => {
  const {
    name, short_description, long_description, address, city,
    phone, email, price_from, rating
  } = hotel;
  
  try {
    console.log('Adding hotel:', name);
    
    if (db.runSync) {
      const result = db.runSync(
        `INSERT INTO hotels (name, short_description, long_description, address, city, phone, email, price_from, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [name, short_description, long_description, address, city, phone, email, price_from, rating]
      );
      
      const hotelId = result.lastInsertRowId;
      console.log(`Hotel added with ID: ${hotelId}`);
      
      // Inserează imaginile (dacă există)
      if (hotel.images && hotel.images.length) {
        for (const [index, uri] of hotel.images.entries()) {
          db.runSync(
            `INSERT INTO hotel_images (hotel_id, uri, is_primary) VALUES (?, ?, ?);`, 
            [hotelId, uri, index === 0 ? 1 : 0]
          );
        }
      }
      
      return hotelId;
    } else {
      throw new Error('runSync not available');
    }
  } catch (error) {
    console.log("Seed addHotel error:", error);
    throw error;
  }
};