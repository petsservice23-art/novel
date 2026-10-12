const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Novel = require('./models/Novel');

dotenv.config();

const rawMapping = {
  "Romance": ["Under the Oak Tree", "Your Ryan", "To You Who Will Ruin Me", "My Sweet Deceiver", "If You Wish to Have Me", "Marriage with a Villain", "High Society", "Having Enemy's Baby", "Can I Cry Now", "Butterfly Through the Fog", "A Word from Violet", "When Pride Fell at My Toes", "Looking for My Fiancé’s Lover", "My Husband Will Regret This", "My Husband Caught Me Having an Affair", "I Ended Up Living Up Next Door With My Ex-Husband", "Cling to Me, Even If You Hate It", "For My Husband’s New Wife", "Even If Your Regret Tries to Hold Me Back", "After the Wicked Wife Leaves", "So The Duchess Disappeared", "If It’s Going to Be Taken Away", "How to Perfectly Break Up with You", "Between Your Letter and My Reply", "Thought It Was ‘The End’, Only to Return to a Changed Genre", "Flowers Are Bait"],
  "Fantasy": ["Under the Oak Tree", "The Villainess is a Marionette", "The Way to Protect the Female Lead’s Older Brother", "I Became a Barbarian’s Bride", "The Baby Raising a Devil", "The Final Hidden Boss Villainess Is a Healer!", "The Demon King Wants Peace", "How to Survive as the Wife of The Monster Duke", "Taming the Monster Prince", "The Oracle of the Villainous Baby", "The Saint's Life in Captivity", "I Got Engaged To The Blind Duke", "The Crown I Will Take From You", "The Villainess Works in the Library", "The Tyrant Brother is a Bonus", "The Eldest Daughter Walks Along the Path of Flowers", "The Abandoned Villainess Owns Everything Now", "I Have a New Family", "Failed to Train the Beast Male Lead", "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite", "The Peaceful Life Of A Maid Who Hides Her Power And Enjoys It"],
  "Drama": ["Can I Cry Now", "Atonement, For Your Cruelty", "Forgotten Juliet", "Forgotten Meadow", "My Husband Caught Me Having an Affair", "To You Who Will Ruin Me", "High Society", "Butterfly Through the Fog", "Between Your Letter and My Reply", "Cling to Me, Even If You Hate It", "If You Give Birth To A Child, You Die", "Even If Your Regret Tries to Hold Me Back", "For My Husband’s New Wife", "My Husband Will Regret This", "Things I Didn’t Know Because It Was The First Time"],
  "Josei": ["Under the Oak Tree", "High Society", "My Sweet Deceiver", "To You Who Will Ruin Me", "Can I Cry Now", "Butterfly Through the Fog", "Forgotten Juliet", "Flowers Are Bait", "Marriage with a Villain", "A Word from Violet", "When Pride Fell at My Toes", "Cling to Me, Even If You Hate It"],
  "Comedy": ["Every Time The Villainess Opens Her Mouth Disaster Follows", "Let’s Go To Our Home, Why Are You Going To The Palace?", "I Like the Obsessive Idiot Male Leads", "This Is Clearly a Misunderstanding!", "The Demon King Wants Peace", "The Tyrant Brother is a Bonus", "I Raised My Nephew, and Ended Up With a Husband", "The Baby Raising a Devil", "The Villainess Works in the Library", "The Peaceful Life Of A Maid Who Hides Her Power And Enjoys It"],
  "Mature": ["Under the Oak Tree", "High Society", "Flowers Are Bait", "Can I Cry Now", "To You Who Will Ruin Me", "Marriage with a Villain", "Butterfly Through the Fog", "Cling to Me, Even If You Hate It", "A Night Worse than Death", "Atonement, For Your Cruelty"],
  "Psychological": ["Merry Psycho", "Flowers Are Bait", "Butterfly Through the Fog", "Death Can’t Sleep", "Precipice Outside the Cage", "A Night Worse than Death", "Dawnlike Black", "Forbidden Odd Melody", "Cling to Me, Even If You Hate It"],
  "Mystery": ["My Possession Became a Ghost Story", "Death Can’t Sleep", "Forbidden Odd Melody", "Precipice Outside the Cage", "Butterfly Through the Fog"],
  "Tragedy": ["If You Give Birth To A Child, You Die", "Atonement, For Your Cruelty", "To You Who Will Ruin Me", "Cling to Me, Even If You Hate It", "Can I Cry Now", "Forgotten Juliet", "Even If Your Regret Tries to Hold Me Back"],
  "Reverse Harem": ["I Disguised Myself as a Man and Joined the Army, Creating a Reverse Harem", "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite", "I Like the Obsessive Idiot Male Leads", "The Villainess Gets Her Sponsorship"],
  "Villainess": ["The Villainess is a Marionette", "The Villainess Works in the Library", "The Villainess Gets Her Sponsorship", "The Abandoned Villainess Owns Everything Now", "Don't Look for the Resurrected Villainess"],
  "Isekai": ["While Others Became Female Leads In Romantic Fantasy Novels, I Became A Closet Monster", "Thought It Was ‘The End’, Only to Return to a Changed Genre", "I'm Trying to End This Possession", "The Villainess is a Marionette", "The Crown I Will Take From You", "Don't Look for the Resurrected Villainess"],
  "Revenge": ["This Is How You Do Revenge", "I Assert the Innocence of the Villain", "The Crown I Will Take From You", "Atonement, For Your Cruelty", "The Wicked Wife’s Dark History Keeps Coming Haunt Her"],
  "Historical": ["Under the Oak Tree", "The Stand-In Empress’s Wedding Night", "I Will Become the Queen of the Enemy Country", "The Crown I Will Take From You", "The Grand Duchess Escape", "The Tyrant Brother is a Bonus"],
  "Supernatural": ["My Possession Became a Ghost Story", "Death Can’t Sleep", "Forbidden Odd Melody"],
  "Action": ["The Prince's Nanny, Her Specialty is Assassination", "I Captured the Enemy Who Tried to Kill Me", "The Way to Protect the Female Lead’s Older Brother", "Taming the Monster Prince", "I Became a Barbarian’s Bride", "The Demon King Wants Peace"],
  "Yandere": ["I Taught You Carefully, So Why Are You Obsessed?", "I Like the Obsessive Idiot Male Leads"],
  "Slice of Life": ["The Peaceful Life Of A Maid Who Hides Her Power And Enjoys It", "The Villainess Works in the Library", "I Have a New Family", "I Raised My Nephew, and Ended Up With a Husband", "Your Ryan"],
  "Possession": ["My Possession Became a Ghost Story", "I'm Trying to End This Possession"],
  "Contract Marriage": ["It Turned Out to be a Useful Fraudulent Marriage", "My Contract Husband Resembles the Male Protagonist", "The Goal Is Alimony"],
  "Dark Fantasy": ["The Way to Protect the Female Lead’s Older Brother", "Dawnlike Black", "Death Can’t Sleep"],
  "Adult": ["Under the Oak Tree", "High Society", "Flowers Are Bait", "Marriage with a Villain", "Can I Cry Now", "A Night Worse than Death", "Cling to Me, Even If You Hate It"],
  "Smut": ["Under the Oak Tree", "High Society", "Flowers Are Bait", "Marriage with a Villain", "Can I Cry Now", "A Night Worse than Death", "Butterfly Through the Fog"],
  "Shoujo": ["The Villainess is a Marionette", "The Villainess Gets Her Sponsorship", "The Tyrant Brother is a Bonus", "I Have a New Family", "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite"],
  "Romance Fantasy": ["Under the Oak Tree", "The Villainess is a Marionette", "The Way to Protect the Female Lead’s Older Brother", "The Baby Raising a Devil", "Taming the Monster Prince", "I Became the Wife of the Beastly Grand Duke", "I Became a Barbarian’s Bride", "The Oracle of the Villainous Baby", "The Final Hidden Boss Villainess Is a Healer!", "The Saint's Life in Captivity"],
  "Contemporary": ["Your Ryan", "High Society", "Can I Cry Now"],
  "Mature Romance": ["Under the Oak Tree", "High Society", "Flowers Are Bait"],
  "Harem": ["I Like the Obsessive Idiot Male Leads", "Everyone Was Obsessed With Me After I Became the Youngest Princess Favourite"],
  "Thriller": ["Merry Psycho", "Precipice Outside the Cage"],
  "Angst": ["Atonement, For Your Cruelty"],
  "Gender Bender": ["I Disguised Myself as a Man and Joined the Army, Creating a Reverse Harem"],
  "Workplace": ["The Villainess Works in the Library", "The Low-Ranking Civil Servant Wants to Achieve Success"],
  "Imperial Palace": ["The Stand-In Empress’s Wedding Night", "What Became of the Tyrant After the Pregnant Empress Left"],
  "Regression": ["The Crown I Will Take From You", "Don't Look for the Resurrected Villainess"],
  "Western Fantasy": ["Under the Oak Tree", "I Became a Barbarian’s Bride", "The Demon King Wants Peace"],
  "Fantasy Romance": ["Under the Oak Tree", "Taming the Monster Prince"],
  "Fluff": ["I Have a New Family", "The Baby Raising a Devil"],
  "Ecchi": ["High Society", "Flowers Are Bait"],
  "Seinen": ["Merry Psycho"],
  "Adult Drama": ["Flowers Are Bait"]
};

