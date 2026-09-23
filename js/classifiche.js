const rankingContainer = document.getElementById("rankingContainer");

async function loadRanking() {

    try {

        const {
            data: films,
            error
        } = await supabaseClient
            .from("films")
            .select("*")
            .order("rating", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        displayRanking(films || []);

    } catch (error) {

        console.error(
            "Errore nel caricamento delle classifiche:",
            error
        );

        rankingContainer.innerHTML = `
            <div class="ranking-empty">
                <i class="bi bi-exclamation-triangle"></i>
                <h2>Errore nel caricamento</h2>
                <p>Non è stato possibile caricare la classifica.</p>
            </div>
        `;

    }

}

function displayRanking(films) {

    if (!films.length) {

        rankingContainer.innerHTML = `
            <div class="ranking-empty">
                <i class="bi bi-film"></i>
                <h2>Nessun film disponibile</h2>
                <p>
                    La classifica verrà mostrata quando saranno presenti dei film.
                </p>
            </div>
        `;

        return;
    }

    rankingContainer.innerHTML =
        films.map((film, index) => {

            const position = index + 1;

            let positionClass = "";

            if (position === 1) {
                positionClass = "ranking-first";
            } else if (position === 2) {
                positionClass = "ranking-second";
            } else if (position === 3) {
                positionClass = "ranking-third";
            }

            return `
                <a
                    href="film-dettaglio.html?id=${film.id}"
                    class="ranking-item ${positionClass}"
                >

                    <div class="ranking-position">
                        ${position}
                    </div>

                    <img
                        src="${film.image || ""}"
                        alt="${film.title || "Film"}"
                        class="ranking-poster"
                    >

                    <div class="ranking-info">

                        <h3>
                            ${film.title || "Titolo sconosciuto"}
                        </h3>

                        <p>
                            ${film.year || "—"} ·
                            ${film.genre || "—"}
                        </p>

                    </div>

                    <div class="ranking-rating">

                        <i class="bi bi-star-fill"></i>

                        <strong>
                            ${film.rating ?? "—"}
                        </strong>

                        <span>/10</span>

                    </div>

                </a>
            `;

        }).join("");

}

loadRanking();