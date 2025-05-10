import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '');
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro: ${error}`);
    process.exit(1);
  }
};

// Função para redefinir senha
export const resetPassword = async (email: string, newPassword: string): Promise<void> => {
  try {
    await connectDB();
    
    // Encontrar usuário pelo email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`Usuário com email ${email} não encontrado.`);
      process.exit(1);
    }
    
    // Atualizar senha
    user.password = newPassword;
    await user.save();
    
    console.log(`Senha redefinida com sucesso para o usuário ${email}`);
    
    // Encerrar conexão
    await mongoose.disconnect();
    console.log('Conexão com MongoDB encerrada');
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    process.exit(1);
  }
};

// Se executado diretamente
if (require.main === module) {
  if (process.argv.length < 4) {
    console.log('Uso: ts-node resetAdminPassword.ts <email> <nova-senha>');
    process.exit(1);
  }
  
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  resetPassword(email, newPassword)
    .catch(err => {
      console.error('Erro:', err);
      process.exit(1);
    });
}
