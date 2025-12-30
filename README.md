# Sharkify
A Firefox extension that randomly replaces images on webpages with your custom uploaded images.

Homepage: https://bigshark.party

[![Sign and Release XPI](https://github.com/zayKenyon/sharkify/actions/workflows/release-xpi.yml/badge.svg)](https://github.com/zayKenyon/sharkify/actions/workflows/release-xpi.yml)
[![Deploy Pages](https://github.com/zayKenyon/sharkify/actions/workflows/pages.yml/badge.svg)](https://github.com/zayKenyon/sharkify/actions/workflows/pages.yml)
---

## Features
- Upload and manage custom images
- Configurable replacement probability
- Manual Sharkify/Reset controls
- Persistent local storage

## Install
Download the latest signed `.xpi` from:
- https://bigshark.party
- or GitHub Releases: https://github.com/zayKenyon/sharkify/releases/latest

Install via
Firefox: `about:addons` → ⚙️ → **Install Add-on From File…**

## Usage
1. Click the extension icon
2. Click **Manage Images** and upload your images
3. Adjust the randomness slider

## Development
```bash
npm install
npm start       # Run in Firefox
npm run build   # Build extension
```
Copy `.env.example` to `.env` and configure for signing.
