const form = document.getElementById("announcementForm");

const draftNameInput = document.getElementById("draftName");
const draftSelect = document.getElementById("draftSelect");
const draftStatus = document.getElementById("draftStatus");
const deleteDraftBtn = document.getElementById("deleteDraftBtn");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const clearAnnouncementBtn = document.getElementById("clearAnnouncementBtn");

const typeInput = document.getElementById("announcementType");
const subjectInput = document.getElementById("announcementSubject");
const messageInput = document.getElementById("announcementMessage");

const previewButton = document.getElementById("previewAnnouncementBtn");
const preview = document.getElementById("announcementPreview");
const status = document.getElementById("announcementStatus");
const editorTitle = document.getElementById("editorTitle");

const sendTestEmailBtn = document.getElementById("sendTestEmailBtn");
const sendAnnouncementBtn = document.getElementById("sendAnnouncementBtn");

const DRAFT_KEY = "cinemaCheGasaAnnouncementDrafts";

let drafts = [];
let selectedDraftId = null;

function createId() {
    return crypto.randomUUID();
}

function showStatus(element, message, type = "success") {
    if (!element) return;

    element.textContent = message;
    element.className = `mt-3 text-${type}`;
}

function getDrafts() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(DRAFT_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Errore nel caricamento delle bozze:", error);
        return [];
    }
}

function saveDraftsToStorage() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
}

function updateDraftMenu() {
    if (!draftSelect) return;

    const previousValue = selectedDraftId;

    draftSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Nuova comunicazione";

    draftSelect.appendChild(placeholder);

    drafts.forEach((draft) => {
        const option = document.createElement("option");

        option.value = draft.id;
        option.textContent = draft.name;

        draftSelect.appendChild(option);
    });

    if (drafts.some((draft) => draft.id === previousValue)) {
        draftSelect.value = previousValue;
    } else {
        draftSelect.value = "";
    }

    if (deleteDraftBtn) {
        deleteDraftBtn.disabled = !draftSelect.value;
    }
}

function getFormData() {
    return {
        name: draftNameInput?.value.trim() || "",
        type: typeInput?.value || "",
        subject: subjectInput?.value.trim() || "",
        message: messageInput?.value.trim() || ""
    };
}

function loadDraft(draft) {
    selectedDraftId = draft.id;

    if (draftNameInput) draftNameInput.value = draft.name;
    if (typeInput) typeInput.value = draft.type;
    if (subjectInput) subjectInput.value = draft.subject;
    if (messageInput) messageInput.value = draft.message;

    if (draftSelect) draftSelect.value = draft.id;

    if (deleteDraftBtn) {
        deleteDraftBtn.disabled = false;
    }

    if (editorTitle) {
        editorTitle.textContent = "Modifica comunicazione";
    }

    showStatus(
        draftStatus,
        `Bozza "${draft.name}" caricata.`,
        "info"
    );

    showStatus(
        status,
        "Puoi modificare il contenuto e salvare le modifiche.",
        "info"
    );

    resetPreview();
}

function resetForm() {
    if (form) form.reset();

    selectedDraftId = null;

    if (draftSelect) draftSelect.value = "";

    if (deleteDraftBtn) {
        deleteDraftBtn.disabled = true;
    }

    if (editorTitle) {
        editorTitle.textContent = "Nuova comunicazione";
    }

    resetPreview();

    showStatus(
        status,
        "Campi svuotati. Le bozze salvate non sono state eliminate.",
        "info"
    );
}

function resetPreview() {
    if (!preview) return;

    preview.replaceChildren();

    const placeholder = document.createElement("p");

    placeholder.className = "text-secondary mb-0";
    placeholder.textContent =
        "Compila il modulo e premi «Visualizza anteprima».";

    preview.appendChild(placeholder);
}

