import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 5001,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me-in-prod',
    authRateMax: Number(process.env.AUTH_RATE_MAX) || 50,
    uploadRateMax: Number(process.env.UPLOAD_RATE_MAX) || 100,
    nodeEnv: process.env.NODE_ENV || 'development',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    appUrl: process.env.APP_URL || 'http://localhost:3000', // Default to client URL
};

