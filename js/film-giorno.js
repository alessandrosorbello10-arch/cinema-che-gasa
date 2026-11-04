document.addEventListener("DOMContentLoaded", async () => {

    const contenitore = document.getElementById("filmGiorno");

    try {

        const { data, error } = await supabaseClient
            .rpc("get_film_giorno");

        if (error) throw error;

        const film = data[0];

        contenitore.innerHTML = `
            <div class="film-giorno-contatore">
                FILM N. ${Math.floor((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - new Date(new Date().getFullYear(), 0, 0)) / 86400000)} / 365
            </div>

            <div class="film-giorno-card">

                <div class="film-giorno-poster">
                    <img
                        src="${film.immagine}"
                        alt="${film.titolo}"
                        class="film-giorno-immagine"
                    >
                </div>

                <div class="film-giorno-info">

                    <h2>${film.titolo}</h2>

                    <div class="film-giorno-meta">
                        <span>${film.anno}</span>
                        <span>${film.genere}</span>
                        <span>
                            <i class="bi bi-star-fill"></i>
                            ${film.voto}/10
                        </span>
                    </div>

                    <div class="film-giorno-descrizione">
                        ${film.descrizione || "Nessuna descrizione disponibile."}
                    </div>

                </div>

            </div>
        `;

    } catch (error) {

        console.error("ERRORE COMPLETO:", error);

        console.log("MESSAGE:", error.message);
        console.log("DETAILS:", error.details);
        console.log("HINT:", error.hint);
        console.log("CODE:", error.code);

        contenitore.innerHTML = `
            <p>Impossibile caricare il Film del Giorno.</p>
        `;

    }

});