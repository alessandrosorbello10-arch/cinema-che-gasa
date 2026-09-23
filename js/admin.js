const filmsTable = document.getElementById("filmsTable");
const addFilmButton = document.getElementById("addFilmButton");
const filmFormContainer = document.getElementById("filmFormContainer");
const addFilmForm = document.getElementById("addFilmForm");
const cancelFilmButton = document.getElementById("cancelFilmButton");
const addFilmMessage = document.getElementById("addFilmMessage");

const importCsvButton = document.getElementById("importCsvButton");
const csvFileInput = document.getElementById("csvFileInput");
const csvImportContainer = document.getElementById("csvImportContainer");
const csvImportContent = document.getElementById("csvImportContent");

let editingFilmId = null;

let existingFilms = [];

let csvFilms = [];
let csvApprovedFilms = [];
let csvSkippedFilms = [];
let csvCurrentIndex = 0;


/* =========================
   ACCESSO ADMIN
   ========================= */

async function checkAdminAccess() {

	const {
		data: { user },
		error: userError
	} = await supabaseClient.auth.getUser();

	if (userError || !user) {
		window.location.href = "login.html";
		return;
	}


	const {
		data: profile,
		error: profileError
	} = await supabaseClient
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.single();


	if (profileError || !profile) {

		alert("Non hai i permessi per accedere al pannello.");

		window.location.href = "../index.html";

		return;

	}


	if (profile.role !== "admin") {

		alert(
			"Accesso negato. Questa pagina è riservata agli amministratori."
		);

		window.location.href = "../index.html";

		return;

	}


	await loadAdminDashboard();

}


/* =========================
   DASHBOARD
   ========================= */

async function loadAdminDashboard() {

	const {
		count: usersCount,
		error: usersError
	} = await supabaseClient
		.from("profiles")
		.select("*", {
			count: "exact",
			head: true
		});


	document.getElementById("totalUsers").textContent =
		usersError ? "—" : usersCount || 0;


	const {
		data: films,
		error: filmsError
	} = await supabaseClient
		.from("films")
		.select("*")
		.order("id", {
			ascending: false
		});


	if (filmsError) {

		console.error(filmsError);

		document.getElementById("totalFilms").textContent = "—";
		document.getElementById("averageRating").textContent = "—";

		filmsTable.innerHTML = `
			<tr>
				<td colspan="5" class="text-center">
					Errore nel caricamento dei film.
				</td>
			</tr>
		`;

		return;

	}


	existingFilms = films || [];


	document.getElementById("totalFilms").textContent =
		existingFilms.length;


	const ratings = existingFilms
		.map(film => Number(film.rating))
		.filter(rating => !isNaN(rating));


	const average = ratings.length
		? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
		: 0;


	document.getElementById("averageRating").textContent =
		average.toFixed(1);


	displayFilms(existingFilms);

}


/* =========================
   TABELLA
   ========================= */

function displayFilms(films) {

	if (!films.length) {

		filmsTable.innerHTML = `
			<tr>
				<td colspan="5" class="text-center">
					Nessun film presente nel database.
				</td>
			</tr>
		`;

		return;

	}


	filmsTable.innerHTML = films.map(film => `

		<tr>

			<td>
				${escapeHtml(film.title || "—")}
			</td>

			<td>
				${film.year || "—"}
			</td>

			<td>
				${escapeHtml(film.genre || "—")}
			</td>

			<td>
				${film.rating ?? "—"}
			</td>

			<td>

				<button
					type="button"
					class="btn btn-sm btn-outline-light edit-film-button"
					data-id="${film.id}"
					title="Modifica film"
				>
					<i class="bi bi-pencil"></i>
				</button>

				<button
					type="button"
					class="btn btn-sm btn-outline-danger delete-film-button"
					data-id="${film.id}"
					title="Elimina film"
				>
					<i class="bi bi-trash"></i>
				</button>

			</td>

		</tr>

	`).join("");

}


/* =========================
   AZIONI TABELLA
   ========================= */

filmsTable.addEventListener("click", async event => {

	const editButton =
		event.target.closest(".edit-film-button");

	if (editButton) {

		await editFilm(editButton.dataset.id);

		return;

	}


	const deleteButton =
		event.target.closest(".delete-film-button");

	if (deleteButton) {

		await deleteFilm(deleteButton.dataset.id);

	}

});


/* =========================
   MODIFICA FILM
   ========================= */

