// // // routes/rag-simple.js 
// // import fetch from 'node-fetch';
// // import db from '../db.js';

// // const OLLAMA_URL = 'http://localhost:11434';
// // const MODEL = 'llama3.1';

// // let hotelsCache = [];
// // let hotelAnimalsCache = {};
// // let animalsCache = [];

// // async function loadCache() {
// //   console.log("📦 Încarc date din DB...");
  
// //   try {
// //     const hotelsRes = await db.query(`
// //       SELECT id, name, city, rating, short_description, address 
// //       FROM hotels 
// //       ORDER BY city, rating DESC
// //     `);
// //     hotelsCache = hotelsRes.rows;
    
// //     const animalsRes = await db.query('SELECT name FROM animals');
// //     animalsCache = animalsRes.rows.map(r => r.name.toLowerCase());
    
// //     const haRes = await db.query(`
// //       SELECT ha.hotel_id, a.name as animal_name 
// //       FROM hotel_animals ha
// //       JOIN animals a ON ha.animal_id = a.id
// //     `);
    
// //     const map = {};
// //     haRes.rows.forEach(r => {
// //       if (!map[r.hotel_id]) map[r.hotel_id] = [];
// //       map[r.hotel_id].push(r.animal_name.toLowerCase());
// //     });
// //     hotelAnimalsCache = map;
    
// //     console.log(`✅ Cache încărcat: ${hotelsCache.length} hoteluri, ${animalsCache.length} animale`);
    
// //   } catch (error) {
// //     console.error("❌ Eroare load cache:", error.message);
// //     hotelsCache = [];
// //     animalsCache = ['câine', 'pisică', 'hamster', 'iepure'];
// //   }
// // }


// // function searchHotelsSimple(city, animal) {
// //   console.log(`🔍 Caută: ${animal} în ${city}`);
  
// //   if (!city || !animal) {
// //     return { hotels: [], message: "Lipsesc informații" };
// //   }
  
// //   const cityLower = city.toLowerCase();
// //   const animalLower = animal.toLowerCase()
// //     .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
// //     .replace(/ș/g, "s").replace(/ț/g, "t");
  
// //   const hotelsInCity = hotelsCache.filter(h => 
// //     h.city.toLowerCase().includes(cityLower) || 
// //     cityLower.includes(h.city.toLowerCase())
// //   );
  
// //   if (hotelsInCity.length === 0) {
// //     return { 
// //       hotels: [], 
// //       message: `Nu am hoteluri în ${city}.` 
// //     };
// //   }
  
// //   const matchingHotels = hotelsInCity.filter(hotel => {
// //     const acceptedAnimals = hotelAnimalsCache[hotel.id] || [];
    
// //     return acceptedAnimals.some(acceptedAnimal => {
// //       const acceptedNormalized = acceptedAnimal
// //         .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
// //         .replace(/ș/g, "s").replace(/ț/g, "t");
      
// //       return acceptedNormalized.includes(animalLower) || 
// //              animalLower.includes(acceptedNormalized);
// //     });
// //   });
  
// //   matchingHotels.sort((a, b) => b.rating - a.rating);
  
// //   return {
// //     hotels: matchingHotels.slice(0, 10),
// //     totalFound: matchingHotels.length,
// //     city: city,
// //     animal: animal
// //   };
// // }


// // async function extractParamsWithLLM(message, conversation = []) {
  
// //   console.log(`\n--- 🕵️ DEBUG ISTORIC ---`);
// //   console.log(`Mesaj nou: "${message}"`);
// //   console.log(`Număr mesaje în istoric: ${conversation.length}`);

// //   let historyText = "Niciun istoric.";
// //   if (conversation && conversation.length > 0) {
// //     const recent = conversation.slice(-2).map(m => m.text || m.content || "").filter(t => t.length > 0);
// //     if (recent.length > 0) {
// //       historyText = recent.join("\n- ");
// //     }
// //   }

