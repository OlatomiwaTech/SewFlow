import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);

const server = app.listen(PORT, () => {
  console.log(`[SewFlow API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[SewFlow API] SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('[SewFlow API] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SewFlow API] SIGINT received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('[SewFlow API] HTTP server closed.');
    process.exit(0);
  });
});

export default server;
