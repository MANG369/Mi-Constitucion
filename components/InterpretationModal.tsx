
import React from 'react';

interface InterpretationModalProps {
  isOpen: boolean;
  isLoading: boolean;
  content: string;
  error: string | null;
  title: string;
  onClose: () => void;
}

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-dashed rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">Generando interpretación con IA...</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Por favor, espere un momento.</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
      <p className="font-bold">Ocurrió un error</p>
      <p className="mt-1">No se pudo generar la interpretación.</p>
      <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{message}</p>
    </div>
);

const FormattedContent: React.FC<{ content: string }> = ({ content }) => {    
    return (
        <div>
            {content.split('\n').filter(p => p.trim() !== '').map((paragraph, pIndex) => {
                const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                return (
                    <p key={pIndex} className="mb-4 text-justify leading-relaxed">
                        {parts.map((part, partIndex) =>
                            partIndex % 2 === 1 ? (
                                <strong key={partIndex}>{part}</strong>
                            ) : (
                                <React.Fragment key={partIndex}>{part}</React.Fragment>
                            )
                        )}
                    </p>
                );
            })}
        </div>
    );
};


export const InterpretationModal: React.FC<InterpretationModalProps> = ({
  isOpen,
  isLoading,
  content,
  error,
  title,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
        onClick={onClose}
    >
        <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-100"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">{title}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-3xl font-bold">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
                {isLoading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {!isLoading && !error && <FormattedContent content={content} />}
            </div>
        </div>
    </div>
  );
};
