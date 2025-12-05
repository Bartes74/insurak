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

interface WelcomeEmailInput {
  to: string;
  password: string;
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

// --- HTML Template Helper ---
function getHtmlTemplate(title: string, bodyContent: string, ctaLink?: string, ctaText?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #4f46e5; padding: 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 40px 30px; }
    .button-container { text-align: center; margin-top: 30px; margin-bottom: 30px; }
    .button { display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; }
    .button:hover { background-color: #4338ca; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .info-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; color: #1e40af; }
    .warning-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Insurak</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #111827; font-size: 20px;">${title}</h2>
      ${bodyContent}
      ${ctaLink ? `
        <div class="button-container">
          <a href="${ctaLink}" class="button">${ctaText}</a>
        </div>
      ` : ''}
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Jeśli przycisk nie działa, skopiuj poniższy link do przeglądarki:<br>
        <a href="${ctaLink}" style="color: #4f46e5;">${ctaLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} InsureGuard. Wszystkie prawa zastrzeżone.</p>
      <p>Ta wiadomość została wygenerowana automatycznie.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendResetEmail({ to, token, expiresAt }: ResetEmailInput) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;

  if (!transporter) {
    console.warn('[mailer] SMTP not configured; printing reset link instead:', resetLink);
    return;
  }

  const html = getHtmlTemplate(
    'Resetowanie hasła',
    `
      <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w systemie Insurak.</p>
      <p>Jeśli to nie Ty wysłałeś tę prośbę, możesz zignorować tę wiadomość.</p>
      <div class="info-box">Link wygaśnie: <strong>${expiresAt.toLocaleString('pl-PL')}</strong></div>
    `,
    resetLink,
    'Zresetuj hasło'
  );

  await transporter.sendMail({
    from: `"Insurak" <${SMTP_USER}>`,
    to,
    subject: 'Reset hasła - Insurak',
    html,
  });
}

export async function sendNotificationEmail({ to, assetId, assetName, endDate, stage }: NotificationEmailInput) {
  const link = `${APP_URL}/assets/${assetId}`;
  const stageLabel = stage === 'first' ? 'Przypomnienie o polisie' : stage === 'followup' ? 'Wymagane działanie' : 'Polisa wygasa!';
  const isUrgent = stage === 'deadline';

  if (!transporter) {
    console.warn('[mailer] SMTP not configured; notification email log:', { to, assetId, stage, link });
    return;
  }

  const boxClass = isUrgent ? 'warning-box' : 'info-box';
  const dateStr = endDate.toLocaleDateString('pl-PL');

  const html = getHtmlTemplate(
    stageLabel,
    `
      <p>Informujemy o zbliżającym się końcu ważności polisy dla zasobu:</p>
      <h3 style="font-size: 18px; margin: 10px 0;">${assetName}</h3>
      <div class="${boxClass}">
        Data wygaśnięcia: <strong>${dateStr}</strong>
      </div>
      <p>Prosimy o podjęcie odpowiednich działań w celu odnowienia ubezpieczenia.</p>
    `,
    link,
    'Zobacz szczegóły'
  );

  await transporter.sendMail({
    from: `"Insurak" <${SMTP_USER}>`,
    to,
    subject: `[Insurak] ${stageLabel} - ${assetName}`,
    html,
  });
}

export async function sendWelcomeEmail({ to, password }: WelcomeEmailInput) {
  const loginLink = `${APP_URL}/login`;

  if (!transporter) {
    console.warn('[mailer] SMTP not configured; welcome email log:', { to, password });
    return;
  }

  const html = getHtmlTemplate(
    'Witaj w Insurak!',
    `
      <p>Administrator utworzył dla Ciebie konto w systemie zarządzania ubezpieczeniami Insurak.</p>
      <p>Poniżej znajdują się Twoje dane do logowania:</p>
      <div class="info-box">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
        <p style="margin: 5px 0;"><strong>Hasło:</strong> ${password}</p>
      </div>
      <p>Zalecamy zmianę hasła po pierwszym zalogowaniu.</p>
    `,
    loginLink,
    'Zaloguj się'
  );

  await transporter.sendMail({
    from: `"Insurak" <${SMTP_USER}>`,
    to,
    subject: 'Witaj w Insurak - Twoje konto zostało utworzone',
    html,
  });
}
