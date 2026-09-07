const filmsContainer = document.getElementById("filmsContainer");

const filmSearch = document.getElementById("filmSearch");

const genreFilter = document.getElementById("genreFilter");

const yearFilter = document.getElementById("yearFilter");

const ratingFilter = document.getElementById("ratingFilter");

let films = [];

async function loadFilms() {

    const {
        data,
        error
    } = await supabaseClient
        .from("films")
        .select("*")
        .order("id", {
            ascending: true
        });

    if (error) {

        console.error(
            "Errore nel caricamento dei film:",
            error
        );

        showFilmNotFound();

        return;
    }

    films = data || [];

    populateGenres();

    populateYears();

    const params =
        new URLSearchParams(window.location.search);

    const selectedGenre =
        params.get("genre");

    if (selectedGenre) {

        const matchingFilms =
            films.filter(film => {

                const filmGenres = (
                    film.generi ||
                    film.genre ||
                    ""
                )
                    .split(",")
                    .map(genre => genre.trim().toLowerCase());

                return filmGenres.includes(
                    selectedGenre.toLowerCase()
                );

            });

        if (!matchingFilms.length) {

            showFilmNotFound();

            return;
        }

        const option =
            [...genreFilter.options].find(
                option =>
                    option.value.toLowerCase() ===
                    selectedGenre.toLowerCase()
            );

        if (option) {
            genreFilter.value = option.value;
        }
    }

    applyFilters();
}

function showFilmNotFound() {

    filmsContainer.innerHTML = `
        <div class="col-12">
            <div class="empty-films">
                <i class="bi bi-film"></i>
                <h2>Film non trovato</h2>
                <p>
                    Non ci sono film disponibili per questo genere.
                </p>
                <button
                    type="button"
                    class="btn btn-light mt-3"
                    onclick="history.back()"
                >
                    <i class="bi bi-arrow-left"></i>
                    Torna indietro
                </button>
            </div>
        </div>
    `;

}

function populateGenres() {

    const genres = new Set();

    films.forEach(film => {

        const filmGenres =
            film.generi ||
            film.genre ||
            "";

        filmGenres
            .split(",")
            .map(genre => genre.trim())
            .filter(Boolean)
            .forEach(genre => {
                genres.add(genre);
            });

    });

    genreFilter.innerHTML = `
        <option value="">Tutti i generi</option>
    `;

    [...genres]
        .sort((a, b) =>
            a.localeCompare(b, "it")
        )
        .forEach(genre => {

            genreFilter.innerHTML += `
                <option value="${genre}">
                    ${genre}
                </option>
            `;

        });

}

function populateYears() {

    const years = new Set();

    films.forEach(film => {

        if (film.year) {
            years.add(film.year);
        }

    });

    yearFilter.innerHTML = `
        <option value="">Tutti gli anni</option>
    `;

    [...years]
        .sort((a, b) => b - a)
        .forEach(year => {

            yearFilter.innerHTML += `
                <option value="${year}">
                    ${year}
                </option>
            `;

        });

}

function applyFilters() {

    const search =
        filmSearch.value
            .trim()
            .toLowerCase();

    const selectedGenre =
        genreFilter.value;

    const selectedYear =
        yearFilter.value;

    const selectedRating =
        ratingFilter.value;

    const filteredFilms =
        films.filter(film => {

            const title =
                (film.title || "")
                    .toLowerCase();

            const filmGenres =
                (
                    film.generi ||
                    film.genre ||
                    ""
                )
                    .split(",")
                    .map(genre =>
                        genre.trim()
                    );

            const matchesSearch =
                !search ||
                title.includes(search);

            const matchesGenre =
                !selectedGenre ||
                filmGenres.some(
                    genre =>
                        genre.toLowerCase() ===
                        selectedGenre.toLowerCase()
                );

            const matchesYear =
                !selectedYear ||
                String(film.year) ===
                selectedYear;

            const matchesRating =
                !selectedRating ||
                Number(film.rating || 0) >=
                Number(selectedRating);

            return (
                matchesSearch &&
                matchesGenre &&
                matchesYear &&
                matchesRating
            );

        });

    displayFilms(filteredFilms);

}

function displayFilms(filteredFilms) {

    if (!filteredFilms.length) {

        showFilmNotFound();

        return;
    }

    filmsContainer.innerHTML =
        filteredFilms.map(film => {

            return `
                <div class="col-6 col-md-4 col-lg-3">

                    <a
                        href="film-dettaglio.html?id=${film.id}"
                        class="film-card-link"
                    >

                        <div class="film-card">

                            <img
                                src="${film.image || ""}"
                                alt="${film.title || "Film"}"
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

                        </div>

                    </a>

                </div>
            `;

        }).join("");

}

filmSearch.addEventListener(
    "input",
    applyFilters
);

genreFilter.addEventListener(
    "change",
    applyFilters
);

yearFilter.addEventListener(
    "change",
    applyFilters
);

ratingFilter.addEventListener(
    "change",
    applyFilters
);

loadFilms();