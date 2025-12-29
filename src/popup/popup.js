/** Popup entry. */

let randomnessOneInX = 333; // default 1 in 333 images

function showError() {
	document.querySelector("#popup-content")?.classList.add("hidden");
	document.querySelector("#error-content")?.classList.remove("hidden");
}

async function sendToActiveTab(message) {
	const tabs = await browser.tabs.query({ active: true, currentWindow: true });
	const tabId = tabs?.[0]?.id;
	if (!tabId) throw new Error("No active tab");
	return await browser.tabs.sendMessage(tabId, message);
}

function openUploadPage() {
	browser.runtime.openOptionsPage();
}

async function isOnOptionsPage() {
	try {
		const tabs = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		const activeTab = tabs?.[0];
		if (!activeTab?.url) return false;

		const optionsUrl = browser.runtime.getURL("src/upload/upload.html");
		return activeTab.url.startsWith(optionsUrl);
	} catch {
		return false;
	}
}

async function checkImagesAndUpdateButton() {
	const result = await browser.storage.local.get(["userImages"]);
	const images = result.userImages || [];
	const sharkifyBtn = document.getElementById("sharkify-btn");
	const resetBtn = document.getElementById("reset-btn");

	const onOptionsPage = await isOnOptionsPage();

	if (sharkifyBtn) sharkifyBtn.disabled = images.length === 0 || onOptionsPage;
	if (resetBtn) resetBtn.disabled = onOptionsPage;

	return images;
}

async function loadRandomness() {
	const result = await browser.storage.local.get(["randomnessOneInX"]);
	randomnessOneInX = result.randomnessOneInX ?? 333;

	const slider = document.getElementById("randomness-input");
	const valueDisplay = document.getElementById("randomness-value");

	if (slider) slider.value = randomnessOneInX;
	if (valueDisplay) valueDisplay.textContent = randomnessOneInX;
}

async function saveRandomness(value) {
	randomnessOneInX = value;
	await browser.storage.local.set({ randomnessOneInX: value });
}

function setupRandomnessSlider() {
	const slider = document.getElementById("randomness-input");
	const valueDisplay = document.getElementById("randomness-value");

	if (!slider || !valueDisplay) return;

	slider.addEventListener("input", (e) => {
		const value = parseInt(e.target.value, 10);
		valueDisplay.textContent = value;
	});

	slider.addEventListener("change", async (e) => {
		const value = parseInt(e.target.value, 10);
		await saveRandomness(value);
	});
}

function wireUI() {
	document
		.getElementById("open-upload-tab-btn")
		?.addEventListener("click", () => {
			// Disable sharkify and reset buttons when opening the options page
			const sharkifyBtn = document.getElementById("sharkify-btn");
			const resetBtn = document.getElementById("reset-btn");
			if (sharkifyBtn) sharkifyBtn.disabled = true;
			if (resetBtn) resetBtn.disabled = true;

			openUploadPage();
		});

	document
		.getElementById("sharkify-btn")
		?.addEventListener("click", async () => {
			const images = await checkImagesAndUpdateButton();
			if (images.length === 0) {
				return;
			}
			const url = images[Math.floor(Math.random() * images.length)]?.dataUrl;
			if (!url) return;

			try {
				await sendToActiveTab({
					command: "sharkify",
					sharkURL: url,
					randomnessOneInX: randomnessOneInX,
				});
			} catch (e) {
				console.error(e);
				showError();
			}
		});

	document.getElementById("reset-btn")?.addEventListener("click", async () => {
		try {
			await sendToActiveTab({ command: "reset" });
		} catch (e) {
			console.error(e);
			showError();
		}
	});
}

try {
	wireUI();
	setupRandomnessSlider();
	loadRandomness();
	checkImagesAndUpdateButton();
} catch (e) {
	console.error(e);
	showError();
}
