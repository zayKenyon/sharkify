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
	 * CSS to hide everything on the page,
	 * except for elements that have the "sharkify-image" class.
	 */
	const hidePage = `body > :not(.sharkify-image) {
                    display: none;
                  }`;

	/**
	 * Add or remove the page-hiding CSS
	 */
	function addHidePageCSS() {
		if (!document.getElementById("sharkify-style")) {
			const style = document.createElement("style");
			style.id = "sharkify-style";
			style.textContent = hidePage;
			document.head.appendChild(style);
		}
	}

	function removeHidePageCSS() {
		const style = document.getElementById("sharkify-style");
		if (style) {
			style.remove();
		}
	}

	/**
	 * Given a URL to a shark image, remove all existing sharks, then
	 * create and style an IMG node pointing to
	 * that image, then insert the node into the document.
	 */
	function insertShark(sharkURL) {
		removeExistingSharks();
		addHidePageCSS();
		const sharkImage = document.createElement("img");
		sharkImage.setAttribute("src", sharkURL);
		sharkImage.style.height = "100vh";
		sharkImage.className = "sharkify-image";
		document.body.appendChild(sharkImage);
	}

	/**
	 * Remove every shark from the page.
	 */
	function removeExistingSharks() {
		const existingSharks = document.querySelectorAll(".sharkify-image");
		for (const shark of existingSharks) {
			shark.remove();
		}
		removeHidePageCSS();
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
	 * On page load, randomly sharkify with 1/3 chance
	 */
	const randomChance = Math.random();
	if (randomChance < 1/3) {
		insertShark(sharkURL);
	}
})();