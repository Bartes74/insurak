"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_ROOT = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads');
exports.UPLOAD_ROOT = UPLOAD_ROOT;
// Ensure uploads directory exists at startup.
if (!fs_1.default.existsSync(UPLOAD_ROOT)) {
    fs_1.default.mkdirSync(UPLOAD_ROOT, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        const assetId = req.params.id || 'general';
        const dir = path_1.default.join(UPLOAD_ROOT, assetId.toString());
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
        cb(null, `${timestamp}-${safeName}`);
    }
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }
        cb(null, true);
    }
});
//# sourceMappingURL=upload.js.map