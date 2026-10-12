const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Novel = require('./models/Novel');
const Chapter = require('./models/Chapter');
const User = require('./models/User');

const JSON_PATH = 'C:/Users/admin/.gemini/antigravity/brain/5487a710-4833-48dc-8f7a-2cfc6fd8d96d/scratch/novelsData.json';

// Curated high-fidelity Unsplash cover templates based on genres for premium aesthetics
const coverPool = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80', // Fantasy book cover
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80', // Library stack
  'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=800&auto=format&fit=crop&q=80', // Forest glow
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80', // Magic book
  'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&auto=format&fit=crop&q=80', // Vintage page
  'https://images.unsplash.com/photo-1519074063912-ad25b57b9845?w=800&auto=format&fit=crop&q=80', // Dark sword
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', // Gothic tower
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80', // Royal scroll
  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&auto=format&fit=crop&q=80', // Ocean storm
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=80'  // Magic spell
];

const genreToTitles = {
  "Romance": [
    "Under the Oak Tree", "Your Ryan", "To You Who Will Ruin Me", "My Sweet Deceiver", 
    "If You Wish to Have Me", "Marriage with a Villain", "High Society", "Having Enemy's Baby", 
    "Can I Cry Now", "Butterfly Through the Fog", "A Word from Violet", "When Pride Fell at My Toes", 
    "Looking for My Fiancé’s Lover", "My Husband Will Regret This", "My Husband Caught Me Having an Affair", 
    "I Ended Up Living Up Next Door With My Ex-Husband", "Cling to Me, Even If You Hate It", 
    "For My Husband’s New Wife", "Even If Your Regret Tries to Hold Me Back", "After the Wicked Wife Leaves", 
    "So The Duchess Disappeared", "If It’s Going to Be Taken Away", "How to Perfectly Break Up with You", 
    "Between Your Letter and My Reply", "Thought It Was ‘The End’, Only to Return to a Changed Genre", 
    "Flowers Are Bait"
  ],
  "Fantasy": [
    "Under the Oak Tree", "The Villainess is a Marionette", "The Way to Protect the Female Lead’s Older Brother", 
    "I Became a Barbarian’s Bride", "The Baby Raising a Devil", "The Final Hidden Boss Villainess Is a Healer!", 
    "The Demon King Wants Peace", "How to Survive as the Wife of The Monster Duke", "Taming the Monster Prince", 
    "The Oracle of the Villainous Baby", "The Saint's Life in Captivity", "I Got Engaged To The Blind Duke", 
    "The Crown I Will Take From You", "The Villainess Works in the Library", "The Tyrant Brother is a Bonus", 
    "The Eldest Daughter Walks Along the Path of Flowers", "The Abandoned Villainess Owns Everything Now", 
    "I Have a New Family", "Failed to Train the Beast Male Lead", 
    "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite", 
    "The Peaceful Life Of A Maid Who Hides Her Power And Enjoys It"
  ],
  "Drama": [
    "Can I Cry Now", "Atonement, For Your Cruelty", "Forgotten Juliet", "Forgotten Meadow", 
    "My Husband Caught Me Having an Affair", "To You Who Will Ruin Me", "High Society", 
    "Butterfly Through the Fog", "Between Your Letter and My Reply", "Cling to Me, Even If You Hate It", 
    "If You Give Birth To A Child, You Die", "Even If Your Regret Tries to Hold Me Back", 
    "For My Husband’s New Wife", "My Husband Will Regret This", "Things I Didn’t Know Because It Was The First Time"
  ],
  "Josei": [
    "Under the Oak Tree", "High Society", "My Sweet Deceiver", "To You Who Will Ruin Me", 
    "Can I Cry Now", "Butterfly Through the Fog", "Forgotten Juliet", "Flowers Are Bait", 
    "Marriage with a Villain", "A Word from Violet", "When Pride Fell at My Toes", 
    "Cling to Me, Even If You Hate It"
  ],
  "Comedy": [
    "Every Time The Villainess Opens Her Mouth Disaster Follows", 
    "Let’s Go To Our Home, Why Are You Going To The Palace?", 
    "I Like the Obsessive Idiot Male Leads", "This Is Clearly a Misunderstanding!", 
    "The Demon King Wants Peace", "The Tyrant Brother is a Bonus", 
    "I Raised My Nephew, and Ended Up With a Husband", "The Baby Raising a Devil", 
    "The Villainess Works in the Library", "The Peaceful Life Of A Maid Who Hides Her Power And Enjoys It"
  ],
  "Mature": [
    "Under the Oak Tree", "High Society", "Flowers Are Bait", "Can I Cry Now", 
    "To You Who Will Ruin Me", "Marriage with a Villain", "Butterfly Through the Fog", 
    "Cling to Me, Even If You Hate It", "A Night Worse than Death", "Atonement, For Your Cruelty"
  ],
  "Psychological": [
    "Merry Psycho", "Flowers Are Bait", "Butterfly Through the Fog", "Death Can’t Sleep", 
    "Precipice Outside the Cage", "A Night Worse than Death", "Dawnlike Black", 
    "Forbidden Odd Melody", "Cling to Me, Even If You Hate It"
  ],
  "Mystery": [
    "My Possession Became a Ghost Story", "Death Can’t Sleep", "Forbidden Odd Melody", 
    "Precipice Outside the Cage", "Butterfly Through the Fog"
  ],
  "Tragedy": [
    "If You Give Birth To A Child, You Die", "Atonement, For Your Cruelty", "To You Who Will Ruin Me", 
    "Cling to Me, Even If You Hate It", "Can I Cry Now", "Forgotten Juliet", 
    "Even If Your Regret Tries to Hold Me Back"
  ],
  "Reverse Harem": [
    "I Disguised Myself as a Man and Joined the Army, Creating a Reverse Harem", 
    "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite", 
    "I Like the Obsessive Idiot Male Leads", "The Villainess Gets Her Sponsorship"
  ],
  "Villainess": [
    "The Villainess is a Marionette", "The Villainess Works in the Library", 
    "The Villainess Gets Her Sponsorship", "The Abandoned Villainess Owns Everything Now", 
    "Don't Look for the Resurrected Villainess"
  ],
  "Isekai": [
    "While Others Became Female Leads In Romantic Fantasy Novels, I Became A Closet Monster", 
    "Thought It Was ‘The End’, Only to Return to a Changed Genre", 
    "I'm Trying to End This Possession"
  ],
  "Transmigration": [
    "I'm Trying to End This Possession", 
    "While Others Became Female Leads In Romantic Fantasy Novels, I Became A Closet Monster"
  ],
  "Reincarnation": [
    "The Villainess is a Marionette", "The Crown I Will Take From You", 
    "Don't Look for the Resurrected Villainess"
  ],
  "Revenge": [
    "This Is How You Do Revenge", "I Assert the Innocence of the Villain", 
    "The Crown I Will Take From You", "Atonement, For Your Cruelty", 
    "The Wicked Wife’s Dark History Keeps Coming Back To Haunt Her"
  ],
  "Historical": [
    "Under the Oak Tree", "The Stand-In Empress’s Wedding Night", 
    "I Will Become the Queen of the Enemy Country", "The Crown I Will Take From You", 
    "The Grand Duchess Escape"
  ],
  "Royalty": [
    "The Tyrant Brother is a Bonus", "I Will Become the Queen of the Enemy Country", 
    "The Stand-In Empress’s Wedding Night", "The Crown I Will Take From You"
  ],
  "Supernatural": [
    "My Possession Became a Ghost Story", "Death Can’t Sleep", "Forbidden Odd Melody"
  ],
  "Horror": [
    "My Possession Became a Ghost Story"
  ],
  "Action": [
    "The Prince's Nanny, Her Specialty is Assassination", "I Captured the Enemy Who Tried to Kill Me", 
    "The Way to Protect the Female Lead’s Older Brother", "Taming the Monster Prince"
  ],
  "Adventure": [
    "I Became a Barbarian’s Bride", "The Demon King Wants Peace", 
    "I Captured the Enemy Who Tried to Kill Me"
  ],
  "Yandere": [
    "I Taught You Carefully, So Why Are You Obsessed?", "I Like the Obsessive Idiot Male Leads"
  ],
  "Possession": [
    "My Possession Became a Ghost Story", "I'm Trying to End This Possession"
  ],
  "Contract Marriage": [
    "It Turned Out to be a Useful Fraudulent Marriage", "My Contract Husband Resembles the Male Protagonist", 
    "The Goal Is Alimony"
  ],
  "Slice of Life": [
    "The Peaceful Life Of A Maid Who Hides Her Power And Enjoys It", "The Villainess Works in the Library", 
    "I Have a New Family", "I Raised My Nephew, and Ended Up With a Husband", "Your Ryan"
  ],
  "Dark Fantasy": [
    "The Way to Protect the Female Lead’s Older Brother", "Dawnlike Black", "Death Can’t Sleep"
  ],
  "Adult": [
    "Under the Oak Tree", "High Society", "Flowers Are Bait", "Marriage with a Villain", 
    "Can I Cry Now", "A Night Worse than Death", "Cling to Me, Even If You Hate It"
  ],
  "Smut": [
    "Under the Oak Tree", "High Society", "Flowers Are Bait", "Marriage with a Villain", 
    "Can I Cry Now", "A Night Worse than Death", "Butterfly Through the Fog"
  ],
  "Shoujo": [
    "The Villainess is a Marionette", "The Villainess Gets Her Sponsorship", 
    "The Tyrant Brother is a Bonus", "I Have a New Family", 
    "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite"
  ],
  "Romance Fantasy": [
    "Under the Oak Tree", "The Villainess is a Marionette", 
    "The Way to Protect the Female Lead’s Older Brother", "The Baby Raising a Devil", 
    "Taming the Monster Prince", "I Became the Wife of the Beastly Grand Duke", 
    "I Became a Barbarian’s Bride", "The Oracle of the Villainous Baby", 
    "The Final Hidden Boss Villainess Is a Healer!", "The Saint's Life in Captivity"
  ],
  "Contemporary": [
    "Your Ryan", "High Society", "Can I Cry Now"
  ],
  "Mature Romance": [
    "Under the Oak Tree", "High Society", "Flowers Are Bait"
  ],
  "Harem": [
    "I Like the Obsessive Idiot Male Leads", "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite"
  ],
  "Thriller": [
    "Merry Psycho", "Precipice Outside the Cage"
  ],
  "Angst": [
    "Atonement, For Your Cruelty"
  ],
  "Gender Bender": [
    "I Disguised Myself as a Man and Joined the Army, Creating a Reverse Harem"
  ],
  "Workplace": [
    "The Villainess Works in the Library", "The Low-Ranking Civil Servant Wants to Achieve Success"
  ],
  "Imperial Palace": [
    "The Stand-In Empress’s Wedding Night", "What Became of the Tyrant After the Pregnant Empress Left"
  ],
  "Regression": [
    "The Crown I Will Take From You", "Don't Look for the Resurrected Villainess"
  ],
  "Western Fantasy": [
    "Under the Oak Tree", "I Became a Barbarian’s Bride", "The Demon King Wants Peace"
  ],
  "Fantasy Romance": [
    "Under the Oak Tree", "Taming the Monster Prince"
  ],
  "Fluff": [
    "I Have a New Family", "The Baby Raising a Devil"
  ],
  "Ecchi": [
    "High Society", "Flowers Are Bait"
  ],
  "Seinen": [
    "Merry Psycho"
  ],
  "Adult Drama": [
    "Flowers Are Bait"
  ]
};

