class SessionManager {
    constructor() {
        this.sessionId = null;
        // Use environment variable or fallback to current origin for API base
        this.apiBase = window.API_BASE || (window.location.origin + '/api');
        this.init();
    }

    async init() {
        await this.getOrCreateSession();
    }

    async getOrCreateSession() {
        // Check for fresh session request
        const urlParams = new URLSearchParams(window.location.search);
        const freshSession = urlParams.get('fresh') === '1';
        
        if (freshSession) {
            // Clear local storage and create new session
            this.clearLocalStorage();
            // Remove fresh param from URL
            const url = new URL(window.location);
            url.searchParams.delete('fresh');
            window.history.replaceState({}, '', url);
        }

        // Try to get session from URL or localStorage
        this.sessionId = urlParams.get('sid') || localStorage.getItem('birthdaySessionId');

        if (!this.sessionId || freshSession) {
            // No id or fresh session requested — create new session on server
            this.sessionId = await this.createSession();
        } else {
            // We have an id — verify it exists on server.
            // Use create=true to let server auto-create if missing (safer)
            try {
                const session = await this.getSession({ createIfMissing: true });
                if (!session) {
                    // If server didn't return session for some reason, create one
                    console.log('Server did not return session object; creating new session.');
                    this.sessionId = await this.createSession();
                }
            } catch (error) {
                console.log('Session verification failed, creating new one locally then trying to create on server', error);
                // fallback: create new server session (or generate local id if network is down)
                try {
                    this.sessionId = await this.createSession();
                } catch (e) {
                    // final fallback: local id
                    this.sessionId = 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                }
            }
        }

        localStorage.setItem('birthdaySessionId', this.sessionId);
        this.updateUrlWithSession();
        return this.sessionId;
    }

