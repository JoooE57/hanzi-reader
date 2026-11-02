# Scriptable barcode widget updates

This folder contains only the generic renderer and update manifest. Private card numbers and barcode patterns remain in the user's local Scriptable installer; never commit that installer here.

Current version: 1.3.0. The renderer provides medium widgets, full-screen barcodes, and local drawing without sending card data over the network.

To publish an update: add a new immutable `engine-X.Y.Z.js` exporting `{version, run: async function(CARDS) {...}}`; validate offline fallback and rendering; then update `manifest.json` to the newer version and its HTTPS raw URL. Preserve `carrier`, `family`, and `openpoint` IDs. Existing phone installations check this manifest on app execution or during eligible widget refreshes. iOS controls when each widget refreshes.
