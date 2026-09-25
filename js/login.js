const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async event => {

	event.preventDefault();

	const email = document.getElementById("loginEmail").value.trim();
	const password = document.getElementById("loginPassword").value;

	loginButton.disabled = true;

	loginMessage.textContent = "Accesso in corso...";
	loginMessage.className = "auth-message";

	const { error } = await supabaseClient.auth.signInWithPassword({
		email,
		password
	});

	if (error) {

		loginMessage.textContent = "Email o password non corretti.";
		loginMessage.className = "auth-message error";

		loginButton.disabled = false;

		return;
	}

	loginMessage.textContent = "Accesso effettuato!";
	loginMessage.className = "auth-message success";

	setTimeout(() => {
		window.location.href = "../index.html";
	}, 500);

});