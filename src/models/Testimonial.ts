import { Schema, model, Document } from 'mongoose';

export interface ITestimonial extends Document {
  quote: string;
  authorName: string;
  authorRole: string; // e.g. "Volunteer, Dhaka Flood Response" or "Program Lead, Red Crescent"
  avatarUrl: string;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    quote: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

export default model<ITestimonial>('Testimonial', testimonialSchema);
