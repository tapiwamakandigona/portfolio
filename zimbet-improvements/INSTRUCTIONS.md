# ZimBet SEO & PWA Improvements

This folder contains improved files to enhance the SEO and functionality of your **ZimBet** repository.

## Instructions

1.  **Copy these files** to the root of your `zimbet` repository.
2.  **`index.html`**:
    *   This file includes new meta tags for SEO (Open Graph, Twitter Cards).
    *   It also includes links for PWA support (`manifest.json`).
    *   **Action**: Replace your existing `index.html` with this one, OR copy the `<head>` section contents into your existing `index.html`.
    *   *Note*: Ensure your script tags (like `<script type="module" src="/main.js"></script>`) match your actual project structure.
3.  **`manifest.json`**:
    *   This file enables your game to be installed as an app on mobile devices.
    *   **Action**: Place this file in the root directory (or `public/` directory if using Vite).
4.  **Icons**:
    *   The manifest refers to `assets/icon-192.png` and `assets/icon-512.png`.
    *   **Action**: You should create these two icons (using your game logo) and place them in an `assets` folder in your repo.
5.  **Service Worker (Optional)**:
    *   The `index.html` tries to register a service worker (`sw.js`). This allows offline play.
    *   If you don't have a `sw.js` file, you can remove the script block at the bottom of `index.html`.

## Why these changes?

*   **SEO**: Helps your game show up in Google search results.
*   **Social Sharing**: Makes your game look good when shared on Twitter/Facebook/LinkedIn.
*   **PWA**: Allows users to "install" the game on their phone home screen for a native app-like experience.
