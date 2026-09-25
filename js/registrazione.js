const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async event => {

	event.preventDefault();

	const email = document.getElementById("registerEmail").value.trim();
	const password = document.getElementById("registerPassword").value;
	const acceptTerms = document.getElementById("acceptTerms").checked;
	const acceptPrivacy = document.getElementById("acceptPrivacy").checked;

	if (!acceptTerms || !acceptPrivacy) {

		registerMessage.textContent =
			"Devi accettare i Termini e la Privacy Policy per registrarti.";

		registerMessage.className =
			"auth-message error";

		return;
	}

	registerMessage.textContent =
		"Registrazione in corso...";

	registerMessage.className =
		"auth-message";

	const acceptedAt =
		new Date().toISOString();

	const { data, error } =
		await supabaseClient.auth.signUp({
			email: email,
			password: password,
			options: {
				data: {
					terms_accepted_at: acceptedAt,
					privacy_accepted_at: acceptedAt,
					terms_version: "1.0",
					privacy_version: "1.0"
				}
			}
		});

	if (error) {

		const message =
			error.message.toLowerCase();

		if (
			message.includes("already registered") ||
			message.includes("already exists") ||
			message.includes("user already") ||
			message.includes("already been registered")
		) {

			registerMessage.innerHTML = `
				<strong>Account già esistente.</strong>
				<br>
				Hai già un account con questa email.
				<br><br>
				<a href="login.html" class="btn btn-light">
					<i class="bi bi-box-arrow-in-right"></i>
					Vai al login
				</a>
			`;

			registerMessage.className =
				"auth-message error";

			return;
		}

		registerMessage.textContent =
			"Errore: " + error.message;

		registerMessage.className =
			"auth-message error";

		return;
	}

	if (!data.user) {

		registerMessage.textContent =
			"Non è stato possibile creare l'account.";

		registerMessage.className =
			"auth-message error";

		return;
	}

	if (
		data.user.identities &&
		data.user.identities.length === 0
	) {

		registerMessage.innerHTML = `
			<strong>Account già esistente.</strong>
			<br>
			Hai già un account con questa email.
			<br><br>
			<a href="login.html" class="btn btn-light">
				<i class="bi bi-box-arrow-in-right"></i>
				Vai al login
			</a>
		`;

		registerMessage.className =
			"auth-message error";

		return;
	}

	registerMessage.textContent =
		"Registrazione completata! Controlla la tua email per confermare l'account.";

	registerMessage.className =
		"auth-message success";

	registerForm.reset();

});