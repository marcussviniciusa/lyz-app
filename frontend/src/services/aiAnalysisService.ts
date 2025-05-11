import axios from 'axios';
import { OpenAI } from 'openai';

// Inicializar OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

// Interface para o tipo de dados de análise
export interface ExamAnalysisData {
  findings?: string;
  recommendations?: string;
  fileNames?: string[];
  patientInfo?: {
    fullName?: string;
    age?: number | string;
    gender?: string;
  };
}

// Interface para o resultado da análise
export interface AIAnalysisResult {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskFactors?: string[];
}

/**
 * Gera um resumo dos resultados de exames usando IA
 */
const generateExamAnalysis = async (
  data: ExamAnalysisData, 
  updateProgress: (progress: number) => void
): Promise<AIAnalysisResult> => {
  try {
    // Simular progresso inicial
    updateProgress(10);
    
    // Construir o prompt para a IA
    let prompt = "Faça uma análise médica profissional com base nas seguintes informações:\n\n";
    
    if (data.patientInfo) {
      prompt += `Paciente: ${data.patientInfo.fullName || 'Não informado'}\n`;
      prompt += `Idade: ${data.patientInfo.age || 'Não informada'}\n`;
      prompt += `Gênero: ${data.patientInfo.gender || 'Não informado'}\n\n`;
    }
    
    // Adicionar informações dos achados
    if (data.findings) {
      prompt += `Achados nos exames: ${data.findings}\n\n`;
    }
    
    // Adicionar informações das recomendações (se disponíveis)
    if (data.recommendations) {
      prompt += `Recomendações prévias: ${data.recommendations}\n\n`;
    }
    
    // Mencionar os arquivos de exames (se houverem)
    if (data.fileNames && data.fileNames.length > 0) {
      prompt += `Arquivos de exames anexados: ${data.fileNames.join(', ')}\n\n`;
    }

    prompt += `Por favor, forneça uma análise completa incluindo:
1. Um breve resumo dos achados principais
2. Lista de pontos-chave identificados
3. Recomendações específicas baseadas nos resultados
4. Possíveis fatores de risco identificados (se houver)

Forneça a resposta em formato JSON com as chaves: "summary", "keyFindings", "recommendations" e "riskFactors".`;

    updateProgress(30);
    
    // Simular um atraso para a análise
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateProgress(50);
    
    // Chamada para a API da OpenAI
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' }
    });
    
    updateProgress(80);
    
    // Extrair o resultado
    const responseContent = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseContent) as AIAnalysisResult;
    
    updateProgress(100);
    
    return result;
  } catch (error) {
    console.error('Erro ao gerar análise do exame:', error);
    
    // Retornar um resultado padrão em caso de erro
    return {
      summary: 'Não foi possível gerar um resumo devido a um erro na análise.',
      keyFindings: ['Erro na análise de IA'],
      recommendations: ['Consulte um profissional de saúde para uma análise detalhada.']
    };
  }
};

/**
 * Versão mock para desenvolvimento/testes sem consumir a API da OpenAI
 */
const generateExamAnalysisMock = async (
  data: ExamAnalysisData,
  updateProgress: (progress: number) => void
): Promise<AIAnalysisResult> => {
  // Simular progresso e atrasos
  updateProgress(10);
  await new Promise(resolve => setTimeout(resolve, 1000));
  updateProgress(25);
  await new Promise(resolve => setTimeout(resolve, 1000));
  updateProgress(45);
  await new Promise(resolve => setTimeout(resolve, 1000));
  updateProgress(70);
  await new Promise(resolve => setTimeout(resolve, 1000));
  updateProgress(90);
  await new Promise(resolve => setTimeout(resolve, 500));
  updateProgress(100);
  
  // Retornar um resultado fictício
  return {
    summary: `Análise dos exames do paciente ${data.patientInfo?.fullName || 'não identificado'} demonstra alguns achados que merecem atenção. ${data.findings ? 'Os principais achados incluem ' + data.findings.substring(0, 100) + '...' : 'Não foram fornecidos detalhes específicos sobre os achados.'}`,
    keyFindings: [
      'Níveis ligeiramente elevados nos marcadores inflamatórios',
      'Resultados dentro da normalidade para função hepática e renal',
      'Hemograma completo sem alterações significativas'
    ],
    recommendations: [
      'Manter acompanhamento médico regular',
      'Avaliar alimentação e estilo de vida',
      'Considerar exames complementares específicos para melhor diagnóstico'
    ],
    riskFactors: [
      'Histórico familiar de condições semelhantes',
      'Estilo de vida sedentário'
    ]
  };
};

// Verificar se temos uma chave de API válida e não vazia
const hasValidApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY && 
  process.env.NEXT_PUBLIC_OPENAI_API_KEY.length > 10;

// Para evitar erros com API key inválida, use a versão mock em ambientes de desenvolvimento
// ou quando não houver chave configurada corretamente
export default hasValidApiKey && process.env.NODE_ENV === 'production'
  ? generateExamAnalysis 
  : generateExamAnalysisMock;

// Exportamos ambas as versões para permitir acesso direto quando necessário
export { generateExamAnalysis, generateExamAnalysisMock };