function saveDraft() {
    const data = getFormData();

    if (!data.name) {
        showStatus(status, "Inserisci un nome per la bozza.", "danger");
        draftNameInput?.focus();
        return;
    }

    if (!data.subject || !data.message) {
        showStatus(
            status,
            "Inserisci l'oggetto e il messaggio prima di salvare.",
            "danger"
        );
        return;
    }

    if (selectedDraftId) {
        const index = drafts.findIndex(
            (draft) => draft.id === selectedDraftId
        );

        if (index !== -1) {
            drafts[index] = {
                ...drafts[index],
                ...data,
                updatedAt: new Date().toISOString()
            };

            saveDraftsToStorage();
            updateDraftMenu();

            if (draftSelect) {
                draftSelect.value = selectedDraftId;
            }

            showStatus(
                status,
                "Bozza aggiornata correttamente.",
                "success"
            );

            showStatus(
                draftStatus,
                "Le modifiche sono state salvate.",
                "success"
            );

            return;
        }
    }

    const now = new Date().toISOString();

    const draft = {
        id: createId(),
        ...data,
        createdAt: now,
        updatedAt: now
    };

    drafts.push(draft);
    selectedDraftId = draft.id;

    saveDraftsToStorage();
    updateDraftMenu();

    if (draftSelect) {
        draftSelect.value = draft.id;
    }

    if (deleteDraftBtn) {
        deleteDraftBtn.disabled = false;
    }

    if (editorTitle) {
        editorTitle.textContent = "Modifica comunicazione";
    }

    showStatus(
        status,
        "Nuova bozza salvata correttamente.",
        "success"
    );

    showStatus(
        draftStatus,
        "La bozza è stata aggiunta all'archivio.",
        "success"
    );
}

function deleteDraft() {
    if (!selectedDraftId) {
        showStatus(
            draftStatus,
            "Seleziona prima una bozza da eliminare.",
            "danger"
        );
        return;
    }

    const draft = drafts.find(
        (item) => item.id === selectedDraftId
    );

    if (!draft) return;

    const confirmed = confirm(
        `Vuoi eliminare la bozza "${draft.name}"? Questa operazione non può essere annullata.`
    );

    if (!confirmed) return;

    drafts = drafts.filter(
        (item) => item.id !== selectedDraftId
    );

    saveDraftsToStorage();

    selectedDraftId = null;

    updateDraftMenu();
    resetForm();

    showStatus(
        draftStatus,
        "Bozza eliminata correttamente.",
        "success"
    );
}

function generatePreview() {
    if (!form || !preview || !form.reportValidity()) return;

    preview.replaceChildren();

    const category = document.createElement("span");

    category.className = "badge text-bg-danger mb-3";
    category.textContent = typeInput?.value || "";

    const subject = document.createElement("h3");

    subject.className = "mb-3";
    subject.textContent = subjectInput?.value.trim() || "";

    const message = document.createElement("p");

    message.className = "mb-0";
    message.style.whiteSpace = "pre-wrap";
    message.textContent = messageInput?.value.trim() || "";

    const separator = document.createElement("hr");
    separator.className = "my-4";

    const footer = document.createElement("p");

    footer.className = "text-secondary small mb-0";
    footer.textContent = "Cinema che Gasa";

    preview.append(
        category,
        subject,
        message,
        separator,
        footer
    );

    showStatus(
        status,
        "Anteprima generata correttamente.",
        "success"
    );
}

function escapeHtml(text) {
    const characters = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return text.replace(/[&<>"']/g, (character) => {
        return characters[character];
    });
}

