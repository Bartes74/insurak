"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecipient = exports.addRecipient = exports.listRecipients = exports.updateNotificationSettings = exports.getNotificationSettings = exports.deleteUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const listUsers = async (_req, res) => {
    const users = await prisma_1.default.user.findMany({
        select: { id: true, email: true, role: true, canEdit: true, createdAt: true },
        orderBy: { id: 'asc' },
    });
    res.json(users);
};
exports.listUsers = listUsers;
const createUser = async (req, res) => {
    const { email, password, role = 'USER', canEdit = false } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ error: 'User already exists' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: { email, passwordHash, role, canEdit },
        select: { id: true, email: true, role: true, canEdit: true, createdAt: true },
    });
    res.status(201).json(user);
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, password, role, canEdit } = req.body;
    const data = {};
    if (email)
        data.email = email;
    if (typeof canEdit === 'boolean')
        data.canEdit = canEdit;
    if (role)
        data.role = role;
    if (password)
        data.passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.default.user.update({
        where: { id: Number(id) },
        data,
        select: { id: true, email: true, role: true, canEdit: true, createdAt: true },
    });
    res.json(user);
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    const { id } = req.params;
    await prisma_1.default.user.delete({ where: { id: Number(id) } });
    res.status(204).send();
};
exports.deleteUser = deleteUser;
const getNotificationSettings = async (_req, res) => {
    const settings = await prisma_1.default.notificationSetting.findFirst();
    res.json(settings || { defaultLeadDays: 30, followUpLeadDays: 10, deadlineLeadDays: 0 });
};
exports.getNotificationSettings = getNotificationSettings;
const updateNotificationSettings = async (req, res) => {
    const { defaultLeadDays = 30, followUpLeadDays = 10, deadlineLeadDays = 0 } = req.body;
    const existing = await prisma_1.default.notificationSetting.findFirst();
    const data = { defaultLeadDays, followUpLeadDays, deadlineLeadDays };
    const saved = existing
        ? await prisma_1.default.notificationSetting.update({ where: { id: existing.id }, data })
        : await prisma_1.default.notificationSetting.create({ data });
    res.json(saved);
};
exports.updateNotificationSettings = updateNotificationSettings;
const listRecipients = async (_req, res) => {
    const recipients = await prisma_1.default.notificationRecipient.findMany({
        where: { assetId: null },
        orderBy: { id: 'asc' },
    });
    res.json(recipients);
};
exports.listRecipients = listRecipients;
const addRecipient = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: 'email is required' });
        return;
    }
    const recipient = await prisma_1.default.notificationRecipient.create({ data: { email } });
    res.status(201).json(recipient);
};
exports.addRecipient = addRecipient;
const deleteRecipient = async (req, res) => {
    const { id } = req.params;
    await prisma_1.default.notificationRecipient.delete({ where: { id: Number(id) } });
    res.status(204).send();
};
exports.deleteRecipient = deleteRecipient;
//# sourceMappingURL=admin.controller.js.map