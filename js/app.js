const currentYear = new Date().getFullYear();

const currentYearElement = document.getElementById("currentYear");

if (currentYearElement) {
	currentYearElement.textContent = currentYear;
}

const heroCarousel = document.getElementById("heroCarousel");
const heroSlides = document.getElementById("heroSlides");
const heroIndicators = document.getElementById("heroIndicators");


async function loadFilms() {
	try {
		/*
		 * Carichiamo TUTTI i film dal database.
		 * In questo modo le statistiche vengono calcolate
		 * sull'intero catalogo e non solamente sui 3 film
		 * mostrati nel carosello.
		 */
		const { data: allFilms, error } = await supabaseClient
			.from("films")
			.select("*");

		if (error) {
			throw error;
		}

		const films = allFilms || [];

		/*
		 * STATISTICHE:
		 * usano tutti i film presenti nel database.
		 */
		updateStats(films);

		/*
		 * CAROSELLO:
		 * prendiamo solamente i 3 film più recenti.
		 */
		const latestFilms = [...films]
			.sort((a, b) => {
				const dateA = new Date(a.created_at || 0);
				const dateB = new Date(b.created_at || 0);

				return dateB - dateA;
			})
			.slice(0, 3);

		updateHero(latestFilms);

	} catch (error) {
		console.error("Errore nel caricamento dei film:", error);
	}
}


function updateHero(films) {
	if (!heroSlides || !heroIndicators) return;

	if (!films.length) {
		heroSlides.innerHTML = `
			<div class="carousel-item active">

				<img
					src="https://placehold.co/1920x1080/111111/ffffff?text=Nessun+film"
					class="hero-image"
					alt="Nessun film disponibile"
				>

				<div class="hero-overlay"></div>

				<div class="hero-content">

					<span class="hero-label">
						FILM IN EVIDENZA
					</span>

					<h1>Nessun film disponibile</h1>

					<p class="hero-info">
						-
						<span>•</span>
						La tua valutazione:
						<strong>-/10</strong>
					</p>

					<p class="hero-description">
						Non ci sono ancora film nel catalogo.
					</p>

				</div>
			</div>
		`;

		heroIndicators.innerHTML = "";

		return;
	}

	heroSlides.innerHTML = "";
	heroIndicators.innerHTML = "";

	films.forEach((film, index) => {

		const title =
			film.titolo ||
			film.title ||
			film.nome ||
			"Film senza titolo";

		const description =
			film.descrizione ||
			film.description ||
			film.trama ||
			"Nessuna descrizione disponibile.";

		const year =
			film.year ||
			film.anno ||
			"-";

		const rating =
			film.rating !== null &&
			film.rating !== undefined &&
			film.rating !== ""
				? Number(film.rating).toFixed(1)
				: "-";

		const image =
			film.immagine ||
			film.image ||
			film.poster ||
			film.poster_url ||
			film.backdrop ||
			film.backdrop_url ||
			film.image_url ||
			"https://placehold.co/1920x1080/111111/ffffff?text=IMMAGINE+404";

		const filmId = film.id || "";

		const slide = document.createElement("div");

		slide.className =
			index === 0
				? "carousel-item active"
				: "carousel-item";

		slide.innerHTML = `
			<img
				src="${image}"
				class="hero-image"
				alt="${title}"
				onerror="this.src='https://placehold.co/1920x1080/111111/ffffff?text=IMMAGINE+404'"
			>

			<div class="hero-overlay"></div>

			<div class="hero-content">

				<span class="hero-label">
					FILM IN EVIDENZA
				</span>

				<h1>${title}</h1>

				<p class="hero-info">
					${year}
					<span>•</span>
					La tua valutazione:
					<strong>${rating}/10</strong>
				</p>

				<p class="hero-description">
					${description}
				</p>

				<a
					href="pagine/film.html${filmId ? "?id=" + encodeURIComponent(filmId) : ""}"
					class="btn btn-light btn-lg"
				>
					<i class="bi bi-play-fill"></i>
					Scopri il film
				</a>

			</div>
		`;

		heroSlides.appendChild(slide);


		const indicator = document.createElement("button");

		indicator.type = "button";
		indicator.dataset.bsTarget = "#heroCarousel";
		indicator.dataset.bsSlideTo = index;

		indicator.setAttribute(
			"aria-label",
			`Film ${index + 1}`
		);

		if (index === 0) {
			indicator.classList.add("active");

			indicator.setAttribute(
				"aria-current",
				"true"
			);
		}

		heroIndicators.appendChild(indicator);
	});


	const oldCarousel =
		bootstrap.Carousel.getInstance(heroCarousel);

	if (oldCarousel) {
		oldCarousel.dispose();
	}

	new bootstrap.Carousel(heroCarousel, {
		interval: 3000,
		ride: "carousel",
		pause: false,
		wrap: true
	});
}


