//api.js

const API_BASE_URL = "http://172.20.10.2:3000"; 

export const api = {
  async getHotels() {
    const res = await fetch(`${API_BASE_URL}/api/hotels`);
    return await res.json();
  },

  async sendMessage(message, sessionId, hotelsShown = []) {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message, 
        sessionId,    // ID de sesiune pentru a păstra contextul
        hotelsShown   // Lista cu ID-uri de hoteluri deja afișate
      })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  },

  async book(data) {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  },

  async resetChat(sessionId) {
    const res = await fetch(`${API_BASE_URL}/api/chat/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    return await res.json();
  }
};
