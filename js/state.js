/**
 * Application State Management
 * Holds all participant data and interaction metrics.
 */

const Store = {
    participant: {
        id: null,
        studyStartTimestamp: null,
        consentTimestamp: null,
        completionTimestamp: null,
        completionStatus: 'abandoned',
    },
    experimental: {
        assignedCondition: null,
        workflowOrder: null,
        
        traditionalTime: 0,
        traditionalClicks: 0,
        traditionalScreens: 0,
        traditionalEventsLog: "[]",
        
        aiTime: 0,
        aiClicks: 0,
        aiScreens: 0,
        aiEventsLog: "[]",
    },
    behavioral: {
        pageTimeMetrics: {}, 
        navigationEvents: 0,
    },
    demographics: {
        age: null,
        gender: null,
        wardrobeExperience: null,
        aiExperience: null,
        mobileConfidence: null,
    },
    questionnaire: {
        ratingTraditional: null,
        easeTraditional: null,
        usefulTraditional: null,
        confTraditional: null,
        
        ratingAi: null,
        easeAi: null,
        usefulAi: null,
        confAi: null,
        
        preference: null,
        easier: null,
        likelyUse: null,
        reason: '',
        suggestions: '',
    },
    metadata: {
        browser: navigator.userAgent,
        deviceType: /Mobile|Android|iP(ad|hone)/.test(navigator.userAgent) ? 'Mobile/Tablet' : 'Desktop',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        sessionID: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
    },
    
    app: {
        currentView: null,
        workflowsToRun: [],
    },

    initParticipant() {
        const uuidSlice = this.metadata.sessionID.slice(0, 5).toUpperCase();
        this.participant.id = `P-${Date.now()}-${uuidSlice}`;
        this.participant.studyStartTimestamp = new Date().toISOString();
    },

    setConsent() {
        this.participant.consentTimestamp = new Date().toISOString();
    },

    assignConditionBasedOnCounts(counts) {
        let isGroupA = true;
        
        if (counts.groupA < counts.groupB) {
            isGroupA = true;
        } else if (counts.groupB < counts.groupA) {
            isGroupA = false;
        } else {
            isGroupA = Math.random() < 0.5;
        }
        
        if (isGroupA) {
            this.experimental.assignedCondition = 'Group A';
            this.experimental.workflowOrder = 'Traditional -> AI';
            this.app.workflowsToRun = ['traditional-workflow', 'ai-workflow'];
        } else {
            this.experimental.assignedCondition = 'Group B';
            this.experimental.workflowOrder = 'AI -> Traditional';
            this.app.workflowsToRun = ['ai-workflow', 'traditional-workflow'];
        }
        
        if (window.Config && window.Config.ENVIRONMENT === 'development') {
            console.log(`🛠 [Development] Server Counts A:${counts.groupA} B:${counts.groupB}. Assigned to: ${this.experimental.assignedCondition}`);
        }
    },
    
    recordPageTime(viewName, durationSec) {
        if (!this.behavioral.pageTimeMetrics[viewName]) {
            this.behavioral.pageTimeMetrics[viewName] = 0;
        }
        this.behavioral.pageTimeMetrics[viewName] += durationSec;
    },

    exportForAPI() {
        return {
            participantId: this.participant.id,
            studyStartTimestamp: this.participant.id ? this.participant.studyStartTimestamp : null,
            consentTimestamp: this.participant.consentTimestamp,
            completionTimestamp: this.participant.completionTimestamp,
            completionStatus: this.participant.completionStatus,
            
            assignedCondition: this.experimental.assignedCondition,
            workflowOrder: this.experimental.workflowOrder,
            
            traditionalTime: this.experimental.traditionalTime,
            traditionalClicks: this.experimental.traditionalClicks,
            traditionalScreens: this.experimental.traditionalScreens,
            traditionalEventsLog: this.experimental.traditionalEventsLog,
            
            aiTime: this.experimental.aiTime,
            aiClicks: this.experimental.aiClicks,
            aiScreens: this.experimental.aiScreens,
            aiEventsLog: this.experimental.aiEventsLog,
            
            navigationEvents: this.behavioral.navigationEvents,
            pageTimeMetricsLog: JSON.stringify(this.behavioral.pageTimeMetrics),
            
            age: this.demographics.age,
            gender: this.demographics.gender,
            wardrobeExperience: this.demographics.wardrobeExperience,
            aiExperience: this.demographics.aiExperience,
            mobileConfidence: this.demographics.mobileConfidence,
            
            ratingTraditional: this.questionnaire.ratingTraditional,
            easeTraditional: this.questionnaire.easeTraditional,
            usefulTraditional: this.questionnaire.usefulTraditional,
            confTraditional: this.questionnaire.confTraditional,
            
            ratingAi: this.questionnaire.ratingAi,
            easeAi: this.questionnaire.easeAi,
            usefulAi: this.questionnaire.usefulAi,
            confAi: this.questionnaire.confAi,
            
            preference: this.questionnaire.preference,
            easier: this.questionnaire.easier,
            likelyUse: this.questionnaire.likelyUse,
            reason: this.questionnaire.reason,
            suggestions: this.questionnaire.suggestions,
            
            browser: this.metadata.browser,
            deviceType: this.metadata.deviceType,
            screenResolution: this.metadata.screenResolution,
            sessionID: this.metadata.sessionID
        };
    }
};

window.Store = Store;
