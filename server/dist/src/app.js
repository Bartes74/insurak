"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const asset_routes_1 = __importDefault(require("./routes/asset.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_1 = require("./lib/upload");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const dashboard_controller_1 = require("./controllers/dashboard.controller");
const app = (0, express_1.default)();
// Basic rate limiting for auth + uploads
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_MAX) || 50,
    standardHeaders: true,
    legacyHeaders: false,
});
const uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.UPLOAD_RATE_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(upload_1.UPLOAD_ROOT));
// Debug Middleware
app.use((req, res, next) => {
    console.log(`📥 Incoming Request: ${req.method} ${req.url}`);
    next();
});
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/assets', asset_routes_1.default);
app.use('/api/import', uploadLimiter, import_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.get('/api/dashboard', auth_middleware_1.authenticateToken, dashboard_controller_1.getDashboard);
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// 404 Handler
app.use((req, res) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});
exports.default = app;
//# sourceMappingURL=app.js.map