const heroCarousel = document.getElementById("heroCarousel");
const heroSlides = document.getElementById("heroSlides");
const heroIndicators = document.getElementById("heroIndicators");

const recommendedSection = document.querySelector(".home-recommendations");
const recommendedFilms = document.getElementById("recommendedFilms");
const recommendedPrev = document.getElementById("recommendedPrev");
const recommendedNext = document.getElementById("recommendedNext");

async function loadFilms() {
    try {
        const { data: allFilms, error } = await supabaseClient
            .from("films")
            .select("*");

        if (error) {
            throw error;
        }

        const films = allFilms || [];

        updateStats(films);

        const latestFilms = selectDailyHeroFilms(films, 4);

        updateHero(latestFilms);
        updateRecommendedFilms(films);
    } catch (error) {
        console.error("Errore nel caricamento dei film:", error);
    }
}

function selectDailyHeroFilms(films, count) {
    if (!films.length) {
        return [];
    }

    const getYear = film =>
        Number(film.year || film.anno || 0);

    const getRating = film => {
        const rating = film.rating ?? film.voto;
        const value = Number(rating);

        return rating !== null &&
            rating !== undefined &&
            rating !== "" &&
            Number.isFinite(value)
            ? value
            : 0;
    };

    const today = new Date();

    const dateKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    let seed = 0;

    for (const character of dateKey) {
        seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
    }

    function random() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    }

    const remaining = [...films];
    const selected = [];

    function pickFilm(pool) {
        const sortedPool = [...pool].sort((a, b) => {
            const yearDifference = getYear(b) - getYear(a);

            if (yearDifference !== 0) {
                return yearDifference;
            }

            return getRating(b) - getRating(a);
        });

        const poolSize = Math.min(sortedPool.length, 12);
        const candidates = sortedPool.slice(0, poolSize);

        const weights = candidates.map((film, index) => {
            const yearWeight = poolSize - index;
            const ratingWeight = 1 + getRating(film) / 10;

            return yearWeight * ratingWeight;
        });

        const totalWeight = weights.reduce(
            (sum, weight) => sum + weight,
            0
        );

        let choice = random() * totalWeight;

        for (let i = 0; i < candidates.length; i++) {
            choice -= weights[i];

            if (choice <= 0) {
                return candidates[i];
            }
        }

        return candidates[candidates.length - 1];
    }

    const films2026 = remaining.filter(
        film => getYear(film) === 2026
    );

    if (films2026.length) {
        const film2026 = pickFilm(films2026);

        selected.push(film2026);
        remaining.splice(remaining.indexOf(film2026), 1);
    }

    while (selected.length < count && remaining.length > 0) {
        const film = pickFilm(remaining);

        selected.push(film);
        remaining.splice(remaining.indexOf(film), 1);
    }

    return selected;
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
                    <span class="hero-label">FILM IN EVIDENZA</span>
                    <h1>Nessun film disponibile</h1>
                    <p class="hero-info">
                        -
                        <span>•</span>
                        valutazione:
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

        const year = film.year || film.anno || "-";
        const rawRating = film.rating ?? film.voto;

        const rating =
            rawRating !== null &&
            rawRating !== undefined &&
            rawRating !== "" &&
            Number.isFinite(Number(rawRating))
                ? Number(rawRating).toFixed(1)
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
                <span class="hero-label">FILM IN EVIDENZA</span>

                <h1>${title}</h1>

                <p class="hero-info">
                    ${year}
                    <span>•</span>
                    La tua valutazione:
                    <strong>${rating}/10</strong>
                </p>

                <p class="hero-description">${description}</p>

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

        const indicator = document.createElement("button");

        indicator.type = "button";
        indicator.dataset.bsTarget = "#heroCarousel";
        indicator.dataset.bsSlideTo = index;

        indicator.setAttribute("aria-label", `Film ${index + 1}`);

        if (index === 0) {
            indicator.classList.add("active");
            indicator.setAttribute("aria-current", "true");
        }

        heroIndicators.appendChild(indicator);
    });

    const oldCarousel = bootstrap.Carousel.getInstance(heroCarousel);

    if (oldCarousel) {
        oldCarousel.dispose();
    }

    new bootstrap.Carousel(heroCarousel, {
        interval: 3000,
        ride: "carousel",
        pause: false,
        wrap: true
    });
}

