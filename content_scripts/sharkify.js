(() => {
	/**
	 * Check and set a global guard variable.
	 * If this content script is injected into the same page again,
	 * it will do nothing next time.
	 */
	if (window.hasRun) {
		return;
	}
	window.hasRun = true;

	/**
	 * Preload the shark image for better performance.
	 * This loads the image into browser cache immediately.
	 */
	const sharkURL = browser.runtime.getURL("beasts/shark.jpg");
	const preloadImage = new Image();
	preloadImage.src = sharkURL;

	/**
	 * Store original image sources so we can restore them
	 */
	const originalSources = new Map();

	/**
	 * Replace images on the page with shark images.
	 * @param {string} sharkURL - URL of the shark image
	 * @param {boolean} randomizePerImage - If true, each image has 1/3 chance
	 */
	function insertShark(sharkURL, randomizePerImage = false) {
		const images = document.querySelectorAll("img");
		for (const img of images) {
			// Skip if already sharkified
			if (img.classList.contains("sharkify-image")) {
				continue;
			}
			// If randomizing per image, each image has 1/3 chance to be sharkified
			// Skip if random value is >= 1/3 (only sharkify when < 1/3)
			if (randomizePerImage && Math.random() >= 1 / 3) {
				continue;
			}
			// Store the original src
			if (!originalSources.has(img)) {
				originalSources.set(img, img.src);
			}
			// Replace with shark
			img.src = sharkURL;
			img.classList.add("sharkify-image");
		}
	}

	/**
	 * Restore all images to their original sources.
	 */
	function removeExistingSharks() {
		const sharkifiedImages = document.querySelectorAll(".sharkify-image");
		for (const img of sharkifiedImages) {
			// Restore original src
			if (originalSources.has(img)) {
				img.src = originalSources.get(img);
				originalSources.delete(img);
			}
			img.classList.remove("sharkify-image");
		}
	}

	/**
	 * Listen for messages from the background script.
	 * Call "insertShark()" or "removeExistingSharks()".
	 */
	browser.runtime.onMessage.addListener((message) => {
		if (message.command === "sharkify") {
			insertShark(message.sharkURL);
		} else if (message.command === "reset") {
			removeExistingSharks();
		}
	});

	/**
	 * On page load, sharkify each image with 1/3 chance
	 */
	insertShark(sharkURL, true);
})();