const seedNovels = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to cloud MongoDB Atlas...");

    // Find the admin user mitesh@gmail.com
    let admin = await User.findOne({ email: 'mitesh@gmail.com' });
    if (!admin) {
      admin = await User.findOne({});
      if (!admin) {
        console.error("Admin user or any user not found. Please register mitesh@gmail.com on the frontend first!");
        process.exit(1);
      }
    }
    console.log(`Using user ${admin.username} (${admin.email}) as author_id for seed novels.`);

    // Wipe existing novels and chapters to ensure a completely fresh populate
    await Novel.deleteMany({});
    await Chapter.deleteMany({});
    console.log("Cleared existing novels and chapters.");

    // Load parsed JSON file
    if (!fs.existsSync(JSON_PATH)) {
      console.error(`Parsed JSON not found at ${JSON_PATH}. Please make sure parseNovels has run.`);
      process.exit(1);
    }
    const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
    const rawNovels = JSON.parse(rawData);
    console.log(`Loaded ${rawNovels.length} novels from parsed JSON.`);

    const seededNovels = [];
    const seededChapters = [];

    for (let i = 0; i < rawNovels.length; i++) {
      const raw = rawNovels[i];
      const title = raw.title;

      // Match genres from mapped list
      const matchedGenres = [];
      for (const [genreName, titles] of Object.entries(genreToTitles)) {
        if (titles.some(t => t.toLowerCase() === title.toLowerCase())) {
          matchedGenres.push(genreName);
        }
      }

      // If no matched genres, give default Romance, Fantasy, Drama
      const finalGenres = matchedGenres.length > 0 ? matchedGenres : ["Romance", "Fantasy", "Drama"];

      // Select a beautiful cover image from our premium pool
      const coverImage = coverPool[i % coverPool.length];

      // Formulate a beautiful rich mock description
      const description = `A captivating tale of ${finalGenres.slice(0, 2).join(' and ')}. Written by the renowned author ${raw.author}, this novel explores high-stakes drama, intricate character relationships, and unexpected twists that will keep you hooked from the first page. Follow the incredible journey with a clean, fully adjustable reading screen, premium themes, and instant coin-unlocks.`;

      // 1. Create Novel Document
      const novel = new Novel({
        title: title,
        description: description,
        author: raw.author,
        cover_image: coverImage,
        author_id: admin._id,
        genres: finalGenres,
        tags: [finalGenres[0].toLowerCase(), raw.status, 'popular', 'premium'],
        total_chapters: raw.chaptersCount || 3,
        rating: (4.2 + Math.random() * 0.7).toFixed(1),
        ratings_count: Math.floor(100 + Math.random() * 1500),
        views: Math.floor(1000 + Math.random() * 50000),
        reads: Math.floor(500 + Math.random() * 25000),
        status: 'approved',
        publishing_status: raw.status === 'ongoing' ? 'ongoing' : 'completed'
      });

      const savedNovel = await novel.save();
      seededNovels.push(savedNovel);

      // 2. Create 3 Sample Chapters for this novel
      const ch1 = new Chapter({
        novel_id: savedNovel._id,
        chapter_number: 1,
        title: 'The Awakening',
        content: [
          'The morning light filtered softly through the tall gothic windows of the grand library.',
          'Everything felt calm, yet there was an underlying tension that hung heavily in the cool air.',
          '“Are you prepared for what is to come?” a deep voice echoed from the shadows behind the oak desk.',
          'She turned slowly, eyes bright with anticipation. The journey was finally about to begin.'
        ],
        is_locked: false
      });

      const ch2 = new Chapter({
        novel_id: savedNovel._id,
        chapter_number: 2,
        title: 'A New Journey',
        content: [
          'With each step further into the ancient ruins, the magic pulsed stronger.',
          'Unseen runes glowed with a faint violet energy along the damp stone walls.',
          '“We shouldn’t be here,” he whispered, casting a nervous glance at the ceiling.',
          'But there was no turning back now. The destiny was set, and the secrets of the empire awaited them.'
        ],
        is_locked: false
      });

      const ch3 = new Chapter({
        novel_id: savedNovel._id,
        chapter_number: 3,
        title: 'Hidden Intentions [PREMIUM]',
        content: [
          'This is a premium chapter. The secrets of the ancient bloodline are finally revealed here!',
          'Under the glowing crystal light, the true identity of the villainess was exposed.',
          '“So it was you all along,” she breathed, taking a step back as the blade caught the moonlight.',
          'Thank you for unlocking this chapter with your premium coins. The story continues to escalate!'
        ],
        is_locked: true,
        price: 10 // Cost of 10 coins to test the premium reader unlock workflow
      });

      await ch1.save();
      await ch2.save();
      await ch3.save();
    }

    console.log(`Successfully seeded ${seededNovels.length} novels with proper taxonomy, dynamic Unsplash covers, and 3 chapters each (with Chapter 3 premium locked)!`);
    process.exit(0);

  } catch (error) {
    console.error("Error seeding novels:", error);
    process.exit(1);
  }
};

seedNovels();
