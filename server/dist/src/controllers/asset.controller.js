"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicyHistory = exports.renewPolicy = exports.downloadPolicyFile = exports.listPolicyFiles = exports.uploadPolicyFiles = exports.deleteAsset = exports.updateAsset = exports.createAsset = exports.getAssets = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
// Helpers
const computeStatus = (policy) => {
    const today = new Date();
    if (policy.status === 'ARCHIVED' || policy.status === 'RENEWAL_IN_PROGRESS')
        return policy.status;
    const diffTime = policy.endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0)
        return 'EXPIRED';
    if (diffDays <= 30)
        return 'EXPIRING';
    return 'ACTIVE';
};
const computeProgress = (policy) => {
    const total = policy.endDate.getTime() - policy.startDate.getTime();
    const passed = Date.now() - policy.startDate.getTime();
    if (total <= 0)
        return 0;
    const pct = Math.min(100, Math.max(0, (passed / total) * 100));
    return Math.round(pct);
};
const getAssets = async (req, res) => {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                policies: {
                    orderBy: { endDate: 'desc' },
                }
            }
        });
        // Transform data to match Frontend Interface
        const formattedAssets = assets.map(asset => {
            const latestPolicy = asset.policies[0];
            const status = latestPolicy ? computeStatus(latestPolicy) : 'EXPIRED';
            const progress = latestPolicy ? computeProgress(latestPolicy) : 0;
            return {
                id: asset.id,
                name: asset.name,
                type: asset.type,
                identifier: asset.identifier,
                status,
                progress,
                policyNumber: latestPolicy?.policyNumber || '',
                insurer: latestPolicy?.insurer || '',
                validFrom: latestPolicy?.startDate.toISOString().split('T')[0] || '',
                validUntil: latestPolicy?.endDate.toISOString().split('T')[0] || '',
                conclusionDate: latestPolicy?.createdAt.toISOString().split('T')[0] || '',
                premium: latestPolicy?.premiumAmount ? Number(latestPolicy.premiumAmount) : 0,
                sumInsured: latestPolicy?.sumInsured ? Number(latestPolicy.sumInsured) : 0,
                paymentFrequency: latestPolicy?.paymentFrequency || 'YEARLY',
                leasingRef: latestPolicy?.leasingRef || '',
                insured: latestPolicy?.insured || '',
                responsiblePerson: asset.responsiblePerson || '',
                comments: latestPolicy?.comments || '',
                notes: asset.notes || ''
            };
        });
        res.json(formattedAssets);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};
