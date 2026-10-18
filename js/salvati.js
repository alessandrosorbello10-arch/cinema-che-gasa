const savedFilmsContainer =
    document.getElementById("savedFilmsContainer");

const recommendationsContainer =
    document.getElementById("recommendedFilmsContainer");


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


function normalizeGenre(genre) {
    return String(genre || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}


function getFilmGenres(genreString) {
    return String(genreString || "")
        .split(/[,;|]/)
        .map(genre => genre.trim())
        .filter(Boolean);
}


// CALCOLO DEI SUGGERIMENTI

function calculateRecommendations(savedFilms, allFilms) {
    if (!savedFilms.length || !allFilms.length) {
        return [];
    }

    const savedIds = new Set(
        savedFilms.map(film => String(film.id))
    );

    const genreScores = new Map();

    // Analizza i generi dei film salvati.
    savedFilms.forEach(film => {
        const genres = getFilmGenres(film.genre);

        genres.forEach((genre, index) => {
            const normalized = normalizeGenre(genre);

            if (!normalized) {
                return;
            }

            // Il genere principale vale di più.
            const weight = index === 0 ? 3 : 2;

            genreScores.set(
                normalized,
                (genreScores.get(normalized) || 0) + weight
            );
        });
    });

    // Calcola il punteggio dei film non ancora salvati.
    const candidates = allFilms
        .filter(film => !savedIds.has(String(film.id)))
        .map(film => {
            const genres = getFilmGenres(film.genre);

            const matchedGenres = [
                ...new Set(
                    genres
                        .map(normalizeGenre)
                        .filter(genre => genreScores.has(genre))
                )
            ];

            let genreScore = 0;

            matchedGenres.forEach(genre => {
                genreScore += genreScores.get(genre);
            });

            const rating = Number(film.rating);

            const ratingScore = Number.isFinite(rating)
                ? Math.max(0, Math.min(10, rating)) / 10
                : 0;

            return {
                film,
                matchedGenres,
                score: genreScore + ratingScore
            };
        })
        .filter(item => item.matchedGenres.length > 0)
        .sort((a, b) => b.score - a.score);

    const recommendations = [];
    const usedIds = new Set();

    // Ordina i generi in base alle preferenze dell'utente.
    const preferredGenres = [...genreScores.keys()].sort(
        (a, b) => genreScores.get(b) - genreScores.get(a)
    );

    // Prima prova a inserire un film per ogni genere preferito.
    preferredGenres.forEach(genre => {
        if (recommendations.length >= 5) {
            return;
        }

        const candidate = candidates.find(item =>
            !usedIds.has(String(item.film.id)) &&
            item.matchedGenres.includes(genre)
        );

        if (candidate) {
            recommendations.push(candidate.film);
            usedIds.add(String(candidate.film.id));
        }
    });

    // Completa gli eventuali posti rimasti con i film migliori.
    candidates.forEach(item => {
        if (
            recommendations.length < 5 &&
            !usedIds.has(String(item.film.id))
        ) {
            recommendations.push(item.film);
            usedIds.add(String(item.film.id));
        }
    });

    return recommendations;
}


// CREAZIONE DELLE SCHEDE

function createFilmCard(film, recommendation = false) {
    const column = document.createElement("div");
    column.className = recommendation
        ? "recommended-film-item"
        : "col-6 col-md-4 col-lg-3";

    const card = document.createElement("div");
    card.className = "film-card";

    const link = document.createElement("a");

    link.href =
        `film-dettaglio.html?id=${encodeURIComponent(film.id)}`;

    link.className = "film-card-link";

    const image = document.createElement("img");

    image.src = film.image || "";
    image.alt = film.title || "Film";
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "film-card-info";

    const title = document.createElement("h3");
    title.textContent = film.title || "Titolo sconosciuto";

    const details = document.createElement("p");

    details.textContent =
        `${film.year || "—"} · ${film.genre || "—"}`;

    const rating = document.createElement("span");

    rating.innerHTML = '<i class="bi bi-star-fill"></i> ';

    rating.appendChild(
        document.createTextNode(`${film.rating ?? "—"}/10`)
    );

    info.append(title, details, rating);

    link.append(image, info);
    card.appendChild(link);

    // Il pulsante di rimozione compare solo nei film salvati.
    if (!recommendation) {
        const removeButton = document.createElement("button");

        removeButton.className = "btn btn-sm btn-danger m-2";

        removeButton.innerHTML =
            '<i class="bi bi-bookmark-x"></i> Rimuovi';

        removeButton.addEventListener("click", () => {
            removeSavedFilm(film.id);
        });

        card.appendChild(removeButton);
    }

    column.appendChild(card);

    return column;
}


// CARICAMENTO DEI FILM CONSIGLIATI

async function loadRecommendations(savedFilms) {
    if (!recommendationsContainer) {
        return;
    }

    if (!savedFilms.length) {
        recommendationsContainer.replaceChildren();
        return;
    }

    recommendationsContainer.innerHTML = `
        <div class="text-secondary py-4">
            <i class="bi bi-arrow-repeat"></i>
            Cerco film che potrebbero piacerti...
        </div>
    `;

    const {
        data: allFilms,
        error
    } = await supabaseClient
        .from("films")
        .select("*");

    if (error) {
        console.error(
            "Errore caricamento suggerimenti:",
            error
        );

        recommendationsContainer.innerHTML = `
            <div class="text-secondary py-4">
                Non è stato possibile caricare i suggerimenti.
            </div>
        `;

        return;
    }

    const recommendations = calculateRecommendations(
        savedFilms,
        allFilms || []
    );

    if (!recommendations.length) {
        recommendationsContainer.innerHTML = `
            <div class="text-secondary py-4">
                Non ci sono ancora film da consigliarti.
            </div>
        `;

        return;
    }

    recommendationsContainer.replaceChildren();

    recommendations.forEach(film => {
        recommendationsContainer.appendChild(
            createFilmCard(film, true)
        );
    });
}


// CARICAMENTO DEI FILM SALVATI

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

                    <h2>Accedi per vedere i tuoi film</h2>

                    <p>
                        Devi avere un account per
                        utilizzare i film salvati.
                    </p>
                </div>
            </div>
        `;

        if (recommendationsContainer) {
            recommendationsContainer.replaceChildren();
        }

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

    if (!savedFilms || savedFilms.length === 0) {
        savedFilmsContainer.innerHTML = `
            <div class="col-12">
                <div class="empty-films text-center py-5">
                    <i class="bi bi-bookmark"></i>

                    <h2>Nessun film salvato</h2>

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

        if (recommendationsContainer) {
            recommendationsContainer.innerHTML = `
                <div class="text-secondary py-4">
                    Salva qualche film per ricevere consigli personalizzati.
                </div>
            `;
        }

        return;
    }

    const filmIds = savedFilms.map(item => item.film_id);

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
        (films || []).map(film => [
            String(film.id),
            film
        ])
    );

    const orderedFilms = savedFilms
        .map(saved => filmMap.get(String(saved.film_id)))
        .filter(Boolean);

    savedFilmsContainer.replaceChildren();

    orderedFilms.forEach(film => {
        savedFilmsContainer.appendChild(
            createFilmCard(film)
        );
    });

    await loadRecommendations(orderedFilms);
}


// RIMOZIONE DI UN FILM SALVATO

window.removeSavedFilm = async function(filmId) {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { error } = await supabaseClient
        .from("saved_films")
        .delete()
        .eq("user_id", user.id)
        .eq("film_id", filmId);

    if (error) {
        console.error("Errore rimozione film:", error);

        alert("Non è stato possibile rimuovere il film.");

        return;
    }

    await loadSavedFilms();
};


// SCORRIMENTO DEI FILM CONSIGLIATI

window.scrollRecommendations = function(direction) {
    const container = document.getElementById(
        "recommendedFilmsContainer"
    );

    if (!container) {
        return;
    }

    container.scrollBy({
        left: direction * container.clientWidth * 0.8,
        behavior: "smooth"
    });
};


// AVVIO DELLA PAGINA

document.addEventListener("DOMContentLoaded", () => {
    loadSavedFilms();

    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
});