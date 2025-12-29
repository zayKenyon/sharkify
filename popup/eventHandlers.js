/**
 * Popup event handlers (Firefox)
 */

import { getRandomImageURL, loadImages } from "./storage.js";

function openUploadPage() {
	browser.runtime.openOptionsPage();
}

export function listenForClicks() {
	const manageBtn = document.getElementById("open-upload-tab-btn");
	const sharkifyBtn = document.getElementById("sharkify-btn");
	const resetBtn = document.getElementById("reset-btn");

	manageBtn?.addEventListener("click", () => openUploadPage());

	sharkifyBtn?.addEventListener("click", async () => {
		await loadImages();
		const url = getRandomImageURL();
		if (!url) {
			window.alert("Please upload an image first!");
			return;
		}
		try {
			const tabs = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});
			await browser.tabs.sendMessage(tabs[0].id, {
				command: "sharkify",
				sharkURL: url,
			});
		} catch (error) {
			console.error("Could not sharkify:", error);
		}
	});

	resetBtn?.addEventListener("click", async () => {
		try {
			const tabs = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});
			await browser.tabs.sendMessage(tabs[0].id, { command: "reset" });
		} catch (error) {
			console.error("Could not reset:", error);
		}
	});
}
