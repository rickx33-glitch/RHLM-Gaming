
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // INICIO DE SESION
    if (loginForm) {
        if (API.getToken()) {
            window.location.replace('/');
            return;
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const identifier = document.getElementById('loginIdentifier').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorElement = document.getElementById('loginError');
            const submitButton = document.getElementById('loginSubmit');

            errorElement.textContent = '';
            submitButton.disabled = true;
            submitButton.textContent = 'Iniciando sesión...';

            try {
                const data = await API.post('/auth/login', {
                    identificador: identifier,
                    password
                });

                if (!data.token) {
                    throw new Error('El servidor no devolvió un token de autenticación.');
                }

                API.saveSession(
                    data.token,
                    data.usuario || data.user || null
                );

                window.location.replace('/');
            } catch (error) {
                errorElement.textContent = error.message;
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Iniciar sesión';
            }
        });
    }

    // REGISTRO
    if (registerForm) {
        if (API.getToken()) {
            window.location.replace('/');
            return;
        }

        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            const errorElement = document.getElementById('registerError');
            const submitButton = document.getElementById('registerSubmit');

            errorElement.textContent = '';

            if (password !== confirmPassword) {
                errorElement.textContent = 'Las contraseñas no coinciden.';
                return;
            }

            if (password.length < 6) {
                errorElement.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Creando cuenta...';

            try {
                await API.post('/auth/register', {
                    username,
                    email,
                    password
                });

                window.location.replace('/login.html');
            } catch (error) {
                errorElement.textContent = error.message;
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Crear cuenta';
            }
        });
    }
});
