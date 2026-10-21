const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetPasswordMessage = document.getElementById("resetPasswordMessage");
const resetPasswordButton = document.getElementById("resetPasswordButton");

let recoverySessionReady = false;
let recoveryFailed = false;
let passwordUpdateInProgress = false;

function showResetMessage(message, type = "") {
    resetPasswordMessage.textContent = message;
    resetPasswordMessage.className = `auth-message mt-3 ${type}`.trim();
}

function setRecoverySession(session) {
    if (session) {
        recoverySessionReady = true;
        recoveryFailed = false;
        resetPasswordButton.disabled = false;
    }
}

// CONTROLLA IL LINK DI RECUPERO
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
        setRecoverySession(session);
    } else if (session && !recoveryFailed) {
        setRecoverySession(session);
    }
});

async function initializeRecovery() {
    const params = new URLSearchParams(window.location.search);

    const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
    );

    const hasError =
        params.has("error") ||
        params.has("error_code") ||
        hashParams.has("error") ||
        hashParams.has("error_code");

    if (hasError) {
        recoveryFailed = true;

        showResetMessage(
            "Il link non è valido o è scaduto. Torna al login e richiedi una nuova email.",
            "error"
        );

        resetPasswordButton.disabled = true;
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (data.session) {
            setRecoverySession(data.session);
            showResetMessage("Puoi scegliere la tua nuova password.");
            return;
        }

        // Attendi brevemente l'eventuale evento PASSWORD_RECOVERY.
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!recoverySessionReady) {
            recoveryFailed = true;

            showResetMessage(
                "Link di recupero non valido o scaduto. Richiedi una nuova email.",
                "error"
            );

            resetPasswordButton.disabled = true;
        }

    } catch (error) {
        console.error("Errore verifica recupero:", error);

        recoveryFailed = true;

        showResetMessage(
            "Impossibile verificare il link. Richiedi una nuova email di recupero.",
            "error"
        );

        resetPasswordButton.disabled = true;
    }
}

// SALVA LA NUOVA PASSWORD
resetPasswordForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (passwordUpdateInProgress) {
        return;
    }

    if (!recoverySessionReady || recoveryFailed) {
        showResetMessage(
            "Il link di recupero non è valido. Richiedi una nuova email.",
            "error"
        );
        return;
    }

    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 6) {
        showResetMessage(
            "La password deve contenere almeno 6 caratteri.",
            "error"
        );
        return;
    }

    if (password !== confirmPassword) {
        showResetMessage(
            "Le password non coincidono.",
            "error"
        );
        return;
    }

    passwordUpdateInProgress = true;
    resetPasswordButton.disabled = true;

    showResetMessage("Aggiornamento della password in corso...");

    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: password
        });

        if (error) {
            throw error;
        }

        showResetMessage(
            "Password aggiornata correttamente! Ora puoi accedere con la nuova password.",
            "success"
        );

        resetPasswordForm.reset();

        // Esce dalla sessione di recupero.
        await supabaseClient.auth.signOut();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        console.error("Errore aggiornamento password:", error);

        showResetMessage(
            "Impossibile aggiornare la password. Il link potrebbe essere scaduto.",
            "error"
        );

        resetPasswordButton.disabled = false;

    } finally {
        passwordUpdateInProgress = false;
    }
});

// MOSTRA/NASCONDE LE PASSWORD
function setupPasswordToggle(buttonId, inputId, iconId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    button.addEventListener("click", () => {
        const showPassword = input.type === "password";

        input.type = showPassword ? "text" : "password";

        icon.className = showPassword
            ? "bi bi-eye-slash"
            : "bi bi-eye";

        button.setAttribute(
            "aria-label",
            showPassword ? "Nascondi password" : "Mostra password"
        );
    });
}

setupPasswordToggle(
    "toggleNewPassword",
    "newPassword",
    "newPasswordIcon"
);

setupPasswordToggle(
    "toggleConfirmPassword",
    "confirmPassword",
    "confirmPasswordIcon"
);

// AVVIO
initializeRecovery();