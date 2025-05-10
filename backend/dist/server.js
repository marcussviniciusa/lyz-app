"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const planRoutes_1 = __importDefault(require("./routes/planRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const promptRoutes_1 = __importDefault(require("./routes/promptRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
// Import configurations
const minio_1 = require("./config/minio");
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Lyz API is running' });
});
// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lyz';
        await mongoose_1.default.connect(mongoURI);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
// Register routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/companies', companyRoutes_1.default);
app.use('/api/plans', planRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/prompts', promptRoutes_1.default);
app.use('/api/files', fileRoutes_1.default);
app.use('/api/materials', materialRoutes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong on the server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start server
const startServer = async () => {
    await connectDB();
    // Initialize MinIO bucket
    await (0, minio_1.initBucket)();
    app.listen(port, () => {
        console.log(`⚡️ Lyz API server running on port ${port}`);
    });
};
startServer().catch(console.error);
