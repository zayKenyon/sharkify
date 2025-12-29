/**
 * Image Management Module
 * Handles uploading and deleting images
 */

import { userImages, saveImages, loadImages } from "./storage.js";

async function fileToDataUrl(file) {
	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("Error reading file"));
		reader.onload = (e) => resolve(e.target.result);
		reader.readAsDataURL(file);
	});
}

/**
 * Upload a new image
 * @param {File} file
 * @param {{ render?: () => void }} [opts]
 */
export async function uploadImage(file, opts = {}) {
	if (!file) throw new Error("No file provided");
	const created = await uploadImages([file], opts);
	return created[0];
}

/**
 * Upload multiple images
 * @param {File[]} files
 * @param {{ render?: () => void }} [opts]
 * @returns {Promise<Array<{id: string, name: string, dataUrl: string}>>}
 */
export async function uploadImages(files, opts = {}) {
	if (!files || files.length === 0) {
		throw new Error("No files provided");
	}

	// Ensure we have the latest state in long-lived pages.
	await loadImages();

	const created = [];
	for (const file of files) {
		if (!file) continue;
		if (file.size > 5 * 1024 * 1024) {
			throw new Error(`Image is too large (max 5MB): ${file.name}`);
		}
		const dataUrl = await fileToDataUrl(file);
		created.push({
			id: Date.now().toString() + "-" + Math.random().toString(16).slice(2),
			name: file.name,
			dataUrl,
		});
	}

	userImages.push(...created);
	await saveImages(userImages);

	try {
		opts.render?.();
	} catch (e) {
		console.warn("Render callback failed (ignored):", e);
	}

	return created;
}

/**
 * Delete an image by id (no confirm). Intended for use in the upload page.
 */
export async function deleteImageById(imageId, opts = {}) {
	await loadImages();
	const filteredImages = userImages.filter((img) => img.id !== imageId);
	await saveImages(filteredImages);
	try {
		opts.render?.();
	} catch (e) {
		console.warn("Render callback failed (ignored):", e);
	}
}

/**
 * Delete an image (with confirm). Used from the popup.
 */
export async function deleteImage(imageId, opts = {}) {
	const confirmed = window.confirm(
		"Are you sure you want to delete this image?",
	);
	if (!confirmed) return;
	return deleteImageById(imageId, opts);
}
