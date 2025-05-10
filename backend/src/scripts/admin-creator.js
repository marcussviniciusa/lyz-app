const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Conectar ao MongoDB
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erro de conexão: ${error.message}`);
    process.exit(1);
  }
}

// Definir esquemas
const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    usageLimit: {
      type: Number,
      default: 1000
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ['superadmin', 'user'],
      default: 'user'
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  { timestamps: true }
);

// Criar modelos
const Company = mongoose.model('Company', CompanySchema);
const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  const connection = await connectDB();
  
  try {
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
    const existingAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingAdmin) {
      console.log(`Administrador já existe: ${existingAdmin.email}`);
    } else {
      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Criar usuário superadmin
      const adminUser = await User.create({
        name: 'Administrador',
        email: 'admin@lyz.ai',
        password: hashedPassword,
        role: 'superadmin',
        company: adminCompany._id,
        isActive: true
      });
      
      console.log(`Administrador criado com sucesso!`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Senha: admin123`);
      console.log('⚠️ IMPORTANTE: Altere esta senha após o primeiro login!');
    }
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
  } finally {
    // Encerrar conexão
    await mongoose.disconnect();
    console.log('Conexão com MongoDB encerrada');
  }
}

// Executar a função
createAdminUser();
