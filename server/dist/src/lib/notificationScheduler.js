"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNotificationsOnce = processNotificationsOnce;
exports.startNotificationScheduler = startNotificationScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("./prisma"));
const mailer_1 = require("./mailer");
const date_fns_1 = require("date-fns");
const CRON_EXPR = process.env.NOTIFICATION_CRON || '0 */6 * * *'; // co 6h domyślnie
async function getSettings() {
    const settings = await prisma_1.default.notificationSetting.findFirst();
    if (settings)
        return settings;
    // ensure defaults exist
    return prisma_1.default.notificationSetting.create({
        data: {
            defaultLeadDays: 30,
            followUpLeadDays: 10,
            deadlineLeadDays: 0,
        },
    });
}
async function getRecipients(assetId) {
    const assetSpecific = await prisma_1.default.notificationRecipient.findMany({ where: { assetId } });
    if (assetSpecific.length > 0)
        return assetSpecific.map((r) => r.email);
    const global = await prisma_1.default.notificationRecipient.findMany({ where: { assetId: null } });
    return global.map((r) => r.email);
}
async function shouldSend(policyId, stage) {
    const existing = await prisma_1.default.notificationLog.findUnique({
        where: {
            policyId_stage: { policyId, stage },
        },
    });
    return !existing;
}
async function markSent(policyId, stage) {
    await prisma_1.default.notificationLog.create({ data: { policyId, stage } });
}
async function processNotificationsOnce() {
    const settings = await getSettings();
    const now = new Date();
    const policies = await prisma_1.default.policy.findMany({
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
        const daysUntilEnd = (0, date_fns_1.differenceInCalendarDays)(policy.endDate, now);
        const lead = policy.notificationOverrideDays ?? settings.defaultLeadDays;
        const followUp = settings.followUpLeadDays;
        const deadline = settings.deadlineLeadDays ?? 0;
        const stages = [
            { name: 'first', condition: daysUntilEnd <= lead && daysUntilEnd >= followUp },
            { name: 'followup', condition: daysUntilEnd <= followUp && daysUntilEnd >= deadline },
            { name: 'deadline', condition: daysUntilEnd <= deadline },
        ];
        for (const stage of stages) {
            if (!stage.condition)
                continue;
            const canSend = await shouldSend(policy.id, stage.name);
            if (!canSend)
                continue;
            const recipients = await getRecipients(policy.assetId);
            if (recipients.length === 0) {
                await markSent(policy.id, stage.name); // avoid loops even without recipients
                continue;
            }
            for (const email of recipients) {
                await (0, mailer_1.sendNotificationEmail)({
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
function startNotificationScheduler() {
    console.log(`⏰ Notification scheduler starting with CRON: ${CRON_EXPR}`);
    node_cron_1.default.schedule(CRON_EXPR, () => {
        processNotificationsOnce().catch((err) => console.error('Notification job failed', err));
    });
}
//# sourceMappingURL=notificationScheduler.js.map