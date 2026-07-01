import express from 'express';
import { ragChat } from './rag-simple.js';

const router = express.Router();

// router.get('/warmup', async (req, res) => {
//   try {
//     await ragChat("Salut", [], "warmup_session"); 
//     res.json({ success: true, message: "AI is awake and ready!" });
//   } catch (err) {
//     res.status(500).json({ success: false });
//   }
// });

router.get('/warmup', async (req, res) => {
  try {
    console.log(" Pornesc încălzirea Ollama...");
    await ragChat("Am nevoie de recomandări pentru cazarea unui animal de companie", [], "warmup_session");
    console.log(" Ollama e încălzit și gata de răspuns rapid!");
    res.json({ success: true, message: "AI is awake and ready!" });
  } catch (err) {
    console.log(" Warmup eșuat — probabil Ollama nu rulează:", err.message);
    res.status(500).json({ success: false });
  }
});

router.post('/', async (req, res) => {
  try {
    const { message, messages = [], sessionId } = req.body;
    const response = await ragChat(message, messages, sessionId);

    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      text: "Eroare internă de server la procesarea mesajului.",
      hotels: []
    });
  }
});

export default router;