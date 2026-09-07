const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    registerMessage.textContent = "Registrazione in corso...";
    registerMessage.className = "auth-message";

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        registerMessage.textContent = "Errore: " + error.message;
        registerMessage.className = "auth-message error";
        return;
    }

    registerMessage.textContent = "Registrazione completata! Controlla la tua email per confermare l'account.";
    registerMessage.className = "auth-message success";
    registerForm.reset();
});