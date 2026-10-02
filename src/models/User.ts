import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  phone: string;
  passwordHash: string;
  serviceCode: string; // The unique code given to them after registration
  messageCap: number; // The limit of messages they can send
  messagesSent: number; // How many they have sent so far
  metaPhoneId?: string; // Optional Meta Phone ID for sending
  role: 'admin' | 'client';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  serviceCode: { type: String, required: true, unique: true },
  messageCap: { type: Number, default: 0 }, // Admin must increase this
  messagesSent: { type: Number, default: 0 },
  metaPhoneId: { type: String, required: false },
  role: { type: String, enum: ['admin', 'client'], default: 'client' }
}, { timestamps: true });

// Prevent Mongoose from recompiling the model if it already exists
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