// //   // PROMPT SIMPLU ȘI CLAR
// //   const prompt = `Ești un sistem automat care returnează date despre hoteluri.
// // Analizează "Mesajul curent" și "Istoricul". Extrage orașul și animalul.
// // Trebuie să returnezi datele STRICT în format JSON, cu cheile "city" și "animal".

// // REGULI:
// // - Dacă orașul lipsește, valoarea va fi null.
// // - Nu inventa orașe.

// // Orașe recunoscute: București, Cluj-Napoca, Timișoara, Iași, Popești-Leordeni, Bragadiru
// // Animale recunoscute: ${animalsCache.join(', ')}

// // Exemplu de răspuns dorit:
// // { "city": "Cluj-Napoca", "animal": "arici" }

// // ---
// // Istoric:
// // - ${historyText}

// // Mesajul curent: "${message}"`;

// //   try {
// //     const response = await fetch(`${OLLAMA_URL}/api/generate`, {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify({
// //         model: 'llama3.1',
// //         prompt: prompt,
// //         stream: false,
// //         keep_alive: -1,
// //         format: "json", 
// //         options: { 
// //           temperature: 0.0,
// //           num_predict: 50 
// //         }
// //       })
// //     });

// //     if (!response.ok) return { city: null, animal: null };

// //     const data = await response.json();
// //     const jsonText = data.response;
    
// //     console.log("📨 Llama 3.1 a dedus:", jsonText);
// //     return JSON.parse(jsonText);
    
// //   } catch (error) {
// //     console.error("❌ Eroare LLM:", error.message);
// //     return { city: null, animal: null };
// //   }
// // }

// // export async function ragChat(message, conversation = []) {
// //   console.log("\n" + "🌟".repeat(40));
// //   console.log("🤖 RAG SIMPLU - Procesează mesaj");
// //   console.log("🌟".repeat(40));
  
// //   if (hotelsCache.length === 0) {
// //     await loadCache();
// //   }
  
// //   const params = await extractParamsWithLLM(message, conversation);
// //   console.log("📊 Parametri extrași:", params);
  
// //   if (!params.city && !params.animal) {
// //     return {
// //       text: "Pentru a căuta hoteluri, am nevoie să știu pentru ce animal și în ce oraș.\n\nExemplu: 'Caut hotel pentru pisică în București'",
// //       follow_up: true,
// //       hotels: []
// //     };
// //   }
  
// //   if (!params.city) {
// //     const animalExamples = animalsCache.slice(0, 3).join(', ');
// //     return {
// //       text: `Pentru ce oraș cauți hotel pentru ${params.animal || 'animale'}?\n\nExemple: București, Cluj-Napoca, Timișoara`,
// //       follow_up: true,
// //       hotels: []
// //     };
// //   }
  
// //   if (!params.animal) {
// //     const city = params.city || "un oraș";
// //     return {
// //       text: `Pentru ce animal cauți hotel în ${city}?\n\nExemple: ${animalsCache.slice(0, 5).join(', ')}`,
// //       follow_up: true,
// //       hotels: []
// //     };
// //   }
  
// //   const result = searchHotelsSimple(params.city, params.animal);
  
// //   if (result.hotels.length === 0) {
// //     const hotelsInCity = hotelsCache.filter(h => 
// //       h.city.toLowerCase().includes(params.city.toLowerCase()) ||
// //       params.city.toLowerCase().includes(h.city.toLowerCase())
// //     );
    
// //     const availableAnimals = new Set();
// //     hotelsInCity.forEach(h => {
// //       const animals = hotelAnimalsCache[h.id] || [];
// //       animals.forEach(a => availableAnimals.add(a));
// //     });
    
// //     const animalList = Array.from(availableAnimals).join(', ');
    
// //     return {
// //       text: `Nu am găsit hoteluri pentru ${params.animal} în ${params.city}.\n\n` +
// //             `În ${params.city} avem hoteluri pentru: ${animalList || "niciun animal"}\n\n` +
// //             `Încearcă cu un alt animal sau alt oraș!`,
// //       hotels: [],
// //       follow_up: false
// //     };
// //   }
  
