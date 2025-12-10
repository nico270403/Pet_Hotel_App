// llm-ollama-extractor.js
import fetch from 'node-fetch';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2:3b';

export async function askModel(messages) {
  try {
    const userMessage = messages[messages.length - 1].content;
    
    const prompt = `### INSTRUCȚIUNI ###
Analizează mesajul utilizatorului și extrage DOAR:
1. INTENȚIA: "search" (căutare hotel) sau "book" (rezervare) sau "unknown"
2. ORAȘ: numele orașului (sau null)
3. TIP ANIMAL: "câine", "pisică", sau alt animal

### EXEMPLE ###
Mesaj: "Caut hotel pentru câini în București"
→ {"intent": "search", "city": "București", "pet_type": "câine"}

Mesaj: "Vreau să rezerv pentru pisica mea"
→ {"intent": "book", "city": null, "pet_type": "pisică"}

Mesaj: "Salut"
→ {"intent": "unknown", "city": null, "pet_type": null}

### MESAJ ACTUAL ###
"${userMessage}"

### RĂSPUNS (DOAR JSON) ###`;

    console.log("🔍 Extragere parametri pentru:", userMessage);
    
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
        },
        format: 'json'
      })
    });

    const data = await response.json();
    
    // Procesează răspunsul
    let jsonText = data.response.trim();
    
    // Extrage JSON
    const jsonMatch = jsonText.match(/\{.*\}/s);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      console.warn("⚠️ JSON invalid, folosim fallback");
      parsed = extractSimple(userMessage);
    }
    
    // Valori default
    if (!parsed.intent) parsed.intent = "unknown";
    if (parsed.city === "") parsed.city = null;
    if (parsed.pet_type === "") parsed.pet_type = null;
    
    console.log("✅ Parametri extrași:", parsed);
    return parsed;

  } catch (error) {
    console.error("❌ Eroare Ollama:", error.message);
    const userMessage = messages[messages.length - 1].content;
    return extractSimple(userMessage);
  }
}

// Fallback simplu pentru extragere
function extractSimple(message) {
  const lower = message.toLowerCase();
  
  const result = {
    intent: "unknown",
    city: null,
    pet_type: null
  };
  
  // Intent
  if (lower.includes("caut") || lower.includes("hotel") || lower.includes("găsi")) {
    result.intent = "search";
  }
  if (lower.includes("rezerv") || lower.includes("book")) {
    result.intent = "book";
  }
  
  // City
  if (lower.includes("bucurești") || lower.includes("bucuresti")) result.city = "București";
  if (lower.includes("cluj")) result.city = "Cluj";
  if (lower.includes("timisoara")) result.city = "Timișoara";
  if (lower.includes("iasi")) result.city = "Iași";
  
  // Pet type
  if (lower.includes("câine") || lower.includes("caine")) result.pet_type = "câine";
  if (lower.includes("pisic")) result.pet_type = "pisică";
  
  return result;
}