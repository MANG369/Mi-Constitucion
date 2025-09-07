// Función auto-ejecutable (IIFE) para establecer el tema ANTES de que la página cargue.
(function checkInitialTheme() {
    const storedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
})();


document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const listaTitulos = document.getElementById('lista-titulos');
    const contenido = document.getElementById('contenido');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const favLink = document.getElementById('fav-link'); 

    let constitucionData = {};

    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        themeToggle.textContent = '☀️';
    }

    // 1. Cargar la Constitución
    async function cargarConstitucion() {
        try {
            // --- CORRECCIÓN CLAVE AQUÍ ---
            // Añadido './' para asegurar que busque en la carpeta actual
            const response = await fetch('./constitucion.json'); 
            // --------------------------

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - No se encontró el archivo`);
            }
            constitucionData = await response.json();
            mostrarIndice();
            mostrarPreambulo();
        } catch (error) {
            console.error('Error al cargar la Constitución:', error);
            contenido.innerHTML = `<p>Error al cargar el contenido. Verifique que el archivo 'constitucion.json' exista en el repositorio y que el nombre sea correcto (todo en minúsculas). Detalle: ${error.message}</p>`;
        }
    }

    // Muestra el preámbulo
    function mostrarPreambulo() {
        clearActiveLinks();
        contenido.innerHTML = `
            <div class="bienvenida">
                <h2>Preámbulo</h2>
                <p>${constitucionData.preambulo}</p>
                <hr>
                <p>Selecciona un título del índice para comenzar a leer o utiliza el buscador.</p>
            </div>
        `;
    }

    // 2. Generar el índice de navegación
    function mostrarIndice() {
        listaTitulos.innerHTML = ''; 
        constitucionData.titulos.forEach((titulo, index) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${titulo.id}`;
            a.textContent = titulo.nombre;
            a.dataset.index = index; 

            a.onclick = (e) => {
                e.preventDefault();
                clearActiveLinks(true); 
                a.classList.add('active'); 
                mostrarContenidoTitulo(index);
                
                if (window.innerWidth <= 768) {
                    contenido.scrollIntoView({ behavior: 'smooth' });
                }
            };
            li.appendChild(a);
            listaTitulos.appendChild(li);
        });
    }

    // 3. Mostrar el contenido de un Título
    function mostrarContenidoTitulo(index) {
        const titulo = constitucionData.titulos[index];
        contenido.innerHTML = `<h2>${titulo.nombre}</h2>`;

        function renderArticulos(items) {
            if (items.articulos) {
                items.articulos.forEach(articulo => {
                    contenido.innerHTML += crearHTMLArticulo(articulo);
                });
            }
            if (items.capitulos) {
                items.capitulos.forEach(capitulo => {
                    contenido.innerHTML += `<h3>${capitulo.nombre}</h3>`;
                    renderArticulos(capitulo); 
                });
            }
             if (items.secciones) {
                items.secciones.forEach(seccion => {
                    contenido.innerHTML += `<h4>${seccion.nombre}</h4>`;
                    renderArticulos(seccion); 
                });
            }
        }
        renderArticulos(titulo);
    }

    // 4. Mostrar solo artículos favoritos
    function mostrarFavoritos() {
        clearActiveLinks();
        favLink.classList.add('active'); 
        
        const favoritos = getFavoritos();
        contenido.innerHTML = `<h2>Artículos Favoritos</h2>`;
        
        if (favoritos.length === 0) {
            contenido.innerHTML += '<p>No tienes ningún artículo guardado en favoritos. Presiona ⭐ en cualquier artículo para añadirlo.</p>';
            return;
        }

        let resultadosEncontrados = 0;
        
        constitucionData.titulos.forEach(titulo => {
            const buscarEnSeccion = (seccion) => {
                if(seccion.articulos) {
                    seccion.articulos.forEach(articulo => {
                        if (favoritos.includes(String(articulo.numero))) {
                            contenido.innerHTML += crearHTMLArticulo(articulo);
                            resultadosEncontrados++;
                        }
                    });
                }
                if(seccion.capitulos) seccion.capitulos.forEach(buscarEnSeccion);
                if(seccion.secciones) seccion.secciones.forEach(buscarEnSeccion);
            };
            buscarEnSeccion(titulo);
        });
    }


    // 5. Función auxiliar para crear el HTML de un artículo
    function crearHTMLArticulo(articulo, searchTerm = '') {
        let textoArticulo = articulo.texto;
        
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            textoArticulo = textoArticulo.replace(regex, '<span class="highlight">$1</span>');
        }

        const favoritos = getFavoritos();
        const esFavorito = favoritos.includes(String(articulo.numero));
        const favIcon = esFavorito ? '🌟' : '⭐'; 
        const favLabel = esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos';

        return `
            <div class="articulo" id="articulo-${articulo.numero}">
                <div class="articulo-header">
                    <span class="articulo-numero">Artículo ${articulo.numero}</span>
                    <div class="articulo-acciones">
                        <button class="btn-fav" title="${favLabel}" aria-label="${favLabel}" data-articulo="${articulo.numero}">${favIcon}</button>
                        <button title="Añadir nota (próximamente)" aria-label="Añadir nota">📝</button>
                    </div>
                </div>
                <p>${textoArticulo}</p>
            </div>
        `;
    }

    // 6. Implementar la búsqueda (Corregida)
    function buscar() {
        const searchTerm = searchInput.value.trim();

        if (searchTerm.length === 0) {
            mostrarPreambulo(); 
            return;
        }

        if (searchTerm.length < 3) {
            contenido.innerHTML = `<h2>Resultados para "${searchTerm}"</h2>`;
            contenido.innerHTML += '<p>Por favor, ingrese al menos 3 caracteres para buscar.</p>';
            return; 
        }
        
        const searchTermLower = searchTerm.toLowerCase();
        contenido.innerHTML = `<h2>Resultados para "${searchTerm}"</h2>`;
        let resultadosEncontrados = 0;

        clearActiveLinks(true);

        constitucionData.titulos.forEach(titulo => {
            const buscarEnSeccion = (seccion) => {
                if(seccion.articulos) {
                    seccion.articulos.forEach(articulo => {
                        if (String(articulo.numero) === searchTerm || articulo.texto.toLowerCase().includes(searchTermLower)) {
                            contenido.innerHTML += crearHTMLArticulo(articulo, searchTerm);
                            resultadosEncontrados++;
                        }
                    });
                }
                if(seccion.capitulos) seccion.capitulos.forEach(buscarEnSeccion);
                if(seccion.secciones) seccion.secciones.forEach(buscarEnSeccion);
            };
            buscarEnSeccion(titulo);
        });

        if (resultadosEncontrados === 0) {
            contenido.innerHTML += '<p>No se encontraron resultados.</p>';
        }
    }
    
    // 7. Implementar el cambio de tema (con localStorage)
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light'); 
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark'); 
        }
    }

    // --- Funciones de Ayuda (Helpers) ---

    // 8. Funciones para Favoritos (LocalStorage)
    function getFavoritos() {
        return JSON.parse(localStorage.getItem('favArticulos')) || [];
    }

    function toggleFavorito(numeroArticulo, buttonElement) {
        let favoritos = getFavoritos();
        const esFavorito = favoritos.includes(numeroArticulo);

        if (esFavorito) {
            favoritos = favoritos.filter(fav => fav !== numeroArticulo);
            buttonElement.textContent = '⭐';
            buttonElement.setAttribute('title', 'Añadir a favoritos');
            buttonElement.setAttribute('aria-label', 'Añadir a favoritos');
        } else {
            favoritos.push(numeroArticulo);
            buttonElement.textContent = '🌟'; 
            buttonElement.setAttribute('title', 'Quitar de favoritos');
            buttonElement.setAttribute('aria-label', 'Quitar de favoritos');
        }
        localStorage.setItem('favArticulos', JSON.stringify(favoritos));
    }

    // 9. Función auxiliar para limpiar enlaces activos en el índice
    function clearActiveLinks(clearAll = false) {
        document.querySelectorAll('#lista-titulos a').forEach(link => link.classList.remove('active'));
        if (clearAll) {
            favLink.classList.remove('active');
        }
    }


    // --- Event Listeners ---
    searchInput.addEventListener('input', buscar);
    themeToggle.addEventListener('click', toggleTheme);
    favLink.addEventListener('click', (e) => {
        e.preventDefault();
        mostrarFavoritos();
    });

    // Delegación de eventos para los botones de favoritos
    contenido.addEventListener('click', (e) => {
        const favButton = e.target.closest('.btn-fav'); 
        if (favButton) {
            const articuloNum = favButton.dataset.articulo;
            toggleFavorito(articuloNum, favButton);
        }
    });
    
    // Iniciar la aplicación
    cargarConstitucion();
});