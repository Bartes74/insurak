import { Request, Response } from 'express';
import { PrismaClient, Policy } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { createAssetSchema, updateAssetSchema, renewPolicySchema } from '../schemas/asset.schema';

const prisma = new PrismaClient();

// Helpers
const computeStatus = (policy: Policy) => {
    const today = new Date();
    if (policy.status === 'ARCHIVED' || policy.status === 'RENEWAL_IN_PROGRESS') return policy.status;

    const diffTime = policy.endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'EXPIRING';
    return 'ACTIVE';
};

const computeProgress = (policy: Policy) => {
    const total = policy.endDate.getTime() - policy.startDate.getTime();
    const passed = Date.now() - policy.startDate.getTime();
    if (total <= 0) return 0;
    const pct = Math.min(100, Math.max(0, (passed / total) * 100));
    return Math.round(pct);
};

export const getAssets = async (req: Request, res: Response) => {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    try {
        const validation = createAssetSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
            return;
        }
        const data = validation.data;

        // Transaction to create Asset AND its first Policy
        const newAsset = await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.create({
                data: {
                    name: data.name,
                    type: data.type,
                    identifier: data.identifier,
                    responsiblePerson: data.responsiblePerson ?? null,
                    notes: data.notes ?? null
                }
            });

            // If policy data is provided
            if (data.policyNumber) {
                await tx.policy.create({
                    data: {
                        assetId: asset.id,
                        policyNumber: data.policyNumber,
                        insurer: data.insurer || '',
                        startDate: new Date(data.validFrom || new Date()),
                        endDate: new Date(data.validUntil || new Date()),
                        premiumAmount: data.premium || 0,
                        sumInsured: data.sumInsured ?? null,
                        paymentFrequency: data.paymentFrequency || 'YEARLY',
                        status: 'ACTIVE',
                        notificationOverrideDays: data.notificationOverrideDays ?? null,
                        leasingRef: data.leasingRef ?? null,
                        insured: data.insured ?? null,
                        comments: data.comments ?? null,
                        files: data.files ? JSON.stringify(data.files) : null,
                    }
                });
            }
            return asset;
        });

        res.status(201).json(newAsset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create asset' });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = updateAssetSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
        return;
    }
    const data = validation.data;

    try {
        // 1. Update Asset details with explict undefined creation
        const assetUpdate: any = {};
        if (data.name !== undefined) assetUpdate.name = data.name;
        if (data.type !== undefined) assetUpdate.type = data.type;
        if (data.identifier !== undefined) assetUpdate.identifier = data.identifier;
        if (data.responsiblePerson !== undefined) assetUpdate.responsiblePerson = data.responsiblePerson;
        if (data.notes !== undefined) assetUpdate.notes = data.notes;

        if (Object.keys(assetUpdate).length > 0) {
            await prisma.asset.update({
                where: { id: Number(id) },
                data: assetUpdate
            });
        }

        // 2. Update LATEST Policy
        const policies = await prisma.policy.findMany({
            where: { assetId: Number(id) },
            orderBy: { endDate: 'desc' },
            take: 1
        });

        if (policies.length > 0 && policies[0]) {
            const policyId = policies[0].id;

            const policyUpdate: any = {};
            if (data.policyNumber !== undefined) policyUpdate.policyNumber = data.policyNumber;
            if (data.insurer !== undefined) policyUpdate.insurer = data.insurer;
            if (data.premium !== undefined) policyUpdate.premiumAmount = data.premium;
            if (data.sumInsured !== undefined) policyUpdate.sumInsured = data.sumInsured;
            if (data.paymentFrequency !== undefined) policyUpdate.paymentFrequency = data.paymentFrequency;
            if (data.leasingRef !== undefined) policyUpdate.leasingRef = data.leasingRef;
            if (data.insured !== undefined) policyUpdate.insured = data.insured;
            if (data.comments !== undefined) policyUpdate.comments = data.comments;
            if (data.notificationOverrideDays !== undefined) policyUpdate.notificationOverrideDays = data.notificationOverrideDays;
            if (data.files !== undefined) policyUpdate.files = JSON.stringify(data.files);

            if (data.validFrom) policyUpdate.startDate = new Date(data.validFrom);
            if (data.validUntil) policyUpdate.endDate = new Date(data.validUntil);

            if (Object.keys(policyUpdate).length > 0) {
                await prisma.policy.update({
                    where: { id: policyId },
                    data: policyUpdate
                });
            }
        }

        res.json({ message: 'Asset updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update asset' });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.asset.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Asset deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};

export const uploadPolicyFiles = async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = (req as any).files as Express.Multer.File[];

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

        const existing = latest.files ? JSON.parse(latest.files) as any[] : [];
        const uploaded = files.map((f) => ({
            filename: f.filename,
            originalName: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            path: path.relative(process.cwd(), f.path),
            uploadedAt: new Date().toISOString(),
        }));

        const updatedFiles = [...existing, ...uploaded];

        await prisma.policy.update({
            where: { id: latest.id },
            data: { files: JSON.stringify(updatedFiles) },
        });

        res.status(200).json({ files: updatedFiles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
};

export const listPolicyFiles = async (req: Request, res: Response) => {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to list files' });
    }
};

export const downloadPolicyFile = async (req: Request, res: Response) => {
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
        const files = latest.files ? JSON.parse(latest.files) as any[] : [];
        const file = files.find((f: any) => f.filename === filename);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const absolutePath = path.join(process.cwd(), file.path);
        if (!fs.existsSync(absolutePath)) {
            res.status(404).json({ error: 'File missing on disk' });
            return;
        }

        res.download(absolutePath, file.originalName);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download file' });
    }
};

export const renewPolicy = async (req: Request, res: Response) => {
    const { id } = req.params;

    const validation = renewPolicySchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
        return;
    }
    const data = validation.data;

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
                    sumInsured: data.sumInsured ?? null,
                    paymentFrequency: data.paymentFrequency || 'YEARLY',
                    status: 'ACTIVE',
                    notificationOverrideDays: data.notificationOverrideDays ?? null,
                    leasingRef: data.leasingRef ?? null,
                    insured: data.insured ?? null,
                    comments: data.comments ?? null,
                    files: data.files ? JSON.stringify(data.files) : null,
                }
            });
        });

        res.json({ message: 'Policy renewed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to renew policy' });
    }
};

export const getPolicyHistory = async (req: Request, res: Response) => {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
