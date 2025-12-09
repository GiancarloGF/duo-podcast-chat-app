// Script to clean up episodes without proper ID
// Run with: node --env-file=.env.local scripts/cleanup-episodes.mjs

import mongoose from 'mongoose';

const EpisodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    number: Number,
    title: String,
    url: String,
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
    messages: Array,
  },
  {
    timestamps: true,
  }
);

async function cleanupEpisodes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the master_data database
    const db = mongoose.connection.useDb('master_data');
    const Episode = db.model('Episode', EpisodeSchema);

    // Find and delete episodes without proper ID
    const result = await Episode.deleteMany({
      $or: [{ id: { $exists: false } }, { id: null }, { id: '' }],
    });

    console.log(`Deleted ${result.deletedCount} episodes without proper ID`);

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupEpisodes();
