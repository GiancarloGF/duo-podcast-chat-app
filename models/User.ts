import mongoose, { Schema, Model } from 'mongoose';

const UserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    // Add other fields as needed
  },
  {
    timestamps: true,
  }
);

export function getUserModel() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  const db = mongoose.connection.useDb('chat-app');
  return db.models.User || db.model('User', UserSchema);
}
