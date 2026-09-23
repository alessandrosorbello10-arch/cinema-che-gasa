const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    loginMessage.textContent = "Accesso in corso...";
    loginMessage.className = "auth-message";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
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
    }, 800);
});