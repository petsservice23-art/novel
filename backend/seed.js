const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const storyParagraphs = [
  "The morning sun bled through the heavy velvet curtains, casting long, crimson shadows across the marble floor. Silence hung heavy in the air, broken only by the rhythmic ticking of the grandfather clock in the corner. Every second felt like an eternity, a reminder of the time that had slipped through her fingers like sand.",
  "He stood at the edge of the precipice, the wind whipping his dark hair across his face. Below, the jagged rocks were swallowed by the churning, slate-gray sea. It was a beautiful, terrifying sight, much like the path he had chosen for himself. There was no turning back now; the bridge had been burned long ago.",
  "The marketplace was a riot of colors and sounds. Merchants cried out their wares, the scent of exotic spices mingled with the smell of roasting meat, and the crowd moved like a living, breathing entity. Amidst the chaos, she moved like a shadow, her hood pulled low over her eyes. She had a mission, and failure was not an option.",
  "In the heart of the ancient forest, where the trees whispered secrets to the moon, lived a creature of myth and shadow. It had watched the rise and fall of empires, the birth and death of stars. Now, it watched the young man who had dared to enter its domain, a flicker of curiosity igniting in its ancient, glowing eyes.",
  "The tea was cold, but she didn't seem to notice. Her gaze was fixed on the letter in her trembling hands, the ink blurred by tears she refused to let fall. The words were a death sentence, a betrayal so profound it shook the very foundations of her world. Everything she had believed in was a lie.",
  "Steel clashed against steel, a shower of sparks illuminating the dim corridor. They moved with a grace that belied the brutality of their dance, each strike calculated, each parry a testament to years of training. This was more than a fight; it was a reckoning, a final confrontation between light and shadow.",
  "The library was a sanctuary of dust and wisdom. Rows upon rows of leather-bound volumes reached toward the vaulted ceiling, their pages filled with the thoughts of long-dead scholars. Here, in the quiet embrace of the past, he found the answers he had been searching for, and a truth he wished he could forget."
];

const chapterTitles = [
  "The Awakening", "A Dangerous Encounter", "Hidden Truths", "The Silent Promise", "Betrayal in the Shadows",
  "The Ancient Prophecy", "Echoes of the Past", "A New Alliance", "The Forbidden Ritual", "Tears of Gold",
  "The Final Stand", "Wings of Fire", "The Glass Throne", "Whispers in the Dark", "The Eternal Night",
  "A Glimmer of Hope", "The Iron Heart", "Shadows of War", "The Crimson Path", "The Sacred Vow",
  "Path of Destiny", "Winds of Change", "Blood and Iron", "The Lost Kingdom", "A Fleeting Dream",
  "Into the Abyss", "The Light Returns", "A Shattered Crown", "The Final Journey", "Echoes of Eternity"
];

const fs = require('fs');
const novelsData = JSON.parse(fs.readFileSync('c:\\\\Users\\\\admin\\\\.gemini\\\\antigravity\\\\brain\\\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\\\scratch\\\\novelsData.json', 'utf8'));

const generateChapterContent = (novelTitle, chapterNum, totalChapters) => {
  let content = `<h2>Chapter ${chapterNum}</h2>`;
  
  content += `<p>The epic saga of <strong>${novelTitle}</strong> continues in Chapter ${chapterNum}. As the plot deepens, new challenges and mysteries arise for our protagonists, pushing them to their absolute limits.</p>`;

  if (chapterNum === 1) {
    content += `<p>This marks the very beginning of the journey. The world is introduced, and the seeds of destiny are planted. Everything that happens from here on out will shape the future of this realm.</p>`;
  } else if (chapterNum === totalChapters) {
    content += `<p>This is the grand finale. All loose ends are tied up, the ultimate confrontation takes place, and the conclusion to this long journey is finally reached. The echoes of these events will last forever.</p>`;
  } else {
    content += `<p>Following the intense events of Chapter ${chapterNum - 1}, the characters must now navigate the consequences of their actions. The tension continues to build as they slowly approach their ultimate destiny.</p>`;
  }

  // Select 5-8 random paragraphs to make it "lengthy"
  const paraCount = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < paraCount; i++) {
    const randomPara = storyParagraphs[Math.floor(Math.random() * storyParagraphs.length)];
    content += `<p>${randomPara}</p>`;
  }
  
  content += `<p><em>End of Chapter ${chapterNum}. To be continued in the next installment...</em></p>`;
  
  return content;
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    await User.deleteMany({});
    await Novel.deleteMany({});
    await Chapter.deleteMany({});
    console.log("Cleared existing data.");

    const authorUser = new User({
      username: "NovelverseAuthor",
      email: "author@novelverse.com",
      password: "password123",
      role: "author"
    });
    await authorUser.save();

    for (const data of novelsData) {
      const novel = new Novel({
        title: data.title,
        author_id: authorUser._id,
        description: `A masterpiece of ${data.genres.join(' & ')}. ${data.title} explores the intricate web of fate and choice.`,
        cover_image: `https://image.pollinations.ai/prompt/${encodeURIComponent(data.title + " anime visual novel cover art")}?width=400&height=600&nologo=true`,
        genres: data.genres,
        status: "approved",
        publishing_status: data.status,
        total_chapters: data.chaptersCount,
        views: 1000 + Math.floor(Math.random() * 50000),
        rating: (4.5 + Math.random() * 0.5).toFixed(1)
      });

      const savedNovel = await novel.save();
      console.log(`Seeding Novel: ${savedNovel.title}...`);

      const chapters = [];
      for (let i = 1; i <= data.chaptersCount; i++) {
        const titleIdx = (i - 1) % chapterTitles.length;
        // Adding Part identifier so titles are completely unique and sequential
        const uniqueTitle = `Part ${i}: ${chapterTitles[titleIdx]}`;
        
        chapters.push({
          novel_id: savedNovel._id,
          chapter_number: i,
          title: uniqueTitle,
          content: generateChapterContent(savedNovel.title, i, data.chaptersCount),
          is_premium: i > 100
        });

        if (i === data.chaptersCount) {
          await Chapter.insertMany(chapters, { ordered: false });
          chapters.length = 0;
        }
      }
      console.log(`✅ ${data.chaptersCount} unique chapters added.`);
    }

    console.log("Database initialized with unique and lengthy content!");
    process.exit();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
