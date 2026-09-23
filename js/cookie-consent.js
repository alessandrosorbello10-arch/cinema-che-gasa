const COOKIE_CONSENT_KEY = "cinemaCheGasaCookieConsent";

function getCookieConsent() {
    return localStorage.getItem(COOKIE_CONSENT_KEY);
}

function setCookieConsent(value) {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
}

function createCookieBanner() {
    if (getCookieConsent()) return;

    const banner = document.createElement("div");
    banner.id = "cookieBanner";

    banner.innerHTML = `
        <div class="cookie-content">
            <div>
                <h3>Privacy e cookie</h3>

                <p>
                    Cinema che Gasa è ancora in fase di sviluppo.
                    Alcune funzioni del sito potrebbero quindi non essere
                    definitive o funzionare correttamente.
                </p>

                <p>
                    Ti invitiamo a non utilizzare dati personali importanti
                    o informazioni sensibili durante l'utilizzo del sito.
                    L'utilizzo degli account avviene durante la fase di sviluppo
                    e le funzionalità potrebbero essere soggette a modifiche,
                    errori o interruzioni.
                </p>

                <p>
                    Il sito utilizza tecnologie necessarie al suo funzionamento.
                    Puoi scegliere come gestire la tua privacy.
                </p>
            </div>

            <div class="cookie-buttons">
                <button id="rejectCookies">Rifiuta</button>
                <button id="customizeCookies">Personalizza</button>
                <button id="acceptCookies">Accetta</button>
            </div>
        </div>
    `;

    document.body.appendChild(banner);

    document.getElementById("acceptCookies").addEventListener("click", () => {
        setCookieConsent(JSON.stringify({
            necessary: true,
            preferences: true,
            analytics: true
        }));

        banner.remove();
    });

    document.getElementById("rejectCookies").addEventListener("click", () => {
        setCookieConsent(JSON.stringify({
            necessary: true,
            preferences: false,
            analytics: false
        }));

        banner.remove();
    });

    document.getElementById("customizeCookies").addEventListener("click", () => {
        openCookieSettings();
    });
}

function openCookieSettings() {
    const oldSettings = document.getElementById("cookieSettings");

    if (oldSettings) {
        oldSettings.remove();
    }

    let currentConsent = {
        necessary: true,
        preferences: false,
        analytics: false
    };

    try {
        const saved = JSON.parse(getCookieConsent());

        if (saved) {
            currentConsent = {
                necessary: true,
                preferences: saved.preferences === true,
                analytics: saved.analytics === true
            };
        }
    } catch (error) {
        console.log("Nessuna preferenza cookie precedente.");
    }

    const settings = document.createElement("div");
    settings.id = "cookieSettings";

    settings.innerHTML = `
        <div class="cookie-settings-box">
            <h2>Personalizza i cookie</h2>

            <p>
                Scegli quali categorie vuoi consentire.
                Puoi modificare questa scelta in qualsiasi momento.
            </p>

            <div class="cookie-option">
                <div>
                    <h3>Necessari</h3>
                    <p>
                        Necessari per il funzionamento del sito.
                    </p>
                </div>

                <strong>Sempre attivi</strong>
            </div>

            <div class="cookie-option">
                <div>
                    <h3>Preferenze</h3>
                    <p>
                        Permettono di ricordare alcune impostazioni
                        e preferenze del sito.
                    </p>
                </div>

                <label>
                    <input type="checkbox" id="preferencesCookies"
                        ${currentConsent.preferences ? "checked" : ""}>
                    Consenti
                </label>
            </div>

            <div class="cookie-option">
                <div>
                    <h3>Statistiche</h3>
                    <p>
                        Permettono di raccogliere informazioni
                        sull'utilizzo del sito.
                    </p>
                </div>

                <label>
                    <input type="checkbox" id="analyticsCookies"
                        ${currentConsent.analytics ? "checked" : ""}>
                    Consenti
                </label>
            </div>

            <div class="cookie-settings-buttons">
                <button id="cancelCookieSettings">Annulla</button>
                <button id="saveCookieSettings">Salva preferenze</button>
            </div>
        </div>
    `;

    document.body.appendChild(settings);

    document.getElementById("cancelCookieSettings").addEventListener("click", () => {
        settings.remove();
    });

    document.getElementById("saveCookieSettings").addEventListener("click", () => {
        const preferences = document.getElementById("preferencesCookies").checked;
        const analytics = document.getElementById("analyticsCookies").checked;

        setCookieConsent(JSON.stringify({
            necessary: true,
            preferences: preferences,
            analytics: analytics
        }));

        settings.remove();
    });
}

function addManageCookiesButton() {
    const footer = document.querySelector("footer");

    if (!footer) return;

    if (document.getElementById("manageCookies")) return;

    const button = document.createElement("button");

    button.id = "manageCookies";
    button.textContent = "Gestisci cookie";

    button.addEventListener("click", openCookieSettings);

    footer.appendChild(button);
}

document.addEventListener("DOMContentLoaded", () => {
    createCookieBanner();
    addManageCookiesButton();
});