    // NEW: Clear all local storage for fresh start
    clearLocalStorage() {
        const keysToRemove = [
            'birthdaySessionId',
            'birthdayLocalData',
            'birthdayLocalScores',
            'birthdayLocalMessages',
            'birthday_bg',
            'birthday_muted'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    async createSession() {
        try {
            const response = await fetch(`${this.apiBase}/session/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to create session');

            const data = await response.json();
            // server returns { sessionId: ... }
            const sid = data.sessionId || data.session_id || data.id;
            if (!sid) throw new Error('Invalid session create response');

            // set sessionId and optionally fetch the full session object to confirm
            this.sessionId = sid;

            // Try to GET the session (server should have created it)
            try {
                await this.getSession();
            } catch (e) {
                // not critical; continue with sessionId anyway
                console.warn('Could not verify created session immediately:', e);
            }

            return this.sessionId;
        } catch (error) {
            console.error('Session creation failed:', error);
            // Fallback: generate local session ID
            const localSid = 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.sessionId = localSid;
            return this.sessionId;
        }
    }

    async getSession(options = {}) {
        // options: { createIfMissing: boolean }
        if (!this.sessionId) return null;

        try {
            let url = `${this.apiBase}/session/${this.sessionId}`;
            if (options.createIfMissing) {
                url += '?create=true';
            }
            const response = await fetch(url);

            if (!response.ok) {
                // if 404 -> throw to upstream so caller can decide to create
                throw new Error(`Session API returned ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to get session from API:', error);

            // === Local fallback: check localStorage for saved session state ===
            try {
                const localDataRaw = localStorage.getItem('birthdayLocalData');
                if (localDataRaw) {
                    const localData = JSON.parse(localDataRaw);
                    if (localData.state) {
                        return localData;
                    } else {
                        return { state: localData };
                    }
                }
            } catch (localErr) {
                console.error('Failed to read local session fallback:', localErr);
            }

            return null;
        }
    }

    async updateSession(updates) {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`${this.apiBase}/session/${this.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) throw new Error('Update failed');
            return await response.json();
        } catch (error) {
            console.error('Failed to update session:', error);
            // Store locally as fallback
            this.storeLocal(updates);
        }
    }

    async resetSession() {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`${this.apiBase}/session/${this.sessionId}/reset`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.sessionId;
                localStorage.setItem('birthdaySessionId', this.sessionId);
                this.updateUrlWithSession();
            }
        } catch (error) {
            console.error('Failed to reset session:', error);
            // Local fallback - create new session
            this.sessionId = await this.createSession();
        }
    }

    // NEW: Method to completely reset everything for fresh journey
    async startFreshJourney() {
        this.clearLocalStorage();
        this.sessionId = null;
        await this.getOrCreateSession();
    }

    storeLocal(updates) {
        const localData = JSON.parse(localStorage.getItem('birthdayLocalData') || '{}');
        localStorage.setItem('birthdayLocalData', JSON.stringify({...localData, ...updates}));
    }

    updateUrlWithSession() {
        if (!this.sessionId) return;
        
        const url = new URL(window.location);
        url.searchParams.set('sid', this.sessionId);
        window.history.replaceState({}, '', url);
    }

    navigateTo(page) {
        const url = new URL(`${page}.html`, window.location.origin);
        if (this.sessionId) {
            url.searchParams.set('sid', this.sessionId);
        }
        window.location.href = url.toString();
    }

    // NEW: Navigate with fresh session
    navigateToFresh(page) {
        const url = new URL(`${page}.html`, window.location.origin);
        url.searchParams.set('fresh', '1');
        window.location.href = url.toString();
    }

    async getConfig() {
        try {
            const response = await fetch(`${this.apiBase}/config`);
            if (!response.ok) throw new Error('Failed to get config');
            return await response.json();
        } catch (error) {
            console.error('Failed to get config:', error);
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            bannerText: 'Happy Birthday, My Love!',
            assets: {
                balloons: 8,
                cloudMessages: [
                    "Best Wishes!",
                    "Happy Birthday!",
                    "You're Amazing!",
                    "So Special!",
                    "Joy & Happiness!",
                    "Love You!"
                ]
            },
            blogContent: {
                title: '💖 My Special Message for You 💖',
                subtitle: 'A Collection of Love and Memories',
                sections: [
                    {
                        type: 'paragraph',
                        content: 'My dearest love, every day with you feels like a beautiful dream come true. Your smile lights up my world in ways words cannot describe.'
                    },
                    {
                        type: 'paragraph', 
                        content: 'You have this incredible ability to make everything better just by being you. Whether I\'m having a tough day or facing challenges, the thought of you brings instant comfort and joy to my heart. 💖'
                    }
                ]
            }
        };
    }

    async getMessages() {
        try {
            const response = await fetch(`${this.apiBase}/messages`);
            if (!response.ok) throw new Error('Failed to get messages');
            return await response.json();
        } catch (error) {
            console.error('Failed to get messages:', error);
            return { messages: [] };
        }
    }

    async submitMessage(name, message) {
        try {
            const response = await fetch(`${this.apiBase}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    name: name,
                    message: message
                })
            });
            
            if (!response.ok) throw new Error('Failed to submit message');
            return await response.json();
        } catch (error) {
            console.error('Failed to submit message:', error);
            // Store locally as fallback
            this.storeLocalMessage(name, message);
            throw error;
        }
    }

    storeLocalMessage(name, message) {
        const messages = JSON.parse(localStorage.getItem('birthdayLocalMessages') || '[]');
        messages.push({
            id: 'local-' + Date.now(),
            name: name,
            message: message,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('birthdayLocalMessages', JSON.stringify(messages));
    }

    async getLocalMessages() {
        return JSON.parse(localStorage.getItem('birthdayLocalMessages') || '[]');
    }

    async submitScore(score, meta = {}) {
        try {
            const response = await fetch(`${this.apiBase}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    score: score,
                    meta: {
                        device: navigator.userAgent,
                        time: new Date().toISOString(),
                        ...meta
                    }
                })
            });
            
            if (!response.ok) throw new Error('Failed to submit score');
            return await response.json();
        } catch (error) {
            console.error('Failed to submit score:', error);
            // Store locally as fallback
            this.storeLocalScore(score, meta);
        }
    }

    storeLocalScore(score, meta) {
        const scores = JSON.parse(localStorage.getItem('birthdayLocalScores') || '[]');
        scores.push({
            id: 'local-' + Date.now(),
            score: score,
            meta: meta,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('birthdayLocalScores', JSON.stringify(scores));
    }
}

// Export singleton
const sessionManager = new SessionManager();
export default sessionManager;