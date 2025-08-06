import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import userRoutes from './routes/user.routes';

const app = express();

//cors
// Define allowed origins
const allowedOrigins = ['http://localhost:3000', 'http://localhost:4000'];
const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

// logger using winston
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${req.statusCode}`);
  });
  next();
});

// rate limit
const generalApplimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', generalApplimiter);

// Stricter rate limiter for login
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 mins
  max: 5,
  message: 'Too many login attempts, try again after 1 minute.',
});

app.post('/api/login', loginLimiter, (req, res) => {
  res.json({ message: 'Login successful (mocked)' });
});

// body parser
app.use(express.json());

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/users', userRoutes);

export default app;
