const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chapter = require('../models/Chapter');
const adminController = require('../controllers/adminController');
const router = express.Router();

// Missing Controller Routes
router.get('/stats', adminController.getAdminStats);
router.get('/novels', adminController.getAllNovels);
router.post('/novels', adminController.createNovel);
router.get('/users', adminController.getAllUsers);
router.put('/novel/:id', adminController.updateNovel);
router.delete('/novel/:id', adminController.deleteNovel);
router.post('/import-chapters', adminController.bulkImportChapters);

// Route 1: Direct Chapter Content Update
router.put('/chapter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tier } = req.body;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (content !== undefined) chapter.content = content;
    if (tier !== undefined) chapter.tier = tier;
    
    await chapter.save();
    res.json({ message: 'Chapter updated successfully', chapter });
  } catch (error) {
    console.error("Error updating chapter:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route 1.5: Create a Single New Chapter
router.post('/chapter', async (req, res) => {
  try {
    const { novel_id, title, content, chapter_number, tier } = req.body;
    const newChapter = new Chapter({
      novel_id,
      title,
      content,
      chapter_number,
      tier: tier || 'free'
    });
    await newChapter.save();
    res.json({ message: 'Chapter created successfully', chapter: newChapter });
  } catch (error) {
    console.error("Error creating chapter:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route 2: AI Translator using Google Gemini
router.post('/translate', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ message: 'No text provided' });

    // IMPORTANT: Make sure GEMINI_API_KEY is in your backend .env file!
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'GEMINI_API_KEY is missing from your .env file. Please add it to use the AI translator.' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert webnovel translator. Translate the following Korean or Chinese raw text into fluid, natural, native-sounding English. Maintain the exact formatting, dialogue structure, and tone. Only return the translated text wrapped cleanly in HTML <p> tags per paragraph, without any markdown formatting blocks like \`\`\`html. 
    
Raw Text:
${rawText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ translatedText: text });
  } catch (error) {
    console.error("AI Translation Error:", error);
    res.status(500).json({ message: 'Translation failed', error: error.toString() });
  }
});

module.exports = router;
