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

        // Window blur: only schedule abandonment if the window lost focus to another app/tab, 
        // NOT when the user clicks inside a prototype iframe!
        window.addEventListener('blur', () => {
            setTimeout(() => {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.tagName === 'IFRAME') {
                    // User is interacting with the prototype inside the app! Keep timer cleared.
                    this.clearAbandonGraceTimer();
                    return;
                }
            }, 100);
        });
        // Flags and state trackers for Figma interaction tracking
        let lastNodeIdTraditional = null;
        let lastNodeIdAi = null;
        let lastNativeClickTimeTraditional = 0;
        let lastNativeClickTimeAi = 0;

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

                // Normalize message type checking according to Figma Embed API documentation
                const msgType = String(data.type || '').toUpperCase().trim();
                const isExplicitClick = msgType === 'MOUSE_CLICK' || 
                                       msgType === 'MOUSE_PRESS_OR_RELEASE' || 
                                       msgType === 'MOUSE_UP' || 
                                       msgType === 'MOUSE_DOWN' || 
                                       msgType === 'NODE_CLICK' ||
                                       msgType === 'TAP';
                                       
                const isPresentedNodeChange = msgType === 'PRESENTED_NODE_CHANGED';
                const isInitialLoad = msgType === 'INITIAL_LOAD';
                const isRoute = isPresentedNodeChange || msgType === 'ROUTE_CHANGE';

                const now = Date.now();

                // 1. Handle Explicit Clicks emitted by Figma Embed API
                if (isExplicitClick) {
                    if (isTraditional) {
                        window.Store.experimental.traditionalClicks++;
                        lastNativeClickTimeTraditional = now;
                        let log = JSON.parse(window.Store.experimental.traditionalEventsLog);
                        log.push(data);
                        window.Store.experimental.traditionalEventsLog = JSON.stringify(log);
                    } else if (isAi) {
                        window.Store.experimental.aiClicks++;
                        lastNativeClickTimeAi = now;
                        let log = JSON.parse(window.Store.experimental.aiEventsLog);
                        log.push(data);
                        window.Store.experimental.aiEventsLog = JSON.stringify(log);
                    }
                }

                // 2. Handle Screen View Changes & Node Transitions
                if (isPresentedNodeChange || isInitialLoad) {
                    // Extract node ID from Figma payload structure
                    const nodeId = data.data && (data.data.presentedNodeId || data.data.nodeId);
                    
                    if (isTraditional) {
                        // Count initial screen view or screen transitions when frame node ID changes
                        if (!lastNodeIdTraditional || (nodeId && nodeId !== lastNodeIdTraditional)) {
                            lastNodeIdTraditional = nodeId;
                            window.Store.experimental.traditionalScreens++;

                            // If screen changed and no explicit click event was logged within 800ms,
                            // count the screen change trigger as a user click action
                            if (now - lastNativeClickTimeTraditional > 800 && !isInitialLoad) {
                                window.Store.experimental.traditionalClicks++;
                                lastNativeClickTimeTraditional = now;
                            }

                            let log = JSON.parse(window.Store.experimental.traditionalEventsLog);
                            log.push(data);
                            window.Store.experimental.traditionalEventsLog = JSON.stringify(log);
                        }
                    } else if (isAi) {
                        if (!lastNodeIdAi || (nodeId && nodeId !== lastNodeIdAi)) {
                            lastNodeIdAi = nodeId;
                            window.Store.experimental.aiScreens++;

                            if (now - lastNativeClickTimeAi > 800 && !isInitialLoad) {
                                window.Store.experimental.aiClicks++;
                                lastNativeClickTimeAi = now;
                            }

                            let log = JSON.parse(window.Store.experimental.aiEventsLog);
                            log.push(data);
                            window.Store.experimental.aiEventsLog = JSON.stringify(log);
                        }
                    }
                }

                // Save state to persist counter updates
                window.Store.saveState();
            } catch (err) {
                console.error('[Figma Embed API] Error parsing message:', err);
            }
        });

        // Focus-Based Click Fallback (For when Figma Embed API messages are not emitted or blocked)
        window.addEventListener('blur', () => {
            // Wait a brief moment to let document.activeElement update
            setTimeout(() => {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.tagName === 'IFRAME') {
                    const iframeId = activeEl.id;
                    const isTraditional = iframeId === 'tw-figma-frame';
                    const isAi = iframeId === 'aw-figma-frame';

                    if (isTraditional || isAi) {
                        const now = Date.now();
                        const lastClickTime = isTraditional ? lastNativeClickTimeTraditional : lastNativeClickTimeAi;

                        // Debounce: If a native click or screen view was recorded in the last 600ms, skip fallback duplicate
                        if (now - lastClickTime < 600) {
                            const resetTrigger = document.getElementById('focus-reset-trigger');
                            if (resetTrigger) {
                                resetTrigger.focus();
                                resetTrigger.blur();
                            }
                            return;
                        }

                        // Record fallback click event
                        const mockClickEvent = {
                            type: 'MOUSE_PRESS_OR_RELEASE',
                            targetNodeId: 'virtual-fallback-node',
                            timestamp: new Date().toISOString(),
                            isFallback: true
                        };

                        if (isTraditional) {
                            lastNativeClickTimeTraditional = now;
                            window.Store.experimental.traditionalClicks++;
                            let log = JSON.parse(window.Store.experimental.traditionalEventsLog);
                            log.push(mockClickEvent);
                            window.Store.experimental.traditionalEventsLog = JSON.stringify(log);
                        } else {
                            lastNativeClickTimeAi = now;
                            window.Store.experimental.aiClicks++;
                            let log = JSON.parse(window.Store.experimental.aiEventsLog);
                            log.push(mockClickEvent);
                            window.Store.experimental.aiEventsLog = JSON.stringify(log);
                        }

                        window.Store.saveState();

                        if (window.Config && window.Config.ENVIRONMENT === 'development') {
                            console.log('☝️ [Focus Click Fallback] Captured tap inside ' + (isTraditional ? 'Traditional' : 'AI') + ' iframe');
                        }

                        // Refocus the parent page using the reset trigger element to capture subsequent iframe taps
                        const resetTrigger = document.getElementById('focus-reset-trigger');
                        if (resetTrigger) {
                            resetTrigger.focus();
                            resetTrigger.blur();
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
