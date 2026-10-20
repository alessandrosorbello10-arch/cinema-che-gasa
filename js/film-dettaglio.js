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

const personalRatingButtons = document.getElementById("personalRatingButtons");
const personalRatingStatus = document.getElementById("personalRatingStatus");

const params = new URLSearchParams(window.location.search);
const filmId = Number(params.get("id"));

let personalRatingUser = null;
let currentPersonalRating = null;

async function loadFilm() {
    if (!filmId) {
        filmTitle.textContent = "Film non trovato";
        filmDescription.textContent =
            "Il film richiesto non esiste nella collezione.";
        return;
    }

    try {
        const { data: film, error } = await supabaseClient
            .from("films")
            .select("*")
            .eq("id", filmId)
            .single();

        if (error || !film) {
            console.error("Errore caricamento film:", error);
            filmTitle.textContent = "Film non trovato";
            filmDescription.textContent =
                "Il film richiesto non esiste nella collezione.";
            return;
        }

        document.title = `${film.title} - Cinema che Gasa`;

        filmTitle.textContent = film.title || "Titolo sconosciuto";
        filmPoster.src = film.image || "";
        filmPoster.alt = film.title || "Film";
        filmInfo.textContent = film.genre || "-";
        filmYear.textContent = film.year || "-";
        filmDuration.textContent = film.duration || "-";
        filmDescription.textContent =
            film.description || "Nessuna descrizione disponibile.";
        filmRating.textContent = film.rating ?? "-";
        filmDirector.textContent = film.director || "-";
        filmGenres.textContent = film.generi || film.genre || "-";

        if (filmBackdrop && film.image) {
            filmBackdrop.style.backgroundImage = `url("${film.image}")`;
        }
    } catch (error) {
        console.error("Errore nel caricamento del film:", error);
        filmTitle.textContent = "Errore";
        filmDescription.textContent =
            "Impossibile caricare le informazioni del film.";
    }
}

// CARICAMENTO DEL VOTO PERSONALE
async function initializePersonalRating() {
    if (!personalRatingButtons || !personalRatingStatus) return;

    try {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error) throw error;

        personalRatingUser = data.user;

        if (!personalRatingUser) {
            personalRatingStatus.textContent =
                "Accedi per assegnare e salvare il tuo voto.";

            personalRatingButtons.querySelectorAll("button").forEach(button => {
                button.disabled = true;
            });

            return;
        }

        const { data: savedRating, error: ratingError } = await supabaseClient
            .from("film_ratings")
            .select("rating")
            .eq("user_id", personalRatingUser.id)
            .eq("film_id", filmId)
            .maybeSingle();

        if (ratingError) throw ratingError;

        if (savedRating) {
            currentPersonalRating = Number(savedRating.rating);
            updatePersonalRatingButtons();

            personalRatingStatus.textContent =
                `Il tuo voto: ${currentPersonalRating}/10`;
        }
    } catch (error) {
        console.error("Errore nel caricamento del voto personale:", error);

        personalRatingStatus.textContent =
            "Impossibile caricare il tuo voto.";
    }
}

// AGGIORNAMENTO VISIVO DEI PULSANTI
function updatePersonalRatingButtons() {
    if (!personalRatingButtons) return;

    personalRatingButtons.querySelectorAll("button").forEach(button => {
        const rating = Number(button.dataset.rating);

        const selected =
            currentPersonalRating !== null &&
            rating <= currentPersonalRating;

        button.classList.toggle("selected", selected);

        button.setAttribute(
            "aria-pressed",
            String(rating === currentPersonalRating)
        );
    });
}

// SALVATAGGIO O RIMOZIONE DEL VOTO
async function savePersonalRating(rating) {
    if (!personalRatingUser) {
        personalRatingStatus.textContent =
            "Accedi per salvare il tuo voto.";
        return;
    }

    const previousRating = currentPersonalRating;
    const removeRating = previousRating === rating;

    personalRatingButtons.querySelectorAll("button").forEach(button => {
        button.disabled = true;
    });

    personalRatingStatus.textContent = removeRating
        ? "Rimozione del voto..."
        : "Salvataggio del voto...";

    try {
        if (removeRating) {
            const { error } = await supabaseClient
                .from("film_ratings")
                .delete()
                .eq("user_id", personalRatingUser.id)
                .eq("film_id", filmId);

            if (error) throw error;

            currentPersonalRating = null;
            personalRatingStatus.textContent = "Voto rimosso.";
        } else {
            const { error } = await supabaseClient
                .from("film_ratings")
                .upsert({
                    user_id: personalRatingUser.id,
                    film_id: filmId,
                    rating: rating,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: "user_id,film_id"
                });

            if (error) throw error;

            currentPersonalRating = rating;

            personalRatingStatus.textContent =
                `Voto ${rating}/10 salvato correttamente.`;
        }

        updatePersonalRatingButtons();
    } catch (error) {
        console.error("Errore nella gestione del voto personale:", error);

        personalRatingStatus.textContent =
            "Operazione non riuscita. Riprova.";
    } finally {
        personalRatingButtons.querySelectorAll("button").forEach(button => {
            button.disabled = !personalRatingUser;
        });
    }
}

// EVENTI DEI PULSANTI
if (personalRatingButtons) {
    personalRatingButtons.addEventListener("click", event => {
        const button = event.target.closest("button[data-rating]");

        if (!button || button.disabled) return;

        savePersonalRating(Number(button.dataset.rating));
    });
}

// AVVIO
loadFilm();
initializePersonalRating();