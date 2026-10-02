let films = [];
let reports = [];
let filmProblems = new Map();

let showProblemsOnly = true;
let imageCheckRunning = false;

const totalReports = document.getElementById("totalReports");
const problemFilms = document.getElementById("problemFilms");
const resolvedReports = document.getElementById("resolvedReports");

const reportSearch = document.getElementById("reportSearch");
const showProblemsButton = document.getElementById("showProblemsButton");
const reportsTable = document.getElementById("reportsTable");

const editFilmModal = document.getElementById("editFilmModal");
const editFilmId = document.getElementById("editFilmId");
const editReportId = document.getElementById("editReportId");

const editTitolo = document.getElementById("editTitolo");
const editAnno = document.getElementById("editAnno");
const editGenere = document.getElementById("editGenere");
const editVoto = document.getElementById("editVoto");
const editDurata = document.getElementById("editDurata");
const editRegista = document.getElementById("editRegista");
const editImmagine = document.getElementById("editImmagine");
const editDescrizione = document.getElementById("editDescrizione");

const editFilmMessage = document.getElementById("editFilmMessage");
const saveFilmButton = document.getElementById("saveFilmButton");


/* =========================
   UTILITÀ
========================= */

function getFilmTitle(film) {
	return film.title || "";
}

function getFilmYear(film) {
	return film.year || "";
}

function getFilmImage(film) {
	return film.image || "";
}


/* =========================
   CONTROLLO CAMPI
========================= */

function checkFilmFields(film) {
	const problems = [];

	if (!String(film.title ?? "").trim()) {
		problems.push({
			key: "title",
			label: "Titolo mancante"
		});
	}

	if (
		film.year === null ||
		film.year === undefined ||
		String(film.year).trim() === ""
	) {
		problems.push({
			key: "year",
			label: "Anno mancante"
		});
	}

	if (!String(film.genre ?? "").trim()) {
		problems.push({
			key: "genre",
			label: "Genere mancante"
		});
	}

	if (
		film.rating === null ||
		film.rating === undefined ||
		String(film.rating).trim() === ""
	) {
		problems.push({
			key: "rating",
			label: "Voto mancante"
		});
	}

	if (!String(film.duration ?? "").trim()) {
		problems.push({
			key: "duration",
			label: "Durata mancante"
		});
	}

	if (!String(film.director ?? "").trim()) {
		problems.push({
			key: "director",
			label: "Regista mancante"
		});
	}

	if (!String(film.image ?? "").trim()) {
		problems.push({
			key: "image",
			label: "Copertina mancante"
		});
	}

	if (!String(film.description ?? "").trim()) {
		problems.push({
			key: "description",
			label: "Descrizione mancante"
		});
	}

	return problems;
}


/* =========================
   CONTROLLO COPERTINA
========================= */

function checkImage(url) {
	return new Promise((resolve) => {
		if (!url || !String(url).trim()) {
			resolve(false);
			return;
		}

		const img = new Image();

		let finished = false;

		const finish = (result) => {
			if (finished) {
				return;
			}

			finished = true;

			img.onload = null;
			img.onerror = null;

			resolve(result);
		};

		img.onload = () => {
			finish(true);
		};

		img.onerror = () => {
			finish(false);
		};

		img.src = String(url).trim();

		/*
			Il timeout NON viene considerato un errore.

			Alcuni server esterni sono molto lenti o impediscono
			il controllo automatico. In quel caso lasciamo il film
			neutro invece di segnalarlo come copertina rotta.
		*/
		setTimeout(() => {
			finish(null);
		}, 10000);
	});
}


/* =========================
   AGGIUNGI PROBLEMA
========================= */

function addFilmProblem(film, problem) {
	const current = filmProblems.get(film.id) || [];

	const alreadyExists = current.some(
		item => item.key === problem.key
	);

	if (!alreadyExists) {
		current.push(problem);
		filmProblems.set(film.id, current);
	}
}


/* =========================
   RIMUOVI PROBLEMA
========================= */

function removeFilmProblem(filmId, key) {
	const current = filmProblems.get(filmId) || [];

	const filtered = current.filter(
		item => item.key !== key
	);

	if (filtered.length === 0) {
		filmProblems.delete(filmId);
	} else {
		filmProblems.set(filmId, filtered);
	}
}


/* =========================
   ANALISI CAMPI
========================= */

