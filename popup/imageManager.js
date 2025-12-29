/**
 * Image management for uploads.
 */

import { loadImages, saveImages, userImages } from "./storage.js";

const MAX_BYTES = 5 * 1024 * 1024;

function estimateDataUrlBytes(dataUrl) {
	const comma = dataUrl.indexOf(",");
	if (comma === -1) return dataUrl.length;
	const b64 = dataUrl.slice(comma + 1);
	return Math.floor((b64.length * 3) / 4);
}

async function blobToDataUrl(blob) {
	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("Error reading blob"));
		reader.onload = (e) => resolve(e.target.result);
		reader.readAsDataURL(blob);
	});
}

async function compressToDataUrl(file) {
	const url = URL.createObjectURL(file);
	try {
		const img = new Image();
		img.decoding = "async";
		img.src = url;
		await img.decode();

		const maxDim = 1280;
		const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
		const w = Math.max(1, Math.round(img.width * scale));
		const h = Math.max(1, Math.round(img.height * scale));

		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d", { alpha: false });
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(img, 0, 0, w, h);

		let blob = await new Promise((resolve) =>
			canvas.toBlob(resolve, "image/webp", 0.82),
		);
		if (!blob) {
			blob = await new Promise((resolve) =>
				canvas.toBlob(resolve, "image/jpeg", 0.78),
			);
		}

		const dataUrl = await blobToDataUrl(blob);
		if (estimateDataUrlBytes(dataUrl) > MAX_BYTES) {
			throw new Error("Image too large after compression");
		}
		return dataUrl;
	} finally {
		URL.revokeObjectURL(url);
	}
}

export async function uploadImages(files) {
	if (!files || files.length === 0) throw new Error("No files provided");
	await loadImages();

	const created = [];
	for (const file of files) {
		if (!file) continue;
		const dataUrl = await compressToDataUrl(file);
		created.push({
			id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
			name: file.name,
			dataUrl,
		});
	}

	userImages.push(...created);
	await saveImages(userImages);
	return created;
}

export async function deleteImageById(imageId) {
	await loadImages();
	await saveImages(userImages.filter((img) => img.id !== imageId));
}
