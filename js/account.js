const accountEmail = document.getElementById("accountEmail");
const accountMessage = document.getElementById("accountMessage");

const deleteAccountButton = document.getElementById("deleteAccountButton");
const changePasswordButton = document.getElementById("changePasswordButton");
const cookieButton = document.getElementById("cookieButton");

const emailNotifications = document.getElementById("emailNotifications");
const emailNotificationsMessage = document.getElementById("emailNotificationsMessage");

let currentUserId = null;
let emailPreferenceLoaded = false;

function showAccountMessage(message, type = "") {
    if (!accountMessage) {
        return;
    }

    accountMessage.textContent = message;
    accountMessage.className = "auth-message";

    if (type) {
        accountMessage.classList.add(type);
    }
}

function showEmailMessage(message, type = "") {
    if (!emailNotificationsMessage) {
        return;
    }

    emailNotificationsMessage.textContent = message;
    emailNotificationsMessage.className = "small mt-2 mb-0";

    if (type === "success") {
        emailNotificationsMessage.classList.add("text-success");
    } else if (type === "error") {
        emailNotificationsMessage.classList.add("text-danger");
    }
}

async function loadAccount() {
    if (!accountEmail) {
        return;
    }

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Errore caricamento sessione:", error);

        showAccountMessage(
            "Si è verificato un errore durante il caricamento dell'account.",
            "error"
        );

        return;
    }

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    currentUserId = session.user.id;

    accountEmail.textContent = session.user.email;

    await loadEmailPreference();
}

async function loadEmailPreference() {
    if (!currentUserId || !emailNotifications) {
        return;
    }

    emailNotifications.disabled = true;
    emailPreferenceLoaded = false;

    showEmailMessage("Caricamento preferenze...");

    try {
        const {
            data: profile,
            error
        } = await supabaseClient
            .from("profiles")
            .select("email_notifications")
            .eq("id", currentUserId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!profile) {
            throw new Error("Profilo utente non trovato.");
        }

        emailNotifications.checked =
            profile.email_notifications === true;

        emailPreferenceLoaded = true;
        emailNotifications.disabled = false;

        showEmailMessage(
            emailNotifications.checked
                ? "Riceverai le comunicazioni del sito."
                : "Le comunicazioni via email sono disattivate."
        );

    } catch (error) {
        console.error(
            "Errore caricamento preferenze email:",
            error
        );

        showEmailMessage(
            "Impossibile caricare le preferenze. Ricarica la pagina.",
            "error"
        );
    }
}

if (emailNotifications) {
    emailNotifications.addEventListener("change", async () => {
        if (!emailPreferenceLoaded || !currentUserId) {
            return;
        }

        const newValue = emailNotifications.checked;

        emailNotifications.disabled = true;

        showEmailMessage("Salvataggio in corso...");

        try {
            const {
                data,
                error
            } = await supabaseClient
                .from("profiles")
                .update({
                    email_notifications: newValue
                })
                .eq("id", currentUserId)
                .select("id")
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error(
                    "Nessun profilo aggiornato. Verifica i permessi del database."
                );
            }

            showEmailMessage(
                newValue
                    ? "Preferenza salvata. Hai attivato le comunicazioni email."
                    : "Preferenza salvata. Hai disattivato le comunicazioni email.",
                "success"
            );

        } catch (error) {
            console.error(
                "Errore salvataggio preferenze email:",
                error
            );

            emailNotifications.checked = !newValue;

            showEmailMessage(
                "Non è stato possibile salvare la preferenza. Riprova.",
                "error"
            );

        } finally {
            emailNotifications.disabled = false;
        }
    });
}

if (changePasswordButton) {
    changePasswordButton.addEventListener("click", async () => {
        const newPassword = prompt(
            "Inserisci la nuova password:"
        );

        if (newPassword === null) {
            return;
        }

        if (newPassword.length < 6) {
            showAccountMessage(
                "La password deve contenere almeno 6 caratteri.",
                "error"
            );

            return;
        }

        const confirmPassword = prompt(
            "Conferma la nuova password:"
        );

        if (confirmPassword === null) {
            return;
        }

        if (newPassword !== confirmPassword) {
            showAccountMessage(
                "Le password non coincidono.",
                "error"
            );

            return;
        }

        changePasswordButton.disabled = true;

        showAccountMessage("Modifica password in corso...");

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error("Errore cambio password:", error);

                showAccountMessage(
                    "Non è stato possibile cambiare la password.",
                    "error"
                );

                return;
            }

            showAccountMessage(
                "Password modificata con successo.",
                "success"
            );

        } catch (error) {
            console.error("Errore cambio password:", error);

            showAccountMessage(
                "Si è verificato un errore durante il cambio della password.",
                "error"
            );

        } finally {
            changePasswordButton.disabled = false;
        }
    });
}

if (cookieButton) {
    cookieButton.addEventListener("click", () => {
        if (typeof openCookieSettings === "function") {
            openCookieSettings();
        } else {
            showAccountMessage(
                "Impossibile aprire le preferenze dei cookie.",
                "error"
            );
        }
    });
}

if (deleteAccountButton) {
    deleteAccountButton.addEventListener("click", async () => {
        const confirmed = confirm(
            "Sei sicuro di voler eliminare definitivamente il tuo account?\n\nQuesta operazione non può essere annullata."
        );

        if (!confirmed) {
            return;
        }

        deleteAccountButton.disabled = true;

        if (changePasswordButton) {
            changePasswordButton.disabled = true;
        }

        if (cookieButton) {
            cookieButton.disabled = true;
        }

        if (emailNotifications) {
            emailNotifications.disabled = true;
        }

        showAccountMessage("Eliminazione account in corso...");

        try {
            const {
                data,
                error
            } = await supabaseClient.functions.invoke(
                "delete-account"
            );

            if (error) {
                console.error(
                    "Errore eliminazione account:",
                    error
                );

                showAccountMessage(
                    "Non è stato possibile eliminare l'account.",
                    "error"
                );

                return;
            }

            if (!data || data.success !== true) {
                console.error("Risposta inattesa:", data);

                showAccountMessage(
                    "Non è stato possibile eliminare l'account.",
                    "error"
                );

                return;
            }

            await supabaseClient.auth.signOut();

            localStorage.removeItem(
                "cinemaCheGasaCookieConsent"
            );

            showAccountMessage(
                "Account eliminato. Reindirizzamento...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1000);

        } catch (error) {
            console.error(
                "Errore eliminazione account:",
                error
            );

            showAccountMessage(
                "Si è verificato un errore durante l'eliminazione dell'account.",
                "error"
            );

        } finally {
            deleteAccountButton.disabled = false;

            if (changePasswordButton) {
                changePasswordButton.disabled = false;
            }

            if (cookieButton) {
                cookieButton.disabled = false;
            }

            if (emailNotifications && emailPreferenceLoaded) {
                emailNotifications.disabled = false;
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadAccount();

    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
});