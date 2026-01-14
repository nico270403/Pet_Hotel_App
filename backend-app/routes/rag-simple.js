// routes/rag-simple.js - RAG ULTRA-SIMPLU CARE MERGE
import fetch from 'node-fetch';
import db from '../db.js';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'qwen2.5:3b';

// ==================== CACHE SIMPLU ====================
let hotelsCache = [];
let hotelAnimalsCache = {};
let animalsCache = [];

async function loadCache() {
  console.log("📦 Încarc date din DB...");
  
  try {
    // 1. Toate hotelurile
    const hotelsRes = await db.query(`
      SELECT id, name, city, rating, short_description, address 
      FROM hotels 
      ORDER BY city, rating DESC
    `);
    hotelsCache = hotelsRes.rows;
    
    // 2. Toate animalele
    const animalsRes = await db.query('SELECT name FROM animals');
    animalsCache = animalsRes.rows.map(r => r.name.toLowerCase());
    
    // 3. Relații hotel-animale
    const haRes = await db.query(`
      SELECT ha.hotel_id, a.name as animal_name 
      FROM hotel_animals ha
      JOIN animals a ON ha.animal_id = a.id
    `);
    
    const map = {};
    haRes.rows.forEach(r => {
      if (!map[r.hotel_id]) map[r.hotel_id] = [];
      map[r.hotel_id].push(r.animal_name.toLowerCase());
    });
    hotelAnimalsCache = map;
    
    console.log(`✅ Cache încărcat: ${hotelsCache.length} hoteluri, ${animalsCache.length} animale`);
    
  } catch (error) {
    console.error("❌ Eroare load cache:", error.message);
    // Fallback date
    hotelsCache = [];
    animalsCache = ['câine', 'pisică', 'hamster', 'iepure'];
  }
}

// ==================== FUNCȚIE SIMPLĂ DE CAUTARE ====================

function searchHotelsSimple(city, animal) {
  console.log(`🔍 Caută: ${animal} în ${city}`);
  
  if (!city || !animal) {
    return { hotels: [], message: "Lipsesc informații" };
  }
  
  // Normalizează
  const cityLower = city.toLowerCase();
  const animalLower = animal.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ș/g, "s").replace(/ț/g, "t");
  
  // 1. Găsește hoteluri în oraș
  const hotelsInCity = hotelsCache.filter(h => 
    h.city.toLowerCase().includes(cityLower) || 
    cityLower.includes(h.city.toLowerCase())
  );
  
  if (hotelsInCity.length === 0) {
    return { 
      hotels: [], 
      message: `Nu am hoteluri în ${city}.` 
    };
  }
  
  // 2. Găsește hoteluri care acceptă animalul
  const matchingHotels = hotelsInCity.filter(hotel => {
    const acceptedAnimals = hotelAnimalsCache[hotel.id] || [];
    
    // Verifică fiecare animal acceptat
    return acceptedAnimals.some(acceptedAnimal => {
      const acceptedNormalized = acceptedAnimal
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ș/g, "s").replace(/ț/g, "t");
      
      return acceptedNormalized.includes(animalLower) || 
             animalLower.includes(acceptedNormalized);
    });
  });
  
  // 3. Sortează după rating
  matchingHotels.sort((a, b) => b.rating - a.rating);
  
  return {
    hotels: matchingHotels.slice(0, 10),
    totalFound: matchingHotels.length,
    city: city,
    animal: animal
  };
}

// ==================== EXTRAGERE PARAMETRI CU LLM ====================

async function extractParamsWithLLM(message) {
  console.log(`🤖 LLM analizează: "${message}"`);
  
  const prompt = `<|im_start|>system
Extrage orașul și animalul din mesajul utilizatorului.

IMPORTANT: Normalizează animalele:
- "motan", "pisoi", "pisică" → "pisică"
- "cățel", "cățeluș", "câine" → "câine"  
- "porcușor de Guineea", "guinea pig" → "porcușor de guineea"
- "reptilă", "șarpe", "șopârlă" → "reptilă"

Orașe posibile: București, Cluj-Napoca, Timișoara, Iași, Popești-Leordeni, Bragadiru
Animale posibile: ${animalsCache.join(', ')}

Răspunde DOAR cu JSON:
{
  "city": "nume_oras_sau_null",
  "animal": "nume_animal_sau_null"
}

Exemple:
"Vreau hotel pentru câine în București" → {"city":"București","animal":"câine"}
"Caut loc pentru pisică" → {"city":null,"animal":"pisică"}
"În Timișoara" → {"city":"Timișoara","animal":null}<|im_end|>

<|im_start|>user
${message}<|im_end|>
<|im_start|>assistant
{`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,
        options: { 
          temperature: 0.1,
          num_predict: 100 
        }
      })
    });

    if (!response.ok) {
      console.warn("⚠️ LLM nu răspunde, folosesc fallback");
      return { city: null, animal: null };
    }

    const data = await response.json();
    let jsonText = data.response.trim();
    
    // Curăță răspunsul
    jsonText = jsonText.replace(/^[^{]*/, ''); // Șterge tot înainte de {
    if (!jsonText.endsWith('}')) jsonText += '}';
    
    console.log("📨 LLM răspuns:", jsonText);
    
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.warn("❌ JSON invalid, fallback:", e.message);
      return { city: null, animal: null };
    }
    
  } catch (error) {
    console.error("❌ Eroare LLM:", error.message);
    return { city: null, animal: null };
  }
}

