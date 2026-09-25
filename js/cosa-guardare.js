const pickerStart = document.getElementById("pickerStart");
const pickerQuestions = document.getElementById("pickerQuestions");
const pickerLoading = document.getElementById("pickerLoading");
const pickerResult = document.getElementById("pickerResult");
const pickerError = document.getElementById("pickerError");
const startButton = document.getElementById("startButton");
const nextButton = document.getElementById("nextButton");
const previousButton = document.getElementById("previousButton");
const retryButton = document.getElementById("retryButton");
const restartButton = document.getElementById("restartButton");
const errorRestartButton = document.getElementById("errorRestartButton");
const questionNumber = document.getElementById("questionNumber");
const questions = document.querySelectorAll(".picker-question");
const resultImage = document.getElementById("resultImage");
const resultTitle = document.getElementById("resultTitle");
const resultYear = document.getElementById("resultYear");
const resultGenre = document.getElementById("resultGenre");
const resultRating = document.getElementById("resultRating");
const resultDuration = document.getElementById("resultDuration");
const resultDescription = document.getElementById("resultDescription");
const resultLink = document.getElementById("resultLink");
let currentQuestion = 1;
let films = [];
let filteredFilms = [];
let currentFilm = null;
let isChangingFilm = false;
const preferences = {
	genre: "qualsiasi",
	rating: 0,
	duration: "any",
	surprise: "balanced"
};

function showScreen(screen) {
	document.querySelectorAll(".picker-screen").forEach(item => {
		item.classList.remove("active");
	});
	screen.classList.add("active");
}

function showQuestion(number) {
	currentQuestion = number;
	questions.forEach(question => {
		question.classList.toggle("active", Number(question.dataset.question) === number);
	});
	questionNumber.textContent = number;
	previousButton.style.visibility = number === 1 ? "hidden" : "visible";
	nextButton.innerHTML = number === 4 ? '<i class="bi bi-stars"></i> Trova il film' : 'Avanti <i class="bi bi-arrow-right"></i>';
}

function loadFilms() {
	return supabaseClient.from("films").select("*");
}

function normalize(value) {
	return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesGenre(film) {
	if (preferences.genre === "qualsiasi") return true;
	const genre = normalize(`${film.genre || ""} ${film.generi || ""}`);
	return genre.includes(normalize(preferences.genre));
}

function matchesRating(film) {
	const rating = Number(film.rating);
	return !Number.isNaN(rating) && rating >= Number(preferences.rating);
}

function getDuration(film) {
	const duration = String(film.duration || "").match(/\d+/);
	return duration ? Number(duration[0]) : null;
}

function matchesDuration(film) {
	if (preferences.duration === "any") return true;
	const duration = getDuration(film);
	if (duration === null) return true;
	if (preferences.duration === "short") return duration < 90;
	if (preferences.duration === "normal") return duration >= 90 && duration <= 120;
	if (preferences.duration === "long") return duration > 120;
	return true;
}

function filterFilms() {
	filteredFilms = films.filter(film => matchesGenre(film) && matchesRating(film) && matchesDuration(film));
}

function chooseFilm(direction = "left") {
	if (!filteredFilms.length) {
		showScreen(pickerError);
		return;
	}

	const available = filteredFilms.filter(film => !currentFilm || film.id !== currentFilm.id);
	const pool = available.length ? available : filteredFilms;

	if (preferences.surprise === "safe") {
		pool.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
		currentFilm = pool[0];
	} else if (preferences.surprise === "balanced") {
		const sorted = [...pool].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
		const top = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.4)));
		currentFilm = top[Math.floor(Math.random() * top.length)];
	} else {
		currentFilm = pool[Math.floor(Math.random() * pool.length)];
	}

	showResult(direction);
}

function updateResultContent() {
	resultImage.src = currentFilm.image || "../img/no-image.jpg";
	resultImage.alt = `Locandina di ${currentFilm.title}`;
	resultTitle.textContent = currentFilm.title || "Titolo non disponibile";
	resultYear.textContent = currentFilm.year || "";
	resultGenre.textContent = currentFilm.generi || currentFilm.genre || "Genere non disponibile";
	resultRating.textContent = currentFilm.rating || "N/D";
	resultDuration.textContent = currentFilm.duration || "N/D";
	resultDescription.textContent = currentFilm.description || "Nessuna descrizione disponibile.";
	resultLink.href = `film-dettaglio.html?id=${encodeURIComponent(currentFilm.id)}`;
}

function showResult(direction = "left") {
	const resultCard = document.querySelector(".result-card");

	if (resultCard && pickerResult.classList.contains("active") && !isChangingFilm) {
		isChangingFilm = true;
		resultCard.classList.remove("slide-in-left", "slide-in-right", "slide-out-left", "slide-out-right");
		resultCard.classList.add(direction === "left" ? "slide-out-left" : "slide-out-right");

		setTimeout(() => {
			updateResultContent();
			resultCard.classList.remove("slide-out-left", "slide-out-right");
			resultCard.classList.add(direction === "left" ? "slide-in-right" : "slide-in-left");

			setTimeout(() => {
				resultCard.classList.remove("slide-in-left", "slide-in-right");
				isChangingFilm = false;
			}, 450);
		}, 350);

		return;
	}

	updateResultContent();
	showScreen(pickerResult);
}

async function findFilm() {
	showScreen(pickerLoading);

	try {
		const { data, error } = await loadFilms();

		if (error) {
			console.error(error);
			showScreen(pickerError);
			return;
		}

		films = data || [];
		filterFilms();

		setTimeout(() => chooseFilm("left"), 900);
	} catch (error) {
		console.error(error);
		showScreen(pickerError);
	}
}

startButton.addEventListener("click", () => {
	currentFilm = null;
	showScreen(pickerQuestions);
	showQuestion(1);
});

nextButton.addEventListener("click", () => {
	const question = document.querySelector(`.picker-question[data-question="${currentQuestion}"]`);
	const selected = question.querySelector(".selected");

	if (!selected) {
		question.querySelector("button").focus();
		return;
	}

	if (currentQuestion === 4) {
		findFilm();
		return;
	}

	showQuestion(currentQuestion + 1);
});

previousButton.addEventListener("click", () => {
	if (currentQuestion > 1) showQuestion(currentQuestion - 1);
});

questions.forEach(question => {
	question.querySelectorAll("button").forEach(button => {
		button.addEventListener("click", () => {
			question.querySelectorAll("button").forEach(item => item.classList.remove("selected"));
			button.classList.add("selected");

			const value = button.dataset.value;

			if (question.dataset.question === "1") preferences.genre = value;
			if (question.dataset.question === "2") preferences.rating = Number(value);
			if (question.dataset.question === "3") preferences.duration = value;
			if (question.dataset.question === "4") preferences.surprise = value;
		});
	});
});

retryButton.addEventListener("click", () => {
	if (isChangingFilm) return;
	const direction = Math.random() > 0.5 ? "left" : "right";
	chooseFilm(direction);
});

restartButton.addEventListener("click", () => {
	currentFilm = null;
	isChangingFilm = false;
	showScreen(pickerStart);
});

errorRestartButton.addEventListener("click", () => {
	currentFilm = null;
	isChangingFilm = false;
	showScreen(pickerQuestions);
	showQuestion(1);
});
