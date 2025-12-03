import cron from 'node-cron';
import prisma from './prisma';
import { sendNotificationEmail } from './mailer';
import { differenceInCalendarDays } from 'date-fns';

type Stage = 'first' | 'followup' | 'deadline';

const CRON_EXPR = process.env.NOTIFICATION_CRON || '0 */6 * * *'; // co 6h domyślnie

async function getSettings() {
  const settings = await prisma.notificationSetting.findFirst();
  if (settings) return settings;
  // ensure defaults exist
  return prisma.notificationSetting.create({
    data: {
      defaultLeadDays: 30,
      followUpLeadDays: 10,
      deadlineLeadDays: 0,
    },
  });
}

async function getRecipients(assetId: number) {
  const assetSpecific = await prisma.notificationRecipient.findMany({ where: { assetId } });
  if (assetSpecific.length > 0) return assetSpecific.map((r) => r.email);
  const global = await prisma.notificationRecipient.findMany({ where: { assetId: null } });
  return global.map((r) => r.email);
}

async function shouldSend(policyId: number, stage: string) {
  const existing = await prisma.notificationLog.findUnique({
    where: {
      policyId_stage: { policyId, stage },
    },
  });
  return !existing;
}

async function markSent(policyId: number, stage: string) {
  await prisma.notificationLog.create({ data: { policyId, stage } });
}

export async function processNotificationsOnce() {
  const settings = await getSettings();
  const now = new Date();

  const policies = await prisma.policy.findMany({
    where: {
      status: { in: ['ACTIVE', 'RENEWAL_IN_PROGRESS', 'EXPIRING'] },
    },
    include: {
      asset: {
        select: { id: true, name: true },
      },
    },
  });

  for (const policy of policies) {
    const daysUntilEnd = differenceInCalendarDays(policy.endDate, now);

    const lead = policy.notificationOverrideDays ?? settings.defaultLeadDays;
    const followUp = settings.followUpLeadDays;
    const deadline = settings.deadlineLeadDays ?? 0;

    const stages: { name: Stage; condition: boolean }[] = [
      { name: 'first', condition: daysUntilEnd <= lead && daysUntilEnd >= followUp },
      { name: 'followup', condition: daysUntilEnd <= followUp && daysUntilEnd >= deadline },
      { name: 'deadline', condition: daysUntilEnd <= deadline },
    ];

    for (const stage of stages) {
      if (!stage.condition) continue;
      const canSend = await shouldSend(policy.id, stage.name);
      if (!canSend) continue;

      const recipients = await getRecipients(policy.assetId);
      if (recipients.length === 0) {
        await markSent(policy.id, stage.name); // avoid loops even without recipients
        continue;
      }

      for (const email of recipients) {
        await sendNotificationEmail({
          to: email,
          assetId: policy.assetId,
          assetName: policy.asset.name,
          endDate: policy.endDate,
          stage: stage.name,
        });
      }

      await markSent(policy.id, stage.name);
    }
  }
}

export function startNotificationScheduler() {
  console.log(`⏰ Notification scheduler starting with CRON: ${CRON_EXPR}`);
  cron.schedule(CRON_EXPR, () => {
    processNotificationsOnce().catch((err) => console.error('Notification job failed', err));
  });
}
