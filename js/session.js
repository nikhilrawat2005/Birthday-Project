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
        // Try to get session from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        this.sessionId = urlParams.get('sid') || localStorage.getItem('birthdaySessionId');

        if (!this.sessionId) {
            this.sessionId = await this.createSession();
        } else {
            // Verify session exists
            try {
                await this.getSession();
            } catch (error) {
                console.log('Session invalid, creating new one');
                this.sessionId = await this.createSession();
            }
        }

        localStorage.setItem('birthdaySessionId', this.sessionId);
        this.updateUrlWithSession();
        return this.sessionId;
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
            return data.sessionId;
        } catch (error) {
            console.error('Session creation failed:', error);
            // Fallback: generate local session ID
            return 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
    }

    async getSession() {
        if (!this.sessionId) return null;
        
        try {
            const response = await fetch(`${this.apiBase}/session/${this.sessionId}`);
            if (!response.ok) throw new Error('Session not found');
            return await response.json();
        } catch (error) {
            console.error('Failed to get session:', error);
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