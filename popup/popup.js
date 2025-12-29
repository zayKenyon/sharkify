/** Popup entry. */

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

function wireUI() {
	document
		.getElementById("open-upload-tab-btn")
		?.addEventListener("click", openUploadPage);

	document
		.getElementById("sharkify-btn")
		?.addEventListener("click", async () => {
			const result = await browser.storage.local.get(["userImages"]);
			const images = result.userImages || [];
			if (images.length === 0) {
				window.alert("Please upload an image first!");
				return;
			}
			const url = images[Math.floor(Math.random() * images.length)]?.dataUrl;
			if (!url) return;

			try {
				await sendToActiveTab({ command: "sharkify", sharkURL: url });
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
} catch (e) {
	console.error(e);
	showError();
}