// //   let responseText = `✅ Am găsit ${result.hotels.length} hoteluri pentru ${params.animal} în ${params.city}:\n\n`;
  
// //   result.hotels.forEach((hotel, index) => {
// //     const stars = '⭐'.repeat(Math.floor(hotel.rating));
// //     responseText += `${index + 1}. **${hotel.name}** ${stars} (${hotel.rating}/5)\n`;
    
// //     if (hotel.short_description) {
// //       responseText += `   ${hotel.short_description}\n`;
// //     }
    
// //     if (hotel.address) {
// //       responseText += `   📍 ${hotel.address}\n`;
// //     }
    
// //     responseText += `   🏙️ ${hotel.city}\n\n`;

// //     //responseText += `   📅 **Rezervă acum:** \`/rezerva ${hotel.id}\`\n\n`;
// //   });
  
// //   if (result.totalFound > result.hotels.length) {
// //     responseText += `\n...și încă ${result.totalFound - result.hotels.length} hoteluri.`;
// //   }
  
// //   console.log("✅ Răspuns RAG generat!");
// //   console.log("🌟".repeat(40));
  
// //   return {
// //     text: responseText,
// //     hotels: result.hotels,
// //     follow_up: false,
// //     params: params
// //   };
// // }


// // export async function testRAG() {
// //   console.log("\n🧪 TEST RAG SIMPLU");
  
// //   const testMessages = [
// //     "Caut hotel pentru câine în București",
// //     "Vreau hotel pentru pisică",
// //     "În Timișoara pentru hamster",
// //     "Caut un hotel"
// //   ];
  
// //   for (const msg of testMessages) {
// //     console.log(`\n📝 Test: "${msg}"`);
// //     const result = await ragChat(msg);
// //     console.log(`📤 Răspuns: ${result.text.substring(0, 100)}...`);
// //     console.log(`🏨 Hoteluri găsite: ${result.hotels.length}`);
// //   }
// // }

// // export default {
// //   ragChat,
// //   testRAG,
// //   loadCache
// // };

// // loadCache();


// import db from '../db.js';
// import fetch from 'node-fetch';

// const OLLAMA_URL = 'http://localhost:11434';
// const MODEL = 'llama3.2:3b';

// let hotelsCache = [];
// let animalsCache = [];
// let hotelAnimalsCache = {};

// const sessions = new Map();

// const normalize = (t) =>
//   (t || "")
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "");

// function getSession(sessionId) {
//   if (!sessions.has(sessionId)) {
//     sessions.set(sessionId, { city: null, animal: null });
//   }
//   return sessions.get(sessionId);
// }

// async function extractLLM(msg) {
//   const prompt = `Analizează mesajul utilizatorului și extrage datele solicitate. Returnează STRICT un JSON valid.

// Reguli:
// - "city": orașul cerut (null dacă lipsește).
// - "animal": animalul cerut (null dacă lipsește).
// - "is_offtopic": true dacă mesajul conține o insultă, este un salut simplu sau nu are legătură cu hotelurile de animale, altfel false.
// - "reply": un mesaj politicos doar dacă is_offtopic este true, altfel null.

// Mesaj: "${msg}"`;

//   const res = await fetch(`${OLLAMA_URL}/api/generate`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       model: MODEL,
//       prompt: prompt,
//       format: "json",
//       stream: false,
//       options: { temperature: 0.0, num_predict: 100 }
//     })
//   });

//   const data = await res.json().catch(() => ({}));

//   try {
//     return JSON.parse(data.response || "{}");
//   } catch {
//     return { city: null, animal: null, is_offtopic: false, reply: null };
//   }
// }

// function search(city, animal) {
//   const cityN = normalize(city);
//   const animalN = normalize(animal);

//   const hotelsInCity = hotelsCache.filter(h =>
//     normalize(h.city).includes(cityN)
//   );