async function editFilm(id) {

	const {
		data: film,
		error
	} = await supabaseClient
		.from("films")
		.select("*")
		.eq("id", Number(id))
		.single();


	if (error || !film) {

		alert("Impossibile caricare il film.");

		return;

	}


	editingFilmId = Number(id);


	document.getElementById("filmTitle").value =
		film.title || "";

	document.getElementById("filmYear").value =
		film.year || "";

	document.getElementById("filmGenre").value =
		film.genre || "";

	document.getElementById("filmGenres").value =
		film.generi || "";

	document.getElementById("filmRating").value =
		film.rating ?? "";

	document.getElementById("filmDuration").value =
		film.duration || "";

	document.getElementById("filmDirector").value =
		film.director || "";

	document.getElementById("filmImage").value =
		film.image || "";

	document.getElementById("filmDescription").value =
		film.description || "";


	filmFormContainer.style.display = "block";
	csvImportContainer.style.display = "none";
	addFilmButton.style.display = "none";


	const submitButton =
		addFilmForm.querySelector('button[type="submit"]');


	submitButton.innerHTML =
		'<i class="bi bi-check-lg"></i> Salva modifiche';


	window.scrollTo({
		top: filmFormContainer.offsetTop - 100,
		behavior: "smooth"
	});

}


/* =========================
   ELIMINA
   ========================= */

async function deleteFilm(id) {

	if (!confirm("Sei sicuro di voler eliminare questo film?")) {
		return;
	}


	const { error } = await supabaseClient
		.from("films")
		.delete()
		.eq("id", Number(id));


	if (error) {

		alert(
			"Impossibile eliminare il film.\n\n" +
			error.message
		);

		return;

	}


	await loadAdminDashboard();

}


/* =========================
   AGGIUNTA MANUALE
   ========================= */

addFilmButton.addEventListener("click", () => {

	editingFilmId = null;

	addFilmForm.reset();

	filmFormContainer.style.display = "block";
	csvImportContainer.style.display = "none";
	addFilmButton.style.display = "none";

	addFilmMessage.textContent = "";


	addFilmForm
		.querySelector('button[type="submit"]')
		.innerHTML =
		'<i class="bi bi-plus-lg"></i> Aggiungi film';

});


cancelFilmButton.addEventListener("click", () => {

	editingFilmId = null;

	addFilmForm.reset();

	filmFormContainer.style.display = "none";

	addFilmButton.style.display = "inline-block";

});


/* =========================
   SALVATAGGIO MANUALE
   ========================= */

addFilmForm.addEventListener("submit", async event => {

	event.preventDefault();


	const filmData = {

		title:
			document.getElementById("filmTitle").value.trim(),

		year:
			Number(document.getElementById("filmYear").value),

		genre:
			document.getElementById("filmGenre").value.trim(),

		generi:
			document.getElementById("filmGenres").value.trim(),

		rating:
			Number(document.getElementById("filmRating").value),

		duration:
			document.getElementById("filmDuration").value.trim(),

		director:
			document.getElementById("filmDirector").value.trim(),

		image:
			document.getElementById("filmImage").value.trim(),

		description:
			document.getElementById("filmDescription").value.trim()

	};


	let error;


	if (editingFilmId) {

		const result = await supabaseClient
			.from("films")
			.update(filmData)
			.eq("id", editingFilmId);

		error = result.error;

	} else {

		const result = await supabaseClient
			.from("films")
			.insert(filmData);

		error = result.error;

	}


	if (error) {

		addFilmMessage.textContent =
			"Errore: " + error.message;

		addFilmMessage.className =
			"auth-message error";

		return;

	}


	addFilmMessage.textContent =
		"Film salvato con successo!";

	addFilmMessage.className =
		"auth-message success";


	editingFilmId = null;

	addFilmForm.reset();

	await loadAdminDashboard();


	setTimeout(() => {

		filmFormContainer.style.display = "none";

		addFilmButton.style.display = "inline-block";

		addFilmMessage.textContent = "";

	}, 1000);

});


/* =========================
   IMPORT CSV
   ========================= */

importCsvButton.addEventListener("click", () => {

	csvFileInput.value = "";

	csvFileInput.click();

});


