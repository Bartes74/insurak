import dotenv from 'dotenv';
import app from './app';
import { startNotificationScheduler } from './lib/notificationScheduler';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`👉 Routes registered: /api/assets (GET, POST, PUT, DELETE)`);
  startNotificationScheduler();
});