function updateStats(films) {
    if (!films.length) {
        const topGenreElement = document.getElementById("topGenre");
        const averageRatingElement = document.getElementById("averageRating");
        const topYearElement = document.getElementById("topYear");
        const filmsWith10Element = document.getElementById("filmsWith10");

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
        const rawGenres = film.generi || film.genre || "";

        const filmGenres = String(rawGenres)
            .split(",")
            .map(g => g.trim())
            .filter(Boolean);

        filmGenres.forEach(genre => {
            genres[genre] = (genres[genre] || 0) + 1;
        });
    });

    const topGenre =
        Object.entries(genres)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const ratedFilms = films.filter(film => {
        const rating = film.rating ?? film.voto;

        return rating !== null &&
            rating !== undefined &&
            rating !== "" &&
            !isNaN(Number(rating));
    });

    const averageRating = ratedFilms.length
        ? ratedFilms.reduce(
            (sum, film) => sum + Number(film.rating ?? film.voto),
            0
        ) / ratedFilms.length
        : 0;

    const years = {};

    films.forEach(film => {
        if (film.visto) {
            const year = film.year || film.anno;

            if (year) {
                const yearString = String(year);
                years[yearString] = (years[yearString] || 0) + 1;
            }
        }
    });

    const topYear =
        Object.entries(years)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const filmsWith10 = films.filter(
        film => Number(film.rating ?? film.voto) === 10
    ).length;

    const topGenreElement = document.getElementById("topGenre");
    const averageRatingElement = document.getElementById("averageRating");
    const topYearElement = document.getElementById("topYear");
    const filmsWith10Element = document.getElementById("filmsWith10");

    if (topGenreElement) {
        topGenreElement.textContent = topGenre;
    }

    if (averageRatingElement) {
        averageRatingElement.textContent = averageRating.toFixed(1);
    }

    if (topYearElement) {
        topYearElement.textContent = topYear;
    }

    if (filmsWith10Element) {
        filmsWith10Element.textContent = filmsWith10;
    }
}

function updateRecommendedFilms(films) {
    if (!recommendedSection || !recommendedFilms) {
        return;
    }

    const filmsRated10 = films
        .filter(film => Number(film.rating ?? film.voto) === 10)
        .sort((a, b) => {
            const yearA = Number(a.year || a.anno || 0);
            const yearB = Number(b.year || b.anno || 0);

            return yearB - yearA;
        });

    if (!filmsRated10.length) {
        recommendedSection.style.display = "none";
        return;
    }

    recommendedSection.style.display = "";
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

        const filmId = film.id || "";
        const card = document.createElement("a");

        card.className = "recommendation-card";
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

            <div class="recommendation-title">${title}</div>
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
            const amount = getRecommendedScrollAmount();

            recommendedFilms.scrollBy({
                left: -amount,
                behavior: "smooth"
            });
        };
    }

    if (recommendedNext) {
        recommendedNext.onclick = () => {
            const amount = getRecommendedScrollAmount();

            const maxScroll =
                recommendedFilms.scrollWidth -
                recommendedFilms.clientWidth;

            if (recommendedFilms.scrollLeft >= maxScroll - 10) {
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
    const card = recommendedFilms.querySelector(".recommendation-card");

    if (!card) {
        return 0;
    }

    const style = window.getComputedStyle(recommendedFilms);
    const gap = parseFloat(style.columnGap || style.gap) || 0;

    return card.offsetWidth + gap;
}

let recommendedAutoScroll;

function startRecommendedAutoScroll() {
    clearInterval(recommendedAutoScroll);

    if (!recommendedFilms) {
        return;
    }

    recommendedAutoScroll = setInterval(() => {
        const maxScroll =
            recommendedFilms.scrollWidth -
            recommendedFilms.clientWidth;

        if (maxScroll <= 0) {
            return;
        }

        const amount = getRecommendedScrollAmount();

        if (recommendedFilms.scrollLeft >= maxScroll - 10) {
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
