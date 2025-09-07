// MEJORA: Función auto-ejecutable (IIFE) para establecer el tema ANTES de que la página cargue.
// Esto previene el "flash" (parpadeo) del tema incorrecto al cargar.
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
    const favLink = document.getElementById('fav-link'); // Botón de "Ver Favoritos"

    let constitucionData = {};

    // MEJORA: Actualiza el icono del botón del tema al cargar
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        themeToggle.textContent = '☀️';
    }

    // 1. Cargar la Constitución desde el archivo JSON (Sin cambios)
    async function cargarConstitucion() {
        try {
            const response = await fetch('constitucion.json');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            constitucionData = await response.json();
            mostrarIndice();
            mostrarPreambulo();
        } catch (error) {
            console.error('Error al cargar la Constitución:', error);
            contenido.innerHTML = '<p>No se pudo cargar el contenido. Por favor, intente de nuevo más tarde o verifique la conexión.</p>';
        }
    }

    // Muestra el preámbulo (Llamado al inicio y al limpiar búsqueda)
    function mostrarPreambulo() {
        // MEJORA: Deselecciona cualquier ítem activo en el índice
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
            a.dataset.index = index; // Identificador para el clic

            a.onclick = (e) => {
                e.preventDefault();
                
                // MEJORA: Lógica para marcar el enlace activo
                clearActiveLinks(true); // Limpia todos los enlaces (incluyendo favoritos)
                a.classList.add('active'); // Añade clase activa al clicado

                mostrarContenidoTitulo(index);
                
                if (window.innerWidth <= 768) {
                    contenido.scrollIntoView({ behavior: 'smooth' });
                }
            };
            li.appendChild(a);
            listaTitulos.appendChild(li);
        });
    }

    // 3. Mostrar el contenido de un Título (Sin cambios en la lógica base)
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
                    renderArticulos(capitulo); // Llamada recursiva
                });
            }
             if (items.secciones) {
                items.secciones.forEach(seccion => {
                    contenido.innerHTML += `<h4>${seccion.nombre}</h4>`;
                    renderArticulos(seccion); // Llamada recursiva
                });
            }
        }
        renderArticulos(titulo);
    }

    // MEJORA (FUNCIONALIDAD): Mostrar solo artículos favoritos
    function mostrarFavoritos() {
        clearActiveLinks();
        favLink.classList.add('active'); // Marca el enlace de favoritos como activo
        
        const favoritos = getFavoritos();
        contenido.innerHTML = `<h2>Artículos Favoritos</h2>`;
        
        if (favoritos.length === 0) {
            contenido.innerHTML += '<p>No tienes ningún artículo guardado en favoritos. Presiona ⭐ en cualquier artículo para añadirlo.</p>';
            return;
        }

        let resultadosEncontrados = 0;
        
        // Debemos buscar en toda la estructura JSON los artículos que coincidan
        constitucionData.titulos.forEach(titulo => {
            const buscarEnSeccion = (seccion) => {
                if(seccion.articulos) {
                    seccion.articulos.forEach(articulo => {
                        // Comprueba si el NÚMERO del artículo está en nuestro array de favoritos
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


    // Función auxiliar para crear el HTML de un artículo
    // MODIFICADA para incluir la lógica de Favoritos y Búsqueda
    function crearHTMLArticulo(articulo, searchTerm = '') {
        let textoArticulo = articulo.texto;
        
        // Resaltado de búsqueda
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            textoArticulo = textoArticulo.replace(regex, '<span class="highlight">$1</span>');
        }

        // MEJORA: Lógica para estado de favoritos
        const favoritos = getFavoritos();
        const esFavorito = favoritos.includes(String(articulo.numero));
        const favIcon = esFavorito ? '🌟' : '⭐'; // Estrella sólida si es favorito
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

    // 4. Implementar la búsqueda (Lógica CORREGIDA)
    function buscar() {
        const searchTerm = searchInput.value.trim();

        // CORRECCIÓN: Manejo de estados de búsqueda
        if (searchTerm.length === 0) {
            mostrarPreambulo(); // Si está vacío, muestra el preámbulo
            return;
        }

        if (searchTerm.length < 3) {
            contenido.innerHTML = `<h2>Resultados para "${searchTerm}"</h2>`;
            contenido.innerHTML += '<p>Por favor, ingrese al menos 3 caracteres para buscar.</p>';
            return; // Si es muy corto, pide más texto
        }
        
        const searchTermLower = searchTerm.toLowerCase();
        contenido.innerHTML = `<h2>Resultados para "${searchTerm}"</h2>`;
        let resultadosEncontrados = 0;

        // Limpia el índice activo, ya que esto es una búsqueda, no un título
        clearActiveLinks(true);

        constitucionData.titulos.forEach(titulo => {
            const buscarEnSeccion = (seccion) => {
                if(seccion.articulos) {
                    seccion.articulos.forEach(articulo => {
                        if (String(articulo.numero) === searchTerm || articulo.texto.toLowerCase().includes(searchTermLower)) {
                            // Pasa el término de búsqueda para resaltarlo
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
    
    // 5. Implementar el cambio de tema (MODIFICADO con localStorage)
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light'); // Guarda la preferencia
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark'); // Guarda la preferencia
        }
    }

    // --- NUEVAS FUNCIONES DE AYUDA (Helpers) ---

    // 6. Funciones para Favoritos (LocalStorage)
    function getFavoritos() {
        // Obtiene el array de favoritos desde localStorage, o devuelve un array vacío
        return JSON.parse(localStorage.getItem('favArticulos')) || [];
    }

    function toggleFavorito(numeroArticulo, buttonElement) {
        let favoritos = getFavoritos();
        const esFavorito = favoritos.includes(numeroArticulo);

        if (esFavorito) {
            // Ya es favorito -> Quitar
            favoritos = favoritos.filter(fav => fav !== numeroArticulo);
            buttonElement.textContent = '⭐';
            buttonElement.setAttribute('title', 'Añadir a favoritos');
            buttonElement.setAttribute('aria-label', 'Añadir a favoritos');
        } else {
            // No es favorito -> Añadir
            favoritos.push(numeroArticulo);
            buttonElement.textContent = '🌟'; // Icono de favorito activo
            buttonElement.setAttribute('title', 'Quitar de favoritos');
            buttonElement.setAttribute('aria-label', 'Quitar de favoritos');
        }
        // Guardar el array actualizado en localStorage
        localStorage.setItem('favArticulos', JSON.stringify(favoritos));
    }

    // 7. Función auxiliar para limpiar enlaces activos en el índice
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

    // Delegación de eventos para los botones de favoritos (ya que se crean dinámicamente)
    contenido.addEventListener('click', (e) => {
        const favButton = e.target.closest('.btn-fav'); // Busca el botón de favorito más cercano al clic
        if (favButton) {
            const articuloNum = favButton.dataset.articulo;
            toggleFavorito(articuloNum, favButton);
        }
    });
    
    // Iniciar la aplicación
    cargarConstitucion();
});