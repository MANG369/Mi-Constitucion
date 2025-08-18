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
            const response = await fetch('constitucion.json');
            constitucionData = await response.json();
            mostrarIndice();
        } catch (error) {
            console.error('Error al cargar la Constitución:', error);
            contenido.innerHTML = '<p>No se pudo cargar el contenido. Por favor, intente de nuevo más tarde.</p>';
        }
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
            };
            li.appendChild(a);
            listaTitulos.appendChild(li);
        });
    }

    // 3. Mostrar el contenido de un Título
    function mostrarContenidoTitulo(index) {
        const titulo = constitucionData.titulos[index];
        contenido.innerHTML = `<h2>${titulo.nombre}</h2>`;

        if (titulo.articulos) {
            titulo.articulos.forEach(articulo => {
                contenido.innerHTML += crearHTMLArticulo(articulo);
            });
        }

        if (titulo.capitulos) {
            titulo.capitulos.forEach(capitulo => {
                contenido.innerHTML += `<h3>${capitulo.nombre}</h3>`;
                capitulo.articulos.forEach(articulo => {
                    contenido.innerHTML += crearHTMLArticulo(articulo);
                });
            });
        }
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
                        <button title="Añadir a favoritos">⭐</button>
                        <button title="Añadir nota">📝</button>
                    </div>
                </div>
                <p>${textoArticulo}</p>
            </div>
        `;
    }

    // 4. Implementar la búsqueda
    function buscar() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm.length < 3) {
            contenido.innerHTML = '<div class="bienvenida"><p>Introduce al menos 3 caracteres para buscar.</p></div>';
            return;
        }

        contenido.innerHTML = `<h2>Resultados para "${searchInput.value}"</h2>`;
        let resultadosEncontrados = 0;

        constitucionData.titulos.forEach(titulo => {
            if (titulo.articulos) {
                titulo.articulos.forEach(articulo => {
                    if (articulo.texto.toLowerCase().includes(searchTerm) || String(articulo.numero) === searchTerm) {
                        contenido.innerHTML += crearHTMLArticulo(articulo, searchInput.value);
                        resultadosEncontrados++;
                    }
                });
            }
            if (titulo.capitulos) {
                titulo.capitulos.forEach(capitulo => {
                    capitulo.articulos.forEach(articulo => {
                       if (articulo.texto.toLowerCase().includes(searchTerm) || String(articulo.numero) === searchTerm) {
                           contenido.innerHTML += crearHTMLArticulo(articulo, searchInput.value);
                           resultadosEncontrados++;
                       }
                    });
                });
            }
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
            themeToggle.textContent = '☀️';
        }
    }

    // Event Listeners
    searchInput.addEventListener('input', buscar);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Iniciar la aplicación
    cargarConstitucion();
});