# Maintenance Guide

Once the study is live, very little maintenance is required. However, keep the following in mind:

## Google Sheets Quotas
- Google Apps Script has a daily execution limit. For free personal accounts (gmail.com), this is typically thousands of executions per day, which is vastly more than enough for a typical MSc dissertation study.
- Ensure your Google Drive has enough storage space (text data in Google Sheets uses extremely little space).

## Data Integrity Monitoring
- Occasionally check the Google Sheet to ensure data is populating correctly.
- Do **not** rename the "Data" tab while the study is live, or the script will fail to find it.
- If you need to manipulate or format the data, it is strongly recommended to copy the data to a *different* sheet or tab, rather than modifying the active "Data" tab, to prevent disrupting the incoming data stream.

## Updating the Application
If you need to fix a typo in the application while the study is live:
1. Make the change in your local files.
2. Commit and push the changes to your GitHub repository.
3. GitHub Pages will automatically rebuild and deploy the site within a few minutes.
4. *Warning:* If a participant is currently taking the study while you deploy an update, it will not affect them unless they refresh the page (which will trigger an abandonment).