function analyzeFilms() {
	filmProblems.clear();

	for (const film of films) {
		const problems = checkFilmFields(film);

		if (problems.length > 0) {
			filmProblems.set(film.id, problems);
		}
	}
}


/* =========================
   CONTROLLO COPERTINE
========================= */

async function checkFilmImages() {
	if (imageCheckRunning) {
		return;
	}

	imageCheckRunning = true;

	const queue = [...films];

	let currentIndex = 0;

	const worker = async () => {
		while (currentIndex < queue.length) {
			const film = queue[currentIndex];

			currentIndex++;

			if (!String(film.image ?? "").trim()) {
				continue;
			}

			const result = await checkImage(film.image);

			/*
				true = immagine funzionante
				false = immagine realmente non caricabile
				null = timeout / impossibile verificare
			*/

			if (result === false) {
				addFilmProblem(film, {
					key: "image",
					label: "Copertina non funzionante"
				});
			}

			if (result === true) {
				removeFilmProblem(film.id, "image");
			}
		}
	};

	/*
		Controlliamo più immagini contemporaneamente
		per evitare che 193 immagini rendano la pagina lenta.
	*/

	const workers = [];

	for (let i = 0; i < 8; i++) {
		workers.push(worker());
	}

	await Promise.all(workers);

	imageCheckRunning = false;

	updateStats();
	renderTable();

	await syncReports();
}


/* =========================
   CREA SEGNALAZIONE
========================= */

async function createReport(filmId, problem) {
	const { data: existing, error: searchError } = await supabaseClient
		.from("films_reports")
		.select("*")
		.eq("film_id", filmId)
		.eq("problem", problem)
		.neq("status", "resolved")
		.limit(1);

	if (searchError) {
		console.error(
			"Errore controllo segnalazione:",
			searchError
		);

		return;
	}

	if (existing && existing.length > 0) {
		return;
	}

	const { error } = await supabaseClient
		.from("films_reports")
		.insert({
			film_id: filmId,
			problem: problem,
			status: "open"
		});

	if (error) {
		console.error(
			"Errore creazione segnalazione:",
			error
		);
	}
}


/* =========================
   RISOLVI SEGNALAZIONI
========================= */

async function resolveFilmReports(filmId) {
	const { error } = await supabaseClient
		.from("films_reports")
		.update({
			status: "resolved"
		})
		.eq("film_id", filmId)
		.neq("status", "resolved");

	if (error) {
		console.error(
			"Errore risoluzione segnalazioni:",
			error
		);
	}
}


/* =========================
   SINCRONIZZA SEGNALAZIONI
========================= */

async function syncReports() {
	/*
		Crea le segnalazioni per i problemi realmente presenti.
	*/

	for (const film of films) {
		const problems = filmProblems.get(film.id) || [];

		for (const problem of problems) {
			await createReport(
				film.id,
				problem.label
			);
		}
	}

	/*
		Risolviamo automaticamente le vecchie segnalazioni
		dei film che ora non hanno più problemi.
	*/

	const openFilmIds = [
		...new Set(
			reports
				.filter(report => report.status !== "resolved")
				.map(report => report.film_id)
		)
	];

	for (const filmId of openFilmIds) {
		const problems = filmProblems.get(filmId) || [];

		if (problems.length === 0) {
			await resolveFilmReports(filmId);
		}
	}

	await reloadReports();
}


/* =========================
   RICARICA SEGNALAZIONI
========================= */

async function reloadReports() {
	const { data, error } = await supabaseClient
		.from("films_reports")
		.select("*")
		.order("created_at", {
			ascending: false
		});

	if (error) {
		console.error(
			"Errore ricaricamento segnalazioni:",
			error
		);

		return;
	}

	reports = data || [];

	updateStats();
}


/* =========================
   STATISTICHE
========================= */

function updateStats() {
	const openReports = reports.filter(
		report => report.status !== "resolved"
	);

	if (totalReports) {
		totalReports.textContent = openReports.length;
	}

	if (problemFilms) {
		problemFilms.textContent = filmProblems.size;
	}

	if (resolvedReports) {
		resolvedReports.textContent =
			reports.filter(
				report => report.status === "resolved"
			).length;
	}
}


/* =========================
   RENDER TABELLA
========================= */

