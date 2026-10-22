const filmsContainer = document.getElementById("filmsContainer");
const filmsPagination = document.getElementById("filmsPagination");
const filmSearch = document.getElementById("filmSearch");
const genreFilter = document.getElementById("genreFilter");
const yearFilter = document.getElementById("yearFilter");
const ratingFilter = document.getElementById("ratingFilter");

const FILMS_PER_PAGE = 50;
const METADATA_BATCH_SIZE = 500;
const FALLBACK_IMAGE = "../img/logo_cinema-che-gasa.png";

let films = [];
let filteredFilms = [];
let currentPage = 1;
let renderRequestId = 0;

// Genera un ordine casuale stabile per ogni giorno.
function dailyShuffle(array) {
    const shuffled = [...array];

    const today = new Date();

    const dateString =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

    let seed = 0;

    for (let i = 0; i < dateString.length; i++) {
        seed = (
            seed * 31 +
            dateString.charCodeAt(i)
        ) >>> 0;
    }

    function random() {
        seed = (
            seed * 1664525 +
            1013904223
        ) >>> 0;

        return seed / 4294967296;
    }

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));

        [shuffled[i], shuffled[j]] = [
            shuffled[j],
            shuffled[i]
        ];
    }

    return shuffled;
}

// Protegge i contenuti inseriti nell'HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}

