const currentYear =
	new Date().getFullYear();

const currentYearElement =
	document.getElementById("currentYear");

if (currentYearElement) {
	currentYearElement.textContent =
		currentYear;
}


const accountArea =
	document.getElementById("accountArea");


async function updateAccountArea() {

	if (!accountArea) {
		return;
	}

	try {

		const {
			data: { user }
		} = await supabaseClient.auth.getUser();

		const isInsidePagine =
			window.location.pathname.includes(
				"/pagine/"
			);

		const pagesPath =
			isInsidePagine
				? ""
				: "pagine/";

		if (!user) {
			return;
		}

		const {
			data: profile,
			error
		} = await supabaseClient
			.from("profiles")
			.select("email, role")
			.eq("id", user.id)
			.maybeSingle();

		if (error) {
			console.error(
				"Errore recupero profilo:",
				error
			);
		}

		const email =
			profile?.email ||
			user.email ||
			"Account";

		const role =
			profile?.role ||
			"user";

		accountArea.innerHTML = `
			<div class="dropdown">

				<button
					class="btn btn-outline-light dropdown-toggle"
					type="button"
					data-bs-toggle="dropdown"
					aria-expanded="false"
				>
					<i class="bi bi-person-circle"></i>
					${email}
				</button>

				<ul class="dropdown-menu dropdown-menu-end">

					<li>
						<a
							class="dropdown-item"
							href="${pagesPath}account.html"
						>
							<i class="bi bi-person"></i>
							Il mio account
						</a>
					</li>

					<li>
						<a
							class="dropdown-item"
							href="${pagesPath}salvati.html"
						>
							<i class="bi bi-bookmark-fill"></i>
							Film salvati
						</a>
					</li>

					${role === "admin" ? `
						<li>
							<hr class="dropdown-divider">
						</li>

						<li>
							<a
								class="dropdown-item"
								href="${pagesPath}admin.html"
							>
								<i class="bi bi-shield-lock"></i>
								Pannello Admin
							</a>
						</li>
					` : ""}

					<li>
						<hr class="dropdown-divider">
					</li>

					<li>
						<button
							id="logoutButton"
							class="dropdown-item text-danger"
							type="button"
						>
							<i class="bi bi-box-arrow-right"></i>
							Esci
						</button>
					</li>

				</ul>

			</div>
		`;

		const logoutButton =
			document.getElementById(
				"logoutButton"
			);

		if (logoutButton) {

			logoutButton.addEventListener(
				"click",
				async () => {

					logoutButton.disabled =
						true;

					const {
						error
					} =
						await supabaseClient
							.auth.signOut();

					if (error) {

						console.error(
							"Errore logout:",
							error
						);

						logoutButton.disabled =
							false;

						return;
					}

					window.location.reload();
				}
			);
		}

	} catch (error) {

		console.error(
			"Errore caricamento account:",
			error
		);
	}
}


updateAccountArea();


const requestForm =
	document.getElementById(
		"requestForm"
	);

const requestMessage =
	document.getElementById(
		"requestMessage"
	);

const requestButton =
	document.getElementById(
		"requestButton"
	);


if (requestForm) {

	requestForm.addEventListener(
		"submit",
		async (event) => {

			event.preventDefault();

			const originalButton =
				requestButton.innerHTML;

			requestButton.disabled =
				true;

			requestButton.innerHTML = `
				<span
					class="spinner-border spinner-border-sm"
				></span>
				Invio...
			`;

			requestMessage.textContent =
				"";

			requestMessage.className =
				"";

			try {

				const formData =
					new FormData(
						requestForm
					);

				const response =
					await fetch(
						"https://api.web3forms.com/submit",
						{
							method: "POST",
							headers: {
								Accept:
									"application/json"
							},
							body: formData
						}
					);

				const result =
					await response.json();

				if (result.success) {

					requestMessage.textContent =
						"✓ Richiesta inviata correttamente!";

					requestMessage.className =
						"request-message success";

					requestForm.reset();

				} else {

					requestMessage.textContent =
						result.message ||
						"Non è stato possibile inviare la richiesta.";

					requestMessage.className =
						"request-message error";
				}

			} catch (error) {

				console.error(
					"Errore richiesta film:",
					error
				);

				requestMessage.textContent =
					"Errore di connessione. Riprova tra poco.";

				requestMessage.className =
					"request-message error";
			}

			requestButton.disabled =
				false;

			requestButton.innerHTML =
				originalButton;
		}
	);
}