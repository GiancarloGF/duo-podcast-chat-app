import mongoose, { Schema } from 'mongoose';

const SavedWordSchema = new Schema(
  {
    userId: { type: String, required: true },
    word: { type: String, required: true },
    originalSentence: { type: String, required: true },
    meaning: { type: String, required: true },
    example: { type: String },
  },
  { timestamps: true }
);

export function getSavedWordModel() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  const db = mongoose.connection.useDb('chat-app');
  return db.models.SavedWord || db.model('SavedWord', SavedWordSchema);
}
