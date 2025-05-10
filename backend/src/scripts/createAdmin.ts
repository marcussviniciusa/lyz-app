import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User, { UserRole } from '../models/User';
import Company from '../models/Company';

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

// Função principal
const createAdminUser = async (): Promise<void> => {
  try {
    await connectDB();
    
    // Verificar se já existe uma empresa administradora
    let adminCompany = await Company.findOne({ name: 'Lyz Administração' });
    
    // Criar empresa se não existir
    if (!adminCompany) {
      console.log('Criando empresa administrativa...');
      adminCompany = await Company.create({
        name: 'Lyz Administração',
        usageLimit: 10000,
        isActive: true
      });
      console.log(`Empresa criada com ID: ${adminCompany._id}`);
    } else {
      console.log(`Empresa administrativa já existe com ID: ${adminCompany._id}`);
    }
    
    // Verificar se já existe um superadmin
    const existingAdmin = await User.findOne({ role: UserRole.SUPERADMIN });
    
    if (existingAdmin) {
      console.log(`Administrador já existe: ${existingAdmin.email}`);
      
      // Perguntar se deseja criar outro admin
      console.log('Se desejar redefinir a senha do admin, execute:');
      console.log(`node -e "require('./dist/scripts/resetAdminPassword').resetPassword('${existingAdmin.email}', 'nova-senha')"`);
    } else {
      // Criar usuário superadmin
      const adminUser = await User.create({
        name: 'Administrador',
        email: 'admin@lyz.ai',
        password: 'admin123', // Será hashing automaticamente pelo middleware
        role: UserRole.SUPERADMIN,
        company: adminCompany._id,
        isActive: true
      });
      
      console.log(`Administrador criado com sucesso!`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Senha: admin123`);
      console.log('⚠️ IMPORTANTE: Altere esta senha após o primeiro login!');
    }
    
    // Encerrar conexão
    await mongoose.disconnect();
    console.log('Conexão com MongoDB encerrada');
    
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    process.exit(1);
  }
};

// Executar a função
createAdminUser();
