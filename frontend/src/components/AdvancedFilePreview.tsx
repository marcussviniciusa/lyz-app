import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Maximize, Minimize, FileIcon } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar o worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type AdvancedFilePreviewProps = {
  file: File | string;
  filename?: string;
  onClose?: () => void;
};

const AdvancedFilePreview: React.FC<AdvancedFilePreviewProps> = ({ file, filename, onClose }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');

  useEffect(() => {
    if (file instanceof File) {
      setFileUrl(URL.createObjectURL(file));
      setFileType(file.type);
    } else if (typeof file === 'string') {
      setFileUrl(file);
      // Tentar inferir o tipo do arquivo pela extensão
      if (file.toLowerCase().endsWith('.pdf')) {
        setFileType('application/pdf');
      } else if (file.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        setFileType('image/*');
      } else {
        setFileType('');
      }
    }

    return () => {
      if (file instanceof File) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.max(1, Math.min(numPages || 1, prevPageNumber + offset)));
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prevScale => Math.min(3, prevScale + 0.2));
  const zoomOut = () => setScale(prevScale => Math.max(0.5, prevScale - 0.2));
  
  const rotate = () => setRotation(prevRotation => (prevRotation + 90) % 360);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename || (file instanceof File ? file.name : 'download');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Memorizar as opções do PDF para evitar re-renders desnecessários
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
    cMapPacked: true,
  }), []);

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="bg-gray-100 p-3 flex justify-between items-center border-b">
        <h3 className="font-medium text-gray-800 truncate max-w-md">
          {filename || (file instanceof File ? file.name : 'Visualização de Arquivo')}
        </h3>
        <div className="flex space-x-2">
          {fileType === 'application/pdf' && (
            <>
              <button 
                onClick={previousPage} 
                disabled={pageNumber <= 1}
                className={`p-1 rounded hover:bg-gray-200 ${pageNumber <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 flex items-center">
                {pageNumber} / {numPages || '--'}
              </span>
              <button 
                onClick={nextPage} 
                disabled={numPages !== null && pageNumber >= numPages}
                className={`p-1 rounded hover:bg-gray-200 ${numPages !== null && pageNumber >= numPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Próxima página"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
          <button onClick={zoomOut} className="p-1 rounded hover:bg-gray-200" title="Diminuir zoom">
            <ZoomOut size={18} />
          </button>
          <span className="text-sm text-gray-600 flex items-center w-12 justify-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} className="p-1 rounded hover:bg-gray-200" title="Aumentar zoom">
            <ZoomIn size={18} />
          </button>
          <button onClick={rotate} className="p-1 rounded hover:bg-gray-200" title="Girar">
            <RotateCw size={18} />
          </button>
          <button onClick={downloadFile} className="p-1 rounded hover:bg-gray-200" title="Download">
            <Download size={18} />
          </button>
          <button onClick={toggleFullscreen} className="p-1 rounded hover:bg-gray-200" title="Tela cheia">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 hover:text-red-500" title="Fechar">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className={`relative overflow-auto bg-gray-50 flex items-center justify-center ${isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[500px]'}`}>
        {fileType === 'application/pdf' ? (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex justify-center"
            options={pdfOptions}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-md"
            />
          </Document>
        ) : fileType.startsWith('image/') || fileType === 'image/*' ? (
          <div 
            style={{ 
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease'
            }}
            className="max-h-full max-w-full p-4"
          >
            <img 
              src={fileUrl} 
              alt={filename || "Preview"} 
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="text-center p-10">
            <FileIcon size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Tipo de arquivo não suportado para prévia</h3>
            <p className="text-sm text-gray-500 mt-2">
              {filename || (file instanceof File ? file.name : 'Arquivo desconhecido')}
            </p>
            <button
              onClick={downloadFile}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
            >
              <Download size={16} className="mr-2" />
              Baixar arquivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilePreview;
