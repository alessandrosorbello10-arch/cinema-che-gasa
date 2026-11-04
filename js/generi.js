function getGeneriFilm(film) {
const generi = new Set();

[film.genre, film.generi].forEach(valore => {
    if (!valore) return;

    valore.split(",").forEach(genere => {
        const nome = genere.trim();

        if (nome) {
            generi.add(nome);
        }
    });
});

return [...generi];

}
