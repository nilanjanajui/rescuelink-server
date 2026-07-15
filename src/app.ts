import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import missionRoutes from './routes/mission.routes';
import volunteerRoutes from './routes/volunteer.routes';
import updateRoutes from './routes/update.routes';
import statsRoutes from './routes/stats.routes';
import subscriberRoutes from './routes/subscriber.routes';
import contactRoutes from './routes/contact.routes';
import testimonialRoutes from './routes/testimonial.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/missions', missionRoutes);
app.use('/api/volunteer-signups', volunteerRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/newsletter', subscriberRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'RescueLink API is running' });
});

export default app;