const accountEmail =
	document.getElementById("accountEmail");

const accountMessage =
	document.getElementById("accountMessage");

const deleteAccountButton =
	document.getElementById("deleteAccountButton");

const changePasswordButton =
	document.getElementById("changePasswordButton");

const cookieButton =
	document.getElementById("cookieButton");


async function loadAccount() {

	const {
		data: { session },
		error
	} = await supabaseClient.auth.getSession();

	if (error) {

		console.error(
			"Errore caricamento sessione:",
			error
		);

		accountMessage.textContent =
			"Si è verificato un errore durante il caricamento dell'account.";

		accountMessage.className =
			"auth-message error";

		return;
	}

	if (!session) {

		window.location.href =
			"login.html";

		return;
	}

	accountEmail.textContent =
		session.user.email;
}


loadAccount();


changePasswordButton.addEventListener(
	"click",
	async () => {

		const newPassword =
			prompt(
				"Inserisci la nuova password:"
			);

		if (newPassword === null) {
			return;
		}

		if (newPassword.length < 6) {

			accountMessage.textContent =
				"La password deve contenere almeno 6 caratteri.";

			accountMessage.className =
				"auth-message error";

			return;
		}

		const confirmPassword =
			prompt(
				"Conferma la nuova password:"
			);

		if (confirmPassword === null) {
			return;
		}

		if (newPassword !== confirmPassword) {

			accountMessage.textContent =
				"Le password non coincidono.";

			accountMessage.className =
				"auth-message error";

			return;
		}

		changePasswordButton.disabled = true;

		accountMessage.textContent =
			"Modifica password in corso...";

		accountMessage.className =
			"auth-message";

		try {

			const { error } =
				await supabaseClient.auth.updateUser({
					password: newPassword
				});

			if (error) {

				console.error(
					"Errore cambio password:",
					error
				);

				accountMessage.textContent =
					"Non è stato possibile cambiare la password.";

				accountMessage.className =
					"auth-message error";

				return;
			}

			accountMessage.textContent =
				"Password modificata con successo.";

			accountMessage.className =
				"auth-message success";

		} catch (error) {

			console.error(
				"Errore cambio password:",
				error
			);

			accountMessage.textContent =
				"Si è verificato un errore durante il cambio della password.";

			accountMessage.className =
				"auth-message error";

		} finally {

			changePasswordButton.disabled = false;

		}
	}
);


cookieButton.addEventListener(
	"click",
	() => {

		if (
			typeof openCookieSettings ===
			"function"
		) {

			openCookieSettings();

		} else {

			accountMessage.textContent =
				"Impossibile aprire le preferenze dei cookie.";

			accountMessage.className =
				"auth-message error";

		}
	}
);


deleteAccountButton.addEventListener(
	"click",
	async () => {

		const confirmed =
			confirm(
				"Sei sicuro di voler eliminare definitivamente il tuo account?\n\nQuesta operazione non può essere annullata."
			);

		if (!confirmed) {
			return;
		}

		deleteAccountButton.disabled = true;

		changePasswordButton.disabled = true;
		cookieButton.disabled = true;

		accountMessage.textContent =
			"Eliminazione account in corso...";

		accountMessage.className =
			"auth-message";

		try {

			const {
				data,
				error
			} =
				await supabaseClient.functions.invoke(
					"delete-account"
				);

			if (error) {

				console.error(
					"Errore eliminazione account:",
					error
				);

				accountMessage.textContent =
					"Non è stato possibile eliminare l'account.";

				accountMessage.className =
					"auth-message error";

				deleteAccountButton.disabled =
					false;

				changePasswordButton.disabled =
					false;

				cookieButton.disabled =
					false;

				return;
			}

			if (
				!data ||
				data.success !== true
			) {

				console.error(
					"Risposta inattesa:",
					data
				);

				accountMessage.textContent =
					"Non è stato possibile eliminare l'account.";

				accountMessage.className =
					"auth-message error";

				deleteAccountButton.disabled =
					false;

				changePasswordButton.disabled =
					false;

				cookieButton.disabled =
					false;

				return;
			}

			await supabaseClient.auth.signOut();

			localStorage.removeItem(
				"cinemaCheGasaCookieConsent"
			);

			accountMessage.textContent =
				"Account eliminato. Reindirizzamento...";

			accountMessage.className =
				"auth-message success";

			setTimeout(
				() => {
					window.location.href =
						"../index.html";
				},
				1000
			);

		} catch (error) {

			console.error(
				"Errore eliminazione account:",
				error
			);

			accountMessage.textContent =
				"Si è verificato un errore durante l'eliminazione dell'account.";

			accountMessage.className =
				"auth-message error";

			deleteAccountButton.disabled =
				false;

			changePasswordButton.disabled =
				false;

			cookieButton.disabled =
				false;
		}
	}
);