const captchaCanvas = document.getElementById("captchaCanvas");
const captchaInput = document.getElementById("captchaInput");
const captchaRefresh = document.getElementById("captchaRefresh");
const captchaMessage = document.getElementById("captchaMessage");

const captchaContext = captchaCanvas.getContext("2d");

const CAPTCHA_LENGTH = 6;
const CAPTCHA_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789";
const MAX_TENTATIVI = 5;

let captchaCode = "";
let tentativiErrati = 0;
let captchaBloccato = false;

function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function generaCaptcha() {
    if (captchaBloccato) return;

    captchaCode = "";

    for (let i = 0; i < CAPTCHA_LENGTH; i++) {
        captchaCode += CAPTCHA_CHARACTERS[
            Math.floor(Math.random() * CAPTCHA_CHARACTERS.length)
        ];
    }

    disegnaCaptcha();

    captchaInput.value = "";
    captchaMessage.textContent = "";
    captchaInput.setCustomValidity("");
}

function disegnaCaptcha() {
    const width = captchaCanvas.width;
    const height = captchaCanvas.height;

    captchaContext.clearRect(0, 0, width, height);

    const background = captchaContext.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#101010");
    background.addColorStop(0.5, "#292020");
    background.addColorStop(1, "#111111");

    captchaContext.fillStyle = background;
    captchaContext.fillRect(0, 0, width, height);

    // Macchie di sfondo
    for (let i = 0; i < 35; i++) {
        captchaContext.beginPath();
        captchaContext.arc(
            randomNumber(0, width),
            randomNumber(0, height),
            randomNumber(2, 8),
            0,
            Math.PI * 2
        );

        captchaContext.fillStyle = `rgba(220, 20, 35, ${randomNumber(0.03, 0.14)})`;
        captchaContext.fill();
    }

    // Linee incrociate
    for (let i = 0; i < 13; i++) {
        captchaContext.beginPath();
        captchaContext.moveTo(randomNumber(-20, width), randomNumber(0, height));

        captchaContext.bezierCurveTo(
            randomNumber(0, width),
            randomNumber(0, height),
            randomNumber(0, width),
            randomNumber(0, height),
            randomNumber(-20, width + 20),
            randomNumber(0, height)
        );

        captchaContext.strokeStyle = Math.random() > 0.5
            ? "rgba(255, 45, 55, 0.65)"
            : "rgba(255, 255, 255, 0.38)";

        captchaContext.lineWidth = randomNumber(0.7, 2);
        captchaContext.stroke();
    }

    // Caratteri distorti
    const characterSpacing = width / (CAPTCHA_LENGTH + 0.5);

    for (let i = 0; i < captchaCode.length; i++) {
        captchaContext.save();

        const x = 10 + i * characterSpacing + randomNumber(-3, 3);
        const y = randomNumber(height * 0.5, height * 0.72);
        const angle = randomNumber(-0.4, 0.4);
        const size = randomNumber(23, 32);

        captchaContext.translate(x, y);
        captchaContext.rotate(angle);

        captchaContext.transform(
            randomNumber(0.85, 1.15),
            randomNumber(-0.12, 0.12),
            randomNumber(-0.12, 0.12),
            randomNumber(0.85, 1.15),
            0,
            0
        );

        captchaContext.font = `bold ${size}px Arial`;
        captchaContext.textBaseline = "middle";
        captchaContext.shadowColor = "#ff1b2d";
        captchaContext.shadowBlur = randomNumber(0, 4);

        captchaContext.fillStyle = Math.random() > 0.45
            ? "#ffffff"
            : "#ffb8bc";

        captchaContext.fillText(captchaCode[i], 0, 0);

        // Segni sopra alcuni caratteri
        if (Math.random() > 0.5) {
            captchaContext.beginPath();
            captchaContext.moveTo(-4, randomNumber(-15, 0));
            captchaContext.lineTo(
                randomNumber(4, 15),
                randomNumber(5, 15)
            );

            captchaContext.strokeStyle = "rgba(255, 70, 80, 0.8)";
            captchaContext.lineWidth = 1;
            captchaContext.stroke();
        }

        captchaContext.restore();
    }

    // Puntini di disturbo
    for (let i = 0; i < 150; i++) {
        captchaContext.fillStyle = Math.random() > 0.5
            ? `rgba(255,255,255,${randomNumber(0.1, 0.55)})`
            : `rgba(255,30,45,${randomNumber(0.1, 0.45)})`;

        captchaContext.fillRect(
            randomNumber(0, width),
            randomNumber(0, height),
            randomNumber(0.5, 2),
            randomNumber(0.5, 2)
        );
    }

    // Bordo
    captchaContext.strokeStyle = "#454545";
    captchaContext.lineWidth = 1;
    captchaContext.strokeRect(0.5, 0.5, width - 1, height - 1);
}

function verificaCaptcha() {
    if (captchaBloccato) {
        captchaMessage.textContent = "Hai esaurito i 5 tentativi. Ricarica la pagina per riprovare.";
        captchaMessage.className = "text-danger small mt-2";
        return false;
    }

    const risposta = captchaInput.value.trim();

    if (risposta !== captchaCode) {
        tentativiErrati++;

        if (tentativiErrati >= MAX_TENTATIVI) {
            captchaBloccato = true;
            captchaInput.disabled = true;
            captchaRefresh.disabled = true;

            captchaMessage.textContent = "Hai esaurito i 5 tentativi. Ricarica la pagina per riprovare.";
            captchaMessage.className = "text-danger small mt-2";

            return false;
        }

        captchaMessage.textContent =
            `Codice errato. Tentativi rimasti: ${MAX_TENTATIVI - tentativiErrati}.`;

        captchaMessage.className = "text-danger small mt-2";

        generaCaptcha();
        captchaInput.focus();

        return false;
    }

    captchaMessage.textContent = "";
    return true;
}

captchaRefresh.addEventListener("click", generaCaptcha);

captchaInput.addEventListener("input", () => {
    captchaInput.setCustomValidity("");
});

generaCaptcha();

window.verificaCaptcha = verificaCaptcha;
window.resetCaptcha = generaCaptcha;