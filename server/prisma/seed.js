"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin@insureguard.com';
    const password = 'admin';
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma.user.upsert({
        where: { email: email },
        update: {},
        create: {
            email: email,
            password_hash: hashedPassword,
            role: 'ADMIN',
            can_edit: true,
        },
    });
    console.log({ user });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map