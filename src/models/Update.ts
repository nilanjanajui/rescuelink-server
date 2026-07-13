import { Schema, model, Document } from 'mongoose';

export interface IUpdate extends Document {
  missionId: string; // Mission _id as a string, kept consistent with VolunteerSignup's convention
  userId: string; // Better Auth user ID of the poster
  message: string;
}

const updateSchema = new Schema<IUpdate>(
  {
    missionId: { type: String, required: true },
    userId: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

export default model<IUpdate>('Update', updateSchema);
