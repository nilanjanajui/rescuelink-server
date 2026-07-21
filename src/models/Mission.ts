import { Schema, model, Document, Types } from 'mongoose';

export interface IMission extends Document {
  title: string;
  shortDescription: string;
  fullDescription: string;
  disasterType: 'flood' | 'earthquake' | 'fire' | 'cyclone' | 'other';
  urgency: 'critical' | 'moderate' | 'low';
  status: 'active' | 'resolved';
  location: string;
  volunteersNeeded: number;
  volunteersJoined: number;
  imageUrl: string;
  images: string[];
  postedBy: string; // Better Auth user ID (string, not a Mongoose ref — different DB/collection ownership)
  estimatedHours: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const missionSchema = new Schema<IMission>(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    disasterType: {
      type: String,
      enum: ['flood', 'earthquake', 'fire', 'cyclone', 'other'],
      required: true,
    },
    urgency: {
      type: String,
      enum: ['critical', 'moderate', 'low'],
      required: true,
    },
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
    location: { type: String, required: true },
    volunteersNeeded: { type: Number, required: true },
    volunteersJoined: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],
    postedBy: { type: String, required: true },
    estimatedHours: { type: Number, default: 4 },
    coordinates: {
      lat: { type: Number, default: 23.8103 },
      lng: { type: Number, default: 90.4125 },
    },
  },
  { timestamps: true },
);

export default model<IMission>('Mission', missionSchema);