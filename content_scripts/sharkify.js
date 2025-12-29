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
	 * Given a URL to a shark image, remove all existing sharks, then
	 * create and style an IMG node pointing to
	 * that image, then insert the node into the document.
	 */
	function insertShark(sharkURL) {
		removeExistingSharks();
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
})();