csvFileInput.addEventListener("change", async () => {

	const file = csvFileInput.files[0];

	if (!file) return;


	try {

		const text = await file.text();

		const delimiter =
			detectDelimiter(text);

		const rows =
			parseCSV(text, delimiter);


		if (rows.length < 2) {

			alert("Il CSV non contiene abbastanza dati.");

			return;

		}


		const headers = rows[0].map(header =>
			header
				.replace(/^\uFEFF/, "")
				.trim()
				.toLowerCase()
		);


		const requiredHeaders = [
			"titolo",
			"anno",
			"genere"
		];


		const missingHeaders =
			requiredHeaders.filter(
				header => !headers.includes(header)
			);


		if (missingHeaders.length) {

			alert(
				"Mancano queste colonne obbligatorie:\n\n" +
				missingHeaders.join(", ")
			);

			return;

		}


		csvFilms = rows
			.slice(1)
			.filter(row =>
				row.some(value => value.trim() !== "")
			)
			.map(row => {

				const film = {};

				headers.forEach((header, index) => {

					film[header] =
						(row[index] || "").trim();

				});

				return normalizeCsvFilm(film);

			});


		if (!csvFilms.length) {

			alert("Non sono stati trovati film nel CSV.");

			return;

		}


		csvApprovedFilms = [];
		csvSkippedFilms = [];
		csvCurrentIndex = 0;


		filmFormContainer.style.display = "none";
		addFilmButton.style.display = "none";

		csvImportContainer.style.display = "block";


		renderCsvFilm();


		window.scrollTo({
			top: csvImportContainer.offsetTop - 100,
			behavior: "smooth"
		});


	} catch (error) {

		console.error(error);

		alert(
			"Errore durante la lettura del CSV."
		);

	}

});


/* =========================
   DELIMITATORE CSV
   ========================= */

function detectDelimiter(text) {

	const firstLine =
		text.split(/\r?\n/)[0] || "";


	const semicolons =
		(firstLine.match(/;/g) || []).length;


	const commas =
		(firstLine.match(/,/g) || []).length;


	return semicolons > commas ? ";" : ",";

}


/* =========================
   PARSER CSV
   ========================= */

function parseCSV(text, delimiter) {

	const rows = [];

	let row = [];
	let value = "";
	let insideQuotes = false;


	for (let i = 0; i < text.length; i++) {

		const char = text[i];
		const next = text[i + 1];


		if (
			char === '"' &&
			insideQuotes &&
			next === '"'
		) {

			value += '"';

			i++;

			continue;

		}


		if (char === '"') {

			insideQuotes = !insideQuotes;

			continue;

		}


		if (
			char === delimiter &&
			!insideQuotes
		) {

			row.push(value);

			value = "";

			continue;

		}


		if (
			(char === "\n" || char === "\r") &&
			!insideQuotes
		) {

			if (
				char === "\r" &&
				next === "\n"
			) {
				i++;
			}


			row.push(value);

			rows.push(row);

			row = [];

			value = "";

			continue;

		}


		value += char;

	}


	if (value !== "" || row.length) {

		row.push(value);

		rows.push(row);

	}


	return rows;

}


/* =========================
   NORMALIZZA FILM
   ========================= */

function normalizeCsvFilm(film) {

	return {

		title: film.titolo || "",
		year: film.anno || "",
		genre: film.genere || "",
		generi: film.generi || "",
		rating: "",
		duration: film.durata || "",
		director: film.regista || "",
		image: film.immagine || "",
		description: film.descrizione || ""

	};

}


/* =========================
   CONTROLLO FILM
   ========================= */

function validateCsvFilm(film, index) {

	const errors = [];
	const warnings = [];


	if (!film.title) {
		errors.push("Titolo mancante.");
	}


	const year = Number(film.year);


	if (
		!film.year ||
		!Number.isInteger(year) ||
		year < 1888 ||
		year > 2100
	) {

		errors.push("Anno non valido.");

	}


	if (!film.genre) {
		errors.push("Genere principale mancante.");
	}


	if (!film.image) {

		warnings.push(
			"Copertina mancante."
		);

	} else {

		try {

			const url =
				new URL(film.image);


			if (
				!["http:", "https:"]
					.includes(url.protocol)
			) {

				errors.push(
					"L'URL della copertina non è valido."
				);

			}

		} catch {

			errors.push(
				"L'URL della copertina non è valido."
			);

		}

	}


	const duplicateDatabase =
		existingFilms.find(existing =>
			String(existing.title)
				.trim()
				.toLowerCase() ===
				String(film.title)
					.trim()
					.toLowerCase() &&
			Number(existing.year) === year
		);


	if (duplicateDatabase) {

		warnings.push(
			"Questo film è già presente nel database."
		);

	}


	const duplicateCsv =
		csvFilms.some((other, otherIndex) =>
			otherIndex !== index &&
			String(other.title)
				.trim()
				.toLowerCase() ===
				String(film.title)
					.trim()
					.toLowerCase() &&
			Number(other.year) === year
		);


	if (duplicateCsv) {

		warnings.push(
			"Questo film compare più volte nel CSV."
		);

	}


	return {
		errors,
		warnings
	};

}


