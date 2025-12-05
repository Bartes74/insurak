"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const notificationScheduler_1 = require("./lib/notificationScheduler");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`👉 Routes registered: /api/assets (GET, POST, PUT, DELETE)`);
    (0, notificationScheduler_1.startNotificationScheduler)();
});
//# sourceMappingURL=index.js.map