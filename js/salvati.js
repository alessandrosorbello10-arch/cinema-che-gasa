const savedFilmsContainer =
	document.getElementById("savedFilmsContainer");

async function getCurrentUser() {
	const {
		data: { user },
		error
	} = await supabaseClient.auth.getUser();

	if (error) {
		console.error(
			"Errore recupero utente:",
			error
		);

		return null;
	}

	return user;
}

async function loadSavedFilms() {

	if (!savedFilmsContainer) {
		return;
	}

	const user = await getCurrentUser();

	if (!user) {

		savedFilmsContainer.innerHTML = `
			<div class="col-12">

				<div class="empty-films text-center py-5">

					<i class="bi bi-person-lock"></i>

					<h2>
						Accedi per vedere i tuoi film
					</h2>

					<p>
						Devi avere un account per
						utilizzare i film salvati.
					</p>

				</div>

			</div>
		`;

		return;
	}

	const {
		data: savedFilms,
		error: savedError
	} = await supabaseClient
		.from("saved_films")
		.select("film_id, created_at")
		.eq("user_id", user.id)
		.order("created_at", {
			ascending: false
		});

	if (savedError) {

		console.error(
			"Errore caricamento film salvati:",
			savedError
		);

		savedFilmsContainer.innerHTML = `
			<div class="col-12 text-center text-danger py-5">
				Errore durante il caricamento dei film.
			</div>
		`;

		return;
	}

	if (
		!savedFilms ||
		savedFilms.length === 0
	) {

		savedFilmsContainer.innerHTML = `
			<div class="col-12">

				<div class="empty-films text-center py-5">

					<i class="bi bi-bookmark"></i>

					<h2>
						Nessun film salvato
					</h2>

					<p>
						Quando salverai un film,
						lo troverai qui.
					</p>

					<a
						href="film.html"
						class="btn btn-light mt-3"
					>

						<i class="bi bi-film"></i>

						Scopri i film

					</a>

				</div>

			</div>
		`;

		return;
	}

	const filmIds =
		savedFilms.map(
			item => item.film_id
		);

	const {
		data: films,
		error: filmsError
	} = await supabaseClient
		.from("films")
		.select("*")
		.in("id", filmIds);

	if (filmsError) {

		console.error(
			"Errore caricamento dati film:",
			filmsError
		);

		savedFilmsContainer.innerHTML = `
			<div class="col-12 text-center text-danger py-5">
				Errore durante il caricamento dei film.
			</div>
		`;

		return;
	}

	const filmMap = new Map(
		films.map(
			film => [film.id, film]
		)
	);

	savedFilmsContainer.innerHTML =
		savedFilms
			.map(saved => {

				const film =
					filmMap.get(
						saved.film_id
					);

				if (!film) {
					return "";
				}

				return `
					<div class="col-6 col-md-4 col-lg-3">

						<div class="film-card">

							<a
								href="film-dettaglio.html?id=${film.id}"
								class="film-card-link"
							>

								<img
									src="${film.image || ""}"
									alt="${film.title || "Film"}"
									loading="lazy"
								>

								<div class="film-card-info">

									<h3>
										${film.title || "Titolo sconosciuto"}
									</h3>

									<p>
										${film.year || "—"} ·
										${film.genre || "—"}
									</p>

									<span>
										<i class="bi bi-star-fill"></i>
										${film.rating ?? "—"}/10
									</span>

								</div>

							</a>

							<button
								class="btn btn-sm btn-danger m-2"
								onclick="removeSavedFilm(${film.id})"
							>

								<i class="bi bi-bookmark-x"></i>

								Rimuovi

							</button>

						</div>

					</div>
				`;
			})
			.join("");
}

window.removeSavedFilm =
	async function(filmId) {

		const user =
			await getCurrentUser();

		if (!user) {
			return;
		}

		const { error } =
			await supabaseClient
				.from("saved_films")
				.delete()
				.eq("user_id", user.id)
				.eq("film_id", filmId);

		if (error) {

			console.error(
				"Errore rimozione film:",
				error
			);

			alert(
				"Non è stato possibile rimuovere il film."
			);

			return;
		}

		await loadSavedFilms();
	};

document.addEventListener(
	"DOMContentLoaded",
	() => {

		loadSavedFilms();

		const currentYear =
			document.getElementById(
				"currentYear"
			);

		if (currentYear) {

			currentYear.textContent =
				new Date().getFullYear();

		}

	}
);