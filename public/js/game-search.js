
document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('gameTitle');
    const genreSelect = document.getElementById('gameGenres');
    const gameModal = document.getElementById('gameModal');

    if (!titleInput || !genreSelect || !gameModal) return;

    let searchTimeout;
    let searchController = null;

    // Crear contenedor de sugerencias
    const suggestions = document.createElement('div');
    suggestions.className = 'game-suggestions';

    titleInput.insertAdjacentElement('afterend', suggestions);

    // Preparar el campo de título para las sugerencias
    titleInput.parentElement.classList.add('game-search-group');

    // Crear selector visual de géneros
    const genreContainer = document.createElement('div');
    genreContainer.className = 'genre-chips';

    genreSelect.insertAdjacentElement('afterend', genreContainer);

    // El select original conserva los valores que utiliza el CRUD
    genreSelect.removeAttribute('required');
    genreSelect.classList.add('genre-select-hidden');

    function renderGenres() {
        genreContainer.innerHTML = '';

        Array.from(genreSelect.options).forEach(option => {
            const chip = document.createElement('button');

            chip.type = 'button';
            chip.className = 'genre-chip';
            chip.textContent = option.textContent;
            chip.classList.toggle('selected', option.selected);

            chip.addEventListener('click', () => {
                option.selected = !option.selected;
                chip.classList.toggle('selected', option.selected);

                genreSelect.dispatchEvent(
                    new Event('change', { bubbles: true })
                );
            });

            genreContainer.appendChild(chip);
        });
    }

    renderGenres();

    // Actualizar chips al abrir o editar un videojuego
    const modalObserver = new MutationObserver(() => {
        if (gameModal.classList.contains('active')) {
            renderGenres();
        }
    });

    modalObserver.observe(gameModal, {
        attributes: true,
        attributeFilter: ['class']
    });

    // También actualizar si el dashboard cambia las opciones seleccionadas
    genreSelect.addEventListener('change', renderGenres);

    function closeSuggestions() {
        suggestions.innerHTML = '';
        suggestions.classList.remove('visible');
    }

    function showSuggestions(resultados) {
        suggestions.innerHTML = '';

        if (!resultados.length) {
            const empty = document.createElement('div');
            empty.className = 'suggestion-empty';
            empty.textContent = 'No se encontraron videojuegos.';
            suggestions.appendChild(empty);
            suggestions.classList.add('visible');
            return;
        }

        resultados.forEach(juego => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'game-suggestion';

            if (juego.portada) {
                const image = document.createElement('img');
                image.src = juego.portada;
                image.alt = '';
                image.loading = 'lazy';
                item.appendChild(image);
            }

            const info = document.createElement('span');
            info.className = 'suggestion-info';

            const name = document.createElement('strong');
            name.textContent = juego.nombre;

            const year = document.createElement('small');
            year.textContent = juego.lanzamiento
                ? juego.lanzamiento.substring(0, 4)
                : 'Fecha no disponible';

            info.append(name, year);
            item.appendChild(info);

            item.addEventListener('click', () => {
                seleccionarVideojuego(juego.id);
            });

            suggestions.appendChild(item);
        });

        suggestions.classList.add('visible');
    }

    async function buscarVideojuegos(consulta) {
        try {
            if (searchController) {
                searchController.abort();
            }

            searchController = new AbortController();

            const respuesta = await API.get(
                `/videojuegos/buscar?q=${encodeURIComponent(consulta)}`,
                { signal: searchController.signal }
            );

            const resultados = respuesta.resultados || [];
            showSuggestions(resultados);

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error buscando videojuegos:', error);
                closeSuggestions();
            }
        }
    }

    async function seleccionarVideojuego(id) {
        closeSuggestions();

        try {
            titleInput.disabled = true;

            const juego = await API.get(`/videojuegos/buscar/${id}`);

            document.getElementById('gameTitle').value =
                juego.titulo || '';

            document.getElementById('gameDeveloper').value =
                juego.desarrollador || '';

            document.getElementById('gameYear').value =
                juego.anioLanzamiento || '';

            document.getElementById('gameCover').value =
                juego.portada || '';

            if (juego.plataformaSugerida) {
                document.getElementById('gamePlatform').value =
                    juego.plataformaSugerida;
            }

            // Seleccionar los géneros compatibles con el modelo
            Array.from(genreSelect.options).forEach(option => {
                option.selected = juego.generos.includes(option.value);
            });

            renderGenres();

        } catch (error) {
            console.error('Error cargando videojuego:', error);
            alert('No fue posible cargar los datos del videojuego.');
        } finally {
            titleInput.disabled = false;
            titleInput.focus();
        }
    }

    titleInput.addEventListener('input', () => {
        const consulta = titleInput.value.trim();

        clearTimeout(searchTimeout);

        if (consulta.length < 2) {
            closeSuggestions();
            return;
        }

        searchTimeout = setTimeout(() => {
            buscarVideojuegos(consulta);
        }, 350);
    });

    document.addEventListener('click', event => {
        if (
            !suggestions.contains(event.target) &&
            event.target !== titleInput
        ) {
            closeSuggestions();
        }
    });

    // Atribución requerida por RAWG
    const attribution = document.createElement('small');
    attribution.className = 'rawg-attribution';

    const attributionLink = document.createElement('a');
    attributionLink.href = 'https://rawg.io/';
    attributionLink.target = '_blank';
    attributionLink.rel = 'noopener noreferrer';
    attributionLink.textContent = 'RAWG';

    attribution.append(
        document.createTextNode('Información de videojuegos proporcionada por '),
        attributionLink
    );

    document.getElementById('gameForm').appendChild(attribution);
});