function renderTable() {
	if (!reportsTable) {
		return;
	}

	const search = reportSearch
		? reportSearch.value.trim().toLowerCase()
		: "";

	let visibleFilms = [...films];

	/*
		Mostra solo i film con problemi.
	*/

	if (showProblemsOnly) {
		visibleFilms = visibleFilms.filter(
			film => filmProblems.has(film.id)
		);
	}

	/*
		Ricerca.
	*/

	if (search) {
		visibleFilms = visibleFilms.filter(film => {
			const title = String(
				getFilmTitle(film)
			).toLowerCase();

			const year = String(
				getFilmYear(film)
			).toLowerCase();

			return (
				title.includes(search) ||
				year.includes(search)
			);
		});
	}

	/*
		Nessun risultato.
	*/

	if (visibleFilms.length === 0) {
		reportsTable.innerHTML = `
			<tr>
				<td colspan="6" class="text-center py-4 text-secondary">
					${
						showProblemsOnly
							? "Nessun problema trovato"
							: "Nessun film trovato"
					}
				</td>
			</tr>
		`;

		return;
	}

	reportsTable.innerHTML = visibleFilms
		.map(film => {
			const problems =
				filmProblems.get(film.id) || [];

			const image = getFilmImage(film);

			const problemBadges = problems.length
				? problems
						.map(
							problem => `
								<span class="badge bg-danger me-1 mb-1">
									${escapeHtml(problem.label)}
								</span>
							`
						)
						.join("")
				: `
					<span class="badge bg-success">
						Nessun problema
					</span>
				`;

			const status = problems.length
				? `
					<span class="badge bg-danger">
						Problema
					</span>
				`
				: `
					<span class="badge bg-success">
						OK
					</span>
				`;

			const imageHtml = image
				? `
					<img
						src="${escapeHtml(image)}"
						class="report-film-image"
						alt=""
						loading="lazy"
					>
				`
				: `
					<span class="text-secondary">
						Nessuna
					</span>
				`;

			return `
				<tr>
					<td>
						<strong>
							${escapeHtml(getFilmTitle(film))}
						</strong>
					</td>

					<td>
						${escapeHtml(getFilmYear(film))}
					</td>

					<td>
						${imageHtml}
					</td>

					<td>
						${problemBadges}
					</td>

					<td>
						${status}
					</td>

					<td>
						<button
							class="btn btn-sm btn-outline-light"
							onclick="openEditFilm(${film.id})"
						>
							<i class="bi bi-pencil"></i>
							Modifica
						</button>
					</td>
				</tr>
			`;
		})
		.join("");
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}


/* =========================
   MODIFICA FILM
========================= */

window.openEditFilm = function(id) {
	const film = films.find(
		item => Number(item.id) === Number(id)
	);

	if (!film) {
		return;
	}

	const problems =
		filmProblems.get(film.id) || [];

	editFilmId.value = film.id;

	if (editReportId) {
		const report = reports.find(
			item =>
				Number(item.film_id) ===
					Number(film.id) &&
				item.status !== "resolved"
		);

		editReportId.value = report
			? report.id
			: "";
	}

	editTitolo.value = film.title || "";
	editAnno.value = film.year ?? "";
	editGenere.value = film.genre || "";
	editVoto.value = film.rating ?? "";
	editDurata.value = film.duration || "";
	editRegista.value = film.director || "";
	editImmagine.value = film.image || "";
	editDescrizione.value =
		film.description || "";

	editFilmMessage.textContent = "";

	/*
		Mostriamo solamente i campi problematici.
	*/

	const fields = {
		title: editTitolo,
		year: editAnno,
		genre: editGenere,
		rating: editVoto,
		duration: editDurata,
		director: editRegista,
		image: editImmagine,
		description: editDescrizione
	};

	Object.entries(fields).forEach(
		([key, field]) => {
			const container =
				field.closest(".mb-3") ||
				field.parentElement;

			if (!container) {
				return;
			}

			const hasProblem = problems.some(
				problem => problem.key === key
			);

			container.style.display =
				hasProblem ? "" : "none";
		}
	);

	const modal = bootstrap.Modal.getOrCreateInstance(
		editFilmModal
	);

	modal.show();
};


/* =========================
   SALVA FILM
========================= */

