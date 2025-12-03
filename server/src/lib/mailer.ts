import nodemailer from 'nodemailer';

interface ResetEmailInput {
  to: string;
  token: string;
  expiresAt: Date;
}

interface NotificationEmailInput {
  to: string;
  assetId: number;
  assetName: string;
  endDate: Date;
  stage: 'first' | 'followup' | 'deadline';
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  APP_URL = 'http://localhost:5173',
} = process.env;

const smtpConfigured = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function sendResetEmail({ to, token, expiresAt }: ResetEmailInput) {
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

export async function sendNotificationEmail({ to, assetId, assetName, endDate, stage }: NotificationEmailInput) {
  const link = `${APP_URL}/assets/${assetId}`;
  const stageLabel = stage === 'first' ? 'Przypomnienie' : stage === 'followup' ? 'Follow-up' : 'Termin!' ;
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
