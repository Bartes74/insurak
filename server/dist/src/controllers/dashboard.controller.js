"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getDashboard = async (_req, res) => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [activeCount, expiringCount, policies] = await Promise.all([
        prisma_1.default.policy.count({ where: { status: { in: ['ACTIVE', 'RENEWAL_IN_PROGRESS', 'EXPIRING'] } } }),
        prisma_1.default.policy.count({ where: { endDate: { lte: in30 }, status: { in: ['ACTIVE', 'RENEWAL_IN_PROGRESS', 'EXPIRING'] } } }),
        prisma_1.default.policy.findMany({
            select: {
                id: true,
                assetId: true,
                policyNumber: true,
                insurer: true,
                startDate: true,
                endDate: true,
                premiumAmount: true,
                sumInsured: true,
                paymentFrequency: true,
                status: true,
                files: true,
                asset: {
                    select: { id: true, name: true, identifier: true, responsiblePerson: true, notes: true },
                },
                insured: true,
                comments: true,
            },
        }),
    ]);
    const monthlyCost = policies.reduce((sum, p) => {
        const amount = Number(p.premiumAmount || 0);
        const divisor = p.paymentFrequency === 'MONTHLY' ? 1 :
            p.paymentFrequency === 'QUARTERLY' ? 3 : 12;
        return sum + amount / divisor;
    }, 0);
    const actionItems = policies
        .filter((p) => {
        const reason = getReason(p);
        return !!reason;
    })
        .map((p) => ({
        assetId: p.assetId,
        assetName: p.asset.name,
        message: getReason(p),
        severity: severityFromReason(getReason(p)),
    }));
    // Cashflow: sum premium per month (start of month string)
    const byMonth = {};
    for (const p of policies) {
        const monthKey = `${p.endDate.getFullYear()}-${String(p.endDate.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + Number(p.premiumAmount || 0);
    }
    const cashflow = Object.entries(byMonth)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([month, amount]) => ({ month, amount }));
    res.json({
        activePolicies: activeCount,
        expiringSoon: expiringCount,
        monthlyCost: Math.round(monthlyCost),
        actionItems,
        cashflow,
    });
};
exports.getDashboard = getDashboard;
function getReason(p) {
    const filesArr = p.files ? JSON.parse(p.files || '[]') : [];
    const hasDoc = Array.isArray(filesArr) && filesArr.length > 0;
    const missingPolicyData = !p.policyNumber || !p.insurer || !p.startDate || !p.endDate;
    const missingResponsible = !p.asset?.responsiblePerson;
    const missingInsured = !p.insured;
    if (p.status === 'EXPIRED')
        return 'Polisa wygasła';
    const daysToEnd = Math.ceil((p.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysToEnd <= 30)
        return 'Polisa wygasa wkrótce';
    if (missingPolicyData)
        return 'Brak danych polisy';
    if (!hasDoc)
        return 'Brak dokumentu polisy';
    if (missingResponsible)
        return 'Brak osoby odpowiedzialnej';
    if (missingInsured)
        return 'Brak ubezpieczonego';
    if (p.status === 'RENEWAL_IN_PROGRESS')
        return 'Odnowienie w toku';
    if (p.status === 'ARCHIVED')
        return 'Do archiwizacji';
    return null;
}
function severityFromReason(reason) {
    if (reason.includes('wygas'))
        return 'danger';
    if (reason.includes('Brak'))
        return 'warning';
    if (reason.includes('Odnowienie'))
        return 'info';
    return 'warning';
}
//# sourceMappingURL=dashboard.controller.js.map