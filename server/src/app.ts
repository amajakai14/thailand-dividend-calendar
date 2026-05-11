import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { getDB } from './db/schema';
import authRouter from './routes/auth';
import dividendsRouter from './routes/dividends';
import portfolioRouter from './routes/portfolio';
import pushRouter from './routes/push';
import watchlistRouter from './routes/watchlist';
import { startNotificationCron } from './services/notifications';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Init DB on startup
getDB();
startNotificationCron();

// API Routes
app.use('/auth', authRouter);
app.use('/api/dividends', dividendsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/push', pushRouter);
app.use('/api/watchlist', watchlistRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve React PWA static files
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
