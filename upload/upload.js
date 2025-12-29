/**
 * Upload Page Script (Firefox)
 */

import { uploadImages, deleteImageById } from "../popup/imageManager.js";
import { loadImages, saveImages, userImages } from "../popup/storage.js";

function $(id) {
	return document.getElementById(id);
}

function setStatus(text) {
	const el = $("status");
	if (el) el.textContent = text || "";
}

function setBusy(isBusy) {
	const input = $("image-upload");
	const deleteAllBtn = $("delete-all-btn");
	if (input) input.disabled = isBusy;
	if (deleteAllBtn) deleteAllBtn.disabled = isBusy;
}

function getSelectedFiles() {
	const input = $("image-upload");
	return input?.files ? Array.from(input.files) : [];
}

function setCount() {
	const el = $("count");
	if (!el) return;
	el.textContent =
		userImages.length === 0 ? "" : `${userImages.length} image(s)`;
}

function openLightbox(image) {
	const lightbox = $("lightbox");
	const img = $("lightbox-img");
	const name = $("lightbox-name");
	if (!lightbox || !img || !name) return;

	lightbox.classList.remove("is-portrait");

	img.onload = () => {
		// If the selected image is portrait, use a narrower modal.
		try {
			if (img.naturalHeight > img.naturalWidth) {
				lightbox.classList.add("is-portrait");
			}
		} catch {
			// ignore
		}
	};

	img.src = image.dataUrl;
	img.alt = image.name;
	name.textContent = image.name;

	lightbox.classList.add("is-open");
	lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
	const lightbox = $("lightbox");
	const img = $("lightbox-img");
	if (!lightbox) return;

	lightbox.classList.remove("is-open");
	lightbox.setAttribute("aria-hidden", "true");

	// Clear src after transition so the previous image doesn't flash next open.
	window.setTimeout(() => {
		if (img) img.src = "";
	}, 150);
}

function wireLightbox() {
	const lightbox = $("lightbox");
	if (!lightbox) return;

	lightbox.addEventListener("click", (e) => {
		const target = e.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.dataset.close === "true") closeLightbox();
	});

	lightbox
		.querySelector(".lightbox__close")
		?.addEventListener("click", closeLightbox);

	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closeLightbox();
	});
}

function renderGallery() {
	const gallery = $("gallery");
	if (!gallery) return;

	gallery.innerHTML = "";
	setCount();

	if (userImages.length === 0) {
		gallery.innerHTML =
			'<div class="empty">No images yet. Choose images to upload.</div>';
		return;
	}

	for (const image of userImages) {
		const card = document.createElement("div");
		card.className = "tile";

		const img = document.createElement("img");
		img.src = image.dataUrl;
		img.alt = image.name;
		img.loading = "lazy";
		img.addEventListener("click", () => openLightbox(image));

		const meta = document.createElement("div");
		meta.className = "tile__meta";

		const name = document.createElement("div");
		name.className = "tile__name";
		name.title = image.name;
		name.textContent = image.name;

		const actions = document.createElement("div");
		actions.className = "tile__actions";

		const del = document.createElement("button");
		del.className = "btn btn--danger";
		del.type = "button";
		del.textContent = "Delete";
		del.addEventListener("click", async (ev) => {
			ev.stopPropagation();
			setBusy(true);
			try {
				await deleteImageById(image.id);
				await refresh();
				setStatus("");
			} catch (e) {
				console.error(e);
				setStatus(`Delete failed: ${e?.message ?? e}`);
			} finally {
				setBusy(false);
			}
		});

		actions.appendChild(del);
		meta.appendChild(name);
		meta.appendChild(actions);

		card.appendChild(img);
		card.appendChild(meta);

		gallery.appendChild(card);
	}
}

async function refresh() {
	await loadImages();
	renderGallery();
}

async function uploadSelection() {
	const files = getSelectedFiles();
	if (files.length === 0) {
		setStatus("");
		return;
	}

	setBusy(true);
	setStatus(`Uploading ${files.length} image(s)…`);
	try {
		await uploadImages(files);

		// clear selection
		const input = $("image-upload");
		if (input) input.value = "";

		await refresh();
		setStatus(`Uploaded ${files.length} image(s).`);
	} catch (e) {
		console.error(e);
		setStatus(`Upload failed: ${e?.message ?? e}`);
	} finally {
		setBusy(false);
	}
}

async function deleteAll() {
	if (userImages.length === 0) return;
	const ok = window.confirm("Delete all uploaded images?");
	if (!ok) return;

	setBusy(true);
	try {
		await saveImages([]);
		await refresh();
		setStatus("All images deleted.");
	} catch (e) {
		console.error(e);
		setStatus(`Delete all failed: ${e?.message ?? e}`);
	} finally {
		setBusy(false);
	}
}

function init() {
	$("image-upload")?.addEventListener("change", () => void uploadSelection());
	$("delete-all-btn")?.addEventListener("click", () => void deleteAll());
	wireLightbox();

	void refresh();
}

init();
