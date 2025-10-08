
import React, { useState } from 'react';
import { constitutionData } from '../data/constitution';
import type { Titulo, Capitulo, Seccion } from '../types';
import { CloseIcon, SearchIcon, ChevronDownIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  onNavigate: (id: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  theme: string;
  toggleTheme: () => void;
  filterType: string;
  setFilterType: (type: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}

type NavigableItem = Titulo | Capitulo | Seccion;

const getChildren = (item: NavigableItem): NavigableItem[] | undefined => {
    if ('capitulos' in item && item.capitulos) return item.capitulos;
    if ('secciones' in item && item.secciones) return item.secciones;
    return undefined;
};

const NavItem: React.FC<{
    item: NavigableItem;
    onNavigate: (id: string) => void;
    level: number;
}> = ({ item, onNavigate, level }) => {
    const [isExpanded, setExpanded] = useState(level < 1); // Expand Títulos by default
    const children = getChildren(item);
    const hasChildren = children && children.length > 0;

    const handleClick = () => {
        onNavigate(item.id);
        if (hasChildren) {
            setExpanded(!isExpanded);
        }
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className="w-full text-left flex justify-between items-center py-2 px-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                style={{ paddingLeft: `${0.75 + level * 0.75}rem` }}
            >
                <span className={`${level === 0 ? 'font-semibold' : 'text-sm'}`}>{item.nombre}</span>
                {hasChildren && (
                    <ChevronDownIcon
                        className={`w-4 h-4 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                )}
            </button>
            {isExpanded && hasChildren && (
                <div className="mt-1 space-y-1">
                    {children.map(child => (
                        <NavItem key={child.id} item={child} onNavigate={onNavigate} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setOpen,
  onNavigate,
  onSearch,
  searchQuery,
  theme,
  toggleTheme,
  filterType,
  setFilterType,
  sortOrder,
  setSortOrder
}) => {
  const selectClasses = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  
  return (
    <nav className={`w-full md:w-80 bg-white dark:bg-gray-800 shadow-lg p-6 flex-shrink-0 transition-transform md:translate-x-0 fixed md:relative h-full z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Mi Constitución</h1>
        <button onClick={() => setOpen(false)} className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="relative mb-2">
        <input
          type="search"
          placeholder="Buscar artículo o palabra..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full p-2 pl-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label htmlFor="filterType" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Filtrar</label>
          <select id="filterType" value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClasses}>
            <option value="all">Todos</option>
            <option value="titulo">Títulos</option>
            <option value="capitulo">Capítulos</option>
            <option value="seccion">Secciones</option>
          </select>
        </div>
        <div>
        <label htmlFor="sortOrder" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ordenar</label>
          <select id="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={selectClasses}>
            <option value="relevance">Relevancia</option>
            <option value="constitutional">Orden Constitucional</option>
          </select>
        </div>
      </div>


      <button onClick={() => onNavigate(constitutionData[0].id)} className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline mb-4 text-sm">
        Volver al inicio
      </button>

      <div className="overflow-y-auto h-[calc(100vh-320px)] space-y-1">
        {constitutionData.map(titulo => (
            <NavItem key={titulo.id} item={titulo} onNavigate={onNavigate} level={0} />
        ))}
      </div>
      
      <button onClick={toggleTheme} className="mt-4 w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center">
        <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        <span className="ml-2">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
      </button>
    </nav>
  );
};
