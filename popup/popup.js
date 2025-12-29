/**
 * Main Popup Script
 */

import { listenForClicks } from "./eventHandlers.js";

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
	document.querySelector("#popup-content").classList.add("hidden");
	document.querySelector("#error-content").classList.remove("hidden");
	console.error(`Popup error: ${error.message ?? error}`);
}

/**
 * When the popup loads, load images and add event handlers.
 */
console.log("=== Popup script starting ===");

(async () => {
	try {
		listenForClicks();
		console.log("Popup initialized successfully");
	} catch (error) {
		reportExecuteScriptError(error);
	}
})();