/* =========================
   MOSTRA FILM
   ========================= */

function renderCsvFilm() {

	if (csvCurrentIndex >= csvFilms.length) {

		renderCsvSummary();

		return;

	}


	const film =
		csvFilms[csvCurrentIndex];


	const validation =
		validateCsvFilm(
			film,
			csvCurrentIndex
		);


	const current =
		csvCurrentIndex + 1;


	const percentage =
		Math.round(
			(current / csvFilms.length) * 100
		);


	csvImportContent.innerHTML = `

		<div class="csv-progress">

			<div class="d-flex justify-content-between mb-2">

				<strong>
					Film ${current} di ${csvFilms.length}
				</strong>

				<span>
					${percentage}%
				</span>

			</div>


			<div class="progress">

				<div
					class="progress-bar"
					style="width:${percentage}%"
				></div>

			</div>

		</div>


		<div class="admin-csv-review">

			<div class="row g-4">


				<div class="col-md-4">

					<div class="csv-poster-preview">

						${
							film.image
								? `
									<img
										id="csvPosterPreview"
										src="${escapeHtml(film.image)}"
										alt="Poster"
									>

									<div
										id="csvPosterError"
										class="csv-poster-placeholder"
										style="display:none;"
									>
										<i class="bi bi-image"></i>
										<span>Immagine non disponibile</span>
									</div>
								`
								: `
									<div class="csv-poster-placeholder">
										<i class="bi bi-image"></i>
										<span>Nessuna copertina</span>
									</div>
								`
						}

					</div>

				</div>


				<div class="col-md-8">

					<div class="csv-film-fields">


						<div>

							<label>
								Titolo
							</label>

							<input
								type="text"
								id="csvTitle"
								class="form-control"
								value="${escapeHtml(film.title)}"
							>

						</div>


						<div>

							<label>
								Anno
							</label>

							<input
								type="number"
								id="csvYear"
								class="form-control"
								value="${escapeHtml(film.year)}"
							>

						</div>


						<div>

							<label>
								Genere
							</label>

							<input
								type="text"
								id="csvGenre"
								class="form-control"
								value="${escapeHtml(film.genre)}"
							>

						</div>


						<div>

							<label>
								Generi
							</label>

							<input
								type="text"
								id="csvGenres"
								class="form-control"
								value="${escapeHtml(film.generi)}"
							>

						</div>


						<div>

							<label>
								Durata
							</label>

							<input
								type="text"
								id="csvDuration"
								class="form-control"
								value="${escapeHtml(film.duration)}"
							>

						</div>


						<div>

							<label>
								Regista
							</label>

							<input
								type="text"
								id="csvDirector"
								class="form-control"
								value="${escapeHtml(film.director)}"
							>

						</div>


						<div class="csv-important-field">

							<label>
								<i class="bi bi-image"></i>
								URL copertina
							</label>

							<input
								type="url"
								id="csvImage"
								class="form-control"
								value="${escapeHtml(film.image)}"
							>

							<small>
								Se la copertina è sbagliata, sostituisci qui il link.
							</small>

						</div>


						<div class="csv-important-field">

							<label>
								<i class="bi bi-star-fill"></i>
								Il mio voto
							</label>

							<input
								type="number"
								id="csvRating"
								class="form-control csv-rating-input"
								min="0"
								max="10"
								step="0.1"
								placeholder="Es. 8.5"
							>

							<small>
								Inserisci il tuo voto da 0 a 10.
							</small>

						</div>


						<div>

							<label>
								Descrizione
							</label>

							<textarea
								id="csvDescription"
								class="form-control"
								rows="4"
							>${escapeHtml(film.description)}</textarea>

						</div>


					</div>

				</div>

			</div>


			${renderValidation(validation)}


			<div class="csv-actions">

				<button
					type="button"
					class="btn btn-light"
					id="csvConfirmButton"
				>
					<i class="bi bi-check-lg"></i>
					Conferma e continua
				</button>


				<button
					type="button"
					class="btn btn-outline-light"
					id="csvSkipButton"
				>
					<i class="bi bi-skip-forward"></i>
					Salta
				</button>


				<button
					type="button"
					class="btn btn-outline-danger"
					id="csvCancelButton"
				>
					<i class="bi bi-x-lg"></i>
					Annulla importazione
				</button>

			</div>

		</div>

	`;


	const poster =
		document.getElementById("csvPosterPreview");


	if (poster) {

		poster.addEventListener("error", () => {

			poster.style.display = "none";

			const error =
				document.getElementById("csvPosterError");

			if (error) {
				error.style.display = "flex";
			}

		});

	}


	document
		.getElementById("csvImage")
		.addEventListener("input", updatePosterPreview);


	document
		.getElementById("csvConfirmButton")
		.addEventListener("click", confirmCsvFilm);


	document
		.getElementById("csvSkipButton")
		.addEventListener("click", skipCsvFilm);


	document
		.getElementById("csvCancelButton")
		.addEventListener("click", cancelCsvImport);

}


