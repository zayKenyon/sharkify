/**
 * CSS to hide everything on the page,
 * except for elements that have the "sharkify-image" class.
 */
const hidePage = `body > :not(.sharkify-image) {
                    display: none;
                  }`;

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
	document.addEventListener("click", (e) => {
		/**
		 * Insert the page-hiding CSS into the active tab,
		 * then get the shark URL and send a "sharkify"
		 * message to the content script in the active tab.
		 */
		function sharkify(tabs) {
			browser.tabs.insertCSS({ code: hidePage }).then(() => {
				const url = browser.runtime.getURL("beasts/shark.jpg");
				browser.tabs.sendMessage(tabs[0].id, {
					command: "sharkify",
					sharkURL: url,
				});
			});
		}

		/**
		 * Remove the page-hiding CSS from the active tab,
		 * send a "reset" message to the content script in the active tab.
		 */
		function reset(tabs) {
			browser.tabs.removeCSS({ code: hidePage }).then(() => {
				browser.tabs.sendMessage(tabs[0].id, {
					command: "reset",
				});
			});
		}

		/**
		 * Just log the error to the console.
		 */
		function reportError(error) {
			console.error(`Could not sharkify: ${error}`);
		}

		/**
		 * Get the active tab,
		 * then call "sharkify()" or "reset()" as appropriate.
		 */
		if (e.target.tagName !== "BUTTON" || !e.target.closest("#popup-content")) {
			// Ignore when click is not on a button within <div id="popup-content">.
			return;
		}
		if (e.target.type === "reset") {
			browser.tabs
				.query({ active: true, currentWindow: true })
				.then(reset)
				.catch(reportError);
		} else {
			browser.tabs
				.query({ active: true, currentWindow: true })
				.then(sharkify)
				.catch(reportError);
		}
	});
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
	document.querySelector("#popup-content").classList.add("hidden");
	document.querySelector("#error-content").classList.remove("hidden");
	console.error(`Failed to execute sharkify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
	.executeScript({ file: "/content_scripts/sharkify.js" })
	.then(listenForClicks)
	.catch(reportExecuteScriptError);