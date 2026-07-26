/**
 * Interaction Tracking System
 * Automatically tracks clicks, timing, and abandonment.
 */

const Tracker = {
    viewStartTimes: {},

    init() {
        // Attach global click listener for click metrics
        document.addEventListener('click', (e) => {
            this.recordClick();
        });

        document.addEventListener('touchstart', (e) => {
            this.recordClick();
        }, { passive: true });
        
        // Listen for validation errors globally (capture when forms fail)
        document.addEventListener('invalid', (e) => {
            window.Store.behavioral.validationErrorCount++;
        }, true); // Use capture phase because invalid events don't bubble
        
        // Listen for tab close / abandonment
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && window.Store.participant.completionStatus !== 'completed') {
                this.sendAbandonmentBeacon();
            }
        });
        
        window.addEventListener('pagehide', () => {
            if (window.Store.participant.completionStatus !== 'completed') {
                this.sendAbandonmentBeacon();
            }
        });
        // Listen for Figma Embed API events
        window.addEventListener('message', (event) => {
            // Verify origin is Figma
            if (event.origin !== 'https://www.figma.com') return;

            try {
                // Some messages are JSON strings, others might be objects
                let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                
                const currentView = window.Store.app.currentView;
                if (!data || !currentView) return;

                const isTraditional = currentView === 'traditional-workflow';
                const isAi = currentView === 'ai-workflow';

                if (!isTraditional && !isAi) return;

                // Add timestamp
                data.timestamp = new Date().toISOString();

                // Store event based on current workflow
                if (isTraditional) {
                    let log = JSON.parse(window.Store.experimental.traditionalEventsLog);
                    log.push(data);
                    window.Store.experimental.traditionalEventsLog = JSON.stringify(log);
                    
                    if (data.type === 'route_change') window.Store.experimental.traditionalScreens++;
                    if (data.type === 'mouse_click') window.Store.experimental.traditionalClicks++;
                } else {
                    let log = JSON.parse(window.Store.experimental.aiEventsLog);
                    log.push(data);
                    window.Store.experimental.aiEventsLog = JSON.stringify(log);
                    
                    if (data.type === 'route_change') window.Store.experimental.aiScreens++;
                    if (data.type === 'mouse_click') window.Store.experimental.aiClicks++;
                }
            } catch (err) {
                // Ignore non-JSON messages from other sources
            }
        });
    },

    recordClick() {
        // Document clicks (outside of iframe) can still be recorded if needed, 
        // but Figma handles its own inside the iframe.
    },

    startViewTimer(viewId) {
        this.viewStartTimes[viewId] = Date.now();
        window.Store.behavioral.navigationEvents++;
    },

    stopViewTimer(viewId) {
        const startTime = this.viewStartTimes[viewId];
        if (startTime) {
            const durationMs = Date.now() - startTime;
            const durationSec = Math.round(durationMs / 1000);
            
            // Record generic time spent on THIS page
            window.Store.recordPageTime(viewId, durationSec);
        }
    },
    
    recordAiCorrection() {
        window.Store.experimental.aiCorrectionCount++;
    },
    
    sendAbandonmentBeacon() {
        if (!window.Store.participant.id) return;
        
        if (window.Store.app.currentView) {
            this.stopViewTimer(window.Store.app.currentView);
        }
        
        const payload = window.Store.exportForAPI();
        
        const url = window.API ? window.API.getScriptUrl() : null;
        if (navigator.sendBeacon && url) {
            try {
                navigator.sendBeacon(url, JSON.stringify(payload));
            } catch (e) {
                console.error("Beacon failed", e);
            }
        }
    }
};

window.Tracker = Tracker;
