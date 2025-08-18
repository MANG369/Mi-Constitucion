document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const listaTitulos = document.getElementById('lista-titulos');
    const contenido = document.getElementById('contenido');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');

    let constitucionData = {};

    // 1. Cargar la Constitución desde el archivo JSON
    async function cargarConstitucion() {
        try {
            // Aseguramos que el nombre del archivo esté en minúsculas
            const response = await fetch('constitucion.json');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            constitucionData = await response.json();
            mostrarIndice();
            // Mostramos el preámbulo al inicio
            mostrarPreambulo();
        } catch (error) {
            console.error('Error al cargar la Constitución:', error);
            contenido.innerHTML = '<p>No se pudo cargar el contenido. Por favor, intente de nuevo más tarde o verifique la conexión.</p>';
        }
    }

    // Muestra el preámbulo en la pantalla de bienvenida
    function mostrarPreambulo() {
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
        listaTitulos.innerHTML = ''; // Limpiar índice existente
        constitucionData.titulos.forEach((titulo, index) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${titulo.id}`;
            a.textContent = titulo.nombre;
            a.onclick = (e) => {
                e.preventDefault();
                mostrarContenidoTitulo(index);
                // En móvil, oculta el índice o desplázate al contenido (opcional)
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

        // Función recursiva para mostrar artículos de títulos, capítulos y secciones
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

    // Función auxiliar para crear el HTML de un artículo
    function crearHTMLArticulo(articulo, searchTerm = '') {
        let textoArticulo = articulo.texto;
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            textoArticulo = textoArticulo.replace(regex, '<span class="highlight">$1</span>');
        }

        return `
            <div class="articulo" id="articulo-${articulo.numero}">
                <div class="articulo-header">
                    <span class="articulo-numero">Artículo ${articulo.numero}</span>
                    <div class="articulo-acciones">
                        <button title="Añadir a favoritos (próximamente)">⭐</button>
                        <button title="Añadir nota (próximamente)">📝</button>
                    </div>
                </div>
                <p>${textoArticulo}</p>
            </div>
        `;
    }

    // 4. Implementar la búsqueda
    function buscar() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length < 3) {
            if(searchTerm.length === 0) mostrarPreambulo();
            return;
        }
        
        const searchTermLower = searchTerm.toLowerCase();
        contenido.innerHTML = `<h2>Resultados para "${searchTerm}"</h2>`;
        let resultadosEncontrados = 0;

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
    
    // 5. Implementar el cambio de tema (Modo Oscuro/Claro)
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = ☀️';
        }
    }

    // Event Listeners
    searchInput.addEventListener('input', buscar);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Iniciar la aplicación
    cargarConstitucion();
});