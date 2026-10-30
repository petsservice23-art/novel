const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chapter = require('../models/Chapter');
const adminController = require('../controllers/adminController');
const { uploadChapterContent } = require('../utils/r2Service');
const router = express.Router();

// Missing Controller Routes
router.get('/stats', adminController.getAdminStats);
router.get('/novels', adminController.getAllNovels);
router.post('/novels', adminController.createNovel);
router.get('/users', adminController.getAllUsers);
router.put('/novel/:id', adminController.updateNovel);
router.delete('/novel/:id', adminController.deleteNovel);
router.post('/import-chapters', adminController.bulkImportChapters);

// Route 1: Direct Chapter Content & Metadata Update
router.put('/chapter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tier, title, chapter_number } = req.body;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (title !== undefined) chapter.title = title;
    if (chapter_number !== undefined) chapter.chapter_number = chapter_number;
    if (content !== undefined) {
      try {
        const r2_key = await uploadChapterContent(chapter.novel_id, chapter.chapter_number, content);
        chapter.r2_key = r2_key;
        chapter.content = null; // Stored in R2!
      } catch (e) {
        console.error('R2 upload failed during chapter edit:', e.message);
        chapter.content = content;
      }
    }
    if (tier !== undefined) {
      chapter.tier = tier;
      chapter.is_locked = (tier === 'coin' || tier === 'paid');
      chapter.price = chapter.is_locked ? 10 : 0;
    }
    
    await chapter.save();
    res.json({ message: 'Chapter updated successfully', chapter });
  } catch (error) {
    console.error("Error updating chapter:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route 1.2: Bulk Update Chapter Locking Rules for a Novel
router.put('/novel/:id/bulk-lock', async (req, res) => {
  try {
    const { id } = req.params;
    const { freeUntil } = req.body;
    const freeNum = parseInt(freeUntil, 10);
    if (isNaN(freeNum) || freeNum < 0) {
      return res.status(400).json({ message: 'Invalid free chapter count' });
    }

    const Novel = require('../models/Novel');
    const novel = await Novel.findById(id);
    if (!novel) return res.status(404).json({ message: 'Novel not found' });

    // Chapters 1 to freeNum are free
    await Chapter.updateMany(
      { novel_id: id, chapter_number: { $lte: freeNum } },
      { $set: { is_locked: false, tier: 'free', price: 0 } }
    );

    // Chapters greater than freeNum are locked
    await Chapter.updateMany(
      { novel_id: id, chapter_number: { $gt: freeNum } },
      { $set: { is_locked: true, tier: 'coin', price: 10 } }
    );

    res.json({ 
      message: `Updated! Chapters 1 to ${freeNum} are Free. Chapters ${freeNum + 1}+ are Locked with 10 Coins.`,
      freeUntil: freeNum
    });
  } catch (error) {
    console.error("Bulk lock error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route 1.5: Create a Single New Chapter
router.post('/chapter', async (req, res) => {
  try {
    const { novel_id, title, content, chapter_number, tier } = req.body;
    const isLocked = tier === 'coin' || tier === 'paid';
    
    let r2_key = null;
    if (content) {
      try {
        r2_key = await uploadChapterContent(novel_id, chapter_number, content);
      } catch (e) {
        console.error('R2 upload failed during chapter create:', e.message);
      }
    }

    const newChapter = new Chapter({
      novel_id,
      title,
      content: r2_key ? null : content,
      r2_key,
      chapter_number,
      tier: tier || 'free',
      is_locked: isLocked,
      price: isLocked ? 10 : 0
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
