// llm-ollama-extractor.js - în backend/routes/
import fetch from 'node-fetch';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2:3b';

export async function askModel(messages) {
  try {
    const userMessage = messages[messages.length - 1].content;
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    
    const prompt = `${systemPrompt}

Mesaj utilizator: "${userMessage}"

Extrage DOAR parametrii în format JSON:
{
  "intent": "search/book/unknown",
  "city": "nume_oras_sau_null",
  "pet_type": "tip_animal_sau_null"
}

JSON:`;
    
    console.log("🤖 Prompt Ollama:", prompt.substring(0, 200));
    
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

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    console.log("📨 Răspuns Ollama:", data.response);

    // Procesează răspunsul
    let jsonText = data.response.trim();
    
    // Extrage JSON
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      console.warn("⚠️ JSON invalid, folosim fallback");
      parsed = extractFallback(userMessage);
    }
    
    // Valori default
    if (!parsed.intent) parsed.intent = "unknown";
    if (parsed.city === "" || parsed.city === "null") parsed.city = null;
    if (parsed.pet_type === "" || parsed.pet_type === "null") parsed.pet_type = null;
    
    console.log("✅ Intent procesat:", parsed);
    return parsed;

  } catch (error) {
    console.error("❌ Eroare Ollama:", error.message);
    const userMessage = messages[messages.length - 1].content;
    return extractFallback(userMessage);
  }
}

function extractFallback(message) {
  const lower = message.toLowerCase();
  
  const result = {
    intent: "unknown",
    city: null,
    pet_type: null
  };
  
  // Detect intent
  if (lower.includes("caut") || lower.includes("hotel") || lower.includes("găsi")) {
    result.intent = "search";
  }
  if (lower.includes("rezerv") || lower.includes("book")) {
    result.intent = "book";
  }
  
  // Detect city
  const cityKeywords = {
    "bucurești": "București",
    "bucuresti": "București",
    "cluj": "Cluj",
    "timisoara": "Timișoara",
    "timișoara": "Timișoara",
    "iasi": "Iași",
    "iași": "Iași",
    "constanța": "Constanța",
    "constanta": "Constanța"
  };
  
  for (const [key, value] of Object.entries(cityKeywords)) {
    if (lower.includes(key)) {
      result.city = value;
      break;
    }
  }
  
  // Detect pet type
  if (lower.includes("câine") || lower.includes("caine")) result.pet_type = "câine";
  else if (lower.includes("pisic")) result.pet_type = "pisică";
  else if (lower.includes("hamster") || lower.includes("șobolan")) result.pet_type = "roedori";
  else if (lower.includes("pasăre") || lower.includes("papagal")) result.pet_type = "păsări";
  
  return result;
}