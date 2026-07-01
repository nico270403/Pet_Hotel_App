import db from '../db.js';
import fetch from 'node-fetch';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2:3b';

let hotelsCache = [];
let animalsCache = [];
let hotelAnimalsCache = {};

const sessions = new Map();

// const normalize = (t) =>
//   (t || "")
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "");

const normalize = (t) =>
  (t || "")
    .toLowerCase()
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t");

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { city: null, animal: null });
  }
  return sessions.get(sessionId);
}

function detectQuickIntent(msg) {
  const m = normalize(msg);

  if (/^(salut|bun[aă]|hello|hey|hi)$/.test(m)) return "greeting";
  if (/(mulțumesc|mersi|thanks)/.test(m)) return "thanks";
  if (/(ești prost|idiot|prost)/.test(m)) return "insult";
  if (/(ce poți face|help|ajutor)/.test(m)) return "help";
  
  if (/(vreau.*rezerv|toate.*hotel|arata.*hotel|vreau.*fac.*rezervare)/.test(m)) return "show_all";

  return null;
}

function extractFast(msg) {
  const m = normalize(msg);

  const cities = ["Bucuresti", "Cluj", "Timisoara", "Iași", "Brașov", "Oradea"];
  const animals = animalsCache.length ? animalsCache : ["caine", "pisica", "hamster"];

  let city = cities.find(c => m.includes(normalize(c))) || null;
  let animal = animals.find(a => m.includes(normalize(a))) || null;

  return { city, animal };
}

async function extractLLM(msg) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt: `Extrage JSON: city, animal din: "${msg}"`,
      format: "json",
      stream: false,
      keep_alive: "30m",
      options: { temperature: 0 }
    })
  });

  const data = await res.json().catch(() => ({}));

  try {
    return JSON.parse(data.response || "{}");
  } catch {
    return { city: null, animal: null };
  }
}

function search(city, animal) {
  const cityN = normalize(city);
  const animalN = normalize(animal);

  const hotelsInCity = hotelsCache.filter(h =>
    normalize(h.city).includes(cityN)
  );

  const result = hotelsInCity.filter(h => {
    const allowed = hotelAnimalsCache[h.id] || [];
    return allowed.some(a => normalize(a).includes(animalN));
  });

  result.sort((a, b) => b.rating - a.rating);

  return result.slice(0, 10);
}

async function loadCache() {
  const hotels = await db.query(`
    SELECT id, name, city, rating, short_description
    FROM hotels
  `);

  hotelsCache = hotels.rows;

  const animals = await db.query(`SELECT name FROM animals`);
  animalsCache = animals.rows.map(r => r.name);

  const ha = await db.query(`
    SELECT hotel_id, a.name
    FROM hotel_animals ha
    JOIN animals a ON a.id = ha.animal_id
  `);

  hotelAnimalsCache = {};

  ha.rows.forEach(r => {
    if (!hotelAnimalsCache[r.hotel_id]) hotelAnimalsCache[r.hotel_id] = [];
    hotelAnimalsCache[r.hotel_id].push(r.name);
  });
}

export async function ragChat(message, conversation = [], sessionId="default") {
  if (!hotelsCache.length) await loadCache();

  const intent = detectQuickIntent(message);
  if (intent === "greeting")
    return { text: "Salut! 👋 Te ajut cu cel mai mare drag să găsești hoteluri sigure și iubitoare pentru animăluțul tău! 🐾" };

  if (intent === "thanks")
    return { text: "Cu cea mai mare plăcere! 🐶 Ne auzim curând!" };

  if (intent === "insult")
    return { text: "Ups! Sunt aici strict ca să te ajut cu hoteluri pentru animale. Dacă ai nevoie de o sugestie, spune-mi! 🐾" };

  if (intent === "show_all") {
    const allHotels = hotelsCache.slice(0, 10).sort((a, b) => b.rating - a.rating);
    return {
      text: "Yei! 🎉 Iată cele mai apreciate hoteluri din rețeaua noastră. Găsește-l pe cel perfect pentru micuțul tău și apasă pe butonul **'Rezervă acum'** ca să începem:",
      hotels: allHotels,
      follow_up: false
    };
  }

  const session = getSession(sessionId);

  let { city, animal } = extractFast(message);


  city = city || session.city;
  animal = animal || session.animal;

  if (!city || !animal) {
    console.log(`Lipsesc date (city=${city}, animal=${animal}) → apelez Ollama...`);
    const llm = await extractLLM(message);
    city = city || llm.city;
    animal = animal || llm.animal;
  }else{
  console.log(` Găsit din text/sesiune: city=${city}, animal=${animal} → Ollama SĂRIT`);
  }

  if (city) session.city = city;
  if (animal) session.animal = animal;


  if (!city && !animal) {
    return {
      text: "Spune-mi pentru ce animal și în ce oraș cauți cazare! 🐾"
    };
  }

  if (!city) {
    return { text: `Super, ai un ${animal}! 🐾 În ce oraș vrei să-i cauți o cameră?` };
  }

  if (!animal) {
    return { text: `Minunat! Căutăm în ${city}. 🏙️ Pentru ce animal de companie ai nevoie de rezervare?` };
  }

  const results = search(city, animal);

  if (!results.length) {
    return {
      text: `Din păcate, nu am găsit hoteluri momentan pentru ${animal} în ${city}. 🥺`
    };
  }

  return {
    text: `Uite ce surpriză! 🐾 Am găsit ${results.length} locuri excelente în ${city}:`,
    hotels: results,
    context: { city, animal }
  };
}

loadCache();