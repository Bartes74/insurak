"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitImport = exports.dryRunImport = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const toDate = (val) => (val ? new Date(val) : new Date());
const dryRunImport = async (req, res) => {
    const raw = req.body.records || [];
    if (!Array.isArray(raw))
        return res.status(400).json({ error: 'records must be an array' });
    const records = raw
        .map((r) => ({ ...r, identifier: (r.identifier || '').trim() }))
        .filter((r) => r.identifier.length > 0);
    const identifiers = records.map((r) => r.identifier);
    const existingAssets = await prisma_1.default.asset.findMany({
        where: { identifier: { in: identifiers } },
        include: { policies: { orderBy: { endDate: 'desc' }, take: 1 } },
    });
    const conflicts = [];
    const newOnes = [];
    const seen = {};
    for (const rec of records) {
        const match = existingAssets.find((a) => a.identifier === rec.identifier);
        if (match) {
            conflicts.push({ identifier: rec.identifier, existing: match, incoming: rec });
        }
        else {
            newOnes.push(rec);
        }
        seen[rec.identifier] = true;
    }
    res.json({
        newCount: newOnes.length,
        updateCount: conflicts.length,
        skipCount: raw.length - records.length,
        conflicts,
        newRecords: newOnes,
    });
};
exports.dryRunImport = dryRunImport;
const commitImport = async (req, res) => {
    const raw = req.body.records || [];
    const records = raw
        .map((r) => ({ ...r, identifier: (r.identifier || '').trim() }))
        .filter((r) => r.identifier.length > 0);
    let added = 0;
    let updated = 0;
    let skipped = raw.length - records.length;
    const cache = {};
    for (const rec of records) {
        let existing = cache[rec.identifier] || (await prisma_1.default.asset.findUnique({ where: { identifier: rec.identifier } }));
        if (!existing) {
            const data = {
                name: rec.name || rec.identifier,
                type: rec.type || 'OTHER',
                identifier: rec.identifier,
                responsiblePerson: rec.responsiblePerson || '',
                notes: rec.notes || '',
            };
            if (rec.policyNumber || rec.validFrom || rec.validUntil) {
                data.policies = {
                    create: {
                        policyNumber: rec.policyNumber || '',
                        insurer: rec.insurer || '',
                        startDate: rec.validFrom ? toDate(rec.validFrom) : new Date(),
                        endDate: rec.validUntil ? toDate(rec.validUntil) : new Date(),
                        premiumAmount: rec.premium || 0,
                        sumInsured: rec.sumInsured || 0,
                        leasingRef: rec.leasingRef || '',
                        insured: rec.insured || '',
                        comments: rec.comments || '',
                    },
                };
            }
            const created = await prisma_1.default.asset.create({ data });
            cache[rec.identifier] = { id: created.id };
            added += 1;
            continue;
        }
        cache[rec.identifier] = { id: existing.id };
        await prisma_1.default.asset.update({
            where: { id: existing.id },
            data: {
                name: rec.name || existing.name,
                type: rec.type || existing.type,
                responsiblePerson: rec.responsiblePerson ?? existing.responsiblePerson,
                notes: rec.notes ?? existing.notes,
            },
        });
        const latest = await prisma_1.default.policy.findFirst({ where: { assetId: existing.id }, orderBy: { endDate: 'desc' } });
        if (latest) {
            await prisma_1.default.policy.update({
                where: { id: latest.id },
                data: {
                    policyNumber: rec.policyNumber || latest.policyNumber,
                    insurer: rec.insurer || latest.insurer,
                    startDate: rec.validFrom ? toDate(rec.validFrom) : latest.startDate,
                    endDate: rec.validUntil ? toDate(rec.validUntil) : latest.endDate,
                    premiumAmount: rec.premium ?? Number(latest.premiumAmount),
                    sumInsured: rec.sumInsured ?? Number(latest.sumInsured ?? 0),
                    leasingRef: rec.leasingRef ?? latest.leasingRef,
                    insured: rec.insured ?? latest.insured,
                    comments: rec.comments ?? latest.comments,
                },
            });
        }
        else if (rec.policyNumber || rec.validFrom || rec.validUntil) {
            await prisma_1.default.policy.create({
                data: {
                    assetId: existing.id,
                    policyNumber: rec.policyNumber || '',
                    insurer: rec.insurer || '',
                    startDate: rec.validFrom ? toDate(rec.validFrom) : new Date(),
                    endDate: rec.validUntil ? toDate(rec.validUntil) : new Date(),
                    premiumAmount: rec.premium || 0,
                    sumInsured: rec.sumInsured || 0,
                    leasingRef: rec.leasingRef || '',
                    insured: rec.insured || '',
                    comments: rec.comments || '',
                },
            });
        }
        updated += 1;
    }
    res.json({ added, updated, skipped });
};
exports.commitImport = commitImport;
//# sourceMappingURL=import.controller.js.map