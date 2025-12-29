/**
 * Storage helpers for uploaded images.
 */

export let userImages = [];

/**
 * Load images from storage.
 */
export async function loadImages() {
	if (!browser?.storage?.local) {
		throw new Error("browser.storage.local API not available");
	}
	const result = await browser.storage.local.get(["userImages"]);
	userImages = result.userImages || [];
	return userImages;
}

/**
 * Save images to storage.
 */
export async function saveImages(images) {
	if (!browser?.storage?.local) {
		throw new Error("browser.storage.local API not available");
	}
	userImages = images;
	await browser.storage.local.set({ userImages });
}
