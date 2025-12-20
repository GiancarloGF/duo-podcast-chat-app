import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    _id: String, // Usaremos el ID de Supabase aquí manualmente
    email: { type: String, required: true },
    name: String,
    avatarUrl: String,

    // --- GAMIFICACIÓN ---
    currentStreak: { type: Number, default: 0 }, // Racha actual
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null }, // Para calcular si rompió racha

    totalXp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  { _id: false, timestamps: true }
);

export function getUserModel() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  const db = mongoose.connection.useDb('chat-app');
  return db.models.User || db.model('User', UserSchema);
}
