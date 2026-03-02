import mongoose, { Schema } from 'mongoose';

const TranslationFeedbackSchema = new Schema(
  {
    userTranslation: String,
    officialTranslation: String,
    originalContent: String,
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
  { _id: false }
);

const InteractionSchema = new Schema(
  {
    messageId: { type: String, required: true },
    userInput: String,
    translationFeedback: TranslationFeedbackSchema,
    isCorrect: Boolean,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    episodeId: { type: Schema.Types.ObjectId, ref: 'Episode', required: true },
    currentMessageIndex: { type: Number, default: 0 },
    interactions: [InteractionSchema],
    status: {
      type: String,
      enum: ['started', 'completed'],
      default: 'started',
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserProgressSchema.index({ userId: 1, episodeId: 1 }, { unique: true });

export function getUserProgressModel() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  const db = mongoose.connection.useDb('chat-app');
  return db.models.UserProgress || db.model('UserProgress', UserProgressSchema);
}
