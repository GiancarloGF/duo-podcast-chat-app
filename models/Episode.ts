import mongoose, { Schema, Model } from 'mongoose';

const KeyPointSchema = new Schema({
  type: String,
  concept: String,
  word: String,
  example: String,
  definition_es: String,
  definition_en: String,
});

const MessageSchema = new Schema({
  id: { type: String, required: true },
  sender: String,
  senderType: String,
  language: String,
  requiresTranslation: Boolean,
  content: String,
  contentHtml: String,
  contentMarkdown: String,
  officialTranslation: String,
  keyPoints: [KeyPointSchema],
});

const CharacterSchema = new Schema({
  name: String,
  role: String,
});

const EpisodeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true }, // 'ep-1'
    number: Number,
    title: String,
    url: String,
    imageUrl: String,
    summaryText: String,
    summaryHtml: String,
    languageLevel: String,
    themes: [String],
    characters: [CharacterSchema],
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

// Helper to get model on specific DB
export function getEpisodeModel() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  // Use 'master_data' database
  const db = mongoose.connection.useDb('master_data');
  // Prevent overwrite on HMR
  return db.models.Episode || db.model('Episode', EpisodeSchema);
}
