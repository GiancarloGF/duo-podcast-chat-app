// Script to seed/update episodes from JSON files to MongoDB
// Run with: node --env-file=.env.local scripts/seed-episodes.mjs

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function mapJsonToEpisode(id, json) {
  const characterRoleMap = new Map();
  if (json.characters) {
    json.characters.forEach((c) => {
      characterRoleMap.set(c.name, c.role);
    });
  }

  return {
    id: json.id || id, // Use id from JSON if available, otherwise use provided id
    number: json.number,
    title: json.title,
    url: json.url,
    imageUrl: json.imageUrl,
    summaryText: json.summaryText,
    summaryHtml: json.summaryHtml,
    languageLevel: json.languageLevel,
    themes: json.themes,
    characters: json.characters,
    messages: json.messages.map((msg) => ({
      id: msg.id,
      sender: msg.relatorName,
      senderType: characterRoleMap.get(msg.relatorName) || 'unknown',
      language: msg.language,
      requiresTranslation: msg.language === 'es',
      content: msg.content,
      contentHtml: msg.contentHtml,
      contentMarkdown: msg.contentMkd,
      officialTranslation: msg.translation,
      keyPoints: msg.keyPoints,
    })),
  };
}

async function seedEpisodes() {
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

    // Load episode JSON files from public/episodes
    const episodesDir = path.join(__dirname, '..', 'public', 'episodes');
    const files = await fs.readdir(episodesDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} episode JSON files`);

    for (const file of jsonFiles) {
      const episodeId = file.replace('.json', '');
      const filePath = path.join(episodesDir, file);
      const jsonContent = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);

      const episodeData = mapJsonToEpisode(episodeId, jsonData);

      console.log(`\nProcessing episode: ${episodeId}`);
      console.log(`Title: ${episodeData.title}`);

      // Upsert the episode (update if exists, insert if not)
      const result = await Episode.findOneAndUpdate(
        { id: episodeId },
        episodeData,
        { upsert: true, new: true }
      );

      console.log(`✓ Episode ${episodeId} updated/inserted successfully`);
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    console.log('✓ All episodes seeded successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedEpisodes();
