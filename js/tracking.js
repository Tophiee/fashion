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
        // Global flags for focus click tracking workaround
        let hasNativeFigmaEvents = false;
        let focusClicksTraditional = 0;
        let focusClicksAi = 0;

        // Listen for Figma Embed API events
        window.addEventListener('message', (event) => {
            // Verify origin is Figma (supports figma.com, www.figma.com, embed.figma.com, etc.)
            const isFigmaOrigin = /^https:\/\/(?:[a-z0-9-]+\.)?figma\.com$/i.test(event.origin);
            if (!isFigmaOrigin) return;

            try {
                // Parse message and shallow-clone it to guarantee mutability (prevents frozen object TypeError)
                let rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!rawData) return;
                let data = { ...rawData };

                // Determine active workflow directly from active DOM elements (timing independent)
                let activeWorkflow = null;
                if (document.getElementById('tw-figma-frame') && document.body.contains(document.getElementById('tw-figma-frame'))) {
                    activeWorkflow = 'traditional-workflow';
                } else if (document.getElementById('aw-figma-frame') && document.body.contains(document.getElementById('aw-figma-frame'))) {
                    activeWorkflow = 'ai-workflow';
                }

                if (window.Config && window.Config.ENVIRONMENT === 'development') {
                    console.log('[Figma Embed Message Received]', {
                        origin: event.origin,
                        type: data.type,
                        activeWorkflow: activeWorkflow,
                        data: data
                    });
                }

                if (!activeWorkflow) return;

                const isTraditional = activeWorkflow === 'traditional-workflow';
                const isAi = activeWorkflow === 'ai-workflow';

                // Add timestamp safely
                data.timestamp = new Date().toISOString();

                // Normalize message type checking
                const msgType = String(data.type || '').toUpperCase().trim();
                const isClick = msgType === 'MOUSE_CLICK' || msgType === 'MOUSE_PRESS_OR_RELEASE';
                const isRoute = msgType === 'ROUTE_CHANGE' || msgType === 'PRESENTED_NODE_CHANGED';

                if (isClick || isRoute) {
                    hasNativeFigmaEvents = true; // Switch off the focus fallback since native events are working
                }

                // Store event
                if (isTraditional) {
                    let log = JSON.parse(window.Store.experimental.traditionalEventsLog);
                    log.push(data);
                    window.Store.experimental.traditionalEventsLog = JSON.stringify(log);
                    
                    if (isRoute) window.Store.experimental.traditionalScreens++;
                    if (isClick) window.Store.experimental.traditionalClicks++;
                } else if (isAi) {
                    let log = JSON.parse(window.Store.experimental.aiEventsLog);
                    log.push(data);
                    window.Store.experimental.aiEventsLog = JSON.stringify(log);
                    
                    if (isRoute) window.Store.experimental.aiScreens++;
                    if (isClick) window.Store.experimental.aiClicks++;
                }
                
                // Save state to persist counter updates
                window.Store.saveState();
            } catch (err) {
                console.error('[Figma Embed API] Error parsing message:', err);
            }
        });

        // Focus-Based Click Fallback (For when Figma API blocks MOUSE_PRESS_OR_RELEASE due to missing login or origin)
        window.addEventListener('blur', () => {
            // Wait a brief moment to let document.activeElement update
            setTimeout(() => {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.tagName === 'IFRAME') {
                    const iframeId = activeEl.id;
                    const isTraditional = iframeId === 'tw-figma-frame';
                    const isAi = iframeId === 'aw-figma-frame';

                    if (isTraditional || isAi) {
                        // If we are already receiving native events, do not double-count clicks/screens
                        if (hasNativeFigmaEvents) {
                            // Refocus parent to keep the focus loop running in case native events drop
                            const resetTrigger = document.getElementById('focus-reset-trigger');
                            if (resetTrigger) {
                                resetTrigger.focus();
                                resetTrigger.blur();
                            }
                            return;
                        }

                        // Create a mock click event for fallback logging
                        const mockClickEvent = {
                            type: 'MOUSE_PRESS_OR_RELEASE',
                            targetNodeId: 'virtual-fallback-node',
                            timestamp: new Date().toISOString(),
                            isFallback: true
                        };

                        if (isTraditional) {
                            focusClicksTraditional++;
                            window.Store.experimental.traditionalClicks++;
                            
                            let log = JSON.parse(window.Store.experimental.traditionalEventsLog);
                            log.push(mockClickEvent);
                            
                            // Fallback Screen Tracker: increment screen count on first click, and every 6 clicks thereafter
                            if (focusClicksTraditional === 1 || focusClicksTraditional % 6 === 0) {
                                window.Store.experimental.traditionalScreens++;
                                log.push({
                                    type: 'PRESENTED_NODE_CHANGED',
                                    timestamp: new Date().toISOString(),
                                    isFallback: true
                                });
                            }
                            window.Store.experimental.traditionalEventsLog = JSON.stringify(log);
                        } else {
                            focusClicksAi++;
                            window.Store.experimental.aiClicks++;
                            
                            let log = JSON.parse(window.Store.experimental.aiEventsLog);
                            log.push(mockClickEvent);
                            
                            // Fallback Screen Tracker: increment screen count on first click, and every 6 clicks thereafter
                            if (focusClicksAi === 1 || focusClicksAi % 6 === 0) {
                                window.Store.experimental.aiScreens++;
                                log.push({
                                    type: 'PRESENTED_NODE_CHANGED',
                                    timestamp: new Date().toISOString(),
                                    isFallback: true
                                });
                            }
                            window.Store.experimental.aiEventsLog = JSON.stringify(log);
                        }

                        window.Store.saveState();

                        if (window.Config && window.Config.ENVIRONMENT === 'development') {
                            console.log('☝️ [Focus Click Fallback] Captured tap inside ' + (isTraditional ? 'Traditional' : 'AI') + ' iframe');
                        }

                        // Refocus the parent page using the hidden input to capture the next tap
                        const resetTrigger = document.getElementById('focus-reset-trigger');
                        if (resetTrigger) {
                            resetTrigger.focus();
                            resetTrigger.blur(); // reset focus to body
                        }
                    }
                }
            }, 150);
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
