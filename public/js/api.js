
const API_URL = '/api';

const API = {
    getToken() {
        return sessionStorage.getItem('token');
    },

    getUser() {
        try {
            return JSON.parse(sessionStorage.getItem('usuario')) || null;
        } catch {
            return null;
        }
    },

    saveSession(token, usuario) {
        sessionStorage.setItem('token', token);

        if (usuario) {
            sessionStorage.setItem('usuario', JSON.stringify(usuario));
        }
    },

    clearSession() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();

        const headers = {
            ...(options.headers || {})
        };

        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        let response;

        try {
            response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });
        } catch (error) {
            throw new Error('No fue posible conectar con el servidor.');
        }

        const contentType = response.headers.get('content-type') || '';
        let data = {};

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { mensaje: text };
        }

        if (!response.ok) {
            if (response.status === 401 && token) {
                this.clearSession();
            }

            throw new Error(
                data.mensaje ||
                data.message ||
                data.error ||
                `Error del servidor (${response.status}).`
            );
        }

        return data;
    },

    get(endpoint) {
        return this.request(endpoint);
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

window.API = API;
