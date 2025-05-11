import React from 'react';
import { motion } from 'framer-motion';
import type { AIAnalysisResult } from '@/services/aiAnalysisService';
import { Check, AlertTriangle, Brain, Sparkles } from 'lucide-react';

interface AIAnalysisResultProps {
  result: AIAnalysisResult;
}

const AIAnalysisResult: React.FC<AIAnalysisResultProps> = ({ result }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-6 mt-4 border border-emerald-100"
    >
      <div className="flex items-center mb-4">
        <div className="bg-emerald-100 p-2 rounded-full mr-3">
          <Brain className="text-emerald-600 h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Análise por IA</h3>
        <div className="ml-auto bg-emerald-100 px-3 py-1 rounded-full flex items-center">
          <Sparkles className="text-emerald-600 h-4 w-4 mr-1" />
          <span className="text-xs font-medium text-emerald-700">Assistência IA</span>
        </div>
      </div>
      
      {/* Resumo */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Resumo</h4>
        <p className="text-gray-600">{result.summary}</p>
      </div>
      
      {/* Achados principais */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Achados Principais</h4>
        <ul className="space-y-2">
          {(Array.isArray(result.keyFindings) ? result.keyFindings : 
            result.keyFindings ? [result.keyFindings] : ["Nenhum achado disponível"])
            .map((finding, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                className="flex items-start"
              >
                <Check className="text-emerald-500 h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
                <span className="text-gray-600">{finding}</span>
              </motion.li>
            ))
          }
        </ul>
      </div>
      
      {/* Recomendações */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recomendações</h4>
        <ul className="space-y-2">
          {(Array.isArray(result.recommendations) ? result.recommendations : 
            // Se não for array, converter para array
            result.recommendations ? [result.recommendations] : ["Nenhuma recomendação disponível"])
            .map((recommendation, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.3, duration: 0.4 }}
                className="flex items-start"
              >
                <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
                  <Check className="text-blue-600 h-3 w-3" />
                </div>
                <span className="text-gray-600">{recommendation}</span>
              </motion.li>
            ))
          }
        </ul>
      </div>
      
      {/* Fatores de risco */}
      {result.riskFactors && (
        Array.isArray(result.riskFactors) ? result.riskFactors.length > 0 : result.riskFactors
      ) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Fatores de Risco</h4>
          <ul className="space-y-2">
            {(Array.isArray(result.riskFactors) ? result.riskFactors : 
              result.riskFactors ? [result.riskFactors] : [])
              .map((risk, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index + 0.6, duration: 0.4 }}
                  className="flex items-start"
                >
                  <div className="bg-amber-100 p-1 rounded-full mr-2 mt-0.5">
                    <AlertTriangle className="text-amber-600 h-3 w-3" />
                  </div>
                  <span className="text-gray-600">{risk}</span>
                </motion.li>
              ))
            }
          </ul>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
        Esta análise foi gerada por IA e deve ser revisada por um profissional de saúde.
      </div>
    </motion.div>
  );
};

export default AIAnalysisResult;