exports.getAssets = getAssets;
const createAsset = async (req, res) => {
    try {
        const data = req.body;
        // Transaction to create Asset AND its first Policy
        const newAsset = await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.create({
                data: {
                    name: data.name,
                    type: data.type,
                    identifier: data.identifier,
                    responsiblePerson: data.responsiblePerson,
                    notes: data.notes
                }
            });
            // If policy data is provided
            if (data.policyNumber) {
                await tx.policy.create({
                    data: {
                        assetId: asset.id,
                        policyNumber: data.policyNumber,
                        insurer: data.insurer,
                        startDate: new Date(data.validFrom),
                        endDate: new Date(data.validUntil),
                        premiumAmount: data.premium,
                        sumInsured: data.sumInsured,
                        paymentFrequency: data.paymentFrequency || 'YEARLY',
                        status: 'ACTIVE',
                        notificationOverrideDays: data.notificationOverrideDays,
                        leasingRef: data.leasingRef,
                        insured: data.insured,
                        comments: data.comments,
                        files: data.files ? JSON.stringify(data.files) : null,
                    }
                });
            }
            return asset;
        });
        res.status(201).json(newAsset);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create asset' });
    }
};
exports.createAsset = createAsset;
const updateAsset = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        // 1. Update Asset details
        await prisma.asset.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                type: data.type,
                identifier: data.identifier,
                responsiblePerson: data.responsiblePerson,
                notes: data.notes
            }
        });
        // 2. Update LATEST Policy (Simplification for MVP)
        const policies = await prisma.policy.findMany({
            where: { assetId: Number(id) },
            orderBy: { endDate: 'desc' },
            take: 1
        });
        if (policies.length > 0 && policies[0]) {
            const policyId = policies[0].id;
            const policyUpdate = {
                policyNumber: data.policyNumber,
                insurer: data.insurer,
                premiumAmount: data.premium,
                sumInsured: data.sumInsured,
                leasingRef: data.leasingRef,
                insured: data.insured,
                comments: data.comments,
                paymentFrequency: data.paymentFrequency,
                notificationOverrideDays: data.notificationOverrideDays,
            };
            if (data.validFrom)
                policyUpdate.startDate = new Date(data.validFrom);
            if (data.validUntil)
                policyUpdate.endDate = new Date(data.validUntil);
            if (data.files)
                policyUpdate.files = JSON.stringify(data.files);
            if (data.status)
                policyUpdate.status = data.status;
            await prisma.policy.update({
                where: { id: policyId },
                data: policyUpdate
            });
        }
        res.json({ message: 'Asset updated' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update asset' });
    }
};
exports.updateAsset = updateAsset;
const deleteAsset = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.asset.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Asset deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};
exports.deleteAsset = deleteAsset;
const uploadPolicyFiles = async (req, res) => {
    const { id } = req.params;
    const files = req.files;
    if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
    }
    try {
        const assetId = Number(id);
        const latest = await prisma.policy.findFirst({
            where: { assetId },
            orderBy: { endDate: 'desc' },
        });
        if (!latest) {
            res.status(404).json({ error: 'Policy not found for asset' });
            return;
        }
        const existing = latest.files ? JSON.parse(latest.files) : [];
        const uploaded = files.map((f) => ({
            filename: f.filename,
            originalName: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            path: path_1.default.relative(process.cwd(), f.path),
            uploadedAt: new Date().toISOString(),
        }));
        const updatedFiles = [...existing, ...uploaded];
        await prisma.policy.update({
            where: { id: latest.id },
            data: { files: JSON.stringify(updatedFiles) },
        });
        res.status(200).json({ files: updatedFiles });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
};
exports.uploadPolicyFiles = uploadPolicyFiles;
const listPolicyFiles = async (req, res) => {
    const { id } = req.params;
    try {
        const latest = await prisma.policy.findFirst({
            where: { assetId: Number(id) },
            orderBy: { endDate: 'desc' },
        });
        if (!latest) {
            res.status(404).json({ error: 'Policy not found for asset' });
            return;
        }
        const files = latest.files ? JSON.parse(latest.files) : [];
        res.json(files);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to list files' });
    }
};
exports.listPolicyFiles = listPolicyFiles;
const downloadPolicyFile = async (req, res) => {
    const { id, filename } = req.params;
    try {
        const latest = await prisma.policy.findFirst({
            where: { assetId: Number(id) },
            orderBy: { endDate: 'desc' },
        });
        if (!latest) {
            res.status(404).json({ error: 'Policy not found for asset' });
            return;
        }
        const files = latest.files ? JSON.parse(latest.files) : [];
        const file = files.find((f) => f.filename === filename);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        const absolutePath = path_1.default.join(process.cwd(), file.path);
        if (!fs_1.default.existsSync(absolutePath)) {
            res.status(404).json({ error: 'File missing on disk' });
            return;
        }
        res.download(absolutePath, file.originalName);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download file' });
    }
};
exports.downloadPolicyFile = downloadPolicyFile;
const renewPolicy = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    if (!data.policyNumber || !data.insurer || !data.validFrom || !data.validUntil) {
        res.status(400).json({ error: 'policyNumber, insurer, validFrom, validUntil are required' });
        return;
    }
    try {
        const assetId = Number(id);
        await prisma.$transaction(async (tx) => {
            const latest = await tx.policy.findFirst({
                where: { assetId },
                orderBy: { endDate: 'desc' },
            });
            if (latest) {
                await tx.policy.update({
                    where: { id: latest.id },
                    data: { status: 'ARCHIVED' }
                });
            }
            await tx.policy.create({
                data: {
                    assetId,
                    policyNumber: data.policyNumber,
                    insurer: data.insurer,
                    startDate: new Date(data.validFrom),
                    endDate: new Date(data.validUntil),
                    premiumAmount: data.premium,
                    sumInsured: data.sumInsured,
                    paymentFrequency: data.paymentFrequency || 'YEARLY',
                    status: 'ACTIVE',
                    notificationOverrideDays: data.notificationOverrideDays,
                    leasingRef: data.leasingRef,
                    insured: data.insured,
                    comments: data.comments,
                    files: data.files ? JSON.stringify(data.files) : null,
                }
            });
        });
        res.json({ message: 'Policy renewed' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to renew policy' });
    }
};
exports.renewPolicy = renewPolicy;
const getPolicyHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const policies = await prisma.policy.findMany({
            where: { assetId: Number(id) },
            orderBy: { endDate: 'desc' },
        });
        const history = policies.map((p) => ({
            ...p,
            premiumAmount: Number(p.premiumAmount),
            sumInsured: p.sumInsured ? Number(p.sumInsured) : null,
            files: p.files ? JSON.parse(p.files) : [],
            computedStatus: computeStatus(p),
            progress: computeProgress(p),
        }));
        res.json(history);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
exports.getPolicyHistory = getPolicyHistory;
//# sourceMappingURL=asset.controller.js.map