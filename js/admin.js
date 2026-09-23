const filmsTable = document.getElementById("filmsTable");

const addFilmButton = document.getElementById("addFilmButton");

const filmFormContainer = document.getElementById("filmFormContainer");

const addFilmForm = document.getElementById("addFilmForm");

const cancelFilmButton = document.getElementById("cancelFilmButton");

const addFilmMessage = document.getElementById("addFilmMessage");

let editingFilmId = null;

async function checkAdminAccess() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        window.location.href = "login.html";
        return;
    }

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        alert("Non hai i permessi per accedere al pannello.");
        window.location.href = "../index.html";
        return;
    }

    if (profile.role !== "admin") {
        alert("Accesso negato. Questa pagina è riservata agli amministratori.");
        window.location.href = "../index.html";
        return;
    }

    await loadAdminDashboard();
}

async function loadAdminDashboard() {

    const {
        count: usersCount,
        error: usersError
    } = await supabaseClient
        .from("profiles")
        .select("*", {
            count: "exact",
            head: true
        });

    document.getElementById("totalUsers").textContent =
        usersError ? "—" : usersCount || 0;

    const {
        data: films,
        error: filmsError
    } = await supabaseClient
        .from("films")
        .select("*")
        .order("id", {
            ascending: false
        });

    if (filmsError) {

        console.error("Errore caricamento film:", filmsError);

        document.getElementById("totalFilms").textContent = "—";
        document.getElementById("averageRating").textContent = "—";

        filmsTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    Errore nel caricamento dei film.
                </td>
            </tr>
        `;

        return;
    }

    document.getElementById("totalFilms").textContent =
        films.length;

    const ratings = films
        .map(film => Number(film.rating))
        .filter(rating => !isNaN(rating));

    const average = ratings.length
        ? ratings.reduce(
            (sum, rating) => sum + rating,
            0
        ) / ratings.length
        : 0;

    document.getElementById("averageRating").textContent =
        average.toFixed(1);

    displayFilms(films);
}

function displayFilms(films) {

    if (!films.length) {

        filmsTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    Nessun film presente nel database.
                </td>
            </tr>
        `;

        return;
    }

    filmsTable.innerHTML = films.map(film => `
        <tr>
            <td>
                ${film.title || "—"}
            </td>

            <td>
                ${film.year || "—"}
            </td>

            <td>
                ${film.genre || "—"}
            </td>

            <td>
                ${film.rating ?? "—"}
            </td>

            <td>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-light edit-film-button"
                    data-id="${film.id}"
                    title="Modifica film"
                >
                    <i class="bi bi-pencil"></i>
                </button>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger delete-film-button"
                    data-id="${film.id}"
                    title="Elimina film"
                >
                    <i class="bi bi-trash"></i>
                </button>

            </td>
        </tr>
    `).join("");
}

filmsTable.addEventListener("click", async event => {

    const editButton =
        event.target.closest(".edit-film-button");

    if (editButton) {

        const id = editButton.dataset.id;

        await editFilm(id);

        return;
    }

    const deleteButton =
        event.target.closest(".delete-film-button");

    if (deleteButton) {

        const id = deleteButton.dataset.id;

        await deleteFilm(id);
    }
});

async function editFilm(id) {

    const {
        data: film,
        error
    } = await supabaseClient
        .from("films")
        .select("*")
        .eq("id", Number(id))
        .single();

    if (error || !film) {

        console.error(
            "Errore caricamento film da modificare:",
            error
        );

        alert("Impossibile caricare il film.");

        return;
    }

    editingFilmId = Number(id);

    document.getElementById("filmTitle").value =
        film.title || "";

    document.getElementById("filmYear").value =
        film.year || "";

    document.getElementById("filmGenre").value =
        film.genre || "";

    document.getElementById("filmGenres").value =
        film.generi || "";

    document.getElementById("filmRating").value =
        film.rating ?? "";

    document.getElementById("filmDuration").value =
        film.duration || "";

    document.getElementById("filmDirector").value =
        film.director || "";

    document.getElementById("filmImage").value =
        film.image || "";

    document.getElementById("filmDescription").value =
        film.description || "";

    filmFormContainer.style.display = "block";

    addFilmButton.style.display = "none";

    addFilmMessage.textContent = "";

    const submitButton =
        addFilmForm.querySelector('button[type="submit"]');

    if (submitButton) {

        submitButton.innerHTML =
            '<i class="bi bi-check-lg"></i> Salva modifiche';
    }

    window.scrollTo({
        top: filmFormContainer.offsetTop - 100,
        behavior: "smooth"
    });
}

