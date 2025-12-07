// Script to verify and update episode titles in MongoDB
// Run with: node --env-file=.env.local scripts/update-episode-titles.mjs

import mongoose from 'mongoose';

const EpisodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: String,
    imageUrl: String,
    summaryText: String,
    summaryHtml: String,
    languageLevel: String,
    themes: [String],
    characters: [
      {
        name: String,
        role: String,
      },
    ],
    messages: [
      {
        id: String,
        sender: String,
        senderType: String,
        language: String,
        requiresTranslation: Boolean,
        content: String,
        contentHtml: String,
        contentMarkdown: String,
        officialTranslation: String,
        keyPoints: Array,
      },
    ],
  },
  {
    timestamps: true,
  }
);

async function updateEpisodeTitles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the master_data database
    const db = mongoose.connection.useDb('master_data');
    const Episode = db.model('Episode', EpisodeSchema);

    // Find all episodes
    const episodes = await Episode.find({});
    console.log(`Found ${episodes.length} episodes`);

    for (const episode of episodes) {
      console.log(`\nEpisode ID: ${episode.id}`);
      console.log(`Current title: "${episode.title || 'EMPTY'}"`);

      if (!episode.title || episode.title.trim() === '') {
        console.log('⚠️  Title is missing or empty!');

        // You can manually set the title here or load from JSON
        // For now, we'll just report it
        console.log('Please update this episode manually or via seed script');
      } else {
        console.log('✓ Title exists');
      }
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateEpisodeTitles();
