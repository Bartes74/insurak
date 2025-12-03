"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetEmail = sendResetEmail;
exports.sendNotificationEmail = sendNotificationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, APP_URL = 'http://localhost:5173', } = process.env;
const smtpConfigured = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;
const transporter = smtpConfigured
    ? nodemailer_1.default.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    : null;
async function sendResetEmail({ to, token, expiresAt }) {
    const resetLink = `${APP_URL}/reset-password?token=${token}`;
    if (!transporter) {
        console.warn('[mailer] SMTP not configured; printing reset link instead:', resetLink);
        return;
    }
    const text = `Kliknij, aby zresetować hasło: ${resetLink}\nLink wygaśnie: ${expiresAt.toISOString()}`;
    await transporter.sendMail({
        from: SMTP_USER,
        to,
        subject: 'Reset hasła - InsureGuard',
        text,
    });
}
async function sendNotificationEmail({ to, assetId, assetName, endDate, stage }) {
    const link = `${APP_URL}/assets/${assetId}`;
    const stageLabel = stage === 'first' ? 'Przypomnienie' : stage === 'followup' ? 'Follow-up' : 'Termin!';
    const text = [
        `${stageLabel}: Polisa wygasa ${endDate.toISOString().split('T')[0]}`,
        `Zasób: ${assetName}`,
        `Link: ${link}`,
    ].join('\n');
    if (!transporter) {
        console.warn('[mailer] SMTP not configured; notification email log:', { to, assetId, stage, link });
        return;
    }
    await transporter.sendMail({
        from: SMTP_USER,
        to,
        subject: `[InsureGuard] ${stageLabel} - ${assetName}`,
        text,
    });
}
//# sourceMappingURL=mailer.js.map