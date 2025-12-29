/**
 * Storage Management Module
 * Handles loading and saving images to browser storage (Firefox)
 */

export let userImages = [];

/**
 * Load images from storage
 */
export async function loadImages() {
	console.log("Loading images from storage...");
	if (!browser?.storage?.local) {
		throw new Error("browser.storage.local API not available");
	}
	const result = await browser.storage.local.get(["userImages"]);
	userImages = result.userImages || [];
	console.log("Loaded images:", userImages.length);
	return userImages;
}

/**
 * Save images to storage
 */
export async function saveImages(images) {
	console.log("Saving images to storage...");
	if (!browser?.storage?.local) {
		throw new Error("browser.storage.local API not available");
	}
	userImages = images;
	await browser.storage.local.set({ userImages });
	console.log("Images saved successfully");
}

/**
 * Get a random image from uploaded images
 */
export function getRandomImageURL() {
	if (userImages.length === 0) {
		return null;
	}
	const randomIndex = Math.floor(Math.random() * userImages.length);
	console.log(
		"Selected random image index:",
		randomIndex,
		"of",
		userImages.length,
	);
	return userImages[randomIndex].dataUrl;
}
