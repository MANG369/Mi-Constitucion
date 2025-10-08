import React, { useState } from 'react';
import { MenuIcon, SparklesIcon, CopyIcon } from './icons';
import type { Articulo, Titulo, Capitulo, Seccion } from '../types';
import type { SearchResult } from '../App';

interface MainContentProps {
  onSidebarOpen: () => void;
  item: Titulo | Capitulo | Seccion;
  searchQuery: string;
  searchResults: SearchResult[];
  onInterpret: (articulo: Articulo) => void;
}

const Highlighted: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!query) {
      return <>{text}</>;
    }
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escapedQuery.trim() === '') {
        return <>{text}</>;
    }
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
  
    return (
      <>
        {parts.map((part, i) => 
          i % 2 === 1 ? (
            <mark key={i} className="bg-yellow-300 dark:bg-yellow-400 text-gray-900 px-1 rounded">
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </>
    );
};

const ArticleCard: React.FC<{
  articulo: Articulo;
  onInterpret: (articulo: Articulo) => void;
}> = ({ articulo, onInterpret }) => {
  const [copyStatus, setCopyStatus] = useState('Copiar Texto');

  const handleCopy = () => {
    const textToCopy = `Artículo ${articulo.numero}: ${articulo.texto}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyStatus('✅ Copiado!');
      setTimeout(() => setCopyStatus('Copiar Texto'), 2000);
    }).catch(() => {
      setCopyStatus('Error al copiar');
    });
  };

  return (
    <div className="mb-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <h4 className="font-bold text-xl text-blue-600 dark:text-blue-400">
        Artículo {articulo.numero}
      </h4>
      <p className="text-base md:text-lg text-justify leading-relaxed md:leading-loose mt-2">{articulo.texto}</p>
      <div className="mt-3 flex items-center space-x-2">
        <button
          onClick={() => onInterpret(articulo)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Interpretar Artículo
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <CopyIcon className="w-5 h-5 mr-2" />
          {copyStatus}
        </button>
      </div>
    </div>
  );
};

const ContentRenderer: React.FC<{
    item: Titulo | Capitulo | Seccion;
    onInterpret: (articulo: Articulo) => void;
    level: number;
}> = ({ item, onInterpret, level }) => {
    const HeaderTag = `h${Math.min(level + 2, 6)}` as React.ElementType;
    
    const headerClasses = [
        "text-3xl md:text-4xl font-bold mb-2 text-blue-700 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-800 pb-2", // level 0 (h2)
        "text-2xl md:text-3xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600 pb-2", // level 1 (h3)
        "text-xl md:text-2xl font-semibold mt-6 mb-3 text-gray-700 dark:text-gray-300", // level 2 (h4)
        "text-lg md:text-xl font-semibold mt-4 mb-2 text-gray-600 dark:text-gray-400" // level 3+ (h5)
    ];
    const headerClass = headerClasses[Math.min(level, headerClasses.length - 1)];

    const children: (Capitulo | Seccion)[] = ('capitulos' in item && item.capitulos) || ('secciones' in item && item.secciones) || [];

    return (
        <div id={item.id} className={level > 0 ? "pt-4" : ""}>
            <HeaderTag className={headerClass}>
                {item.nombre}
            </HeaderTag>

            {'articulos' in item && item.articulos?.map(articulo => (
                <ArticleCard key={articulo.numero.toString()} articulo={articulo} onInterpret={onInterpret} />
            ))}
            
            <div className="ml-0 md:ml-4">
                {children.map(child => (
                    <ContentRenderer key={child.id} item={child} onInterpret={onInterpret} level={level + 1} />
                ))}
            </div>
        </div>
    );
};

const SearchResultItem: React.FC<{
  result: SearchResult;
  query: string;
  onInterpret: (articulo: Articulo) => void;
}> = ({ result, query, onInterpret }) => {
  const { articulo, context } = result;
  const contextPath = [
    context.titulo.nombre,
    context.capitulo?.nombre,
    context.seccion?.nombre,
  ].filter(Boolean).join(' › ');

  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{contextPath}</p>
      <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">
        <Highlighted text={`Artículo ${articulo.numero}`} query={query} />
      </h4>
      <p className="text-justify leading-relaxed mt-1">
        <Highlighted text={articulo.texto} query={query} />
      </p>
      <div className="mt-3">
        <button
          onClick={() => onInterpret(articulo)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Interpretar Artículo
        </button>
      </div>
    </div>
  );
};


export const MainContent: React.FC<MainContentProps> = ({
  onSidebarOpen,
  item,
  searchQuery,
  searchResults,
  onInterpret
}) => {
  const isSearching = searchQuery.length >= 3;

  return (
    <>
      <header className="flex justify-between items-center mb-6">
        <button onClick={onSidebarOpen} className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10">
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="text-right md:text-left w-full">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Constitución de la República Bolivariana de Venezuela</h2>
          <p className="text-md text-gray-600 dark:text-gray-400">Gaceta Oficial N° 36.860 del 30 de diciembre de 1999</p>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-md min-h-[60vh]">
        {isSearching ? (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400">
              Resultados para: "{searchQuery}"
            </h2>
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <SearchResultItem
                  key={`${result.articulo.numero}-${index}`}
                  result={result}
                  query={searchQuery}
                  onInterpret={onInterpret}
                />
              ))
            ) : (
              <p>No se encontraron resultados para su búsqueda.</p>
            )}
          </div>
        ) : (
          <ContentRenderer item={item} onInterpret={onInterpret} level={0} />
        )}
      </div>

      <footer className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Mi Constitución. Una herramienta didáctica para el estudio de la Constitución de Venezuela.</p>
      </footer>
    </>
  );
};