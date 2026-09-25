const currentYear = new Date().getFullYear();

const currentYearElement = document.getElementById("currentYear");

if (currentYearElement) {
	currentYearElement.textContent = currentYear;
}

const accountArea = document.getElementById("accountArea");

async function updateAccountArea() {
	if (!accountArea) return;

	try {
		const {
			data: { user }
		} = await supabaseClient.auth.getUser();

		if (!user) return;

		const isInsidePagine =
			window.location.pathname.includes("/pagine/");

		const accountLink =
			isInsidePagine
				? "account.html"
				: "pagine/account.html";

		accountArea.innerHTML = `
			<a
				href="${accountLink}"
				class="btn btn-outline-light account-email-button"
			>
				<i class="bi bi-person-circle"></i>
				${user.email}
			</a>

			<button
				id="logoutButton"
				class="btn btn-light"
			>
				<i class="bi bi-box-arrow-right"></i>
				Esci
			</button>
		`;

		const logoutButton =
			document.getElementById("logoutButton");

		logoutButton.addEventListener("click", async () => {
			await supabaseClient.auth.signOut();
			window.location.reload();
		});

	} catch (error) {
		console.error(
			"Errore caricamento account:",
			error
		);
	}
}

updateAccountArea();

async function checkAdmin() {
	if (!accountArea) return;

	try {
		const {
			data: { user }
		} = await supabaseClient.auth.getUser();

		if (!user) return;

		const {
			data: profile,
			error
		} = await supabaseClient
			.from("profiles")
			.select("role")
			.eq("id", user.id)
			.single();

		if (error) {
			console.error(
				"Errore controllo admin:",
				error
			);
			return;
		}

		if (profile && profile.role === "admin") {

			if (
				document.getElementById("adminButton")
			) {
				return;
			}

			const adminButton =
				document.createElement("a");

			const isInsidePagine =
				window.location.pathname.includes("/pagine/");

			adminButton.href =
				isInsidePagine
					? "admin.html"
					: "pagine/admin.html";

			adminButton.id =
				"adminButton";

			adminButton.className =
				"btn btn-danger";

			adminButton.innerHTML = `
				<i class="bi bi-shield-lock"></i>
				Pannello Admin
			`;

			accountArea.prepend(adminButton);
		}

	} catch (error) {
		console.error(
			"Errore controllo accesso admin:",
			error
		);
	}
}

checkAdmin();