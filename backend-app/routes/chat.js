// import express from 'express';
// import { ragChat } from './rag-simple.js';

// const router = express.Router();


// router.get('/warmup', async (req, res) => {
//   try {
//     console.log("🔥 Încep încălzirea AI-ului în fundal...");
//     await ragChat("Salut", []); 
//     res.json({ success: true, message: "AI is awake and ready!" });
//   } catch (err) {
//     console.error("❌ Eroare la încălzire:", err);
//     res.status(500).json({ success: false });
//   }
// });


// router.post('/', async (req, res) => {
//   try {
//     const { message, messages = [] } = req.body;
    
//     console.log(`\n💬 CHAT REQUEST: "${message}"`);
    
//     const response = await ragChat(message, messages);
    
//     res.json({
//       success: true,
//       ...response,
//       timestamp: new Date().toISOString()
//     });
    
//   } catch (error) {
//     console.error('❌ Eroare chat:', error);
    
//     res.status(500).json({
//       success: false,
//       text: "A apărut o eroare. Te rog încearcă din nou mai târziu.",
//       error: error.message,
//       hotels: []
//     });
//   }
// });

// router.get('/test', async (req, res) => {
//   try {
//     const result = await ragChat("Caut hotel pentru câine în București");
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// export default router;

import express from 'express';
import { ragChat } from './rag-simple.js';

const router = express.Router();

router.get('/warmup', async (req, res) => {
  try {
    await ragChat("Salut", [], "warmup_session"); 
    res.json({ success: true, message: "AI is awake and ready!" });
  } catch (err) {
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