import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';
import userRoutes from './routes/userRoutes';
import planRoutes from './routes/planRoutes';
import aiRoutes from './routes/aiRoutes';
import promptRoutes from './routes/promptRoutes';
import fileRoutes from './routes/fileRoutes';
import materialRoutes from './routes/materialRoutes';
import fileAnalysisRoutes from './routes/fileAnalysisRoutes';

// Import configurations
import { initBucket } from './config/minio';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentar limite de payload e timeout
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar timeout do servidor
app.use((req, res, next) => {
  // Definir timeout de 120 segundos por requisição
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Lyz API is running' });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lyz';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/file-analysis', fileAnalysisRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
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
  await initBucket();
  
  const server = app.listen(port, () => {
    console.log(`⚡️ Lyz API server running on port ${port}`);
  });
  
  // Configurar timeouts do servidor
  server.timeout = 120000; // 120 segundos
  server.keepAliveTimeout = 65000; // 65 segundos
  server.headersTimeout = 66000; // 66 segundos (deve ser maior que keepAliveTimeout)
  
  // Tratamento de erro no servidor
  server.on('error', (error) => {
    console.error('Server error:', error);
  });
  
  // Manipulador para fechar o servidor graciosamente
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close().then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
};

startServer().catch(console.error);