function updateStats(films) {

	/*
	 * Se non ci sono film, azzeriamo le statistiche
	 * invece di lasciare dati vecchi.
	 */
	if (!films.length) {

		const topGenreElement =
			document.getElementById("topGenre");

		const averageRatingElement =
			document.getElementById("averageRating");

		const topYearElement =
			document.getElementById("topYear");

		const filmsWith10Element =
			document.getElementById("filmsWith10");

		if (topGenreElement) {
			topGenreElement.textContent = "-";
		}

		if (averageRatingElement) {
			averageRatingElement.textContent = "-";
		}

		if (topYearElement) {
			topYearElement.textContent = "-";
		}

		if (filmsWith10Element) {
			filmsWith10Element.textContent = "0";
		}

		return;
	}


	/*
	 * =========================
	 * GENERE PIÙ PRESENTE
	 * =========================
	 */

	const genres = {};

	films.forEach(film => {

		const rawGenres =
			film.generi ||
			film.genre ||
			"";

		const filmGenres = String(rawGenres)
			.split(",")
			.map(g => g.trim())
			.filter(Boolean);

		filmGenres.forEach(genre => {

			genres[genre] =
				(genres[genre] || 0) + 1;

		});
	});


	const topGenre =
		Object.entries(genres)
			.sort((a, b) => b[1] - a[1])[0]?.[0] || "-";


	/*
	 * =========================
	 * VALUTAZIONE MEDIA
	 * =========================
	 */

	const ratedFilms = films.filter(film => {

		return (
			film.rating !== null &&
			film.rating !== undefined &&
			film.rating !== "" &&
			!isNaN(Number(film.rating))
		);

	});


	const averageRating =
		ratedFilms.length
			? ratedFilms.reduce(
				(sum, film) =>
					sum + Number(film.rating),
				0
			) / ratedFilms.length
			: 0;


	/*
	 * =========================
	 * ANNO PIÙ VISTO
	 * =========================
	 */

	const years = {};

	films.forEach(film => {

		/*
		 * Consideriamo solamente i film segnati
		 * come visti.
		 */
		if (film.visto) {

			const year =
				film.year ||
				film.anno;

			if (year) {

				const yearString =
					String(year);

				years[yearString] =
					(years[yearString] || 0) + 1;

			}
		}
	});


	const topYear =
		Object.entries(years)
			.sort((a, b) => b[1] - a[1])[0]?.[0] || "-";


	/*
	 * =========================
	 * FILM DA 10
	 * =========================
	 */

	const filmsWith10 =
		films.filter(
			film =>
				Number(film.rating) === 10
		).length;


	/*
	 * =========================
	 * AGGIORNAMENTO HTML
	 * =========================
	 */

	const topGenreElement =
		document.getElementById("topGenre");

	const averageRatingElement =
		document.getElementById("averageRating");

	const topYearElement =
		document.getElementById("topYear");

	const filmsWith10Element =
		document.getElementById("filmsWith10");


	if (topGenreElement) {
		topGenreElement.textContent =
			topGenre;
	}


	if (averageRatingElement) {
		averageRatingElement.textContent =
			averageRating.toFixed(1);
	}


	if (topYearElement) {
		topYearElement.textContent =
			topYear;
	}


	if (filmsWith10Element) {
		filmsWith10Element.textContent =
			filmsWith10;
	}
}


if (heroCarousel) {
	loadFilms();
}


const accountArea =
	document.getElementById("accountArea");


async function updateAccountArea() {

	if (!accountArea) return;

	try {

		const {
			data: { user }
		} = await supabaseClient.auth.getUser();

		if (!user) return;


		accountArea.innerHTML = `
			<span class="btn btn-outline-light">
				<i class="bi bi-person-circle"></i>
				${user.email}
			</span>

			<button
				id="logoutButton"
				class="btn btn-light"
			>
				<i class="bi bi-box-arrow-right"></i>
				Esci
			</button>
		`;


		const logoutButton =
			document.getElementById("logoutButton");


		logoutButton.addEventListener(
			"click",
			async () => {

				await supabaseClient.auth.signOut();

				window.location.reload();

			}
		);

	} catch (error) {

		console.error(
			"Errore caricamento account:",
			error
		);

	}
}


updateAccountArea();


async function checkAdmin() {

	if (!accountArea) return;

	try {

		const {
			data: { user }
		} = await supabaseClient.auth.getUser();

		if (!user) return;


		const {
			data: profile,
			error
		} = await supabaseClient
			.from("profiles")
			.select("role")
			.eq("id", user.id)
			.single();


		if (error) {

			console.error(
				"Errore controllo admin:",
				error
			);

			return;
		}


		if (
			profile &&
			profile.role === "admin"
		) {

			if (
				document.getElementById("adminButton")
			) {
				return;
			}


			const adminButton =
				document.createElement("a");


			const isInsidePagine =
				window.location.pathname
					.includes("/pagine/");


			adminButton.href =
				isInsidePagine
					? "admin.html"
					: "pagine/admin.html";


			adminButton.id =
				"adminButton";


			adminButton.className =
				"btn btn-danger";


			adminButton.innerHTML = `
				<i class="bi bi-shield-lock"></i>
				Pannello Admin
			`;


			accountArea.prepend(
				adminButton
			);

		}

	} catch (error) {

		console.error(
			"Errore controllo accesso admin:",
			error
		);

	}
}


checkAdmin();