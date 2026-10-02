const saveFilmButton = document.getElementById("saveFilmButton");

async function getCurrentUser() {
	const {
		data: { user },
		error
	} = await supabaseClient.auth.getUser();

	if (error) {
		console.error("Errore recupero utente:", error);
		return null;
	}

	return user;
}

async function updateSaveButton() {
	if (!saveFilmButton) {
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const filmId = Number(params.get("id"));

	if (!filmId) {
		return;
	}

	const user = await getCurrentUser();

	if (!user) {
		saveFilmButton.innerHTML = `
			<i class="bi bi-bookmark"></i>
			<span>Salva film</span>
		`;
		return;
	}

	const { data, error } = await supabaseClient
		.from("saved_films")
		.select("id")
		.eq("user_id", user.id)
		.eq("film_id", filmId)
		.maybeSingle();

	if (error) {
		console.error("Errore controllo film salvato:", error);
		return;
	}

	if (data) {
		saveFilmButton.classList.remove("btn-light");
		saveFilmButton.classList.add("btn-danger");

		saveFilmButton.innerHTML = `
			<i class="bi bi-bookmark-fill"></i>
			<span>Salvato</span>
		`;

		saveFilmButton.dataset.saved = "true";
	} else {
		saveFilmButton.classList.remove("btn-danger");
		saveFilmButton.classList.add("btn-light");

		saveFilmButton.innerHTML = `
			<i class="bi bi-bookmark"></i>
			<span>Salva film</span>
		`;

		saveFilmButton.dataset.saved = "false";
	}
}

if (saveFilmButton) {
	saveFilmButton.addEventListener("click", async () => {
		const params = new URLSearchParams(window.location.search);
		const filmId = Number(params.get("id"));

		if (!filmId) {
			return;
		}

		const user = await getCurrentUser();

		if (!user) {
			alert("Devi accedere al tuo account per salvare un film.");
			return;
		}

		saveFilmButton.disabled = true;

		const isSaved =
			saveFilmButton.dataset.saved === "true";

		if (isSaved) {
			const { error } = await supabaseClient
				.from("saved_films")
				.delete()
				.eq("user_id", user.id)
				.eq("film_id", filmId);

			if (error) {
				console.error(
					"Errore rimozione film salvato:",
					error
				);

				alert("Non è stato possibile rimuovere il film.");
			}
		} else {
			const { error } = await supabaseClient
				.from("saved_films")
				.insert({
					user_id: user.id,
					film_id: filmId
				});

			if (error) {
				if (error.code === "23505") {
					console.log("Film già salvato.");
				} else {
					console.error(
						"Errore salvataggio film:",
						error
					);

					alert("Non è stato possibile salvare il film.");
				}
			}
		}

		await updateSaveButton();

		saveFilmButton.disabled = false;
	});
}

document.addEventListener("DOMContentLoaded", () => {
	updateSaveButton();
});