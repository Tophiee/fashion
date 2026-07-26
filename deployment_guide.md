# Deployment Guide

Follow these steps to deploy the research application so participants can access it globally.

## Part 1: Backend Deployment (Google Apps Script)
1. Open Google Sheets and create a new blank spreadsheet. Name it something memorable (e.g., "Wardrobe Study Data").
2. Rename the first tab at the bottom to **Data** (case-sensitive).
3. In the top menu, go to **Extensions > Apps Script**.
4. Delete any existing code in the editor.
5. Copy the entire contents of `google-apps-script/Code.gs` from this project and paste it into the editor.
6. Click the **Save** icon.
7. Click the blue **Deploy** button > **New deployment**.
8. Click the gear icon next to "Select type" and choose **Web app**.
9. Settings:
   - Description: "Production Backend"
   - Execute as: **Me** (This ensures data writes to your sheet even if the participant doesn't have a Google account).
   - Who has access: **Anyone**
10. Click **Deploy**. Google will ask you to authorize access to your Google Account. 
    *Note: Google may show a "Google hasn't verified this app" warning. Click "Advanced" and "Go to... (unsafe)" to proceed. You are authorizing your own script.*
11. Copy the resulting **Web app URL**.
12. Paste this URL into `js/api.js` in your codebase (see Configuration Guide).

## Part 2: Frontend Deployment (GitHub Pages)
GitHub Pages provides free, secure SSL hosting perfect for this application.

1. Create a free account on [GitHub](https://github.com/).
2. Create a new repository (e.g., `wardrobe-study`).
3. Upload all the files from this directory (`index.html`, `css/`, `js/`, `assets/`) directly into the repository.
4. Go to the repository **Settings** tab.
5. In the left sidebar, click **Pages**.
6. Under **Build and deployment**, set the Source to **Deploy from a branch**.
7. Under **Branch**, select `main` (or `master`), leave the folder as `/ (root)`, and click **Save**.
8. Wait 1-2 minutes. GitHub will display a message at the top of the settings page: *"Your site is live at https://[username].github.io/wardrobe-study"*.

Send this GitHub Pages link to your participants.
