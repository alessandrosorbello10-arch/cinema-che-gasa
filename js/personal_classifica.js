const personalSearch = document.getElementById("personalSearch");
const personalStatus = document.getElementById("personalStatus");
const loginNotice = document.getElementById("loginNotice");
const personalRanking = document.getElementById("personalRanking");

let personalFilms = [];
let personalRatings = {};
let currentUser = null;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getFilmTitle(film) {
    return film.title ?? film.titolo ?? "Titolo sconosciuto";
}

function getFilmYear(film) {
    return film.year ?? film.anno ?? "—";
}

function getFilmGenre(film) {
    return film.genre ?? film.genere ?? "—";
}

function getFilmImage(film) {
    return film.image ?? film.immagine ?? film.url_immagine ?? "";
}

function getFilmId(film) {
    return film.id;
}

// CARICAMENTO DELLA CLASSIFICA PERSONALE
async function initializePersonalRanking() {
    try {
        personalStatus.textContent = "Caricamento della classifica...";

        const { data, error } = await supabaseClient.auth.getUser();

        if (error) throw error;

        currentUser = data.user;

        if (!currentUser) {
            loginNotice.hidden = false;
            personalSearch.disabled = true;

            personalRanking.innerHTML = `
                <div class="personal-empty">
                    <i class="bi bi-person-lock"></i>
                    <h3>Accedi per vedere la tua classifica</h3>
                    <p>I tuoi film valutati compariranno qui dopo l'accesso.</p>
                </div>
            `;

            personalStatus.textContent = "";
            return;
        }

        loginNotice.hidden = true;
        personalSearch.disabled = false;

        const [filmsResult, ratingsResult] = await Promise.all([
            supabaseClient
                .from("films")
                .select("*"),

            supabaseClient
                .from("film_ratings")
                .select("film_id, rating")
                .eq("user_id", currentUser.id)
        ]);

        if (filmsResult.error) throw filmsResult.error;
        if (ratingsResult.error) throw ratingsResult.error;

        const films = filmsResult.data || [];
        const ratings = ratingsResult.data || [];

        personalRatings = {};

        ratings.forEach(item => {
            personalRatings[String(item.film_id)] = Number(item.rating);
        });

        // Mantieni soltanto i film a cui l'utente ha assegnato un voto.
        personalFilms = films.filter(film =>
            personalRatings[String(getFilmId(film))] !== undefined
        );

        // Ordina dal voto più alto al più basso.
        personalFilms.sort((a, b) => {
            const ratingDifference =
                personalRatings[String(getFilmId(b))] -
                personalRatings[String(getFilmId(a))];

            if (ratingDifference !== 0) {
                return ratingDifference;
            }

            return getFilmTitle(a).localeCompare(getFilmTitle(b), "it");
        });

        renderPersonalRanking();

        personalStatus.textContent = personalFilms.length === 1
            ? "Hai valutato 1 film."
            : `Hai valutato ${personalFilms.length} film.`;

    } catch (error) {
        console.error("Errore nel caricamento della classifica personale:", error);

        personalRanking.innerHTML = `
            <div class="personal-empty">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Impossibile caricare la classifica</h3>
                <p>Controlla la connessione e riprova.</p>
            </div>
        `;

        personalStatus.textContent = "Errore durante il caricamento.";
    }
}

// VISUALIZZAZIONE DELLA CLASSIFICA
function renderPersonalRanking() {
    const query = personalSearch.value.trim().toLocaleLowerCase("it");

    const filteredFilms = personalFilms.filter(film =>
        getFilmTitle(film).toLocaleLowerCase("it").includes(query)
    );

    if (!filteredFilms.length) {
        const message = personalFilms.length
            ? "Nessun film corrisponde alla ricerca."
            : "La tua classifica è ancora vuota.";

        const description = personalFilms.length
            ? "Prova a cercare un altro titolo."
            : "Assegna un voto a un film dalla sua pagina di dettaglio.";

        personalRanking.innerHTML = `
            <div class="personal-empty">
                <i class="bi bi-film"></i>
                <h3>${escapeHTML(message)}</h3>
                <p>${escapeHTML(description)}</p>
            </div>
        `;

        return;
    }

    personalRanking.innerHTML = filteredFilms.map(film => {
        const id = getFilmId(film);
        const title = getFilmTitle(film);
        const rating = personalRatings[String(id)];

        return `
            <a
                href="film-dettaglio.html?id=${encodeURIComponent(id)}"
                class="personal-rank"
            >
                <div class="personal-position">
                    ${personalFilms.indexOf(film) + 1}
                </div>

                <img
                    class="personal-poster"
                    src="${escapeHTML(getFilmImage(film))}"
                    alt="${escapeHTML(title)}"
                    loading="lazy"
                    onerror="this.style.visibility='hidden'"
                >

                <div class="personal-rank-info">
                    <h3>${escapeHTML(title)}</h3>

                    <p>
                        ${escapeHTML(getFilmYear(film))}
                        · ${escapeHTML(getFilmGenre(film))}
                    </p>
                </div>

                <div class="personal-rank-rating">
                    <i class="bi bi-star-fill"></i>
                    <strong>${rating}</strong>
                    <span>/10</span>
                </div>

                <i class="bi bi-chevron-right"></i>
            </a>
        `;
    }).join("");
}

// RICERCA DEI FILM
personalSearch.addEventListener("input", renderPersonalRanking);

// ANNO CORRENTE
document.getElementById("currentYear").textContent =
    new Date().getFullYear();

// AVVIO
initializePersonalRanking();