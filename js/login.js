const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const loginEmail = document.getElementById("loginEmail");

const recoveryPage =
    "https://alessandrosorbello10-arch.github.io/cinema-che-gasa/pagine/reimposta-password.html";

// LOGIN
loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = document.getElementById("loginPassword").value;

    loginButton.disabled = true;

    loginMessage.textContent = "Accesso in corso...";
    loginMessage.className = "auth-message";

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            loginMessage.textContent = "Email o password non corretti.";
            loginMessage.className = "auth-message error";
            return;
        }

        loginMessage.textContent = "Accesso effettuato!";
        loginMessage.className = "auth-message success";

        setTimeout(() => {
            window.location.href = "../index.html";
        }, 500);

    } catch (error) {
        console.error("Errore durante il login:", error);

        loginMessage.textContent =
            "Si è verificato un errore. Riprova più tardi.";

        loginMessage.className = "auth-message error";

    } finally {
        loginButton.disabled = false;
    }
});

// RECUPERO PASSWORD
forgotPasswordButton.addEventListener("click", async () => {
    const email = loginEmail.value.trim();

    if (!email) {
        loginMessage.textContent =
            "Inserisci prima la tua email nel campo Email.";

        loginMessage.className = "auth-message error";
        loginEmail.focus();

        return;
    }

    forgotPasswordButton.disabled = true;
    loginButton.disabled = true;

    loginMessage.textContent = "Invio dell'email in corso...";
    loginMessage.className = "auth-message";

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: recoveryPage
            }
        );

        if (error) {
            throw error;
        }

        loginMessage.textContent =
            "Se l'account esiste, riceverai un'email con le istruzioni per recuperare la password.";

        loginMessage.className = "auth-message success";

    } catch (error) {
        console.error("Errore recupero password:", error);

        loginMessage.textContent =
            "Impossibile inviare l'email. Riprova più tardi.";

        loginMessage.className = "auth-message error";

    } finally {
        forgotPasswordButton.disabled = false;
        loginButton.disabled = false;
    }
});