/* =========================
   ANTEPRIMA COPERTINA
   ========================= */

function updatePosterPreview() {

	const url =
		document.getElementById("csvImage").value.trim();

	const poster =
		document.getElementById("csvPosterPreview");

	const error =
		document.getElementById("csvPosterError");


	if (!poster || !error) return;


	if (!url) {

		poster.style.display = "none";
		error.style.display = "flex";

		return;

	}


	poster.src = url;
	poster.style.display = "block";
	error.style.display = "none";

}


/* =========================
   VALIDAZIONE
   ========================= */

function renderValidation(validation) {

	let html = "";


	if (validation.errors.length) {

		html += `

			<div class="alert alert-danger csv-alert">

				<strong>
					<i class="bi bi-exclamation-triangle"></i>
					Problemi da correggere
				</strong>

				<ul class="mb-0 mt-2">

					${validation.errors.map(error =>
						`<li>${escapeHtml(error)}</li>`
					).join("")}

				</ul>

			</div>

		`;

	}


	if (validation.warnings.length) {

		html += `

			<div class="alert alert-warning csv-alert">

				<strong>
					<i class="bi bi-exclamation-circle"></i>
					Attenzione
				</strong>

				<ul class="mb-0 mt-2">

					${validation.warnings.map(warning =>
						`<li>${escapeHtml(warning)}</li>`
					).join("")}

				</ul>

			</div>

		`;

	}


	if (
		!validation.errors.length &&
		!validation.warnings.length
	) {

		html = `

			<div class="alert alert-success csv-alert">

				<i class="bi bi-check-circle"></i>

				Dati controllati. Inserisci il tuo voto e puoi continuare.

			</div>

		`;

	}


	return html;

}


/* =========================
   DATI FORM CSV
   ========================= */

function getCsvFilmFromForm() {

	return {

		title:
			document.getElementById("csvTitle").value.trim(),

		year:
			document.getElementById("csvYear").value.trim(),

		genre:
			document.getElementById("csvGenre").value.trim(),

		generi:
			document.getElementById("csvGenres").value.trim(),

		rating:
			document.getElementById("csvRating").value.trim(),

		duration:
			document.getElementById("csvDuration").value.trim(),

		director:
			document.getElementById("csvDirector").value.trim(),

		image:
			document.getElementById("csvImage").value.trim(),

		description:
			document.getElementById("csvDescription").value.trim()

	};

}


/* =========================
   CONFERMA
   ========================= */

function confirmCsvFilm() {

	const film =
		getCsvFilmFromForm();


	const validation =
		validateCsvFilm(
			film,
			csvCurrentIndex
		);


	if (validation.errors.length) {

		alert(
			"Correggi prima gli errori indicati."
		);

		return;

	}


	const rating =
		Number(
			String(film.rating)
				.replace(",", ".")
		);


	if (
		film.rating === "" ||
		isNaN(rating) ||
		rating < 0 ||
		rating > 10
	) {

		alert(
			"Devi inserire il tuo voto da 0 a 10."
		);

		document
			.getElementById("csvRating")
			.focus();

		return;

	}


	film.rating = rating;


	csvFilms[csvCurrentIndex] = film;

	csvApprovedFilms.push(film);

	csvCurrentIndex++;

	renderCsvFilm();

}


