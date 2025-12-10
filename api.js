// api.js
const API_BASE_URL = "http://172.20.10.2:3000"; 

export const api = {
  async getHotels() {
    const res = await fetch(`${API_BASE_URL}/api/hotels`);
    return await res.json();
  },

  async sendMessage(message) {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    return await res.json();
  },

  async book(data) {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  }
};