if (saveFilmButton) {
	saveFilmButton.addEventListener(
		"click",
		async () => {
			const id = Number(
				editFilmId.value
			);

			if (!id) {
				return;
			}

			saveFilmButton.disabled = true;

			editFilmMessage.textContent =
				"Salvataggio...";

			const updatedFilm = {
				title: editTitolo.value.trim(),

				year: editAnno.value
					? Number(editAnno.value)
					: null,

				genre: editGenere.value.trim(),

				rating: editVoto.value
					? Number(editVoto.value)
					: null,

				duration:
					editDurata.value.trim(),

				director:
					editRegista.value.trim(),

				image:
					editImmagine.value.trim(),

				description:
					editDescrizione.value.trim()
			};

			const { error } =
				await supabaseClient
					.from("films")
					.update(updatedFilm)
					.eq("id", id);

			if (error) {
				console.error(
					"Errore aggiornamento film:",
					error
				);

				editFilmMessage.textContent =
					"Errore durante il salvataggio.";

				saveFilmButton.disabled = false;

				return;
			}

			/*
				Aggiorniamo il film locale.
			*/

			const index = films.findIndex(
				film =>
					Number(film.id) === id
			);

			if (index !== -1) {
				films[index] = {
					...films[index],
					...updatedFilm
				};
			}

			/*
				Ricalcoliamo i problemi dei campi.
			*/

			analyzeFilms();

			editFilmMessage.textContent =
				"Film salvato correttamente.";

			updateStats();
			renderTable();

			/*
				Richiudiamo il modal dopo poco.
			*/

			setTimeout(() => {
				const modal =
					bootstrap.Modal.getInstance(
						editFilmModal
					);

				if (modal) {
					modal.hide();
				}
			}, 700);

			/*
				Controlliamo anche la nuova copertina.
			*/

			const film = films.find(
				item =>
					Number(item.id) === id
			);

			if (film) {
				const imageResult =
					await checkImage(
						film.image
					);

				if (imageResult === false) {
					addFilmProblem(film, {
						key: "image",
						label:
							"Copertina non funzionante"
					});
				}

				if (imageResult === true) {
					removeFilmProblem(
						film.id,
						"image"
					);
				}

				updateStats();
				renderTable();
			}

			await syncReports();

			saveFilmButton.disabled = false;
		}
	);
}


/* =========================
   RICERCA
========================= */

if (reportSearch) {
	reportSearch.addEventListener(
		"input",
		() => {
			renderTable();
		}
	);
}


/* =========================
   TOGGLE
========================= */

if (showProblemsButton) {
	showProblemsButton.addEventListener(
		"click",
		() => {
			showProblemsOnly =
				!showProblemsOnly;

			if (showProblemsOnly) {
				showProblemsButton.innerHTML = `
					<i class="bi bi-exclamation-triangle"></i>
					Mostra tutti i film
				`;
			} else {
				showProblemsButton.innerHTML = `
					<i class="bi bi-list-check"></i>
					Mostra solo problemi
				`;
			}

			renderTable();
		}
	);
}


/* =========================
   CARICAMENTO DATI
========================= */

async function loadData() {
	if (reportsTable) {
		reportsTable.innerHTML = `
			<tr>
				<td colspan="6" class="text-center py-4 text-secondary">
					<i class="bi bi-arrow-repeat"></i>
					Caricamento film...
				</td>
			</tr>
		`;
	}

	const [
		filmsResult,
		reportsResult
	] = await Promise.all([
		supabaseClient
			.from("films")
			.select("*")
			.order("id", {
				ascending: true
			}),

		supabaseClient
			.from("films_reports")
			.select("*")
			.order("created_at", {
				ascending: false
			})
	]);

	if (filmsResult.error) {
		console.error(
			"Errore caricamento film:",
			filmsResult.error
		);

		if (reportsTable) {
			reportsTable.innerHTML = `
				<tr>
					<td colspan="6" class="text-center text-danger py-4">
						Errore nel caricamento dei film.
					</td>
				</tr>
			`;
		}

		return;
	}

	if (reportsResult.error) {
		console.error(
			"Errore caricamento segnalazioni:",
			reportsResult.error
		);
	}

	films = filmsResult.data || [];
	reports = reportsResult.data || [];

	/*
		Controlliamo subito i campi vuoti.
	*/

	analyzeFilms();

	updateStats();
	renderTable();

	/*
		Successivamente parte il controllo
		delle copertine in background.
	*/

	checkFilmImages();
}


/* =========================
   AVVIO
========================= */

document.addEventListener(
	"DOMContentLoaded",
	() => {
		loadData();
	}
);