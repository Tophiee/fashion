/**
 * View Controllers
 * Logic for individual screens (event listeners, validation, form handling).
 */

window.Views = {
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
                const elements = {
                    'info-researcher-name': window.Config.RESEARCHER_NAME,
                    'info-researcher-email': window.Config.RESEARCHER_EMAIL,
                };
                
                for (const [id, value] of Object.entries(elements)) {
                    const el = document.getElementById(id);
                    if (el && value) el.textContent = value;
                }
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
            
            // Start timer
            const startTime = Date.now();
            
            document.getElementById('btn-tw-complete').addEventListener('click', () => {
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
            
            // Start timer
            const startTime = Date.now();
            
            document.getElementById('btn-aw-complete').addEventListener('click', () => {
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
        }
    }
};
