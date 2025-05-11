import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AIAnalysisAnimationProps = {
  isAnalyzing: boolean;
  progress: number;
  message?: string;
};

const AIAnalysisAnimation: React.FC<AIAnalysisAnimationProps> = ({ 
  isAnalyzing, 
  progress, 
  message = 'Processando análise de exames com IA...'
}) => {
  // Palavras para animação de texto
  const words = [
    'Extraindo dados...',
    'Analisando padrões...',
    'Correlacionando resultados...',
    'Verificando indicadores...',
    'Comparando com base de conhecimento...',
    'Verificando valores de referência...',
    'Gerando insights...',
    'Preparando resumo...'
  ];

  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Atualiza a palavra a cada 2.5 segundos
  React.useEffect(() => {
    if (!isAnalyzing) return;
    
    const interval = setInterval(() => {
      setCurrentWordIndex(prevIndex => 
        prevIndex === words.length - 1 ? 0 : prevIndex + 1
      );
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isAnalyzing, words.length]);

  if (!isAnalyzing) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative overflow-hidden">
        {/* Gradiente decorativo no topo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500"></div>
        
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{message}</h3>
          <p className="text-gray-500 text-sm">Isso pode levar alguns instantes</p>
        </div>
        
        {/* Círculo animado */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            {/* Círculo de fundo */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            
            {/* Círculo de progresso */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <motion.circle
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                cx="50"
                cy="50"
                r="48"
                fill="transparent"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                style={{
                  rotate: "-90deg",
                  transformOrigin: "center",
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Percentual no centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
        
        {/* Animação de texto */}
        <div className="text-center h-8 mb-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentWordIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-emerald-600 font-medium"
            >
              {words[currentWordIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        
        {/* Partículas pulsantes */}
        <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-blue-500"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <div className="text-center text-xs text-gray-400">
          Os resultados serão processados com precisão
        </div>
      </div>
    </motion.div>
  );
};

export default AIAnalysisAnimation;