// ==================== FUNCȚIA PRINCIPALĂ RAG ====================

export async function ragChat(message, conversation = []) {
  console.log("\n" + "🌟".repeat(40));
  console.log("🤖 RAG SIMPLU - Procesează mesaj");
  console.log("🌟".repeat(40));
  
  // 1. Încarcă cache dacă e gol
  if (hotelsCache.length === 0) {
    await loadCache();
  }
  
  // 2. Extrage parametri cu LLM
  const params = await extractParamsWithLLM(message);
  console.log("📊 Parametri extrași:", params);
  
  // 3. Dacă lipsesc, întreabă
  if (!params.city && !params.animal) {
    return {
      text: "Pentru a căuta hoteluri, am nevoie să știu pentru ce animal și în ce oraș.\n\nExemplu: 'Caut hotel pentru pisică în București'",
      follow_up: true,
      hotels: []
    };
  }
  
  if (!params.city) {
    const animalExamples = animalsCache.slice(0, 3).join(', ');
    return {
      text: `Pentru ce oraș cauți hotel pentru ${params.animal || 'animale'}?\n\nExemple: București, Cluj-Napoca, Timișoara`,
      follow_up: true,
      hotels: []
    };
  }
  
  if (!params.animal) {
    const city = params.city || "un oraș";
    return {
      text: `Pentru ce animal cauți hotel în ${city}?\n\nExemple: ${animalsCache.slice(0, 5).join(', ')}`,
      follow_up: true,
      hotels: []
    };
  }
  
  // 4. Caută hoteluri
  const result = searchHotelsSimple(params.city, params.animal);
  
  // 5. Generează răspuns frumos
  if (result.hotels.length === 0) {
    // Ce animale sunt disponibile în acest oraș?
    const hotelsInCity = hotelsCache.filter(h => 
      h.city.toLowerCase().includes(params.city.toLowerCase()) ||
      params.city.toLowerCase().includes(h.city.toLowerCase())
    );
    
    const availableAnimals = new Set();
    hotelsInCity.forEach(h => {
      const animals = hotelAnimalsCache[h.id] || [];
      animals.forEach(a => availableAnimals.add(a));
    });
    
    const animalList = Array.from(availableAnimals).join(', ');
    
    return {
      text: `Nu am găsit hoteluri pentru ${params.animal} în ${params.city}.\n\n` +
            `În ${params.city} avem hoteluri pentru: ${animalList || "niciun animal"}\n\n` +
            `Încearcă cu un alt animal sau alt oraș!`,
      hotels: [],
      follow_up: false
    };
  }
  
  // 6. Formatează răspunsul cu hoteluri găsite
  let responseText = `✅ Am găsit ${result.hotels.length} hoteluri pentru ${params.animal} în ${params.city}:\n\n`;
  
  result.hotels.forEach((hotel, index) => {
    const stars = '⭐'.repeat(Math.floor(hotel.rating));
    responseText += `${index + 1}. **${hotel.name}** ${stars} (${hotel.rating}/5)\n`;
    
    if (hotel.short_description) {
      responseText += `   ${hotel.short_description}\n`;
    }
    
    if (hotel.address) {
      responseText += `   📍 ${hotel.address}\n`;
    }
    
    responseText += `   🏙️ ${hotel.city}\n\n`;
  });
  
  if (result.totalFound > result.hotels.length) {
    responseText += `\n...și încă ${result.totalFound - result.hotels.length} hoteluri.`;
  }
  
  console.log("✅ Răspuns RAG generat!");
  console.log("🌟".repeat(40));
  
  return {
    text: responseText,
    hotels: result.hotels,
    follow_up: false,
    params: params
  };
}

// ==================== FUNCȚIE DE TEST ====================

export async function testRAG() {
  console.log("\n🧪 TEST RAG SIMPLU");
  
  const testMessages = [
    "Caut hotel pentru câine în București",
    "Vreau hotel pentru pisică",
    "În Timișoara pentru hamster",
    "Caut un hotel"
  ];
  
  for (const msg of testMessages) {
    console.log(`\n📝 Test: "${msg}"`);
    const result = await ragChat(msg);
    console.log(`📤 Răspuns: ${result.text.substring(0, 100)}...`);
    console.log(`🏨 Hoteluri găsite: ${result.hotels.length}`);
  }
}

export default {
  ragChat,
  testRAG,
  loadCache
};