/* =========================
   SALTA
   ========================= */

function skipCsvFilm() {

	csvSkippedFilms.push(
		csvFilms[csvCurrentIndex]
	);

	csvCurrentIndex++;

	renderCsvFilm();

}


/* =========================
   ANNULLA
   ========================= */

function cancelCsvImport() {

	if (
		!confirm(
			"Vuoi annullare l'importazione?"
		)
	) {
		return;
	}


	csvFilms = [];
	csvApprovedFilms = [];
	csvSkippedFilms = [];
	csvCurrentIndex = 0;


	csvImportContainer.style.display = "none";

	addFilmButton.style.display = "inline-block";

}


/* =========================
   RIEPILOGO
   ========================= */

function renderCsvSummary() {

	const total =
		csvFilms.length;

	const approved =
		csvApprovedFilms.length;

	const skipped =
		csvSkippedFilms.length;


	csvImportContent.innerHTML = `

		<div class="csv-summary text-center">

			<i class="bi bi-check-circle csv-summary-icon"></i>

			<h2>
				Controllo completato
			</h2>

			<p>
				Hai controllato tutti i film del CSV.
			</p>


			<div class="row g-3 justify-content-center my-4">


				<div class="col-sm-4">

					<div class="admin-stat">

						<i class="bi bi-film"></i>

						<div>

							<span>Totali</span>

							<strong>
								${total}
							</strong>

						</div>

					</div>

				</div>


				<div class="col-sm-4">

					<div class="admin-stat">

						<i class="bi bi-check-lg"></i>

						<div>

							<span>Da importare</span>

							<strong>
								${approved}
							</strong>

						</div>

					</div>

				</div>


				<div class="col-sm-4">

					<div class="admin-stat">

						<i class="bi bi-skip-forward"></i>

						<div>

							<span>Saltati</span>

							<strong>
								${skipped}
							</strong>

						</div>

					</div>

				</div>

			</div>


			<div class="d-flex justify-content-center gap-2 flex-wrap">

				<button
					type="button"
					class="btn btn-light"
					id="finalImportButton"
					${approved ? "" : "disabled"}
				>

					<i class="bi bi-cloud-arrow-up"></i>

					Importa ${approved} film

				</button>


				<button
					type="button"
					class="btn btn-outline-light"
					id="closeCsvButton"
				>
					Chiudi
				</button>

			</div>


			<div
				id="csvFinalMessage"
				class="auth-message mt-4"
			></div>

		</div>

	`;


	document
		.getElementById("finalImportButton")
		.addEventListener(
			"click",
			importApprovedFilms
		);


	document
		.getElementById("closeCsvButton")
		.addEventListener("click", () => {

			csvImportContainer.style.display = "none";

			addFilmButton.style.display = "inline-block";

		});

}


/* =========================
   IMPORTAZIONE DATABASE
   ========================= */

async function importApprovedFilms() {

	const button =
		document.getElementById("finalImportButton");

	const message =
		document.getElementById("csvFinalMessage");


	button.disabled = true;

	button.innerHTML =
		'<i class="bi bi-hourglass-split"></i> Importazione...';


	message.textContent =
		"Sto salvando i film nel database...";


	const filmsToInsert =
		csvApprovedFilms.map(film => ({

			title: film.title,

			year: Number(film.year),

			genre: film.genre,

			generi: film.generi,

			rating: Number(film.rating),

			duration: film.duration,

			director: film.director,

			image: film.image,

			description: film.description

		}));


	const { error } =
		await supabaseClient
			.from("films")
			.insert(filmsToInsert);


	if (error) {

		button.disabled = false;

		button.innerHTML =
			'<i class="bi bi-arrow-repeat"></i> Riprova';

		message.textContent =
			"Errore: " + error.message;

		message.className =
			"auth-message error";

		return;

	}


	message.textContent =
		`${filmsToInsert.length} film importati con successo!`;

	message.className =
		"auth-message success";


	await loadAdminDashboard();


	setTimeout(() => {

		csvImportContainer.style.display = "none";

		addFilmButton.style.display = "inline-block";

		csvFilms = [];
		csvApprovedFilms = [];
		csvSkippedFilms = [];
		csvCurrentIndex = 0;

	}, 1200);

}


/* =========================
   ESCAPE HTML
   ========================= */

function escapeHtml(value) {

	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

}


checkAdminAccess();