/**
 * Content script.
 */

(async () => {
	if (!globalThis.browser) return;
	if (window.hasRun) return;
	window.hasRun = true;

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

	function resetPage() {
		for (const [img, original] of originalSources.entries()) {
			if (!img || !img.isConnected) {
				originalSources.delete(img);
				continue;
			}
			restoreOriginal(img, original);
			img.classList.remove("sharkify-image");
			originalSources.delete(img);
		}
	}

	async function preload(url) {
		await new Promise((resolve) => {
			const img = new Image();
			img.decoding = "async";
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = url;
		});
	}

	let sessionSharkURL = null;

	async function sharkify({ url, randomizePerImage, randomnessOneInX }) {
		const finalUrl = sessionSharkURL || url;
		if (!finalUrl) return;
		if (!sessionSharkURL) sessionSharkURL = finalUrl;

		await preload(finalUrl);

		// Calculate probability as 1/X (e.g., 1/333 = 0.003)
		const oneInX = randomnessOneInX ?? 333;
		const probability = 1 / oneInX;

		for (const img of document.querySelectorAll("img")) {
			if (img.classList.contains("sharkify-image")) continue;
			if (randomizePerImage && Math.random() >= probability) continue;

			storeOriginal(img);
			img.setAttribute("src", finalUrl);
			img.removeAttribute("srcset");
			img.removeAttribute("sizes");
			img.classList.add("sharkify-image");
		}
	}

	browser.runtime.onMessage.addListener((message) => {
		if (message.command === "reset") {
			resetPage();
			return;
		}
		if (message.command === "sharkify") {
			return sharkify({
				url: message.sharkURL,
				randomizePerImage: false,
				randomnessOneInX: message.randomnessOneInX ?? 333,
			});
		}
	});

	const storedSettings = await browser.storage.local.get([
		"userImages",
		"randomnessOneInX",
	]);
	const autoUrl =
		storedSettings.userImages?.[
			Math.floor(Math.random() * (storedSettings.userImages?.length || 0))
		]?.dataUrl;
	const randomness = storedSettings.randomnessOneInX ?? 333;

	if (autoUrl) {
		sessionSharkURL = autoUrl;
		await sharkify({
			url: autoUrl,
			randomizePerImage: true,
			randomnessOneInX: randomness,
		});
	}
})();
