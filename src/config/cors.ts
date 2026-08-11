import type { CorsOptions } from 'cors';
import { env } from './env.js';

const allowedOrigins = [env.frontendUrl, env.adminUrl, env.liveUrl].filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};