async function sendTestEmail() {
    const subject = subjectInput?.value.trim() || "";
    const message = messageInput?.value.trim() || "";

    if (!subject || !message) {
        showStatus(
            status,
            "Inserisci l'oggetto e il messaggio prima di inviare.",
            "danger"
        );
        return;
    }

    const confirmed = confirm(
        "Inviare un'email di prova esclusivamente a alessandroalfiosorbello@gmail.com?"
    );

    if (!confirmed) return;

    if (sendTestEmailBtn) {
        sendTestEmailBtn.disabled = true;
        sendTestEmailBtn.textContent = "Invio in corso...";
    }

    if (saveDraftBtn) {
        saveDraftBtn.disabled = true;
    }

    try {
        const html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${escapeHtml(subject)}</title>
            </head>
            <body style="font-family:Arial,sans-serif;color:#222;line-height:1.6;padding:20px;">
                <h2 style="color:#c00;">
                    ${escapeHtml(typeInput?.value || "")}
                </h2>

                <h3>${escapeHtml(subject)}</h3>

                <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>

                <hr>

                <p style="color:#777;font-size:12px;">
                    Email di prova di Cinema che Gasa.
                </p>
            </body>
            </html>
        `;

        let client = null;

        if (typeof supabaseClient !== "undefined") {
            client = supabaseClient;
        } else if (typeof supabase !== "undefined") {
            client = supabase;
        }

        if (!client?.functions?.invoke) {
            throw new Error(
                "Client Supabase non trovato. Controlla js/supabase.js."
            );
        }

        const { data, error } = await client.functions.invoke(
            "send-announcement",
            {
                body: {
                    subject,
                    html,
                    test: true
                }
            }
        );

        if (error) throw error;

        if (data?.error) {
            throw new Error(data.error);
        }

        showStatus(
            status,
            "Richiesta accettata da Brevo. Controlla la posta in arrivo e lo Spam.",
            "success"
        );
    } catch (error) {
        console.error("Errore durante il test email:", error);

        showStatus(
            status,
            `Invio non riuscito: ${error.message || "errore sconosciuto"}. Controlla la console e i log di Supabase.`,
            "danger"
        );
    } finally {
        if (sendTestEmailBtn) {
            sendTestEmailBtn.disabled = false;
            sendTestEmailBtn.innerHTML =
                '<i class="bi bi-envelope"></i> Invia email di prova';
        }

        if (saveDraftBtn) {
            saveDraftBtn.disabled = false;
        }
    }
}

async function sendAnnouncement() {
    const subject = subjectInput?.value.trim() || "";
    const message = messageInput?.value.trim() || "";

    if (!subject || !message) {
        showStatus(
            status,
            "Inserisci oggetto e messaggio.",
            "danger"
        );
        return;
    }

    const confirmed = confirm(
        "ATTENZIONE!\n\nVuoi inviare questa comunicazione via email a tutti gli utenti che hanno attivato le notifiche?\n\nL'invio reale non può essere annullato."
    );

    if (!confirmed) return;

    const escapeHTML = (text) => text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
            <h2 style="color:#c62828">Cinema che Gasa</h2>
            <h3>${escapeHTML(subject)}</h3>
            <div style="line-height:1.6;white-space:pre-wrap">${escapeHTML(message)}</div>
            <hr>
            <p style="font-size:12px;color:#777">
                Hai ricevuto questa email da Cinema che Gasa.
            </p>
        </div>
    `;

    if (sendAnnouncementBtn) {
        sendAnnouncementBtn.disabled = true;
    }

    showStatus(
        status,
        "Invio delle email in corso...",
        "info"
    );

    try {
        const client = typeof supabaseClient !== "undefined"
            ? supabaseClient
            : null;

        if (!client?.functions?.invoke) {
            throw new Error(
                "Client Supabase non trovato. Controlla js/supabase.js."
            );
        }

        const { data, error } = await client.functions.invoke(
            "send-announcement",
            {
                body: {
                    subject,
                    html
                }
            }
        );

        if (error) {
            let details = error.message;

            if (error.context) {
                try {
                    const response = await error.context.json();
                    details = response.error || response.message || details;
                } catch {}
            }

            throw new Error(details);
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        showStatus(
            status,
            `Invio completato. Inviate: ${data.sent}. Fallite: ${data.failed}. Destinatari: ${data.total}.`,
            "success"
        );
    } catch (error) {
        console.error("Errore invio comunicazione:", error);

        showStatus(
            status,
            "Errore durante l'invio: " + error.message,
            "danger"
        );
    } finally {
        if (sendAnnouncementBtn) {
            sendAnnouncementBtn.disabled = false;
        }
    }
}

/* Gestione delle bozze */

draftSelect?.addEventListener("change", (event) => {
    event.preventDefault();

    const id = draftSelect.value;

    if (!id) {
        resetForm();

        showStatus(
            draftStatus,
            "Nuova comunicazione selezionata.",
            "info"
        );

        return;
    }

    const draft = drafts.find((item) => item.id === id);

    if (draft) loadDraft(draft);
});

saveDraftBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    saveDraft();
});

deleteDraftBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    deleteDraft();
});

previewButton?.addEventListener("click", (event) => {
    event.preventDefault();
    generatePreview();
});

clearAnnouncementBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    resetForm();
});

sendTestEmailBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    sendTestEmail();
});

sendAnnouncementBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    sendAnnouncement();
});

draftNameInput?.addEventListener("input", () => {
    if (selectedDraftId) {
        showStatus(
            status,
            "Hai modificato il nome. Premi «Salva bozza» per confermare.",
            "info"
        );
    }
});

[typeInput, subjectInput, messageInput].forEach((input) => {
    input?.addEventListener("input", () => {
        if (selectedDraftId) {
            showStatus(
                status,
                "Hai modifiche non salvate. Premi «Salva bozza» per conservarle.",
                "info"
            );
        }
    });
});

/* Inizializzazione */

drafts = getDrafts();

updateDraftMenu();
resetPreview();