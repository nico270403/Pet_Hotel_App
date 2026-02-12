import express from 'express';
import { ragChat } from './rag-simple.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, messages = [] } = req.body;
    
    console.log(`\n💬 CHAT REQUEST: "${message}"`);
    
    
    const response = await ragChat(message, messages);
    
    
    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Eroare chat:', error);
    
    res.status(500).json({
      success: false,
      text: "A apărut o eroare. Te rog încearcă din nou mai târziu.",
      error: error.message,
      hotels: []
    });
  }
});


router.get('/test', async (req, res) => {
  try {
    const result = await ragChat("Caut hotel pentru câine în București");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;