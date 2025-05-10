import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Plan from '../models/Plan';
import PlanVersion, { IPlanVersion } from '../models/PlanVersion';

// Obter todas as versões de um plano
export const getPlanVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'ID do plano inválido'
      });
      return;
    }

    // Verificar se o plano existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plano não encontrado'
      });
      return;
    }

    // Verificar permissões
    const userId = req.user._id.toString();
    const userCompany = req.user.company.toString();
    const userRole = req.user.role;
    const planCreator = plan.creator.toString();
    const planCompany = plan.company.toString();

    if (userId !== planCreator && (userRole !== 'superadmin' || userCompany !== planCompany)) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para acessar as versões deste plano'
      });
      return;
    }

    // Buscar todas as versões do plano, organizadas por número de versão (decrescente)
    const versions = await PlanVersion.find({ planId })
      .sort({ versionNumber: -1 })
      .populate('creator', 'name email');

    res.status(200).json({
      status: 'success',
      results: versions.length,
      data: {
        versions
      }
    });
  } catch (error) {
    console.error('Erro ao buscar versões do plano:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ocorreu um erro ao buscar as versões do plano'
    });
  }
};

// Obter uma versão específica de um plano
export const getPlanVersionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, versionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      res.status(400).json({
        status: 'error',
        message: 'Formato de ID inválido'
      });
      return;
    }

    // Verificar se o plano existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plano não encontrado'
      });
      return;
    }

    // Verificar permissões
    const userId = req.user._id.toString();
    const userCompany = req.user.company.toString();
    const userRole = req.user.role;
    const planCreator = plan.creator.toString();
    const planCompany = plan.company.toString();

    if (userId !== planCreator && (userRole !== 'superadmin' || userCompany !== planCompany)) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para acessar as versões deste plano'
      });
      return;
    }

    // Buscar a versão específica
    const version = await PlanVersion.findById(versionId)
      .populate('creator', 'name email');

    if (!version || version.planId.toString() !== planId) {
      res.status(404).json({
        status: 'error',
        message: 'Versão do plano não encontrada'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        version
      }
    });
  } catch (error) {
    console.error('Erro ao buscar versão do plano:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ocorreu um erro ao buscar a versão do plano'
    });
  }
};

// Comparar duas versões de um plano
export const comparePlanVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const { version1Id, version2Id } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(planId) || 
        !mongoose.Types.ObjectId.isValid(version1Id) || 
        !mongoose.Types.ObjectId.isValid(version2Id)) {
      res.status(400).json({
        status: 'error',
        message: 'Formato de ID inválido'
      });
      return;
    }

    // Verificar se o plano existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plano não encontrado'
      });
      return;
    }

    // Verificar permissões
    const userId = req.user._id.toString();
    const userCompany = req.user.company.toString();
    const userRole = req.user.role;
    const planCreator = plan.creator.toString();
    const planCompany = plan.company.toString();

    if (userId !== planCreator && (userRole !== 'superadmin' || userCompany !== planCompany)) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para comparar versões deste plano'
      });
      return;
    }

    // Buscar as duas versões
    const version1 = await PlanVersion.findById(version1Id);
    const version2 = await PlanVersion.findById(version2Id);

    if (!version1 || version1.planId.toString() !== planId ||
        !version2 || version2.planId.toString() !== planId) {
      res.status(404).json({
        status: 'error',
        message: 'Uma ou ambas as versões do plano não foram encontradas'
      });
      return;
    }

    // Realizar a comparação
    const differences = compareObjects(version1.snapshot, version2.snapshot);

    res.status(200).json({
      status: 'success',
      data: {
        version1: {
          id: version1._id,
          number: version1.versionNumber,
          createdAt: version1.createdAt,
          changeDescription: version1.changeDescription
        },
        version2: {
          id: version2._id,
          number: version2.versionNumber,
          createdAt: version2.createdAt,
          changeDescription: version2.changeDescription
        },
        differences
      }
    });
  } catch (error) {
    console.error('Erro ao comparar versões do plano:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ocorreu um erro ao comparar as versões do plano'
    });
  }
};