async function deleteFilm(id) {

    const confirmed = confirm(
        "Sei sicuro di voler eliminare questo film?"
    );

    if (!confirmed) return;

    const {
        error
    } = await supabaseClient
        .from("films")
        .delete()
        .eq("id", Number(id));

    if (error) {

        console.error(
            "Errore eliminazione film:",
            error
        );

        alert(
            "Impossibile eliminare il film.\n\n" +
            error.message
        );

        return;
    }

    await loadAdminDashboard();
}

addFilmButton.addEventListener("click", () => {

    editingFilmId = null;

    addFilmForm.reset();

    filmFormContainer.style.display = "block";

    addFilmButton.style.display = "none";

    addFilmMessage.textContent = "";

    const submitButton =
        addFilmForm.querySelector('button[type="submit"]');

    if (submitButton) {

        submitButton.innerHTML =
            '<i class="bi bi-plus-lg"></i> Aggiungi film';
    }

    window.scrollTo({
        top: filmFormContainer.offsetTop - 100,
        behavior: "smooth"
    });
});

cancelFilmButton.addEventListener("click", () => {

    editingFilmId = null;

    addFilmForm.reset();

    addFilmMessage.textContent = "";

    filmFormContainer.style.display = "none";

    addFilmButton.style.display = "inline-block";

    const submitButton =
        addFilmForm.querySelector('button[type="submit"]');

    if (submitButton) {

        submitButton.innerHTML =
            '<i class="bi bi-plus-lg"></i> Aggiungi film';
    }
});

addFilmForm.addEventListener("submit", async event => {

    event.preventDefault();

    addFilmMessage.textContent =
        editingFilmId
            ? "Salvataggio modifiche..."
            : "Salvataggio in corso...";

    addFilmMessage.className =
        "auth-message";

    const title =
        document.getElementById("filmTitle").value.trim();

    const year =
        Number(
            document.getElementById("filmYear").value
        );

    const genre =
        document.getElementById("filmGenre").value.trim();

    const generi =
        document.getElementById("filmGenres").value.trim();

    const rating =
        Number(
            document.getElementById("filmRating").value
        );

    const duration =
        document.getElementById("filmDuration").value.trim();

    const director =
        document.getElementById("filmDirector").value.trim();

    const image =
        document.getElementById("filmImage").value.trim();

    const description =
        document.getElementById("filmDescription").value.trim();

    const filmData = {
        title,
        year,
        genre,
        generi,
        rating,
        duration,
        director,
        image,
        description
    };

    let error;

    if (editingFilmId) {

        const result =
            await supabaseClient
                .from("films")
                .update(filmData)
                .eq("id", editingFilmId);

        error = result.error;

    } else {

        const result =
            await supabaseClient
                .from("films")
                .insert(filmData);

        error = result.error;
    }

    if (error) {

        console.error(
            "Errore salvataggio film:",
            error
        );

        addFilmMessage.textContent =
            "Errore durante il salvataggio: " +
            error.message;

        addFilmMessage.className =
            "auth-message error";

        return;
    }

    addFilmMessage.textContent =
        editingFilmId
            ? "Film modificato con successo!"
            : "Film aggiunto con successo!";

    addFilmMessage.className =
        "auth-message success";

    editingFilmId = null;

    addFilmForm.reset();

    await loadAdminDashboard();

    setTimeout(() => {

        filmFormContainer.style.display = "none";

        addFilmButton.style.display = "inline-block";

        addFilmMessage.textContent = "";

        const submitButton =
            addFilmForm.querySelector('button[type="submit"]');

        if (submitButton) {

            submitButton.innerHTML =
                '<i class="bi bi-plus-lg"></i> Aggiungi film';
        }

    }, 1200);
});

checkAdminAccess();