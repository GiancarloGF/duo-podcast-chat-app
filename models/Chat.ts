import mongoose, { Schema, Model } from 'mongoose';

const MessageSchema = new Schema({
  id: { type: String, required: true }, // Unique ID for the chat message
  episodeMessageId: { type: String }, // Reference to the original episode message ID (if applicable)
  sender: { type: String, required: true },
  message: { type: String, required: true },
  isUserMessage: { type: Boolean, default: false },
  translationFeedback: {
    analysis: String,
    score: Number,
    suggestions: [String],
    differences: String,
    detailedAnalysis: {
      grammar: String,
      vocabulary: String,
      construction: String,
    },
    phrasalVerbs: {
      relevant: Boolean,
      suggestions: [String],
    },
  },
  timestamp: { type: Date, default: Date.now },
});

const ChatSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    episodeId: { type: String, required: true, ref: 'Episode', index: true },
    status: {
      type: String,
      enum: ['idle', 'initialized', 'completed'],
      default: 'initialized',
    },
    progress: { type: Number, default: 0 }, // Number of messages shown/completed
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

// Helper to get model on specific DB
export function getChatModel() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  // Use 'chat-app' database
  const db = mongoose.connection.useDb('chat-app');
  // Prevent overwrite on HMR
  return db.models.Chat || db.model('Chat', ChatSchema);
}
