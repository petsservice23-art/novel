const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');

dotenv.config();

const paragraphs = {
  awakening: [
    "The morning light filtered softly through the tall gothic windows of the grand library.",
    "She adjusted the collar of her dress, her hands trembling slightly as she glanced at the imposing wooden doors.",
    "A heavy silence hung in the air, only broken by the distant clanking of armor from the training grounds.",
    "\"My lady, you must prepare yourself for his arrival,\" a gentle voice whispered from the shadows.",
    "He stood there, a towering figure clad in dark armor, his eyes sharp and unreadable.",
    "The scent of pine and polished steel entered the room before he did.",
    "She could not meet his gaze, staring instead at the intricate patterns of the rug beneath her feet.",
    "\"Is this all you have to say?\" he asked, his voice a low rumble that vibrated in her chest.",
    "A sudden warmth spread across her cheeks as his gloved hand lightly brushed past her shoulder.",
    "The castle felt less like a home and more like a fortress meant to keep the world out—or her in."
  ],
  campaign: [
    "The war horns blew at the break of dawn, their sound echoing through the misty valley.",
    "Mud and blood mixed beneath their boots as the vanguard pushed forward.",
    "\"Hold the line!\" the commander roared, raising his broadsword high.",
    "Magic crackled in the air, the scent of ozone thick and suffocating.",
    "A massive shadow descended upon the battlefield, blocking out the sun.",
    "The clash of steel against scales was deafening.",
    "He wiped the sweat from his brow, his eyes fixed on the horizon where the dark army gathered.",
    "\"We do not retreat!\" he yelled, inspiring a surge of courage in the exhausted troops.",
    "The ground shook with the weight of the monstrous beast approaching.",
    "In the distance, the faint glow of the healing tents offered a small sliver of hope."
  ],
  society: [
    "The ballroom was a sea of silk, gold, and whispered rumors.",
    "She forced a polite smile, though the sheer weight of their judgmental stares felt suffocating.",
    "\"You look radiant tonight,\" the Duke offered, a sly smirk playing on his lips.",
    "Behind the crystal goblets and delicate pastries lay a battlefield of politics and deceit.",
    "The musicians played a lively waltz, yet the atmosphere was incredibly tense.",
    "He extended a hand toward her, the entire room falling silent as they watched his unprecedented gesture.",
    "\"Do not let them see you falter,\" he murmured as he led her to the center of the dance floor.",
    "A scandal was brewing, and everyone knew her name was at the center of it.",
    "The glittering chandeliers cast long, dramatic shadows against the marble pillars.",
    "She raised her chin defiantly, refusing to be just another pawn in their games."
  ],
  finale: [
    "The dust finally settled, revealing the sheer scale of the devastation—and their victory.",
    "He rushed toward her, his armor battered, dropping to his knees as he pulled her into a desperate embrace.",
    "\"It's over,\" he whispered, burying his face in her hair.",
    "Tears streamed down her face, but for the first time, they were tears of profound relief.",
    "The kingdom would remember this day for centuries to come.",
    "They stood together at the balcony, watching the sun rise over a newly forged empire.",
    "\"I promised I would return to you,\" he said softly, his rough hand cupping her cheek.",
    "No more wars, no more secrets. Only the quiet peace they had fought so hard to earn.",
    "The ancient oak tree stood tall in the courtyard, a silent witness to their enduring vow.",
    "And so, a new legend began—one of resilience, magic, and an unbreakable bond."
  ]
};

const getRandomParagraphs = (arc, min = 15, max = 25) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const pool = paragraphs[arc];
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return result;
};

const seedOakTree = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const novel = await Novel.findOne({ title: { $regex: /Under the Oak Tree/i } });
    if (!novel) {
      console.error("Could not find 'Under the Oak Tree' in the database.");
      process.exit(1);
    }

    console.log(`Found novel: ${novel.title} (${novel._id})`);
    
    // Wipe existing chapters for this specific novel
    await Chapter.deleteMany({ novel_id: novel._id });
    console.log("Deleted existing chapters for this novel.");

    const totalChapters = 282;
    novel.total_chapters = totalChapters;
    await novel.save();

    const chaptersToInsert = [];

    for (let i = 1; i <= totalChapters; i++) {
      let arc = 'awakening';
      let title = `Chapter ${i}: The New Beginning`;
      let isLocked = i > 3;
      let price = isLocked ? 10 : 0;

      if (i <= 50) {
        arc = 'awakening';
        title = `Chapter ${i}: Life in the Castle`;
      } else if (i <= 140) {
        arc = 'campaign';
        title = `Chapter ${i}: The Northern Expedition`;
      } else if (i <= 250) {
        arc = 'society';
        title = `Chapter ${i}: Whispers of the Court`;
      } else {
        arc = 'finale';
        title = `Chapter ${i}: The Eternal Vow`;
      }

      chaptersToInsert.push({
        novel_id: novel._id,
        chapter_number: i,
        title: title,
        content: getRandomParagraphs(arc),
        is_locked: isLocked,
        price: price
      });
    }

    console.log(`Seeding ${chaptersToInsert.length} chapters...`);
    await Chapter.insertMany(chaptersToInsert);
    console.log("Successfully seeded 282 rich chapters for Under the Oak Tree!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding chapters:", error);
    process.exit(1);
  }
};

seedOakTree();
