# Configuration Guide

This guide details how to customize the Wardrobe Research Prototype for your specific study needs.

## 1. Connecting the API Endpoint
Before actual participant testing, you must connect the frontend to your Google Apps Script backend.
1. Open `js/api.js`.
2. Locate line 7: `SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',`
3. Replace the placeholder string with the Web App URL generated from your Google Apps Script deployment.
*Note: If the URL is left as the placeholder, the application will simulate a successful API submission to allow for local UX testing.*

## 2. Modifying the Mock AI Data
The AI simulation relies on deterministic data to present a consistent experience to every participant.
1. Open `assets/mock-data.json`.
2. Modify the array of objects. You can add as many items as you like.
3. The system will randomly pick an item from this array during the AI Analysis phase.
4. Ensure your categories and colors match the options available in the dropdowns in `index.html`.

## 3. Updating Researcher Details
Participants need to know who is conducting the research.
1. Open `index.html`.
2. Search for `[Researcher Name]` and `[Supervisor Name]` within the `<template id="view-info-sheet">`.
3. Replace these placeholders with your actual contact information.

## 4. Adjusting Questionnaire Scales
If you need to change a 5-point Likert scale to a 7-point scale:
1. Locate the specific `.likert-scale` block in `index.html`.
2. Add `<label class="focus-ring-wrapper"><input type="radio" name="..." value="6"><span>6</span></label>` (and 7) as needed.
3. Ensure the CSS remains responsive. The flexbox layout will automatically distribute the new items.
