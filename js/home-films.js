const heroCarousel = document.getElementById("heroCarousel");
const heroSlides = document.getElementById("heroSlides");
const heroIndicators = document.getElementById("heroIndicators");

const recommendedSection =
    document.querySelector(".home-recommendations");

const recommendedFilms =
    document.getElementById("recommendedFilms");

const recommendedPrev =
    document.getElementById("recommendedPrev");

const recommendedNext =
    document.getElementById("recommendedNext");

async function loadFilms() {
    try {

        const {
            data: allFilms,
            error
        } = await supabaseClient
            .from("films")
            .select("*");

        if (error) {
            throw error;
        }

        const films = allFilms || [];

        updateStats(films);

        const latestFilms = [...films]
            .sort((a, b) => {

                const yearA =
                    Number(a.year || a.anno || 0);

                const yearB =
                    Number(b.year || b.anno || 0);

                return yearB - yearA;

            })
            .slice(0, 3);

        updateHero(latestFilms);

        updateRecommendedFilms(films);

    } catch (error) {

        console.error(
            "Errore nel caricamento dei film:",
            error
        );

    }
}

function updateHero(films) {

    if (!heroSlides || !heroIndicators) {
        return;
    }

    if (!films.length) {

        heroSlides.innerHTML = `
            <div class="carousel-item active">

                <img
                    src="https://placehold.co/1920x1080/111111/ffffff?text=Nessun+film"
                    class="hero-image"
                    alt="Nessun film disponibile"
                >

                <div class="hero-overlay"></div>

                <div class="hero-content">

                    <span class="hero-label">
                        FILM IN EVIDENZA
                    </span>

                    <h1>Nessun film disponibile</h1>

                    <p class="hero-info">
                        -
                        <span>•</span>
                        La tua valutazione:
                        <strong>-/10</strong>
                    </p>

                    <p class="hero-description">
                        Non ci sono ancora film nel catalogo.
                    </p>

                </div>

            </div>
        `;

        heroIndicators.innerHTML = "";

        return;
    }

    heroSlides.innerHTML = "";
    heroIndicators.innerHTML = "";

    films.forEach((film, index) => {

        const title =
            film.titolo ||
            film.title ||
            film.nome ||
            "Film senza titolo";

        const description =
            film.descrizione ||
            film.description ||
            film.trama ||
            "Nessuna descrizione disponibile.";

        const year =
            film.year ||
            film.anno ||
            "-";

        const rating =
            film.rating !== null &&
            film.rating !== undefined &&
            film.rating !== ""
                ? Number(film.rating).toFixed(1)
                : "-";

        const image =
            film.immagine ||
            film.image ||
            film.poster ||
            film.poster_url ||
            film.backdrop ||
            film.backdrop_url ||
            film.image_url ||
            "https://placehold.co/1920x1080/111111/ffffff?text=IMMAGINE+404";

        const filmId = film.id || "";

        const slide = document.createElement("div");

        slide.className =
            index === 0
                ? "carousel-item active"
                : "carousel-item";

        slide.innerHTML = `
            <img
                src="${image}"
                class="hero-image"
                alt="${title}"
                onerror="this.src='https://placehold.co/1920x1080/111111/ffffff?text=IMMAGINE+404'"
            >

            <div class="hero-overlay"></div>

            <div class="hero-content">

                <span class="hero-label">
                    FILM IN EVIDENZA
                </span>

                <h1>${title}</h1>

                <p class="hero-info">
                    ${year}
                    <span>•</span>
                    La tua valutazione:
                    <strong>${rating}/10</strong>
                </p>

                <p class="hero-description">
                    ${description}
                </p>

                <a
                    href="pagine/film-dettaglio.html${filmId ? "?id=" + encodeURIComponent(filmId) : ""}"
                    class="btn btn-light btn-lg"
                >
                    <i class="bi bi-play-fill"></i>
                    Scopri il film
                </a>

            </div>
        `;

        heroSlides.appendChild(slide);

        const indicator =
            document.createElement("button");

        indicator.type = "button";

        indicator.dataset.bsTarget =
            "#heroCarousel";

        indicator.dataset.bsSlideTo =
            index;

        indicator.setAttribute(
            "aria-label",
            `Film ${index + 1}`
        );

        if (index === 0) {

            indicator.classList.add("active");

            indicator.setAttribute(
                "aria-current",
                "true"
            );
        }

        heroIndicators.appendChild(indicator);

    });

    const oldCarousel =
        bootstrap.Carousel.getInstance(
            heroCarousel
        );

    if (oldCarousel) {
        oldCarousel.dispose();
    }

    new bootstrap.Carousel(
        heroCarousel,
        {
            interval: 3000,
            ride: "carousel",
            pause: false,
            wrap: true
        }
    );
}

