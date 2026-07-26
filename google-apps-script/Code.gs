/**
 * Google Apps Script Web App - MSc Wardrobe Research
 * 
 * Secure Backend for receiving anonymous participant data and handling true counterbalancing.
 */

// GET request handles true counterbalancing by returning current group counts
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ groupA: 0, groupB: 0, error: "Sheet not found" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    let countA = 0;
    let countB = 0;
    
    if (lastRow > 1) {
      const conditions = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
      for (let i = 0; i < conditions.length; i++) {
        if (conditions[i][0] === 'Group A') countA++;
        if (conditions[i][0] === 'Group B') countB++;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ groupA: countA, groupB: countB }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ groupA: 0, groupB: 0, error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// POST request securely receives data
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
    
    if (!sheet) {
      throw new Error("Target sheet 'Data' not found.");
    }
    
    if (sheet.getLastRow() === 0) {
      setupHeaders(sheet);
    }
    
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Validation Failed: Empty payload.");
    }
    
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      throw new Error("Validation Failed: Invalid JSON format.");
    }
    
    // Strict Validation
    if (!data.participantId || typeof data.participantId !== 'string') {
      throw new Error("Validation Failed: Missing or invalid Participant ID");
    }
    
    // Duplicate Check
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === data.participantId) {
          return ContentService.createTextOutput(JSON.stringify({ "status": "success", "note": "Duplicate prevented" }))
                               .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // Prepare row data securely mapping directly to schema
    const rowData = [
      // 1. Participant Info
      sanitize(data.participantId),
      sanitize(data.studyStartTimestamp),
      sanitize(data.consentTimestamp),
      sanitize(data.completionTimestamp),
      sanitize(data.completionStatus),
      
      // 2. Experimental Data
      sanitize(data.assignedCondition),
      sanitize(data.workflowOrder),
      Number(data.traditionalTime) || 0,
      Number(data.traditionalClicks) || 0,
      Number(data.traditionalScreens) || 0,
      sanitize(data.traditionalEventsLog),
      Number(data.aiTime) || 0,
      Number(data.aiClicks) || 0,
      Number(data.aiScreens) || 0,
      sanitize(data.aiEventsLog),
      
      // 3. Advanced Behavioral Metrics
      Number(data.navigationEvents) || 0,
      sanitize(data.pageTimeMetricsLog),
      
      // 4. Demographics
      sanitize(data.age),
      sanitize(data.gender),
      sanitize(data.wardrobeExperience),
      sanitize(data.aiExperience),
      Number(data.mobileConfidence) || 0,
      
      // 5. Questionnaire
      Number(data.ratingTraditional) || 0,
      Number(data.easeTraditional) || 0,
      Number(data.usefulTraditional) || 0,
      Number(data.confTraditional) || 0,
      
      Number(data.ratingAi) || 0,
      Number(data.easeAi) || 0,
      Number(data.usefulAi) || 0,
      Number(data.confAi) || 0,
      
      sanitize(data.preference),
      sanitize(data.easier),
      sanitize(data.likelyUse),
      sanitize(data.reason),
      sanitize(data.suggestions),
      
      // 6. Metadata
      sanitize(data.browser),
      sanitize(data.deviceType),
      sanitize(data.screenResolution),
      sanitize(data.sessionID),
      new Date().toISOString()
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function sanitize(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.startsWith('=')) return "'" + str;
  return str.substring(0, 5000);
}

function setupHeaders(sheet) {
  const headers = [
    "Participant ID", "Study Start", "Consent Given", "Study Completed", "Completion Status",
    "Assigned Condition", "Workflow Order", 
    "Traditional Duration (s)", "Traditional Clicks", "Traditional Screens", "Traditional Events Log",
    "AI Duration (s)", "AI Clicks", "AI Screens", "AI Events Log",
    "Navigation Events", "Page Time Log",
    "Age", "Gender", "Wardrobe Exp", "AI Exp", "Mobile Confidence",
    "Rating Traditional", "Ease Traditional", "Useful Traditional", "Confidence Traditional",
    "Rating AI", "Ease AI", "Useful AI", "Confidence AI",
    "Preference", "Easier", "Likely Use", "Reason", "Suggestions",
    "Browser", "Device Type", "Resolution", "Session ID", "Backend Received"
  ];
  sheet.appendRow(headers);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#e8f0fe");
  sheet.setFrozenRows(1);
}
