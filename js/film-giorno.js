async function caricaFilmGiorno() {

    const contenitore = document.getElementById("filmGiorno");

    try {

        // Recupera la data italiana

        const dataOggi = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Europe/Rome",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());


        // Controlla se esiste già il film di oggi

        const { data: filmSalvato, error: erroreSalvato } =
            await supabaseClient
                .from("film_giorno")
                .select("*")
                .eq("data", dataOggi)
                .maybeSingle();

        if (erroreSalvato) throw erroreSalvato;


        let film;


        if (filmSalvato) {

            // Recupera il film già selezionato

            const { data, error } = await supabaseClient
                .from("films")
                .select("*")
                .eq("id", filmSalvato.film_id)
                .single();

            if (error) throw error;

            film = data;

        } else {

            // Recupera gli ultimi 365 giorni

            const dataLimite = new Date(dataOggi + "T12:00:00");

            dataLimite.setDate(dataLimite.getDate() - 364);

            const limite = dataLimite.toISOString().split("T")[0];

            const { data: storico, error: erroreStorico } =
                await supabaseClient
                    .from("film_giorno")
                    .select("*")
                    .gte("data", limite)
                    .lt("data", dataOggi)
                    .order("data", { ascending: false });

            if (erroreStorico) throw erroreStorico;


            // Recupera tutti i film

            const { data: films, error: erroreFilms } =
                await supabaseClient
                    .from("films")
                    .select("*");

            if (erroreFilms) throw erroreFilms;


            // Film già utilizzati

            const utilizzati = storico.map(f => String(f.film_id));

            // Generi utilizzati negli ultimi 3 giorni

            const generiRecenti = storico
                .slice(0, 3)
                .map(f => f.genere.toLowerCase());


            // Filtra i film disponibili

            const disponibili = films.filter(f => {

                const genere = String(f.genre || f.generi || "")
                    .split(",")[0]
                    .trim()
                    .toLowerCase();

                return (
                    !utilizzati.includes(String(f.id)) &&
                    genere !== "" &&
                    !generiRecenti.includes(genere)
                );

            });


            if (disponibili.length === 0) {
                throw new Error("Nessun film disponibile per oggi.");
            }


            // Selezione casuale

            film = disponibili[
                Math.floor(Math.random() * disponibili.length)
            ];


            const genereFilm = String(film.genre || film.generi || "")
                .split(",")[0]
                .trim();


            // Salva la selezione su Supabase

            const { error: erroreInserimento } =
                await supabaseClient
                    .from("film_giorno")
                    .insert({
                        data: dataOggi,
                        film_id: film.id,
                        genere: genereFilm
                    });

            if (erroreInserimento) {

                // Se un altro dispositivo ha già effettuato
                // la selezione, recupera quella salvata.

                if (erroreInserimento.code === "23505") {

                    const { data: salvato, error } =
                        await supabaseClient
                            .from("film_giorno")
                            .select("*")
                            .eq("data", dataOggi)
                            .single();

                    if (error) throw error;

                    const { data, error: erroreFilm } =
                        await supabaseClient
                            .from("films")
                            .select("*")
                            .eq("id", salvato.film_id)
                            .single();

                    if (erroreFilm) throw erroreFilm;

                    film = data;

                } else {

                    throw erroreInserimento;

                }

            }

        }


        // Mostra il film

        contenitore.innerHTML = `

            <div class="film-giorno-card">

                <img
                    src="${film.image || '../img/logo_cinema-che-gasa.png'}"
                    alt="${film.title}"
                    class="film-giorno-poster"
                >

                <div class="film-giorno-info">

                    <div class="film-giorno-etichetta">
                        FILM SELEZIONATO DEL GIORNO
                    </div>

                    <h2>${film.title}</h2>

                    <div class="film-giorno-meta">

                        <span>${film.year || "Anno sconosciuto"}</span>

                        <span>${film.genre || film.generi || "Genere sconosciuto"}</span>

                        <span class="film-giorno-voto">
                            <i class="bi bi-star-fill"></i>
                            ${film.rating ?? "N/D"}
                        </span>

                    </div>

                    <p>
                        ${film.description || "Nessuna descrizione disponibile."}
                    </p>

                </div>

            </div>

        `;

    } catch (errore) {

        console.error("Errore Film del giorno:", errore);

        contenitore.innerHTML = `
            <div class="film-giorno-errore">
                <h3>Impossibile caricare il film del giorno.</h3>
                <p>Riprova più tardi.</p>
            </div>
        `;

    }

}


caricaFilmGiorno();