import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import decksRouter from './routes/decks';
import progressRouter from './routes/progress';
import speakingRouter from './routes/speaking';
import dictionaryRouter from './routes/dictionary';
import conversationsRouter from './routes/conversations';
import leaderboardRouter from './routes/leaderboard';
import profileRouter from './routes/profile';
import collectionsRouter from './routes/collections';
import { errorHandler } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// 1. Bảo mật HTTP Headers với Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cho phép frontend Vercel tải tài nguyên
    contentSecurityPolicy: false, // Để frontend tự quản lý CSP
  })
);

// 2. CORS an toàn hỗ trợ cả Localhost và Vercel Production
const allowedOrigins = [
  CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (server-to-server, curl) hoặc origin nằm trong danh sách whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' })); // Giới hạn kích thước payload

// 3. Giới hạn tần suất gọi API (Rate Limiting) chống spam và DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // Tối đa 300 request / 15 phút cho mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau 15 phút.',
    },
  },
});
app.use('/api', apiLimiter);

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
app.use('/api/collections', collectionsRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`🚀 Backend Server đang chạy tại http://localhost:${PORT}`);
});