// Restaurar uma versão anterior
export const restorePlanVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, versionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      res.status(400).json({
        status: 'error',
        message: 'Formato de ID inválido'
      });
      return;
    }

    // Verificar se o plano existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plano não encontrado'
      });
      return;
    }

    // Verificar permissões
    const userId = req.user._id.toString();
    const userCompany = req.user.company.toString();
    const userRole = req.user.role;
    const planCreator = plan.creator.toString();
    const planCompany = plan.company.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'Apenas o criador do plano pode restaurar versões anteriores'
      });
      return;
    }

    // Buscar a versão específica
    const version = await PlanVersion.findById(versionId);

    if (!version || version.planId.toString() !== planId) {
      res.status(404).json({
        status: 'error',
        message: 'Versão do plano não encontrada'
      });
      return;
    }

    // Primeiro, criar uma nova versão do estado atual
    const latestVersion = await PlanVersion.findOne({ planId })
      .sort({ versionNumber: -1 });
    
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    
    // Criar um snapshot do estado atual antes de restaurar
    const currentSnapshot = { ...plan.toObject() };
    // Usar object rest para criar um novo objeto sem as propriedades indesejadas
    const { _id, __v, updatedAt, ...cleanSnapshot } = currentSnapshot;

    // Salvar o estado atual como uma nova versão
    await PlanVersion.create({
      planId,
      versionNumber: newVersionNumber,
      creator: userId,
      company: userCompany,
      snapshot: currentSnapshot,
      changeDescription: `Estado antes de restaurar para a versão ${version.versionNumber}`,
      changedSections: ['*']
    });

    // Restaurar o plano para o estado da versão selecionada
    // Preservar alguns campos que não devem ser restaurados
    const originalId = plan._id;
    const originalCreatedAt = plan.createdAt;
    const originalSharedLink = plan.sharedLink;
    const originalSharedLinkExpiry = plan.sharedLinkExpiry;
    const originalViewCount = plan.viewCount;

    // Aplicar o snapshot da versão anterior
    Object.keys(version.snapshot).forEach(key => {
      if (!['_id', 'createdAt', 'updatedAt', '__v', 'sharedLink', 'sharedLinkExpiry', 'viewCount'].includes(key)) {
        (plan as any)[key] = version.snapshot[key];
      }
    });

    await plan.save();

    res.status(200).json({
      status: 'success',
      message: `Plano restaurado para a versão ${version.versionNumber}`,
      data: {
        plan
      }
    });
  } catch (error) {
    console.error('Erro ao restaurar versão do plano:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ocorreu um erro ao restaurar a versão do plano'
    });
  }
};

// Função auxiliar para criar uma nova versão
export const createPlanVersion = async (
  planId: string,
  userId: string,
  companyId: string,
  snapshot: any,
  changeDescription: string,
  changedSections: string[] = []
): Promise<IPlanVersion | null> => {
  try {
    // Encontrar a versão mais recente para determinar o próximo número de versão
    const latestVersion = await PlanVersion.findOne({ planId })
      .sort({ versionNumber: -1 });
    
    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Criar a nova versão
    const newVersion = await PlanVersion.create({
      planId,
      versionNumber,
      creator: userId,
      company: companyId,
      snapshot,
      changeDescription,
      changedSections
    });

    return newVersion;
  } catch (error) {
    console.error('Erro ao criar versão do plano:', error);
    return null;
  }
};

// Função auxiliar para comparar objetos e encontrar diferenças
const compareObjects = (obj1: any, obj2: any, path: string = '') => {
  const differences: Array<{path: string, oldValue: any, newValue: any}> = [];

  // Se os tipos são diferentes, retornar toda a diferença
  if (typeof obj1 !== typeof obj2) {
    differences.push({
      path: path || 'root',
      oldValue: obj1,
      newValue: obj2
    });
    return differences;
  }

  // Se ambos são arrays, comparar cada elemento
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    // Caso especial para arrays de diferentes tamanhos
    if (obj1.length !== obj2.length) {
      differences.push({
        path: path || 'root',
        oldValue: `Array com ${obj1.length} elementos`,
        newValue: `Array com ${obj2.length} elementos`
      });
    }

    // Comparar elementos comuns
    const minLength = Math.min(obj1.length, obj2.length);
    for (let i = 0; i < minLength; i++) {
      const nestedPath = path ? `${path}[${i}]` : `[${i}]`;
      const nestedDifferences = compareObjects(obj1[i], obj2[i], nestedPath);
      differences.push(...nestedDifferences);
    }

    return differences;
  }

  // Se ambos são objetos (e não arrays), comparar cada propriedade
  if (typeof obj1 === 'object' && typeof obj2 === 'object' && 
      obj1 !== null && obj2 !== null &&
      !Array.isArray(obj1) && !Array.isArray(obj2)) {
    
    // Obter todas as chaves de ambos os objetos
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    for (const key of allKeys) {
      const nestedPath = path ? `${path}.${key}` : key;
      
      // Verificar se a chave existe em ambos os objetos
      if (!(key in obj1)) {
        differences.push({
          path: nestedPath,
          oldValue: undefined,
          newValue: obj2[key]
        });
      } else if (!(key in obj2)) {
        differences.push({
          path: nestedPath,
          oldValue: obj1[key],
          newValue: undefined
        });
      } else {
        // A chave existe em ambos, comparar recursivamente
        const nestedDifferences = compareObjects(obj1[key], obj2[key], nestedPath);
        differences.push(...nestedDifferences);
      }
    }
    
    return differences;
  }

  // Para valores primitivos, simplesmente comparar
  if (obj1 !== obj2) {
    differences.push({
      path: path || 'root',
      oldValue: obj1,
      newValue: obj2
    });
  }

  return differences;
};
