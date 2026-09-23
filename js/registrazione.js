const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async event => {
	event.preventDefault();

	const email = document.getElementById("registerEmail").value.trim();
	const password = document.getElementById("registerPassword").value;
	const acceptTerms = document.getElementById("acceptTerms").checked;
	const acceptPrivacy = document.getElementById("acceptPrivacy").checked;

	if (!acceptTerms || !acceptPrivacy) {
		registerMessage.textContent = "Devi accettare i Termini e la Privacy Policy per registrarti.";
		registerMessage.className = "auth-message error";
		return;
	}

	registerMessage.textContent = "Registrazione in corso...";
	registerMessage.className = "auth-message";

	const acceptedAt = new Date().toISOString();

	const { data, error } = await supabaseClient.auth.signUp({
		email: email,
		password: password
	});

	if (error) {
		registerMessage.textContent = "Errore: " + error.message;
		registerMessage.className = "auth-message error";
		return;
	}

	if (data.user) {
		const { error: profileError } = await supabaseClient
			.from("profiles")
			.insert({
				id: data.user.id,
				email: email,
				role: "user",
				terms_accepted_at: acceptedAt,
				privacy_accepted_at: acceptedAt,
				terms_version: "1.0",
				privacy_version: "1.0"
			});

		if (profileError) {
			console.error(profileError);
			registerMessage.textContent = "Account creato, ma si è verificato un errore nel salvataggio delle preferenze.";
			registerMessage.className = "auth-message error";
			return;
		}
	}

	registerMessage.textContent = "Registrazione completata! Controlla la tua email per confermare l'account.";
	registerMessage.className = "auth-message success";
	registerForm.reset();
});