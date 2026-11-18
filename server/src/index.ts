import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import decksRouter from './routes/decks';
import progressRouter from './routes/progress';
import speakingRouter from './routes/speaking';
import dictionaryRouter from './routes/dictionary';
import conversationsRouter from './routes/conversations';
import leaderboardRouter from './routes/leaderboard';
import profileRouter from './routes/profile';
import { errorHandler } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint theo chuẩn chung
app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'SpeakUp API Server is running');
});

// REST API Routes
app.use('/api/decks', decksRouter);
app.use('/api/progress', progressRouter);
app.use('/api/speaking', speakingRouter);
app.use('/api/dictionary', dictionaryRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/profile', profileRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`🚀 Backend Server đang chạy tại http://localhost:${PORT}`);
});
