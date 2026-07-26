# MSc Wardrobe Research Prototype

This repository contains the complete source code for the MSc dissertation research prototype comparing Traditional and AI-assisted wardrobe creation workflows. It is built strictly to experimental constraints to ensure valid data collection and participant safety.

## Research Compliance
- **No Personally Identifiable Information (PII)**: Participants are tracked via an anonymous `P-{Timestamp}-{UUID}` ID. No emails, names, or IP addresses are collected.
- **Strict Study Integrity**: A custom Single Page Application (SPA) state machine strictly enforces the flow (Information -> Consent -> Demographics -> Workflow 1 -> Workflow 2 -> Evaluation). Back navigation is disabled. Refreshes trigger an abandonment beacon.
- **Accessibility**: Built to WCAG standards with `aria-live` regions, keyboard-navigable custom inputs, skip links, semantic HTML, and high contrast styling.
- **Simulated AI (Deterministic)**: The AI workflow uses pre-defined mock data to ensure that every participant receives consistent, controlled stimuli without relying on costly or unpredictable third-party APIs.

## Project Architecture
This is a zero-dependency Vanilla JavaScript application.
```text
/
├── index.html                  # Main SPA shell (templates for all views)
├── css/
│   └── main.css                # Global styles, layout, accessible components
├── js/
│   ├── app.js                  # State machine, routing, and progress bar
│   ├── state.js                # In-memory store for all participant metrics
│   ├── tracking.js             # Analytics engine (clicks, duration, abandonment)
│   ├── views.js                # Interactive logic for individual workflows
│   └── api.js                  # Communication with Google Apps Script
├── assets/
│   └── mock-data.json          # Deterministic data for AI simulation
└── google-apps-script/
    └── Code.gs                 # The secure backend script for Google Sheets
```

## Data Schema & Statistical Export
The application generates a flattened dataset specifically designed for easy importation into SPSS, R, or Excel. 
### Exporting Data
1. Open the Google Sheet where the Apps Script is deployed.
2. Click **File > Download > Comma Separated Values (.csv)**.
3. Import the CSV directly into your statistical software.

### Column Mapping
- **Identity & Time:** `Participant ID`, `Study Start`, `Consent Given`, `Study Completed`, `Completion Status`
- **Experimental:** `Assigned Condition` (Group A or B), `Workflow Order`
- **Workflow 1 & 2 Metrics:** `Start`, `End`, `Duration (s)`, `Clicks`, `Complete`
- **Advanced Behaviors:** `AI Corrections`, `Navigation Events`, `Validation Errors`, `Submission Retries`, `Page Time Log` (JSON mapping seconds per page)
- **Demographics:** `Age`, `Gender`, `Wardrobe Exp`, `AI Exp`, `Mobile Confidence`
- **Traditional Evaluation (Likert 1-5):** `Rating Traditional`, `Ease Traditional`, `Useful Traditional`, `Confidence Traditional`
- **AI Evaluation (Likert 1-5):** `Rating AI`, `Ease AI`, `Useful AI`, `Confidence AI`
- **Comparative & Qualitative:** `Preference`, `Easier`, `Likely Use`, `Reason`, `Suggestions`
- **Metadata:** `Browser`, `Device Type`, `Resolution`, `Session ID`, `Backend Received`

## Technical Documentation
Please refer to the following guides for detailed operational instructions:
- [Installation Guide](installation_guide.md)
- [Configuration Guide](configuration_guide.md)
- [Deployment Guide](deployment_guide.md)
- [Maintenance Guide](maintenance_guide.md)