const mainGenres = ['Romance', 'Fantasy', 'Drama', 'Josei', 'Comedy', 'Mature', 'Psychological', 'Adult', 'Smut', 'Mystery', 'Tragedy', 'Slice of Life', 'Shoujo', 'Romance Fantasy', 'Contemporary', 'Mature Romance', 'Fantasy Romance'];

const applyCategorization = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for categorization...");

    const novels = await Novel.find({});
    
    // Build a map of title to genres and tags
    const titleDataMap = {};
    
    for (const [category, titles] of Object.entries(rawMapping)) {
      const isGenre = mainGenres.includes(category);
      
      for (const title of titles) {
        if (!titleDataMap[title]) {
          titleDataMap[title] = { genres: new Set(), tags: new Set() };
        }
        
        if (isGenre) {
          titleDataMap[title].genres.add(category);
        } else {
          titleDataMap[title].tags.add(category);
        }
      }
    }

    let updated = 0;
    for (const novel of novels) {
      let g = [];
      let t = [];
      
      // If we have explicit mapping
      if (titleDataMap[novel.title]) {
        g = Array.from(titleDataMap[novel.title].genres);
        t = Array.from(titleDataMap[novel.title].tags);
      } 
      
      // Provide some fallback if missing
      if (g.length === 0) g = ['Fantasy', 'Romance']; 

      novel.genres = g;
      novel.tags = t;
      
      // Safe image fallback URL (fast and reliable)
      const fallbackImage = `https://picsum.photos/seed/${novel._id}/400/600`;
      
      // Attempt to construct pollinations URL but fallback using an onerror handler in frontend
      const prompt = `Korean manhwa cover art for romance fantasy novel, beautiful highly detailed anime style, ${novel.title}`;
      novel.cover_image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=600&nologo=true`;
      
      await novel.save();
      updated++;
    }

    console.log(`Successfully categorized and regenerated covers for ${updated} novels.`);
    process.exit(0);
  } catch (error) {
    console.error("Error categorizing novels:", error);
    process.exit(1);
  }
};

applyCategorization();