function updateStats(films) {

    if (!films.length) {

        const topGenreElement =
            document.getElementById("topGenre");

        const averageRatingElement =
            document.getElementById("averageRating");

        const topYearElement =
            document.getElementById("topYear");

        const filmsWith10Element =
            document.getElementById("filmsWith10");

        if (topGenreElement) {
            topGenreElement.textContent = "-";
        }

        if (averageRatingElement) {
            averageRatingElement.textContent = "-";
        }

        if (topYearElement) {
            topYearElement.textContent = "-";
        }

        if (filmsWith10Element) {
            filmsWith10Element.textContent = "0";
        }

        return;
    }

    const genres = {};

    films.forEach(film => {

        const rawGenres =
            film.generi ||
            film.genre ||
            "";

        const filmGenres =
            String(rawGenres)
                .split(",")
                .map(g => g.trim())
                .filter(Boolean);

        filmGenres.forEach(genre => {

            genres[genre] =
                (genres[genre] || 0) + 1;

        });

    });

    const topGenre =
        Object.entries(genres)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const ratedFilms =
        films.filter(film => {

            return (
                film.rating !== null &&
                film.rating !== undefined &&
                film.rating !== "" &&
                !isNaN(Number(film.rating))
            );

        });

    const averageRating =
        ratedFilms.length
            ? ratedFilms.reduce(
                (sum, film) =>
                    sum + Number(film.rating),
                0
            ) / ratedFilms.length
            : 0;

    const years = {};

    films.forEach(film => {

        if (film.visto) {

            const year =
                film.year ||
                film.anno;

            if (year) {

                const yearString =
                    String(year);

                years[yearString] =
                    (years[yearString] || 0) + 1;

            }

        }

    });

    const topYear =
        Object.entries(years)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const filmsWith10 =
        films.filter(
            film =>
                Number(film.rating) === 10
        ).length;

    const topGenreElement =
        document.getElementById("topGenre");

    const averageRatingElement =
        document.getElementById("averageRating");

    const topYearElement =
        document.getElementById("topYear");

    const filmsWith10Element =
        document.getElementById("filmsWith10");

    if (topGenreElement) {
        topGenreElement.textContent =
            topGenre;
    }

    if (averageRatingElement) {
        averageRatingElement.textContent =
            averageRating.toFixed(1);
    }

    if (topYearElement) {
        topYearElement.textContent =
            topYear;
    }

    if (filmsWith10Element) {
        filmsWith10Element.textContent =
            filmsWith10;
    }
}

function updateRecommendedFilms(films) {

    if (!recommendedSection || !recommendedFilms) {
        return;
    }

    const filmsRated10 =
        films
            .filter(
                film =>
                    Number(film.rating) === 10
            )
            .sort((a, b) => {

                const yearA =
                    Number(a.year || a.anno || 0);

                const yearB =
                    Number(b.year || b.anno || 0);

                return yearB - yearA;

            });

    if (!filmsRated10.length) {

        recommendedSection.style.display =
            "none";

        return;
    }

    recommendedSection.style.display =
        "";

    recommendedFilms.innerHTML = "";

    filmsRated10.forEach(film => {

        const title =
            film.titolo ||
            film.title ||
            film.nome ||
            "Film senza titolo";

        const image =
            film.immagine ||
            film.image ||
            film.poster ||
            film.poster_url ||
            film.image_url ||
            "https://placehold.co/600x900/111111/ffffff?text=IMMAGINE+404";

        const filmId =
            film.id || "";

        const card =
            document.createElement("a");

        card.className =
            "recommendation-card";

        card.href =
            `pagine/film-dettaglio.html?id=${encodeURIComponent(filmId)}`;

        card.innerHTML = `
            <div class="recommendation-poster">

                <img
                    src="${image}"
                    alt="${title}"
                    onerror="this.src='https://placehold.co/600x900/111111/ffffff?text=IMMAGINE+404'"
                >

                <div class="recommendation-rating">
                    <i class="bi bi-star-fill"></i>
                    10
                </div>

            </div>

            <div class="recommendation-title">
                ${title}
            </div>
        `;

        recommendedFilms.appendChild(card);

    });

    setupRecommendedCarousel();
}

function setupRecommendedCarousel() {

    if (!recommendedFilms) {
        return;
    }

    if (recommendedPrev) {

        recommendedPrev.onclick = () => {

            const amount =
                getRecommendedScrollAmount();

            recommendedFilms.scrollBy({
                left: -amount,
                behavior: "smooth"
            });

        };

    }

    if (recommendedNext) {

        recommendedNext.onclick = () => {

            const amount =
                getRecommendedScrollAmount();

            const maxScroll =
                recommendedFilms.scrollWidth -
                recommendedFilms.clientWidth;

            if (
                recommendedFilms.scrollLeft >=
                maxScroll - 10
            ) {

                recommendedFilms.scrollTo({
                    left: 0,
                    behavior: "smooth"
                });

                return;
            }

            recommendedFilms.scrollBy({
                left: amount,
                behavior: "smooth"
            });

        };

    }

    startRecommendedAutoScroll();
}

function getRecommendedScrollAmount() {

    const card =
        recommendedFilms.querySelector(
            ".recommendation-card"
        );

    if (!card) {
        return 0;
    }

    const style =
        window.getComputedStyle(
            recommendedFilms
        );

    const gap =
        parseFloat(style.columnGap || style.gap) || 0;

    return card.offsetWidth + gap;
}

let recommendedAutoScroll;

function startRecommendedAutoScroll() {

    clearInterval(
        recommendedAutoScroll
    );

    if (!recommendedFilms) {
        return;
    }

    recommendedAutoScroll =
        setInterval(() => {

            const maxScroll =
                recommendedFilms.scrollWidth -
                recommendedFilms.clientWidth;

            if (maxScroll <= 0) {
                return;
            }

            const amount =
                getRecommendedScrollAmount();

            if (
                recommendedFilms.scrollLeft >=
                maxScroll - 10
            ) {

                recommendedFilms.scrollTo({
                    left: 0,
                    behavior: "smooth"
                });

            } else {

                recommendedFilms.scrollBy({
                    left: amount,
                    behavior: "smooth"
                });

            }

        }, 3500);
}

if (heroCarousel) {
    loadFilms();
}