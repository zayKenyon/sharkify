/**
 * Content Script Loader (Firefox)
 * Bundled for content_scripts.
 */

// Import all the functionality inline
(async () => {
	if (!globalThis.browser) {
		console.error("Firefox 'browser' API not available in this context");
		return;
	}

	/**
	 * Check and set a global guard variable.
	 */
	if (window.hasRun) {
		return;
	}
	window.hasRun = true;

	/**
	 * Get a random image URL from all uploaded images
	 */
	async function getRandomImageURL() {
		const result = await browser.storage.local.get(["userImages"]);
		const userImages = result.userImages || [];
		if (userImages.length === 0) {
			return null;
		}
		const randomIndex = Math.floor(Math.random() * userImages.length);
		return userImages[randomIndex].dataUrl;
	}

	/**
	 * Get all image URLs from storage
	 */
	async function getAllImageURLs() {
		const result = await browser.storage.local.get(["userImages"]);
		const userImages = result.userImages || [];
		return userImages.map((img) => img.dataUrl);
	}

	/**
	 * Preload all images for better performance
	 */
	async function preloadImages() {
		const imageURLs = await getAllImageURLs();
		if (imageURLs.length === 0) {
			console.log("No images uploaded yet, skipping preload");
			return false;
		}
		// Preload all images for better performance
		imageURLs.forEach((url) => {
			const preloadImage = new Image();
			preloadImage.src = url;
		});
		console.log(`Preloaded ${imageURLs.length} images`);
		return true;
	}
	// Store original image sources so we can restore them
	// Value stores properties needed to fully restore responsive images.
	const originalSources = new Map();

	function storeOriginal(img) {
		if (originalSources.has(img)) return;
		originalSources.set(img, {
			src: img.getAttribute("src"),
			srcset: img.getAttribute("srcset"),
			sizes: img.getAttribute("sizes"),
		});
	}

	function restoreOriginal(img, original) {
		if (!original) return;

		if (original.src === null) img.removeAttribute("src");
		else img.setAttribute("src", original.src);

		if (original.srcset === null) img.removeAttribute("srcset");
		else img.setAttribute("srcset", original.srcset);

		if (original.sizes === null) img.removeAttribute("sizes");
		else img.setAttribute("sizes", original.sizes);
	}
	/**
	 * Sharkify images using random images from the uploaded set
	 * @param {boolean} randomizePerImage - If true, each image has 1/3 chance
	 */
	async function sharkifyWithRandomImages(randomizePerImage = false) {
		const images = document.querySelectorAll("img");
		for (const img of images) {
			// Skip if already sharkified
			if (img.classList.contains("sharkify-image")) {
				continue;
			}
			// If randomizing per image, check 1/3 chance for each image
			if (randomizePerImage && Math.random() >= 1 / 3) {
				continue;
			}
			// Store the original src/srcset/sizes before changing anything
			storeOriginal(img);
			// Get a random image URL for this specific image
			const randomURL = await getRandomImageURL();
			if (randomURL) {
				img.setAttribute("src", randomURL);
				img.removeAttribute("srcset");
				img.removeAttribute("sizes");
				img.classList.add("sharkify-image");
			}
		}
	}
	/**
	 * Restore all images to their original sources.
	 */
	function removeExistingSharks() {
		// Restore everything we touched, even if classes changed or DOM mutations removed the class.
		for (const [img, original] of originalSources.entries()) {
			// Only restore elements still in the document
			if (!img || !img.isConnected) {
				originalSources.delete(img);
				continue;
			}
			restoreOriginal(img, original);
			img.classList.remove("sharkify-image");
			originalSources.delete(img);
		}
	}
	/**
	 * Setup message listener
	 */
	function setupMessageListener() {
		browser.runtime.onMessage.addListener((message) => {
			if (message.command === "sharkify") {
				sharkifyWithRandomImages(false);
			} else if (message.command === "reset") {
				removeExistingSharks();
			}
		});
	}
	/**
	 * Initialize the content script
	 */
	async function init() {
		// Setup message listener for popup commands
		setupMessageListener();
		// Preload images and perform auto-sharkification on page load
		const hasImages = await preloadImages();
		if (hasImages) {
			// Perform automatic sharkification on page load with 1/3 chance per image
			// Each image element gets a random image from the uploaded set
			await sharkifyWithRandomImages(true);
		}
	}
	// Run initialization
	init();
})();
