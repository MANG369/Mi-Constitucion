
export interface Articulo {
  numero: number | string;
  texto: string;
}

export interface Seccion {
  id: string;
  nombre: string;
  articulos: Articulo[];
}

export interface Capitulo {
  id: string;
  nombre: string;
  articulos?: Articulo[];
  secciones?: Seccion[];
}

export interface Titulo {
  id: string;
  nombre: string;
  articulos?: Articulo[];
  capitulos?: Capitulo[];
}
