const COOKIE_CONSENT_KEY = "cinemaCheGasaCookieConsent";

function getCookieConsent() {
	try {
		return JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY));
	} catch {
		return null;
	}
}

function setCookieConsent(value) {
	localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
		necessary: true,
		optional: value,
		date: new Date().toISOString()
	}));
}

function createCookieBanner() {
	if (getCookieConsent()) return;

	const banner = document.createElement("div");
	banner.id = "cookieBanner";

	banner.innerHTML = `
		<div class="cookie-content">
			<div>
				<h3>La tua privacy</h3>
				<p>Utilizziamo tecnologie necessarie al sito e, con il tuo consenso, eventuali tecnologie facoltative.</p>
				<a href="cookie.html">Cookie Policy</a> ·
				<a href="privacy.html">Privacy Policy</a>
			</div>
			<div class="cookie-buttons">
				<button type="button" id="essentialCookies">Accetta gli essenziali</button>
				<button type="button" id="acceptCookies">Accetta tutti</button>
				<button type="button" id="rejectCookies">Rifiuta tutti</button>
			</div>
		</div>
	`;

	document.body.appendChild(banner);

	document.getElementById("essentialCookies").addEventListener("click", () => {
		setCookieConsent(false);
		banner.remove();
	});

	document.getElementById("acceptCookies").addEventListener("click", () => {
		setCookieConsent(true);
		banner.remove();
	});

	document.getElementById("rejectCookies").addEventListener("click", () => {
		setCookieConsent(false);
		banner.remove();
	});
}

function openCookieSettings() {
	document.getElementById("cookieSettings")?.remove();

	const consent = getCookieConsent();
	const settings = document.createElement("div");
	settings.id = "cookieSettings";

	settings.innerHTML = `
		<div class="cookie-settings-box">
			<h2>Preferenze privacy</h2>
			<p>Le tecnologie necessarie sono sempre attive. Puoi scegliere se consentire quelle facoltative.</p>
			<div class="cookie-option">
				<div>
					<strong>Tecnologie necessarie</strong>
					<p>Consentono al sito di funzionare.</p>
				</div>
				<strong>Sempre attive</strong>
			</div>
			<div class="cookie-option">
				<div>
					<strong>Tecnologie facoltative</strong>
					<p>Utilizzabili solo se previste dal sito e consentite.</p>
				</div>
				<label>
					<input type="checkbox" id="optionalCookies" ${consent?.optional ? "checked" : ""}>
					Consenti
				</label>
			</div>
			<div class="cookie-settings-buttons">
				<button type="button" id="cancelCookieSettings">Annulla</button>
				<button type="button" id="saveCookieSettings">Salva preferenze</button>
			</div>
		</div>
	`;

	document.body.appendChild(settings);

	document.getElementById("cancelCookieSettings").addEventListener("click", () => {
		settings.remove();
	});

	document.getElementById("saveCookieSettings").addEventListener("click", () => {
		setCookieConsent(document.getElementById("optionalCookies").checked);
		settings.remove();
	});
}

function addManageCookiesButton() {
	const footer = document.querySelector("footer");

	if (!footer || document.getElementById("manageCookies")) return;

	const button = document.createElement("button");
	button.id = "manageCookies";
	button.type = "button";
	button.textContent = "Gestisci cookie";
	button.addEventListener("click", openCookieSettings);

	footer.appendChild(button);
}

document.addEventListener("DOMContentLoaded", () => {
	createCookieBanner();
	addManageCookiesButton();
});