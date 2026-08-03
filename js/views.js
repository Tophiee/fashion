/**
 * View Controllers
 * Logic for individual screens (event listeners, validation, form handling).
 */

window.Views = {
    /**
     * Sets up the mobile tap-to-interact overlay for Figma iframes.
     * On touch devices: overlay blocks iframe so page is scrollable.
     * User taps overlay → iframe becomes interactive, lock button appears.
     * User taps lock → overlay returns so they can scroll again.
     */
    _setupPrototypeOverlay(overlayId, lockBtnId, scrollHintId) {
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!isTouchDevice) return; // Desktop: do nothing, CSS hides everything

        const overlay = document.getElementById(overlayId);
        const lockBtn = document.getElementById(lockBtnId);
        const scrollHint = document.getElementById(scrollHintId);

        if (!overlay || !lockBtn) return;

        // Show the overlay and scroll hint on mobile
        overlay.classList.add('active');
        if (scrollHint) scrollHint.classList.add('active');

        // Tap overlay → unlock iframe
        overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
            lockBtn.classList.add('active');
        });

        // Tap lock → re-lock iframe so user can scroll
        lockBtn.addEventListener('click', () => {
            lockBtn.classList.remove('active');
            overlay.classList.add('active');
        });
    },

    _fillContactFields(elements) {
        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (!el || !value) continue;
            el.textContent = value;
            if (el.tagName === 'A' && value.includes('@')) {
                el.setAttribute('href', 'mailto:' + value);
            }
        }
    },

    'landing': {
        init() {
            if (window.Config) {
                const titleEl = document.getElementById('landing-title');
                if (titleEl && window.Config.STUDY_TITLE) titleEl.textContent = window.Config.STUDY_TITLE;
                
                const timeEl = document.getElementById('landing-time');
                if (timeEl && window.Config.ESTIMATED_TIME) timeEl.textContent = window.Config.ESTIMATED_TIME;
            }
            
            document.getElementById('btn-begin-study').addEventListener('click', () => {
                window.App.next();
            });
        }
    },
    
    'info-sheet': {
        init() {
            if (window.Config) {
                window.Views._fillContactFields({
                    'info-data-controller': window.Config.DATA_CONTROLLER,
                    'info-data-controller-email': window.Config.DATA_CONTROLLER_EMAIL,
                    'info-researcher-name': window.Config.RESEARCHER_NAME,
                    'info-researcher-email': window.Config.RESEARCHER_EMAIL,
                    'info-supervisor-1-name': window.Config.SUPERVISOR_1_NAME,
                    'info-supervisor-1-email': window.Config.SUPERVISOR_1_EMAIL,
                    'info-supervisor-2-name': window.Config.SUPERVISOR_2_NAME,
                    'info-supervisor-2-email': window.Config.SUPERVISOR_2_EMAIL,
                });
            }
            
            document.getElementById('btn-continue-consent').addEventListener('click', () => {
                window.App.next();
            });
        }
    },
    
    'consent': {
        init() {
            const form = document.getElementById('consent-form');
            const btn = document.getElementById('btn-agree-consent');
            
            form.addEventListener('change', () => {
                const allChecked = Array.from(form.querySelectorAll('input[type="checkbox"]'))
                    .every(cb => cb.checked);
                btn.disabled = !allChecked;
                btn.setAttribute('aria-disabled', !allChecked);
            });
            
            btn.addEventListener('click', () => {
                if (!btn.disabled) {
                    window.Store.setConsent();
                    window.App.next();
                }
            });
        }
    },
    
    'demographics': {
        init() {
            const btn = document.getElementById('btn-submit-demographics');
            const form = document.getElementById('demographics-form');
            
            form.addEventListener('change', (e) => {
                if (e.target.validity.valid) {
                    e.target.classList.remove('error-state');
                }
            });
            
            btn.addEventListener('click', (e) => {
                if (form.checkValidity()) {
                    e.preventDefault();
                    const fd = new FormData(form);
                    window.Store.demographics.age = fd.get('age');
                    window.Store.demographics.gender = fd.get('gender') || 'Not Specified';
                    window.Store.demographics.wardrobeExperience = fd.get('wardrobeExperience');
                    window.Store.demographics.aiExperience = fd.get('aiExperience');
                    window.Store.demographics.mobileConfidence = fd.get('mobileConfidence');
                    
                    window.App.next();
                } else {
                    e.preventDefault();
                    form.querySelectorAll(':invalid').forEach(field => {
                        if(field.tagName !== 'FIELDSET') field.classList.add('error-state');
                    });
                    window.App.showToast('Please complete all required fields.', 'error');
                }
            });
        }
    },

    'study-instructions': {
        init() {
            document.getElementById('btn-begin-workflows').addEventListener('click', () => {
                window.App.next();
            });
        }
    },
    
    'random-assignment': {
        async init() {
            try {
                const counts = await window.API.getConditionCounts();
                window.Store.assignConditionBasedOnCounts(counts);
            } catch (err) {
                console.error("Counterbalancing API failed. Falling back to random.", err);
                window.Store.assignConditionBasedOnCounts({ groupA: 0, groupB: 0 });
            }
            
            setTimeout(() => window.App.next(), 1000);
        }
    },
    
    'transition': {
        init() {
            document.getElementById('btn-start-next-workflow').addEventListener('click', () => {
                window.App.next();
            });
        }
    },
    
    'traditional-workflow': {
        init() {
            const orderNum = window.Store.app.workflowsToRun[0] === 'traditional-workflow' ? '1' : '2';
            document.getElementById('tw-order-num').textContent = orderNum;
            
            // Setup mobile tap-to-interact overlay
            window.Views._setupPrototypeOverlay('tw-overlay', 'tw-lock-btn', 'tw-scroll-hint');
            
            // Start timer
            const startTime = Date.now();
            const completeBtn = document.getElementById('btn-tw-complete');

            console.log('[Figma Embed API] Workflow started. Events only fire if:', {
                pageOrigin: window.location.origin,
                note: '1) This exact origin is allowlisted in your Figma OAuth app Embed API settings',
                note2: '2) You are logged into Figma in this browser (required by Figma as of 2026)',
                note3: '3) Study is served over http(s), not file://',
                iframeSrc: document.getElementById('tw-figma-frame') && document.getElementById('tw-figma-frame').src
            });
            
            completeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const endTime = Date.now();
                const interactionTime = (endTime - startTime) / 1000;
                window.Store.experimental.traditionalTime = interactionTime;
                
                window.App.next();
            });
        }
    },
    
    'ai-workflow': {
        init() {
            const orderNum = window.Store.app.workflowsToRun[0] === 'ai-workflow' ? '1' : '2';
            document.getElementById('aw-order-num').textContent = orderNum;
            
            // Setup mobile tap-to-interact overlay
            window.Views._setupPrototypeOverlay('aw-overlay', 'aw-lock-btn', 'aw-scroll-hint');
            
            // Start timer
            const startTime = Date.now();
            const completeBtn = document.getElementById('btn-aw-complete');

            console.log('[Figma Embed API] Workflow started. Events only fire if:', {
                pageOrigin: window.location.origin,
                note: '1) This exact origin is allowlisted in your Figma OAuth app Embed API settings',
                note2: '2) You are logged into Figma in this browser (required by Figma as of 2026)',
                note3: '3) Study is served over http(s), not file://',
                iframeSrc: document.getElementById('aw-figma-frame') && document.getElementById('aw-figma-frame').src
            });
            
            completeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const endTime = Date.now();
                const interactionTime = (endTime - startTime) / 1000;
                window.Store.experimental.aiTime = interactionTime;
                
                window.App.next();
            });
        }
    },
    
    'post-study': {
        init() {
            const btn = document.getElementById('btn-submit-study');
            const form = document.getElementById('post-study-form');
            const errorDiv = document.getElementById('post-study-error');
            
            btn.addEventListener('click', async (e) => {
                if (form.checkValidity()) {
                    e.preventDefault();
                    
                    btn.disabled = true;
                    btn.textContent = 'Submitting...';
                    errorDiv.textContent = '';
                    errorDiv.classList.add('hidden');
                    
                    const fd = new FormData(form);
                    const q = window.Store.questionnaire;
                    
                    // Traditional
                    q.ratingTraditional = fd.get('eval-rating-traditional');
                    q.easeTraditional = fd.get('eval-ease-traditional');
                    q.usefulTraditional = fd.get('eval-useful-traditional');
                    q.confTraditional = fd.get('eval-conf-traditional');
                    
                    // AI
                    q.ratingAi = fd.get('eval-rating-ai');
                    q.easeAi = fd.get('eval-ease-ai');
                    q.usefulAi = fd.get('eval-useful-ai');
                    q.confAi = fd.get('eval-conf-ai');
                    
                    // Comparative
                    q.preference = fd.get('eval-preference');
                    q.easier = fd.get('eval-easier');
                    q.likelyUse = fd.get('eval-likely-use');
                    q.reason = fd.get('eval-reason') || '';
                    q.suggestions = fd.get('eval-suggestions') || '';
                    
                    window.Store.participant.completionTimestamp = new Date().toISOString();
                    window.Store.participant.completionStatus = 'completed';
                    
                    window.App.showLoading('Securely saving responses...');
                    
                    try {
                        const success = await window.API.submitData();
                        window.App.hideLoading();
                        
                        if (success) {
                            sessionStorage.removeItem('wardrobe_study_state');
                            window.App.next();
                        } else {
                            window.App.showErrorView("API returned an error. Please try again.");
                        }
                    } catch (err) {
                        window.App.hideLoading();
                        errorDiv.textContent = err.message || "Network error occurred.";
                        errorDiv.classList.remove('hidden');
                    }
                    
                } else {
                    form.reportValidity();
                    window.App.showToast('Please complete all required evaluation questions.', 'error');
                }
            });
        }
    },
    
    'thank-you': {
        init() {
            document.getElementById('final-participant-id').textContent = window.Store.participant.id;

            if (window.Config) {
                window.Views._fillContactFields({
                    'debrief-data-controller': window.Config.DATA_CONTROLLER,
                    'debrief-data-controller-email': window.Config.DATA_CONTROLLER_EMAIL,
                    'debrief-researcher-name': window.Config.RESEARCHER_NAME,
                    'debrief-researcher-email': window.Config.RESEARCHER_EMAIL,
                    'debrief-supervisor-1-name': window.Config.SUPERVISOR_1_NAME,
                    'debrief-supervisor-1-email': window.Config.SUPERVISOR_1_EMAIL,
                    'debrief-supervisor-2-name': window.Config.SUPERVISOR_2_NAME,
                    'debrief-supervisor-2-email': window.Config.SUPERVISOR_2_EMAIL,
                });
            }
        }
    }
};
