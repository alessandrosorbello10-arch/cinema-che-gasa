const COOKIE_CONSENT_KEY = "cinemaCheGasaCookieConsent";


function getCookieConsent() {

	return localStorage.getItem(COOKIE_CONSENT_KEY);

}


function setCookieConsent(value) {

	localStorage.setItem(
		COOKIE_CONSENT_KEY,
		value
	);

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
					Il sito utilizza tecnologie necessarie al suo
					funzionamento e può utilizzare la memoria del browser
					per ricordare le preferenze dell'utente.
				</p>

				<p>
					Per maggiori informazioni puoi consultare la
					<a href="cookie.html">Cookie Policy</a>
					e la
					<a href="privacy.html">Privacy Policy</a>.
				</p>

			</div>


			<div class="cookie-buttons">

				<button id="rejectCookies">
					Rifiuta
				</button>

				<button id="customizeCookies">
					Personalizza
				</button>

				<button id="acceptCookies">
					Accetta
				</button>

			</div>

		</div>

	`;


	document.body.appendChild(banner);


	document
		.getElementById("acceptCookies")
		.addEventListener("click", () => {

			setCookieConsent(
				JSON.stringify({
					necessary: true
				})
			);

			banner.remove();

		});


	document
		.getElementById("rejectCookies")
		.addEventListener("click", () => {

			setCookieConsent(
				JSON.stringify({
					necessary: true
				})
			);

			banner.remove();

		});


	document
		.getElementById("customizeCookies")
		.addEventListener("click", () => {

			openCookieSettings();

		});

}


function openCookieSettings() {

	const oldSettings =
		document.getElementById("cookieSettings");


	if (oldSettings) {

		oldSettings.remove();

	}


	const settings =
		document.createElement("div");


	settings.id = "cookieSettings";


	settings.innerHTML = `

		<div class="cookie-settings-box">

			<h2>Impostazioni privacy</h2>

			<p>
				Cinema che Gasa utilizza tecnologie necessarie
				al funzionamento del sito e la memoria del browser
				per ricordare la scelta effettuata.
			</p>


			<div class="cookie-option">

				<div>

					<h3>Tecnologie necessarie</h3>

					<p>
						Necessarie per il corretto funzionamento
						del sito.
					</p>

				</div>

				<strong>
					Sempre attive
				</strong>

			</div>


			<div class="cookie-settings-buttons">

				<button id="cancelCookieSettings">
					Annulla
				</button>

				<button id="saveCookieSettings">
					Salva preferenze
				</button>

			</div>

		</div>

	`;


	document.body.appendChild(settings);


	document
		.getElementById("cancelCookieSettings")
		.addEventListener("click", () => {

			settings.remove();

		});


	document
		.getElementById("saveCookieSettings")
		.addEventListener("click", () => {

			setCookieConsent(
				JSON.stringify({
					necessary: true
				})
			);

			settings.remove();

		});

}


function addManageCookiesButton() {

	const footer =
		document.querySelector("footer");


	if (!footer) return;


	if (
		document.getElementById("manageCookies")
	) return;


	const button =
		document.createElement("button");


	button.id = "manageCookies";

	button.textContent =
		"Gestisci cookie";


	button.addEventListener(
		"click",
		openCookieSettings
	);


	footer.appendChild(button);

}


document.addEventListener(
	"DOMContentLoaded",
	() => {

		createCookieBanner();

		addManageCookiesButton();

	}
);