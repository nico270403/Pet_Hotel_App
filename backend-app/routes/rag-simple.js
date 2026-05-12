// routes/rag-simple.js 
import fetch from 'node-fetch';
import db from '../db.js';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.1';

let hotelsCache = [];
let hotelAnimalsCache = {};
let animalsCache = [];

async function loadCache() {
  console.log("📦 Încarc date din DB...");
  
  try {
    const hotelsRes = await db.query(`
      SELECT id, name, city, rating, short_description, address 
      FROM hotels 
      ORDER BY city, rating DESC
    `);
    hotelsCache = hotelsRes.rows;
    
    const animalsRes = await db.query('SELECT name FROM animals');
    animalsCache = animalsRes.rows.map(r => r.name.toLowerCase());
    
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
    hotelsCache = [];
    animalsCache = ['câine', 'pisică', 'hamster', 'iepure'];
  }
}


function searchHotelsSimple(city, animal) {
  console.log(`🔍 Caută: ${animal} în ${city}`);
  
  if (!city || !animal) {
    return { hotels: [], message: "Lipsesc informații" };
  }
  
  const cityLower = city.toLowerCase();
  const animalLower = animal.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ș/g, "s").replace(/ț/g, "t");
  
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
  
  const matchingHotels = hotelsInCity.filter(hotel => {
    const acceptedAnimals = hotelAnimalsCache[hotel.id] || [];
    
    return acceptedAnimals.some(acceptedAnimal => {
      const acceptedNormalized = acceptedAnimal
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ș/g, "s").replace(/ț/g, "t");
      
      return acceptedNormalized.includes(animalLower) || 
             animalLower.includes(acceptedNormalized);
    });
  });
  
  matchingHotels.sort((a, b) => b.rating - a.rating);
  
  return {
    hotels: matchingHotels.slice(0, 10),
    totalFound: matchingHotels.length,
    city: city,
    animal: animal
  };
}


async function extractParamsWithLLM(message, conversation = []) {
  
  console.log(`\n--- 🕵️ DEBUG ISTORIC ---`);
  console.log(`Mesaj nou: "${message}"`);
  console.log(`Număr mesaje în istoric: ${conversation.length}`);

  let historyText = "Niciun istoric.";
  if (conversation && conversation.length > 0) {
    const recent = conversation.slice(-2).map(m => m.text || m.content || "").filter(t => t.length > 0);
    if (recent.length > 0) {
      historyText = recent.join("\n- ");
    }
  }

  // PROMPT SIMPLU ȘI CLAR
  const prompt = `Ești un sistem automat care returnează date despre hoteluri.
Analizează "Mesajul curent" și "Istoricul". Extrage orașul și animalul.
Trebuie să returnezi datele STRICT în format JSON, cu cheile "city" și "animal".

REGULI:
- Dacă orașul lipsește, valoarea va fi null.
- Nu inventa orașe.

Orașe recunoscute: București, Cluj-Napoca, Timișoara, Iași, Popești-Leordeni, Bragadiru
Animale recunoscute: ${animalsCache.join(', ')}

Exemplu de răspuns dorit:
{ "city": "Cluj-Napoca", "animal": "arici" }

---
Istoric:
- ${historyText}

Mesajul curent: "${message}"`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt: prompt,
        stream: false,
        keep_alive: -1,
        format: "json", // 🔴 ACEASTA ESTE LINIA MAGICĂ!
        options: { 
          temperature: 0.0,
          num_predict: 50 
        }
      })
    });

    if (!response.ok) return { city: null, animal: null };

    const data = await response.json();
    const jsonText = data.response;
    
    console.log("📨 Llama 3.1 a dedus:", jsonText);
    return JSON.parse(jsonText);
    
  } catch (error) {
    console.error("❌ Eroare LLM:", error.message);
    return { city: null, animal: null };
  }
}

export async function ragChat(message, conversation = []) {
  console.log("\n" + "🌟".repeat(40));
  console.log("🤖 RAG SIMPLU - Procesează mesaj");
  console.log("🌟".repeat(40));
  
  if (hotelsCache.length === 0) {
    await loadCache();
  }
  
  const params = await extractParamsWithLLM(message, conversation);
  console.log("📊 Parametri extrași:", params);
  
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
  
  const result = searchHotelsSimple(params.city, params.animal);
  
  if (result.hotels.length === 0) {
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

    //responseText += `   📅 **Rezervă acum:** \`/rezerva ${hotel.id}\`\n\n`;
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

loadCache();