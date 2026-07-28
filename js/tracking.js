/**
 * Interaction Tracking System
 * Automatically tracks clicks, timing, and abandonment.
 */

const Tracker = {
    viewStartTimes: {},
    abandonGraceTimer: null,

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
        
        // Tab switch / background: wait grace period before abandoning
        window.addEventListener('visibilitychange', () => {
            if (window.Store.participant.completionStatus === 'completed') {
                this.clearAbandonGraceTimer();
                return;
            }

            if (document.visibilityState === 'hidden') {
                this.scheduleAbandonmentBeacon();
            } else if (document.visibilityState === 'visible') {
                this.clearAbandonGraceTimer();
            }
        });
        
        // Tab/window closing: beacon immediately (delayed timer cannot run after unload)
        window.addEventListener('pagehide', () => {
            this.clearAbandonGraceTimer();
            if (window.Store.participant.completionStatus !== 'completed') {
                this.sendAbandonmentBeacon();
            }
        });
        // Listen for Figma Embed API events
        window.addEventListener('message', (event) => {
            // Verify origin is Figma (Embed Kit 1.0 and 2.0)
            if (event.origin !== 'https://www.figma.com' && event.origin !== 'https://embed.figma.com') return;

            try {
                // Some messages are JSON strings, others might be objects
                let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                console.log('[Figma Embed API]', {
                    origin: event.origin,
                    type: data && data.type,
                    data: data,
                    currentView: window.Store.app.currentView
                });
                
                const currentView = window.Store.app.currentView;
                if (!data || !currentView) return;

                const isTraditional = currentView === 'traditional-workflow';
                const isAi = currentView === 'ai-workflow';

                if (!isTraditional && !isAi) return;

                // Add timestamp
                data.timestamp = new Date().toISOString();

                const isClick = data.type === 'mouse_click' || data.type === 'MOUSE_PRESS_OR_RELEASE';
                const isRoute = data.type === 'route_change' || data.type === 'PRESENTED_NODE_CHANGED';

                // Store event based on current workflow
                if (isTraditional) {
                    let log = JSON.parse(window.Store.experimental.traditionalEventsLog);
                    log.push(data);
                    window.Store.experimental.traditionalEventsLog = JSON.stringify(log);
                    
                    if (isRoute) window.Store.experimental.traditionalScreens++;
                    if (isClick) window.Store.experimental.traditionalClicks++;
                } else {
                    let log = JSON.parse(window.Store.experimental.aiEventsLog);
                    log.push(data);
                    window.Store.experimental.aiEventsLog = JSON.stringify(log);
                    
                    if (isRoute) window.Store.experimental.aiScreens++;
                    if (isClick) window.Store.experimental.aiClicks++;
                }
            } catch (err) {
                console.log('[Figma Embed API] non-JSON / ignored message', event.origin, event.data);
            }
        });
    },

    clearAbandonGraceTimer() {
        if (this.abandonGraceTimer) {
            clearTimeout(this.abandonGraceTimer);
            this.abandonGraceTimer = null;
        }
    },

    scheduleAbandonmentBeacon() {
        this.clearAbandonGraceTimer();
        const graceMs = (window.Config && window.Config.ABANDON_GRACE_MS) || (5 * 60 * 1000);
        this.abandonGraceTimer = setTimeout(() => {
            this.abandonGraceTimer = null;
            if (window.Store.participant.completionStatus !== 'completed') {
                this.sendAbandonmentBeacon();
            }
        }, graceMs);
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
