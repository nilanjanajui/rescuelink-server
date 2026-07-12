import { Schema, model, Document } from 'mongoose';

export interface IVolunteerSignup extends Document {
  missionId: string;
  userId: string;
  joinedAt: Date;
}

const volunteerSignupSchema = new Schema<IVolunteerSignup>(
  {
    missionId: { type: String, required: true },
    userId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default model<IVolunteerSignup>(
  'VolunteerSignup',
  volunteerSignupSchema,
);
