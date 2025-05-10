"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importStar(require("../models/User"));
const Company_1 = __importDefault(require("../models/Company"));
// Carregar variáveis de ambiente
dotenv_1.default.config();
// Conectar ao MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI || '');
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`Erro: ${error}`);
        process.exit(1);
    }
};
// Função principal
const createAdminUser = async () => {
    try {
        await connectDB();
        // Verificar se já existe uma empresa administradora
        let adminCompany = await Company_1.default.findOne({ name: 'Lyz Administração' });
        // Criar empresa se não existir
        if (!adminCompany) {
            console.log('Criando empresa administrativa...');
            adminCompany = await Company_1.default.create({
                name: 'Lyz Administração',
                usageLimit: 10000,
                isActive: true
            });
            console.log(`Empresa criada com ID: ${adminCompany._id}`);
        }
        else {
            console.log(`Empresa administrativa já existe com ID: ${adminCompany._id}`);
        }
        // Verificar se já existe um superadmin
        const existingAdmin = await User_1.default.findOne({ role: User_1.UserRole.SUPERADMIN });
        if (existingAdmin) {
            console.log(`Administrador já existe: ${existingAdmin.email}`);
            // Perguntar se deseja criar outro admin
            console.log('Se desejar redefinir a senha do admin, execute:');
            console.log(`node -e "require('./dist/scripts/resetAdminPassword').resetPassword('${existingAdmin.email}', 'nova-senha')"`);
        }
        else {
            // Criar usuário superadmin
            const adminUser = await User_1.default.create({
                name: 'Administrador',
                email: 'admin@lyz.ai',
                password: 'admin123', // Será hashing automaticamente pelo middleware
                role: User_1.UserRole.SUPERADMIN,
                company: adminCompany._id,
                isActive: true
            });
            console.log(`Administrador criado com sucesso!`);
            console.log(`Email: ${adminUser.email}`);
            console.log(`Senha: admin123`);
            console.log('⚠️ IMPORTANTE: Altere esta senha após o primeiro login!');
        }
        // Encerrar conexão
        await mongoose_1.default.disconnect();
        console.log('Conexão com MongoDB encerrada');
    }
    catch (error) {
        console.error('Erro ao criar administrador:', error);
        process.exit(1);
    }
};
// Executar a função
createAdminUser();
