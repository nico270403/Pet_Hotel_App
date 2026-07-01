// dbHelpers.js
import db from "./database";

/* HOTELS  */
export const getHotels = () => {
  try {
    console.log('Getting hotels from database...');
    
    // getAllSync pentru a obține toate hotelurile
    if (db.getAllSync) {
      const hotels = db.getAllSync(
        `SELECT * FROM hotels ORDER BY rating DESC, name ASC;`
      );
      console.log('Hotels retrieved:', hotels);
      return hotels;
    } else {
      // Fallback pentru alte metode
      throw new Error('getAllSync not available');
    }
  } catch (error) {
    console.log("getHotels error", error);
    throw error;
  }
};

export const getHotelById = (id) => {
  try {
    if (db.getFirstSync) {
      return db.getFirstSync(
        `SELECT * FROM hotels WHERE id = ?;`,
        [id]
      );
    } else if (db.getAllSync) {
      const results = db.getAllSync(
        `SELECT * FROM hotels WHERE id = ?;`,
        [id]
      );
      return results[0] || null;
    } else {
      throw new Error('No query method available');
    }
  } catch (error) {
    console.log("getHotelById error", error);
    throw error;
  }
};

export const getHotelsByCity = (city) => {
  try {
    if (db.getAllSync) {
      return db.getAllSync(
        `SELECT * FROM hotels WHERE city LIKE ? ORDER BY rating DESC;`,
        [`%${city}%`]
      );
    } else {
      throw new Error('getAllSync not available');
    }
  } catch (error) {
    console.log("getHotelsByCity error", error);
    throw error;
  }
};

// Funcție pentru a obține hotelurile cu imaginile lor
export const getHotelsWithImages = () => {
  try {
    if (db.getAllSync) {
      const hotels = db.getAllSync(
        `SELECT * FROM hotels ORDER BY rating DESC, name ASC;`
      );
      
      // Pentru fiecare hotel, obtin imaginile
      const hotelsWithImages = hotels.map(hotel => {
        const images = db.getAllSync(
          `SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY is_primary DESC;`,
          [hotel.id]
        );
        return {
          ...hotel,
          images: images || []
        };
      });
      
      return hotelsWithImages;
    } else {
      throw new Error('getAllSync not available');
    }
  } catch (error) {
    console.log("getHotelsWithImages error", error);
    throw error;
  }
};

/* BOOKINGS */
export const addBooking = (booking) => {
  const { hotel_id, pet_name, owner_name, start_date, end_date, servicesJSON, price, currency } = booking;
  
  try {
    if (db.runSync) {
      return db.runSync(
        `INSERT INTO bookings (hotel_id, pet_name, owner_name, start_date, end_date, services, price, currency, status, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0);`,
        [hotel_id, pet_name, owner_name, start_date, end_date, servicesJSON, price, currency]
      );
    } else {
      throw new Error('runSync not available');
    }
  } catch (error) {
    console.log("addBooking error", error);
    throw error;
  }
};

export const getAllBookings = () => {
  try {
    if (db.getAllSync) {
      return db.getAllSync(
        `SELECT b.*, h.name as hotel_name, h.city as hotel_city 
         FROM bookings b 
         LEFT JOIN hotels h ON b.hotel_id = h.id 
         ORDER BY b.created_at DESC;`
      );
    } else {
      throw new Error('getAllSync not available');
    }
  } catch (error) {
    console.log("getAllBookings error", error);
    throw error;
  }
};


export const getHotelWithDetails = (hotelId) => {
  try {
    if (db.getFirstSync) {
      // Obtin detaliile hotelului
      const hotel = db.getFirstSync(
        `SELECT * FROM hotels WHERE id = ?;`,
        [hotelId]
      );
      
      if (hotel) {
        // Obtin imaginile hotelului
        const images = db.getAllSync(
          `SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY is_primary DESC;`,
          [hotelId]
        );
        
        return {
          ...hotel,
          images: images || []
        };
      }
      return null;
    } else {
      throw new Error('getFirstSync not available');
    }
  } catch (error) {
    console.log("getHotelWithDetails error", error);
    throw error;
  }
};

export default {
  getHotels,
  getHotelById,
  getHotelsByCity,
  getHotelsWithImages,
  addBooking,
  getAllBookings,
  getHotelWithDetails
};
