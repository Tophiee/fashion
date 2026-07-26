/**
 * API Integration
 * Handles submitting data and fetching true counterbalancing counts.
 */

const API = {
    getScriptUrl() {
        return window.Config && window.Config.SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' 
            ? window.Config.SCRIPT_URL 
            : null;
    },

    async getConditionCounts() {
        const url = this.getScriptUrl();
        
        // Development mode or placeholder URL fallback
        if (window.Config.ENVIRONMENT === 'development' || !url) {
            console.log("🛠 [Development Mode] Simulating true counterbalancing counts.");
            return new Promise(resolve => {
                setTimeout(() => resolve({ groupA: Math.floor(Math.random() * 10), groupB: Math.floor(Math.random() * 10) }), 800);
            });
        }

        try {
            // Because Apps Script Web Apps require following redirects for GET requests
            const response = await fetch(url, { redirect: 'follow' });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch condition counts:', error);
            // Fallback to equal counts so it randomly assigns
            return { groupA: 0, groupB: 0 };
        }
    },

    async submitData() {
        const payload = window.Store.exportForAPI();
        const url = this.getScriptUrl();

        if (window.Config.ENVIRONMENT === 'development' || !url) {
            console.log("🛠 [Development Mode] Payload that would be sent:", payload);
            return new Promise((resolve) => {
                setTimeout(() => resolve(true), 1200);
            });
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                return true;
            } else {
                console.error("Apps Script returned an error:", result);
                throw new Error(result.message || 'Unknown server error');
            }
        } catch (error) {
            console.error('Error submitting data:', error);
            window.Store.behavioral.submissionRetryCount++;
            throw error;
        }
    }
};

window.API = API;
