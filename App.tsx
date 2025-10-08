
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { InterpretationModal } from './components/InterpretationModal';
import { getInterpretation } from './services/geminiService';
import { constitutionData } from './data/constitution';
import type { Articulo, Titulo, Capitulo, Seccion } from './types';

export interface SearchResult {
  articulo: Articulo;
  context: {
    titulo: Titulo;
    capitulo?: Capitulo;
    seccion?: Seccion;
  };
  score: number;
}

type ModalState = {
  isOpen: boolean;
  isLoading: boolean;
  content: string;
  error: string | null;
  title: string;
};

type NavigableItem = Titulo | Capitulo | Seccion;

type SearchableArticle = {
  articulo: Articulo;
  context: {
    titulo: Titulo;
    capitulo?: Capitulo;
    seccion?: Seccion;
  };
};

const findItemById = (id: string, items: NavigableItem[]): NavigableItem | undefined => {
    for (const item of items) {
        if (item.id === id) return item;

        let children: NavigableItem[] | undefined;
        if ('capitulos' in item && item.capitulos) {
            children = item.capitulos;
        } else if ('secciones' in item && item.secciones) {
            children = item.secciones;
        }

        if (children) {
            const found = findItemById(id, children);
            if (found) return found;
        }
    }
    return undefined;
};

const getArticleSortValue = (numero: number | string): number => {
    if (typeof numero === 'number') return numero;
    const specials: { [key: string]: number } = {
        'preámbulo': -1, 'única': 1000, 'primera': 1001, 'segunda': 1002,
        'tercera': 1003, 'cuarta': 1004, 'quinta': 1005, 'sexta': 1006,
        'séptima': 1007, 'octava': 1008, 'novena': 1009, 'décima': 1010,
        'decimoprimera': 1011, 'decimosegunda': 1012, 'decimotercera': 1013,
        'decimocuarta': 1014, 'decimoquinta': 1015, 'decimosexta': 1016,
        'decimoséptima': 1017, 'decimoctava': 1018, 'decimonovena': 1019,
        'vigésima': 1020, 'vigesimoprimera': 1021, 'vigesimosegunda': 1022
    };
    return specials[numero.toLowerCase()] || 999;
};

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [contentId, setContentId] = useState<string>(constitutionData[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const [filterType, setFilterType] = useState('all'); // all, titulo, capitulo, seccion
  const [sortOrder, setSortOrder] = useState('relevance'); // relevance, constitutional

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    isLoading: false,
    content: '',
    error: null,
    title: ''
  });

  useEffect(() => {
    const bodyClasses = document.body.classList;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      bodyClasses.remove('bg-gray-100', 'text-gray-800');
      bodyClasses.add('bg-gray-900', 'text-gray-200');
    } else {
      document.documentElement.classList.remove('dark');
      bodyClasses.remove('bg-gray-900', 'text-gray-200');
      bodyClasses.add('bg-gray-100', 'text-gray-800');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const searchableArticles = useMemo((): SearchableArticle[] => {
    const articles: SearchableArticle[] = [];
    constitutionData.forEach(titulo => {
        if (titulo.articulos) {
            titulo.articulos.forEach(articulo => articles.push({ articulo, context: { titulo } }));
        }
        if (titulo.capitulos) {
            titulo.capitulos.forEach(capitulo => {
                if (capitulo.articulos) {
                    capitulo.articulos.forEach(articulo => articles.push({ articulo, context: { titulo, capitulo } }));
                }
                if (capitulo.secciones) {
                    capitulo.secciones.forEach(seccion => {
                        seccion.articulos.forEach(articulo => articles.push({ articulo, context: { titulo, capitulo, seccion } }));
                    });
                }
            });
        }
    });
    return articles;
  }, []);

  const searchResults = useMemo((): SearchResult[] => {
      if (searchQuery.length < 3) {
          return [];
      }

      const lowerCaseQuery = searchQuery.toLowerCase();
      let results: SearchResult[] = [];

      searchableArticles.forEach(({ articulo, context }) => {
          const fullText = `artículo ${articulo.numero} ${articulo.texto}`.toLowerCase();
          if (fullText.includes(lowerCaseQuery)) {
              let score = (fullText.match(new RegExp(lowerCaseQuery, 'g')) || []).length;
              if (`artículo ${articulo.numero}`.toLowerCase().includes(lowerCaseQuery)) {
                  score += 10;
              }
              results.push({ articulo, context, score });
          }
      });

      // Filter results
      const filteredResults = results.filter(r => {
          if (filterType === 'all') return true;
          if (filterType === 'titulo') return !r.context.capitulo;
          if (filterType === 'capitulo') return !!r.context.capitulo && !r.context.seccion;
          if (filterType === 'seccion') return !!r.context.seccion;
          return false;
      });

      // Sort results
      if (sortOrder === 'relevance') {
          filteredResults.sort((a, b) => b.score - a.score);
      } else { // 'constitutional'
          filteredResults.sort((a, b) => getArticleSortValue(a.articulo.numero) - getArticleSortValue(b.articulo.numero));
      }

      return filteredResults;
  }, [searchQuery, searchableArticles, filterType, sortOrder]);


  const findArticleContext = (articleToFind: Articulo) => {
    const found = searchableArticles.find(item => item.articulo.numero === articleToFind.numero && item.articulo.texto === articleToFind.texto);
    if (found) {
        return {
            tituloNombre: found.context.titulo.nombre,
            capituloNombre: found.context.capitulo?.nombre || null,
            seccionNombre: found.context.seccion?.nombre || null
        };
    }
    return { tituloNombre: "Contexto no encontrado", capituloNombre: null, seccionNombre: null };
  };

  const handleInterpret = async (articulo: Articulo) => {
    setModalState({
      isOpen: true,
      isLoading: true,
      content: '',
      error: null,
      title: `✨ Interpretación del Artículo ${articulo.numero}`
    });

    try {
      const context = findArticleContext(articulo);
      const interpretation = await getInterpretation(articulo, context);
      setModalState(s => ({ ...s, isLoading: false, content: interpretation }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
      setModalState(s => ({ ...s, isLoading: false, error: errorMessage }));
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, isLoading: false, content: '', error: null, title: '' });
  };

  const navigateTo = (id: string) => {
    setContentId(id);
    setSearchQuery('');
    setSidebarOpen(false);
    setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, 100);
  };

  const displayedItem = findItemById(contentId, constitutionData) || constitutionData[0];
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        isOpen={isSidebarOpen}
        setOpen={setSidebarOpen}
        onNavigate={navigateTo}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        theme={theme}
        toggleTheme={toggleTheme}
        filterType={filterType}
        setFilterType={setFilterType}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <MainContent
          onSidebarOpen={() => setSidebarOpen(true)}
          item={displayedItem}
          searchQuery={searchQuery}
          searchResults={searchResults}
          onInterpret={handleInterpret}
        />
      </main>
      <InterpretationModal
        {...modalState}
        onClose={closeModal}
      />
    </div>
  );
}