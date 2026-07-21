import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import missionRoutes from './routes/mission.routes';
import volunteerRoutes from './routes/volunteer.routes';
import updateRoutes from './routes/update.routes';
import statsRoutes from './routes/stats.routes';
import subscriberRoutes from './routes/subscriber.routes';
import contactRoutes from './routes/contact.routes';
import testimonialRoutes from './routes/testimonial.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

// Serve uploaded image files statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/missions', missionRoutes);
app.use('/api/volunteer-signups', volunteerRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/newsletter', subscriberRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'RescueLink API is running' });
});

export default app;