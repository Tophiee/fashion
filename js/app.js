/**
 * Application Core & Navigation Controller
 * Manages the SPA state machine and DOM manipulation.
 */

const App = {
    root: null,
    
    // Ordered flow of the study
    flow: [
        'view-landing',
        'view-info-sheet',
        'view-consent',
        'view-demographics',
        'view-study-instructions',
        'view-random-assignment',
        'dynamic-workflow-1',
        'view-transition',
        'dynamic-workflow-2',
        'view-post-study',
        'view-thank-you'
    ],
    
    currentFlowIndex: 0,

    init() {
        this.root = document.getElementById('app-root');
        window.Store.initParticipant();
        window.Tracker.init();
        
        // Restore session if browser discarded tab or reloaded
        const restored = window.Store.restoreState();
        if (restored) {
            console.log('🔄 Session restored from sessionStorage at step index:', this.currentFlowIndex);
        }

        // Prevent accidental back navigation
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', () => {
            window.history.pushState(null, '', window.location.href);
            this.showToast('Navigation is disabled during the study to ensure data integrity.', 'error');
        });
        
        // Prevent reload warnings
        window.addEventListener('beforeunload', (e) => {
            if (window.Store.participant.completionStatus !== 'completed') {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to exit? Your progress will be lost.';
            }
        });

        // Start the application
        this.renderCurrentView();
    },
    
    updateProgressBar() {
        const header = document.getElementById('app-header');
        const progressBar = document.getElementById('progress-bar');
        const currentText = document.getElementById('progress-step-current');
        const totalText = document.getElementById('progress-step-total');
        
        // Hide progress bar on landing and thank you screens
        if (this.currentFlowIndex === 0 || this.currentFlowIndex === this.flow.length - 1) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
            
            // Calculate progress (excluding landing and thank you from total steps visual)
            const totalVisualSteps = this.flow.length - 2;
            const currentVisualStep = this.currentFlowIndex; // 1-indexed relative to visual steps
            
            const percentage = (currentVisualStep / totalVisualSteps) * 100;
            
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', Math.round(percentage));
            currentText.textContent = currentVisualStep;
            totalText.textContent = totalVisualSteps;
        }
    },

    renderCurrentView() {
        const step = this.flow[this.currentFlowIndex];
        let templateId = step;

        if (step === 'dynamic-workflow-1') {
            templateId = 'view-' + window.Store.app.workflowsToRun[0];
        } else if (step === 'dynamic-workflow-2') {
            templateId = 'view-' + window.Store.app.workflowsToRun[1];
        }

        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`Template ${templateId} not found`);
            return;
        }

        if (window.Store.app.currentView) {
            window.Tracker.stopViewTimer(window.Store.app.currentView);
        }

        // Render new view
        this.root.innerHTML = '';
        const node = template.content.cloneNode(true);
        this.root.appendChild(node);
        
        // Update state
        const viewName = templateId.replace('view-', '');
        window.Store.app.currentView = viewName;
        
        // Start tracking new view
        window.Tracker.startViewTimer(viewName);
        this.updateProgressBar();

        // Save progress to session storage
        window.Store.saveState();

        // Initialize view-specific logic
        if (window.Views && window.Views[viewName]) {
            window.Views[viewName].init();
        }
        
        window.scrollTo(0, 0);
        
        // Accessibility: move focus to the section for screen readers
        const viewSection = this.root.querySelector('section');
        if (viewSection) {
            viewSection.setAttribute('tabindex', '-1');
            viewSection.focus({ preventScroll: true });
        }
    },
    
    exitStudy() {
        // Attempt to close the window
        window.close();
        
        // If the browser blocks window.close(), replace the screen with a safe exit message
        setTimeout(() => {
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center; background-color:#f3f4f6; color:#111827; padding:20px;">
                    <h1 style="font-size:24px; font-weight:bold; margin-bottom:10px;">You have exited the study.</h1>
                    <p style="color:#4b5563;">You may now safely close this browser tab.</p>
                </div>
            `;
        }, 300);
    },

    next() {
        if (this.currentFlowIndex < this.flow.length - 1) {
            this.currentFlowIndex++;
            this.renderCurrentView();
        }
    },

    showLoading(text = 'Loading...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-overlay').classList.remove('hidden');
        document.getElementById('loading-overlay').setAttribute('aria-hidden', 'false');
    },

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
        document.getElementById('loading-overlay').setAttribute('aria-hidden', 'true');
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
    
    showErrorView(message = null) {
        const template = document.getElementById('view-error');
        this.root.innerHTML = '';
        this.root.appendChild(template.content.cloneNode(true));
        
        if (message) {
            document.getElementById('error-desc').textContent = message;
        }
        
        document.getElementById('btn-retry-submit').addEventListener('click', () => {
            this.currentFlowIndex = this.flow.indexOf('view-post-study');
            this.renderCurrentView();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.App = App;
    App.init();
});