//   const result = hotelsInCity.filter(h => {
//     const allowed = hotelAnimalsCache[h.id] || [];
//     return allowed.some(a => normalize(a).includes(animalN));
//   });

//   result.sort((a, b) => b.rating - a.rating);
//   return result.slice(0, 10);
// }

// async function loadCache() {
//   const hotels = await db.query(`SELECT id, name, city, rating, short_description FROM hotels`);
//   hotelsCache = hotels.rows;

//   const animals = await db.query(`SELECT name FROM animals`);
//   animalsCache = animals.rows.map(r => r.name);

//   const ha = await db.query(`
//     SELECT hotel_id, a.name
//     FROM hotel_animals ha
//     JOIN animals a ON a.id = ha.animal_id
//   `);

//   hotelAnimalsCache = {};
//   ha.rows.forEach(r => {
//     if (!hotelAnimalsCache[r.hotel_id]) hotelAnimalsCache[r.hotel_id] = [];
//     hotelAnimalsCache[r.hotel_id].push(r.name);
//   });
// }

// export async function ragChat(message, conversation = [], sessionId="default") {
//   if (!hotelsCache.length) await loadCache();

//   const session = getSession(sessionId);
//   const llmData = await extractLLM(message);

//   if (llmData.is_offtopic && llmData.reply) {
//     return { text: llmData.reply, hotels: [], follow_up: false, context: { city: session.city, animal: session.animal } };
//   }

//   if (llmData.city) session.city = llmData.city;
//   if (llmData.animal) session.animal = llmData.animal;

//   const city = session.city;
//   const animal = session.animal;

//   if (!city && !animal) {
//     return { text: "Spune-mi pentru ce animal și în ce oraș cauți hotel 🐾", hotels: [], follow_up: true, context: { city, animal } };
//   }

//   if (!city) {
//     return { text: `Pentru ce oraș cauți hotel pentru ${animal}?`, hotels: [], follow_up: true, context: { city, animal } };
//   }

//   if (!animal) {
//     return { text: `Pentru ce animal cauți hotel în ${city}?`, hotels: [], follow_up: true, context: { city, animal } };
//   }

//   const results = search(city, animal);

//   if (!results.length) {
//     return {
//       text: `Din păcate, nu am găsit hoteluri pentru ${animal} în ${city}. Încearcă un alt oraș!`,
//       hotels: [], follow_up: false, context: { city, animal }
//     };
//   }

//   return {
//     text: `Am găsit ${results.length} hoteluri în ${city} pentru ${animal}:\n\nAlege unul de mai jos pentru a începe rezervarea!`,
//     hotels: results, follow_up: false, context: { city, animal }
//   };
// }

// loadCache();

import db from '../db.js';
import fetch from 'node-fetch';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2:3b';

let hotelsCache = [];
let animalsCache = [];
let hotelAnimalsCache = {};

const sessions = new Map();

const normalize = (t) =>
  (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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
  
  // NOU: Detectează când omul vrea să facă o rezervare generală
  if (/(vreau.*rezerv|toate.*hotel|arata.*hotel|vreau.*fac.*rezervare)/.test(m)) return "show_all";

  return null;
}

function extractFast(msg) {
  const m = normalize(msg);

  const cities = ["bucuresti", "cluj", "timisoara", "iasi", "brasov", "oradea"];
  const animals = animalsCache.length ? animalsCache : ["caine", "pisica", "hamster"];

  let city = cities.find(c => m.includes(c)) || null;
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

  // NOU: Răspunsul empatic cu toate hotelurile
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

  if (!city || !animal) {
    const llm = await extractLLM(message);
    city = city || llm.city;
    animal = animal || llm.animal;
  }

  if (city) session.city = city;
  if (animal) session.animal = animal;

  city = city || session.city;
  animal = animal || session.animal;

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
    text: `Uite ce surpriză! 🐾 Am găsit ${results.length} locuri excelente în ${city} pentru un puiuț de ${animal}:`,
    hotels: results
  };
}

loadCache();