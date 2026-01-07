(async () => {
	if (!globalThis.browser) return;
	if (window.hasRun) return;
	window.hasRun = true;

	const originalSources = new Map();
	const autoProcessed = new WeakSet();

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

	function preload(url) {
		return new Promise((resolve) => {
			const img = new Image();
			img.decoding = "async";
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = url;
		});
	}

	let persistentSharkURL = null;
	let autoModeConfig = null;

	function calcProbability(randomnessOneInX) {
		return 1 / (randomnessOneInX ?? 333);
	}

	function restoreSharkifiedImage(img) {
		img.setAttribute("src", persistentSharkURL);
		img.removeAttribute("srcset");
		img.removeAttribute("sizes");
	}

	function getApplyParams() {
		return {
			randomizePerImage: autoModeConfig?.mode === "auto",
			probability: autoModeConfig?.probability ?? 1,
		};
	}

	function applyToImage(img, finalUrl, { randomizePerImage, probability }) {
		if (!(img instanceof HTMLImageElement)) return;
		if (img.classList.contains("sharkify-image")) return;

		if (randomizePerImage) {
			if (autoProcessed.has(img)) return;
			autoProcessed.add(img);
			if (Math.random() >= probability) return;
		}

		storeOriginal(img);
		img.setAttribute("src", finalUrl);
		img.removeAttribute("srcset");
		img.removeAttribute("sizes");
		img.classList.add("sharkify-image");
	}

	async function sharkify({ url, randomizePerImage, randomnessOneInX }) {
		if (!persistentSharkURL) persistentSharkURL = url;
		if (!persistentSharkURL) return;

		await preload(persistentSharkURL);

		const probability = calcProbability(randomnessOneInX);

		for (const img of document.querySelectorAll("img")) {
			applyToImage(img, persistentSharkURL, { randomizePerImage, probability });
		}
	}

	function updateAutoModeConfig(randomizePerImage, randomnessOneInX) {
		autoModeConfig = randomizePerImage
			? {
				enabled: true,
				probability: calcProbability(randomnessOneInX),
				mode: "auto",
			}
			: persistentSharkURL
				? { enabled: true, probability: 1, mode: "manual" }
				: null;
	}

	function handleNewOrChangedImages(root) {
		if (!persistentSharkURL || !autoModeConfig?.enabled) return;

		const applyParams = getApplyParams();

		if (root instanceof HTMLImageElement) {
			if (root.classList.contains("sharkify-image")) {
				restoreSharkifiedImage(root);
			} else {
				applyToImage(root, persistentSharkURL, applyParams);
			}
			return;
		}

		if (!root?.querySelectorAll) return;

		for (const img of root.querySelectorAll("img:not(.sharkify-image)")) {
			applyToImage(img, persistentSharkURL, applyParams);
		}
	}

	let mutationPending = false;
	const observer = new MutationObserver((mutations) => {
		if (!persistentSharkURL || !autoModeConfig?.enabled) return;
		if (mutationPending) return;

		mutationPending = true;
		requestAnimationFrame(() => {
			mutationPending = false;

			for (const m of mutations) {
				if (m.type === "childList") {
					for (const n of m.addedNodes) {
						if (n.nodeType !== Node.ELEMENT_NODE) continue;
						handleNewOrChangedImages(n);
					}
				}

				if (m.type === "attributes" && m.target instanceof HTMLImageElement) {
					handleNewOrChangedImages(m.target);
				}
			}

			setTimeout(() => {
				if (!persistentSharkURL || !autoModeConfig?.enabled) return;

				const applyParams = getApplyParams();
				for (const img of document.querySelectorAll("img:not(.sharkify-image)")) {
					applyToImage(img, persistentSharkURL, applyParams);
				}
			}, 100);
		});
	});

	observer.observe(document.documentElement, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["src", "srcset"],
	});

	browser.runtime.onMessage.addListener((message) => {
		if (message.command === "reset") {
			resetPage();
			autoModeConfig = null;
			return;
		}
		if (message.command === "sharkify") {
			return sharkify({
				url: persistentSharkURL || message.sharkURL,
				randomizePerImage: false,
				randomnessOneInX: message.randomnessOneInX ?? 333,
			}).then(() => {
				updateAutoModeConfig(false, message.randomnessOneInX);
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
		persistentSharkURL = autoUrl;
		updateAutoModeConfig(true, randomness);
		await sharkify({
			url: autoUrl,
			randomizePerImage: true,
			randomnessOneInX: randomness,
		});
	}
})();
