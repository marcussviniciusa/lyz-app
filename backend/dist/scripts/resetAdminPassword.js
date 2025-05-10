"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
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
// Função para redefinir senha
const resetPassword = async (email, newPassword) => {
    try {
        await connectDB();
        // Encontrar usuário pelo email
        const user = await User_1.default.findOne({ email });
        if (!user) {
            console.error(`Usuário com email ${email} não encontrado.`);
            process.exit(1);
        }
        // Atualizar senha
        user.password = newPassword;
        await user.save();
        console.log(`Senha redefinida com sucesso para o usuário ${email}`);
        // Encerrar conexão
        await mongoose_1.default.disconnect();
        console.log('Conexão com MongoDB encerrada');
    }
    catch (error) {
        console.error('Erro ao redefinir senha:', error);
        process.exit(1);
    }
};
exports.resetPassword = resetPassword;
// Se executado diretamente
if (require.main === module) {
    if (process.argv.length < 4) {
        console.log('Uso: ts-node resetAdminPassword.ts <email> <nova-senha>');
        process.exit(1);
    }
    const email = process.argv[2];
    const newPassword = process.argv[3];
    (0, exports.resetPassword)(email, newPassword)
        .catch(err => {
        console.error('Erro:', err);
        process.exit(1);
    });
}