// Mostra un indicatore di caricamento.
function showLoading(message = "Stiamo preparando il catalogo...") {
    filmsContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div
                class="spinner-border text-danger"
                role="status"
            >
                <span class="visually-hidden">
                    Caricamento...
                </span>
            </div>

            <p class="mt-3">
                ${escapeHTML(message)}
            </p>
        </div>
    `;
}

// Recupera solamente i dati essenziali dei film.
// Non scarica ancora le copertine e le descrizioni.
async function loadFilmMetadata() {
    const allMetadata = [];
    let offset = 0;

    while (true) {
        const {
            data,
            error
        } = await supabaseClient
            .from("films")
            .select("id,title,year,genre,rating")
            .order("id", {
                ascending: true
            })
            .range(
                offset,
                offset + METADATA_BATCH_SIZE - 1
            );

        if (error) {
            throw error;
        }

        const batch = data || [];

        allMetadata.push(...batch);

        if (batch.length < METADATA_BATCH_SIZE) {
            break;
        }

        offset += METADATA_BATCH_SIZE;
    }

    return allMetadata;
}

// Carica i dati essenziali del catalogo.
async function loadFilms() {
    showLoading();

    filmsPagination.innerHTML = "";

    try {
        const metadata = await loadFilmMetadata();

        films = dailyShuffle(metadata);

        populateGenres();
        populateYears();

        // Mantiene il filtro per genere presente nell'URL.
        const params = new URLSearchParams(
            window.location.search
        );

        const selectedGenre = params.get("genre");

        if (selectedGenre) {
            const normalizedGenre =
                selectedGenre.trim().toLowerCase();

            const matchingFilms = films.filter(film => {
                const filmGenres = (
                    film.genre || ""
                )
                    .split(",")
                    .map(genre => genre.trim().toLowerCase());

                return filmGenres.includes(normalizedGenre);
            });

            if (!matchingFilms.length) {
                showFilmNotFound();
                return;
            }

            const option = [
                ...genreFilter.options
            ].find(option =>
                option.value.toLowerCase() === normalizedGenre
            );

            if (option) {
                genreFilter.value = option.value;
            }
        }

        applyFilters();

    } catch (error) {
        console.error(
            "Errore nel caricamento dei film:",
            error
        );

        filmsContainer.innerHTML = `
            <div class="col-12">
                <div class="empty-films">
                    <i class="bi bi-exclamation-circle"></i>

                    <h2>Errore di caricamento</h2>

                    <p>
                        Non è stato possibile caricare
                        il catalogo. Riprova tra poco.
                    </p>

                    <button
                        type="button"
                        class="btn btn-light mt-3"
                        id="retryFilmsButton"
                    >
                        Riprova
                    </button>
                </div>
            </div>
        `;

        filmsPagination.innerHTML = "";

        document
            .getElementById("retryFilmsButton")
            ?.addEventListener("click", loadFilms);
    }
}

// Mostra il messaggio quando non ci sono risultati.
function showFilmNotFound() {
    filmsContainer.innerHTML = `
        <div class="col-12">
            <div class="empty-films">
                <i class="bi bi-film"></i>

                <h2>Film non trovato</h2>

                <p>
                    Non ci sono film disponibili
                    con questi criteri.
                </p>

                <button
                    type="button"
                    class="btn btn-light mt-3"
                    id="backToFilmsButton"
                >
                    <i class="bi bi-arrow-left"></i>
                    Torna indietro
                </button>
            </div>
        </div>
    `;

    filmsPagination.innerHTML = "";

    document
        .getElementById("backToFilmsButton")
        ?.addEventListener("click", () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "film.html";
            }
        });
}

// Popola il filtro dei generi.
function populateGenres() {
    const genres = new Set();

    films.forEach(film => {
        (film.genre || "")
            .split(",")
            .map(genre => genre.trim())
            .filter(Boolean)
            .forEach(genre => genres.add(genre));
    });

    genreFilter.innerHTML = `
        <option value="">Tutti i generi</option>
    `;

    [...genres]
        .sort((a, b) => a.localeCompare(b, "it"))
        .forEach(genre => {
            const option = document.createElement("option");

            option.value = genre;
            option.textContent = genre;

            genreFilter.appendChild(option);
        });
}

// Popola il filtro degli anni.
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
            const option = document.createElement("option");

            option.value = year;
            option.textContent = year;

            yearFilter.appendChild(option);
        });
}

// Applica ricerca e filtri a tutto il catalogo.
function applyFilters() {
    const search = filmSearch.value
        .trim()
        .toLowerCase();

    const selectedGenre = genreFilter.value;
    const selectedYear = yearFilter.value;
    const selectedRating = ratingFilter.value;

    filteredFilms = films.filter(film => {
        const title = (
            film.title || ""
        ).toLowerCase();

        const filmGenres = (
            film.genre || ""
        )
            .split(",")
            .map(genre => genre.trim());

        const matchesSearch =
            !search || title.includes(search);

        const matchesGenre =
            !selectedGenre ||
            filmGenres.some(genre =>
                genre.toLowerCase() ===
                selectedGenre.toLowerCase()
            );

        const matchesYear =
            !selectedYear ||
            String(film.year) === selectedYear;

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

    currentPage = 1;

    displayFilms();
}

// Recupera le informazioni complete di soli 50 film.
async function loadPageFilms(pageFilms) {
    const ids = pageFilms.map(film => film.id);

    if (!ids.length) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("films")
        .select("*")
        .in("id", ids);

    if (error) {
        throw error;
    }

    const completeFilms = data || [];

    // Supabase non garantisce l'ordine degli ID nella risposta.
    const filmsById = new Map(
        completeFilms.map(film => [
            String(film.id),
            film
        ])
    );

    return ids
        .map(id => filmsById.get(String(id)))
        .filter(Boolean);
}

// Crea una scheda per un film.
function createFilmCard(film, index) {
    const image = film.image || "";
    const title = film.title || "Titolo sconosciuto";
    const year = film.year || "—";
    const genre = film.genre || "—";
    const rating = film.rating ?? "—";

    // Priorità alle prime due immagini.
    const loading = index < 2 ? "eager" : "lazy";
    const priority = index === 0 ? "high" : "auto";

    const imageHTML = image
        ? `
            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                loading="${loading}"
                decoding="async"
                fetchpriority="${priority}"
                onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${FALLBACK_IMAGE}';}"
            >
        `
        : `
            <img
                src="${FALLBACK_IMAGE}"
                alt="${escapeHTML(title)}"
                loading="lazy"
                decoding="async"
            >
        `;

    return `
        <div class="col-6 col-md-4 col-lg-3">
            <a
                href="film-dettaglio.html?id=${encodeURIComponent(film.id)}"
                class="film-card-link"
            >
                <div class="film-card">
                    ${imageHTML}

                    <div class="film-card-info">
                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        <p>
                            ${escapeHTML(year)} ·
                            ${escapeHTML(genre)}
                        </p>

                        <span>
                            <i class="bi bi-star-fill"></i>
                            ${escapeHTML(rating)}/10
                        </span>
                    </div>
                </div>
            </a>
        </div>
    `;
}

// Mostra la pagina corrente e carica i relativi film.
async function displayFilms() {
    const requestId = ++renderRequestId;
    const totalFilms = filteredFilms.length;

    if (!totalFilms) {
        showFilmNotFound();
        return;
    }

    const totalPages = Math.ceil(
        totalFilms / FILMS_PER_PAGE
    );

    currentPage = Math.min(
        Math.max(currentPage, 1),
        totalPages
    );

    const startIndex =
        (currentPage - 1) * FILMS_PER_PAGE;

    const endIndex = Math.min(
        startIndex + FILMS_PER_PAGE,
        totalFilms
    );

    // Questi sono i dati essenziali dei 50 film richiesti.
    const pageMetadata = filteredFilms.slice(
        startIndex,
        endIndex
    );

    showLoading(
        `Caricamento dei film ${startIndex + 1}–${endIndex}...`
    );

    try {
        // Scarica le informazioni complete solo per questa pagina.
        const pageFilms = await loadPageFilms(pageMetadata);

        // Ignora le risposte di richieste precedenti.
        if (requestId !== renderRequestId) {
            return;
        }

        if (!pageFilms.length) {
            showFilmNotFound();
            return;
        }

        filmsContainer.innerHTML = pageFilms
            .map((film, index) =>
                createFilmCard(film, index)
            )
            .join("");

        renderPagination(
            totalFilms,
            totalPages,
            startIndex,
            endIndex
        );

    } catch (error) {
        if (requestId !== renderRequestId) {
            return;
        }

        console.error(
            "Errore nel caricamento della pagina:",
            error
        );

        filmsContainer.innerHTML = `
            <div class="col-12">
                <div class="empty-films">
                    <i class="bi bi-exclamation-circle"></i>

                    <h2>Errore di caricamento</h2>

                    <p>
                        Non è stato possibile caricare
                        questa pagina di film.
                    </p>

                    <button
                        type="button"
                        class="btn btn-light mt-3"
                        id="retryPageButton"
                    >
                        Riprova
                    </button>
                </div>
            </div>
        `;

        filmsPagination.innerHTML = "";

        document
            .getElementById("retryPageButton")
            ?.addEventListener("click", displayFilms);
    }
}

// Calcola i numeri da mostrare nella navigazione.
function getVisiblePages(totalPages) {
    const pages = new Set([
        1,
        totalPages,
        currentPage,
        currentPage - 1,
        currentPage + 1
    ]);

    return [...pages]
        .filter(page =>
            page >= 1 && page <= totalPages
        )
        .sort((a, b) => a - b);
}

// Crea la paginazione.
function renderPagination(
    totalFilms,
    totalPages,
    startIndex,
    endIndex
) {
    const firstFilm = startIndex + 1;
    const lastFilm = endIndex;

    let pagesHTML = "";

    const visiblePages = getVisiblePages(totalPages);

    for (let i = 0; i < visiblePages.length; i++) {
        const page = visiblePages[i];
        const previousPage = visiblePages[i - 1];

        if (
            previousPage !== undefined &&
            page - previousPage > 1
        ) {
            pagesHTML += `
                <span
                    class="pagination-ellipsis"
                    aria-hidden="true"
                >
                    …
                </span>
            `;
        }

        pagesHTML += `
            <button
                type="button"
                class="pagination-number ${
                    page === currentPage ? "active" : ""
                }"
                data-page="${page}"
                aria-label="Pagina ${page}"
                ${
                    page === currentPage
                        ? 'aria-current="page"'
                        : ""
                }
            >
                ${page}
            </button>
        `;
    }

    filmsPagination.innerHTML = `
        <div class="pagination-info">
            <span class="pagination-info-icon">
                <i class="bi bi-film"></i>
            </span>

            <span>
                Film
                <strong>${firstFilm}–${lastFilm}</strong>
                di
                <strong>${totalFilms}</strong>
            </span>
        </div>

        <nav
            class="pagination-controls"
            aria-label="Paginazione del catalogo"
        >
            <button
                type="button"
                class="pagination-arrow"
                data-page="${currentPage - 1}"
                aria-label="Pagina precedente"
                ${currentPage === 1 ? "disabled" : ""}
            >
                <i class="bi bi-chevron-left"></i>
                <span>Precedente</span>
            </button>

            <div class="pagination-numbers">
                ${pagesHTML}
            </div>

            <button
                type="button"
                class="pagination-arrow"
                data-page="${currentPage + 1}"
                aria-label="Pagina successiva"
                ${
                    currentPage === totalPages
                        ? "disabled"
                        : ""
                }
            >
                <span>Successiva</span>
                <i class="bi bi-chevron-right"></i>
            </button>
        </nav>
    `;
}

// Gestisce i cambi di pagina.
filmsPagination.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");

    if (!button || button.disabled) {
        return;
    }

    const requestedPage = Number(button.dataset.page);

    const totalPages = Math.ceil(
        filteredFilms.length / FILMS_PER_PAGE
    );

    if (
        !Number.isInteger(requestedPage) ||
        requestedPage < 1 ||
        requestedPage > totalPages ||
        requestedPage === currentPage
    ) {
        return;
    }

    currentPage = requestedPage;

    displayFilms();

    const header = document.querySelector(".films-header");

    if (header) {
        header.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});

// Eventi di ricerca e filtri.
filmSearch.addEventListener("input", applyFilters);
genreFilter.addEventListener("change", applyFilters);
yearFilter.addEventListener("change", applyFilters);
ratingFilter.addEventListener("change", applyFilters);

// Avvia il catalogo.
loadFilms();