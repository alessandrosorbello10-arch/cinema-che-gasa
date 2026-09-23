const rankingContainer = document.getElementById("rankingContainer");
const yearFilter = document.getElementById("yearFilter");
const genreFilter = document.getElementById("genreFilter");
const resetFilters = document.getElementById("resetFilters");
const rankingCount = document.getElementById("rankingCount");

let allFilms = [];

async function loadRanking() {
	try {
		const { data: films, error } = await supabaseClient
			.from("films")
			.select("*");

		if (error) throw error;

		allFilms = films || [];

		createFilters();
		updateRanking();
	} catch (error) {
		console.error("Errore nel caricamento delle classifiche:", error);

		rankingContainer.innerHTML = `
			<div class="ranking-empty">
				<i class="bi bi-exclamation-triangle"></i>
				<h2>Errore nel caricamento</h2>
				<p>Non è stato possibile caricare la classifica.</p>
			</div>
		`;
	}
}

function createFilters() {
	const years = [...new Set(
		allFilms
			.map(film => film.year)
			.filter(year => year)
	)].sort((a, b) => Number(b) - Number(a));

	years.forEach(year => {
		const option = document.createElement("option");
		option.value = year;
		option.textContent = year;
		yearFilter.appendChild(option);
	});

	const genres = new Set();

	allFilms.forEach(film => {
		if (film.genre) genres.add(film.genre);

		if (Array.isArray(film.genres)) {
			film.genres.forEach(genre => genres.add(genre));
		}
	});

	[...genres]
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b, "it"))
		.forEach(genre => {
			const option = document.createElement("option");
			option.value = genre;
			option.textContent = genre;
			genreFilter.appendChild(option);
		});
}

function updateRanking() {
	const selectedYear = yearFilter.value;
	const selectedGenre = genreFilter.value;

	let films = allFilms.filter(film => {
		const yearMatch =
			!selectedYear ||
			String(film.year) === selectedYear;

		let genreMatch = true;

		if (selectedGenre) {
			genreMatch =
				film.genre === selectedGenre ||
				(Array.isArray(film.genres) &&
					film.genres.includes(selectedGenre));
		}

		return yearMatch && genreMatch;
	});

	films.sort((a, b) => {
		const ratingA = Number(a.rating) || 0;
		const ratingB = Number(b.rating) || 0;

		if (ratingA !== ratingB) {
			return ratingB - ratingA;
		}

		return (Number(b.year) || 0) - (Number(a.year) || 0);
	});

	rankingCount.textContent =
		`${films.length} film${films.length === 1 ? "" : " disponibili"}`;

	displayRanking(films.slice(0, 50));
}

function displayRanking(films) {
	if (!films.length) {
		rankingContainer.innerHTML = `
			<div class="ranking-empty">
				<i class="bi bi-film"></i>
				<h2>Nessun film trovato</h2>
				<p>Non ci sono film che corrispondono ai filtri selezionati.</p>
			</div>
		`;

		return;
	}

	rankingContainer.innerHTML = films.map((film, index) => {
		const position = index + 1;

		let positionClass = "";

		if (position === 1) positionClass = "ranking-first";
		if (position === 2) positionClass = "ranking-second";
		if (position === 3) positionClass = "ranking-third";

		return `
			<a
				href="film-dettaglio.html?id=${film.id}"
				class="ranking-item ${positionClass}"
			>

				<div class="ranking-position">
					${position}
				</div>

				<div class="ranking-poster-wrapper">
					<img
						src="${film.image || ""}"
						alt="${film.title || "Film"}"
						class="ranking-poster"
					>
				</div>

				<div class="ranking-info">
					<h3>
						${film.title || "Titolo sconosciuto"}
					</h3>

					<p>
						${film.year || "—"} · ${film.genre || "—"}
					</p>
				</div>

				<div class="ranking-rating">
					<i class="bi bi-star-fill"></i>
					<strong>${film.rating ?? "—"}</strong>
					<span>/10</span>
				</div>

				<i class="bi bi-chevron-right ranking-arrow"></i>

			</a>
		`;
	}).join("");
}

yearFilter.addEventListener("change", updateRanking);
genreFilter.addEventListener("change", updateRanking);

resetFilters.addEventListener("click", () => {
	yearFilter.value = "";
	genreFilter.value = "";

	updateRanking();
});

loadRanking();