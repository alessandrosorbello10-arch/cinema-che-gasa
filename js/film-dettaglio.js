const filmTitle = document.getElementById("filmTitle");
const filmPoster = document.getElementById("filmPoster");
const filmInfo = document.getElementById("filmInfo");
const filmYear = document.getElementById("filmYear");
const filmDuration = document.getElementById("filmDuration");
const filmDescription = document.getElementById("filmDescription");
const filmRating = document.getElementById("filmRating");
const filmDirector = document.getElementById("filmDirector");
const filmGenres = document.getElementById("filmGenres");
const filmBackdrop = document.querySelector(".film-detail-backdrop");

const params = new URLSearchParams(window.location.search);
const filmId = Number(params.get("id"));

async function loadFilm() {

    if (!filmId) {

        filmTitle.textContent = "Film non trovato";
        filmDescription.textContent =
            "Il film richiesto non esiste nella collezione.";

        return;
    }

    try {

        const {
            data: film,
            error
        } = await supabaseClient
            .from("films")
            .select("*")
            .eq("id", filmId)
            .single();

        if (error || !film) {

            console.error(
                "Errore caricamento film:",
                error
            );

            filmTitle.textContent = "Film non trovato";

            filmDescription.textContent =
                "Il film richiesto non esiste nella collezione.";

            return;
        }

        document.title =
            `${film.title} - Cinema che Gasa`;

        filmTitle.textContent =
            film.title || "Titolo sconosciuto";

        filmPoster.src =
            film.image || "";

        filmPoster.alt =
            film.title || "Film";

        filmInfo.textContent =
            film.genre || "-";

        filmYear.textContent =
            film.year || "-";

        filmDuration.textContent =
            film.duration || "-";

        filmDescription.textContent =
            film.description || "Nessuna descrizione disponibile.";

        filmRating.textContent =
            film.rating ?? "-";

        filmDirector.textContent =
            film.director || "-";

        filmGenres.textContent =
            film.generi || film.genre || "-";

        if (filmBackdrop && film.image) {

            filmBackdrop.style.backgroundImage =
                `url("${film.image}")`;

        }

    } catch (error) {

        console.error(
            "Errore nel caricamento del film:",
            error
        );

        filmTitle.textContent = "Errore";

        filmDescription.textContent =
            "Impossibile caricare le informazioni del film.";

    }

}

loadFilm();