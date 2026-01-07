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

	let sharkPreloadPromise = null;
	function ensurePreloaded(url) {
		if (!url) return Promise.resolve(false);
		return (sharkPreloadPromise ??= preload(url));
	}

	function calcProbability(randomnessOneInX) {
		return 1 / (randomnessOneInX ?? 333);
	}

	function getApplyParams() {
		return {
			randomizePerImage: autoModeConfig?.mode === "auto",
			probability: autoModeConfig?.probability ?? 1,
		};
	}

	function restoreSharkifiedImage(img) {
		// Avoid redundant DOM writes
		if (img.getAttribute("src") !== persistentSharkURL) img.setAttribute("src", persistentSharkURL);
		if (img.hasAttribute("srcset")) img.removeAttribute("srcset");
		if (img.hasAttribute("sizes")) img.removeAttribute("sizes");
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
		if (img.hasAttribute("srcset")) img.removeAttribute("srcset");
		if (img.hasAttribute("sizes")) img.removeAttribute("sizes");
		img.classList.add("sharkify-image");
	}

	async function sharkify({ url, randomizePerImage, randomnessOneInX }) {
		persistentSharkURL ??= url;
		if (!persistentSharkURL) return;

		await ensurePreloaded(persistentSharkURL);

		const probability = calcProbability(randomnessOneInX);
		for (const img of document.querySelectorAll("img")) {
			applyToImage(img, persistentSharkURL, { randomizePerImage, probability });
		}
	}

	function updateAutoModeConfig(randomizePerImage, randomnessOneInX) {
		autoModeConfig = randomizePerImage
			? { enabled: true, probability: calcProbability(randomnessOneInX), mode: "auto" }
			: persistentSharkURL
				? { enabled: true, probability: 1, mode: "manual" }
				: null;
	}

	let mutationPending = false;
	const mutationCandidates = new Set();

	function addCandidate(node) {
		if (node instanceof HTMLImageElement) {
			mutationCandidates.add(node);
			return;
		}
		if (!node?.querySelectorAll) return;
		for (const img of node.querySelectorAll("img")) mutationCandidates.add(img);
	}

	function flushMutationCandidates() {
		if (!persistentSharkURL || !autoModeConfig?.enabled) {
			mutationCandidates.clear();
			return;
		}

		const applyParams = getApplyParams();
		for (const img of mutationCandidates) {
			if (!(img instanceof HTMLImageElement) || !img.isConnected) continue;
			if (img.classList.contains("sharkify-image")) restoreSharkifiedImage(img);
			else applyToImage(img, persistentSharkURL, applyParams);
		}
		mutationCandidates.clear();
	}

	const observer = new MutationObserver((mutations) => {
		if (!persistentSharkURL || !autoModeConfig?.enabled) return;

		for (const m of mutations) {
			if (m.type === "childList") {
				for (const n of m.addedNodes) {
					if (n.nodeType !== Node.ELEMENT_NODE) continue;
					addCandidate(n);
				}
				continue;
			}

			if (m.type === "attributes" && m.target instanceof HTMLImageElement) {
				mutationCandidates.add(m.target);
			}
		}

		if (mutationPending) return;
		mutationPending = true;
		requestAnimationFrame(() => {
			mutationPending = false;
			flushMutationCandidates();
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
			mutationCandidates.clear();
			mutationPending = false;
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
