
document.addEventListener('DOMContentLoaded', () => {
    const token = API.getToken();

    // PROTEGER EL DASHBOARD
    if (!token) {
        window.location.replace('/login.html');
        return;
    }

    const elements = {
        gamesGrid: document.getElementById('gamesGrid'),
        gameModal: document.getElementById('gameModal'),
        gameForm: document.getElementById('gameForm'),
        modalTitle: document.getElementById('modalTitle'),
        gameFormError: document.getElementById('gameFormError'),
        saveGameBtn: document.getElementById('saveGameBtn'),
        searchInput: document.getElementById('searchInput'),
        filterPlatform: document.getElementById('filterPlatform'),
        filterStatus: document.getElementById('filterStatus'),
        totalGames: document.getElementById('totalGames'),
        playingGames: document.getElementById('playingGames'),
        completedGames: document.getElementById('completedGames'),
        favoriteGames: document.getElementById('favoriteGames'),
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),
        toastContainer: document.getElementById('toastContainer')
    };

    let games = [];
    let editingGameId = null;
    let showingFavorites = false;

    // UTILIDADES
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[character]);
    }

    function getGameId(game) {
        return game._id || game.id;
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3500);
    }

    function getErrorMessage(error) {
        return error?.message || 'Ocurrió un error inesperado.';
    }

    function getResponseGames(data) {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.videojuegos)) return data.videojuegos;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.resultados)) return data.resultados;
        return [];
    }

    function getCoverUrl(value) {
        if (!value) return '';

        try {
            const url = new URL(value);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return url.href;
            }
        } catch {
            return '';
        }

        return '';
    }

    // USUARIO
    function loadUserInfo() {
        const user = API.getUser();

        if (user) {
            const username = user.username || user.nombre || user.email || 'Gamer';
            elements.userName.textContent = username;
            elements.userAvatar.textContent = username.charAt(0).toUpperCase();
        }
    }

    // ESTADISTICAS
    function updateStatistics() {
        elements.totalGames.textContent = games.length;

        elements.playingGames.textContent = games.filter(
            game => game.estado === 'Jugando'
        ).length;

        elements.completedGames.textContent = games.filter(
            game => game.estado === 'Completado'
        ).length;

        elements.favoriteGames.textContent = games.filter(
            game => game.favorito === true
        ).length;
    }

    // CARGAR VIDEOJUEGOS
    async function loadGames() {
        elements.gamesGrid.innerHTML = `
            <div class="empty-state glass">
                <p>Cargando tu colección...</p>
            </div>
        `;

        try {
            const data = await API.get('/videojuegos');
            games = getResponseGames(data);

            updateStatistics();
            renderGames();
        } catch (error) {
            elements.gamesGrid.innerHTML = `
                <div class="empty-state glass">
                    <h3>No se pudo cargar la colección</h3>
                    <p>${escapeHTML(getErrorMessage(error))}</p>
                    <button class="btn btn-primary" id="retryGamesBtn">Reintentar</button>
                </div>
            `;

            document.getElementById('retryGamesBtn')?.addEventListener('click', loadGames);
        }
    }

    // FILTRAR VIDEOJUEGOS
    function getFilteredGames() {
        const search = elements.searchInput.value.trim().toLowerCase();
        const platform = elements.filterPlatform.value;
        const status = elements.filterStatus.value;

        return games.filter(game => {
            const matchesSearch =
                (game.titulo || '').toLowerCase().includes(search) ||
                (game.desarrollador || '').toLowerCase().includes(search);

            const matchesPlatform = !platform || game.plataforma === platform;
            const matchesStatus = !status || game.estado === status;
            const matchesFavorites = !showingFavorites || game.favorito === true;

            return matchesSearch &&
                matchesPlatform &&
                matchesStatus &&
                matchesFavorites;
        });
    }

    // MOSTRAR VIDEOJUEGOS
    function renderGames() {
        const filteredGames = getFilteredGames();

        if (filteredGames.length === 0) {
            const message = showingFavorites
                ? 'Todavía no tienes videojuegos favoritos.'
                : 'No se encontraron videojuegos.';

            elements.gamesGrid.innerHTML = `
                <div class="empty-state glass">
                    <div class="empty-icon">▣</div>
                    <h3>${message}</h3>
                    <p>Agrega un videojuego o modifica los filtros de búsqueda.</p>
                    <button class="btn btn-primary" id="emptyAddGameBtn">Agregar videojuego</button>
                </div>
            `;

            document.getElementById('emptyAddGameBtn')
                ?.addEventListener('click', openCreateModal);

            return;
        }

        elements.gamesGrid.innerHTML = filteredGames.map(game => {
            const id = escapeHTML(getGameId(game));
            const title = escapeHTML(game.titulo);
            const platform = escapeHTML(game.plataforma);
            const developer = escapeHTML(game.desarrollador);
            const year = escapeHTML(game.anioLanzamiento);
            const status = game.estado || 'Pendiente';
            const genres = Array.isArray(game.generos)
                ? game.generos.map(escapeHTML).join(' · ')
                : '';

            const cover = getCoverUrl(game.portada);
            const favorite = game.favorito === true;

            const statusClass = {
                Jugando: 'status-playing',
                Completado: 'status-completed',
                Pendiente: 'status-pending',
                Dropped: 'status-dropped'
            }[status] || 'status-pending';

            const coverContent = cover
                ? `<img src="${escapeHTML(cover)}" alt="Portada de ${title}" loading="lazy"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
                   <div class="game-cover-placeholder" style="display:none">R</div>`
                : `<div class="game-cover-placeholder">R</div>`;

            return `
                <article class="game-card">
                    <div class="game-cover">
                        ${coverContent}
                        <button class="game-favorite ${favorite ? 'active' : ''}"
                            data-action="favorite" data-id="${id}"
                            title="Cambiar favorito" aria-label="Cambiar favorito">
                            ${favorite ? '♥' : '♡'}
                        </button>
                    </div>

                    <div class="game-info">
                        <h3 class="game-title" title="${title}">${title}</h3>

                        <div class="game-meta">
                            <span>${platform}</span>
                            <span>·</span>
                            <span>${year}</span>
                        </div>

                        <p class="game-developer">${developer}</p>
                        <p class="game-meta">${genres}</p>

                        <div style="margin-top:12px">
                            <span class="status ${statusClass}">
                                ${escapeHTML(status)}
                            </span>
                        </div>

                        <div class="game-actions">
                            <button data-action="edit" data-id="${id}">Editar</button>
                            <button data-action="delete" data-id="${id}">Eliminar</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    // MODAL
    function openModal() {
        elements.gameModal.classList.add('active');
        elements.gameModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        elements.gameModal.classList.remove('active');
        elements.gameModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        elements.gameForm.reset();
        elements.gameFormError.textContent = '';
        editingGameId = null;
    }

    function openCreateModal() {
        editingGameId = null;
        elements.gameForm.reset();
        elements.gameFormError.textContent = '';
        elements.modalTitle.textContent = 'Agregar videojuego';
        elements.saveGameBtn.textContent = 'Guardar videojuego';
        openModal();
    }

    function openEditModal(game) {
        editingGameId = getGameId(game);

        document.getElementById('gameTitle').value = game.titulo || '';
        document.getElementById('gamePlatform').value = game.plataforma || '';
        document.getElementById('gameYear').value = game.anioLanzamiento || '';
        document.getElementById('gameDeveloper').value = game.desarrollador || '';
        document.getElementById('gameStatus').value = game.estado || 'Pendiente';
        document.getElementById('gameCover').value = game.portada || '';
        document.getElementById('gameFavorite').checked = game.favorito === true;

        const genresSelect = document.getElementById('gameGenres');
        const selectedGenres = Array.isArray(game.generos) ? game.generos : [];

        Array.from(genresSelect.options).forEach(option => {
            option.selected = selectedGenres.includes(option.value);
        });

        elements.gameFormError.textContent = '';
        elements.modalTitle.textContent = 'Editar videojuego';
        elements.saveGameBtn.textContent = 'Guardar cambios';

        openModal();
    }

    // OBTENER DATOS DEL FORMULARIO
    function getFormData() {
        const genres = Array.from(
            document.getElementById('gameGenres').selectedOptions
        ).map(option => option.value);

        return {
            titulo: document.getElementById('gameTitle').value.trim(),
            plataforma: document.getElementById('gamePlatform').value,
            generos: genres,
            desarrollador: document.getElementById('gameDeveloper').value.trim(),
            anioLanzamiento: Number(document.getElementById('gameYear').value),
            estado: document.getElementById('gameStatus').value,
            favorito: document.getElementById('gameFavorite').checked,
            portada: document.getElementById('gameCover').value.trim()
        };
    }

    // CREAR O EDITAR VIDEOJUEGO
    elements.gameForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = getFormData();

        elements.gameFormError.textContent = '';

        if (!formData.generos.length) {
            elements.gameFormError.textContent = 'Selecciona al menos un género.';
            return;
        }

        elements.saveGameBtn.disabled = true;
        elements.saveGameBtn.textContent = 'Guardando...';

        try {
            if (editingGameId) {
                await API.put(
                    `/videojuegos/${encodeURIComponent(editingGameId)}`,
                    formData
                );

                showToast('Videojuego actualizado correctamente.');
            } else {
                await API.post('/videojuegos', formData);
                showToast('Videojuego agregado a tu colección.');
            }

            closeModal();
            await loadGames();
        } catch (error) {
            elements.gameFormError.textContent = getErrorMessage(error);
        } finally {
            elements.saveGameBtn.disabled = false;
            elements.saveGameBtn.textContent = editingGameId
                ? 'Guardar cambios'
                : 'Guardar videojuego';
        }
    });

    // ACCIONES DE LAS TARJETAS
    elements.gamesGrid.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');

        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;
        const game = games.find(item => String(getGameId(item)) === String(id));

        if (!game) return;

        if (action === 'edit') {
            openEditModal(game);
            return;
        }

        if (action === 'delete') {
            const confirmed = window.confirm(
                `¿Seguro que deseas eliminar "${game.titulo}" de tu colección?`
            );

            if (!confirmed) return;

            try {
                await API.delete(`/videojuegos/${encodeURIComponent(id)}`);
                showToast('Videojuego eliminado correctamente.');
                await loadGames();
            } catch (error) {
                showToast(getErrorMessage(error), 'error');
            }

            return;
        }

        if (action === 'favorite') {
            try {
                await API.put(`/videojuegos/${encodeURIComponent(id)}`, {
                    ...game,
                    favorito: !game.favorito
                });

                showToast(
                    game.favorito
                        ? 'Videojuego eliminado de favoritos.'
                        : 'Videojuego agregado a favoritos.'
                );

                await loadGames();
            } catch (error) {
                showToast(getErrorMessage(error), 'error');
            }
        }
    });

    // FILTROS
    elements.searchInput.addEventListener('input', renderGames);
    elements.filterPlatform.addEventListener('change', renderGames);
    elements.filterStatus.addEventListener('change', renderGames);

    // BOTONES PARA ABRIR EL MODAL
    document.getElementById('addGameBtn')
        .addEventListener('click', openCreateModal);

    document.getElementById('addGameBtnSecondary')
        .addEventListener('click', openCreateModal);

    document.getElementById('emptyAddGameBtn')
        .addEventListener('click', openCreateModal);

    // BOTONES PARA CERRAR EL MODAL
    document.getElementById('closeModalBtn')
        .addEventListener('click', closeModal);

    document.getElementById('cancelModalBtn')
        .addEventListener('click', closeModal);

    elements.gameModal.addEventListener('click', (event) => {
        if (event.target === elements.gameModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && elements.gameModal.classList.contains('active')) {
            closeModal();
        }
    });

    // FAVORITOS
    document.getElementById('favoritesLink').addEventListener('click', (event) => {
        event.preventDefault();

        showingFavorites = !showingFavorites;

        document.getElementById('favoritesLink').classList.toggle(
            'active',
            showingFavorites
        );

        document.getElementById('coleccion').scrollIntoView({
            behavior: 'smooth'
        });

        renderGames();
    });

    // NAVEGACION
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });

            link.classList.add('active');
        });
    });

    // PERFIL
    document.getElementById('profileLink').addEventListener('click', (event) => {
        event.preventDefault();

        const user = API.getUser();

        showToast(
            user
                ? `Sesión iniciada como ${user.username || user.email || 'Gamer'}.`
                : 'Tu sesión está activa.',
            'success'
        );
    });

    // CERRAR SESION
    document.getElementById('logoutBtn').addEventListener('click', () => {
        const confirmed = window.confirm('¿Deseas cerrar tu sesión?');

        if (!confirmed) return;

        API.clearSession();
        window.location.replace('/login.html');
    });

    // INICIALIZAR DASHBOARD
    loadUserInfo();
    loadGames();
});
