import 'dotenv/config';
import app from './app.js';
import prisma from './lib/prisma.js';
import { startOverdueCron } from './services/overdue.cron.js';
import { ensureAssetTagSequence } from './utils/assetTagGenerator.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Ensure asset tag sequence exists
    await ensureAssetTagSequence();
    console.log('✅ Asset tag sequence ready');

    // Start cron jobs
    startOverdueCron();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 AssetFlow API running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });

    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Kill the existing process first:`);
        console.error(`   Run: netstat -ano | findstr :${PORT}  → then: taskkill /PID <pid> /F`);
      } else {
        console.error('❌ Server error:', err.message);
      }
      await prisma.$disconnect();
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
