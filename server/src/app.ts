import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

// Init DB on startup (runs migrations for user tables)
getDB();
startNotificationCron();

// Routes
app.use('/auth', authRouter);
app.use('/api/dividends', dividendsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/push', pushRouter);
app.use('/api/watchlist', watchlistRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
