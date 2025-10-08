import sessionManager from './session.js';
import audioManager from './audio.js';

class ResultPage {
    constructor() {
        this.currentScene = 'transition-scene';
        this.guestbookMessages = [];
        this.config = null;
        this.init();
    }

    async init() {
        await this.loadSessionData();
        this.setupScenes();
        this.bindEvents();
        this.loadConfig();
        this.loadGuestbookMessages();
        audioManager.playBg('bg_soft_ambient.mp3');
    }

    async loadSessionData() {
        const session = await sessionManager.getSession();
        if (session && session.state && session.state.game) {
            document.getElementById('kitty-score').textContent = session.state.game.score || 0;
        }
    }

    setupScenes() {
        this.scenes = {
            'transition-scene': document.getElementById('transition-scene'),
            'reward-scene': document.getElementById('reward-scene')
        };
    }

    bindEvents() {
        // Transition to reward scene
        document.getElementById('yes-reward').addEventListener('click', () => {
            audioManager.playSfx('sfx_click.mp3');
            this.showRewardScene();
        });

        // Guestbook form submission
        document.getElementById('guestbook-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitGuestbookMessage();
        });

        // Restart buttons
        document.getElementById('blog-restart-btn').addEventListener('click', () => {
            this.restartExperience();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.currentScene === 'transition-scene') {
                this.showRewardScene();
            }
        });
    }

    showRewardScene() {
        // Animate transition
        const duckyKitty = document.querySelector('.ducky-kitty-image');
        const speechBubble = document.querySelector('.transition-bubble');
        
        if (duckyKitty) {
            duckyKitty.style.transition = 'all 1s ease';
            duckyKitty.style.transform = 'translateX(-100vw)';
        }
        
        if (speechBubble) {
            speechBubble.style.transition = 'all 1s ease';
            speechBubble.style.transform = 'translateX(-100vw)';
        }
        
        setTimeout(() => {
            this.showScene('reward-scene');
            // Scroll to top when showing reward page
            document.querySelector('.blog-container').scrollTop = 0;
        }, 1000);
    }

    showScene(sceneName) {
        // Hide all scenes
        Object.values(this.scenes).forEach(scene => {
            if (scene) scene.classList.remove('active');
        });
        
        // Show target scene
        if (this.scenes[sceneName]) {
            this.scenes[sceneName].classList.add('active');
        }
        this.currentScene = sceneName;
    }

    async loadConfig() {
        this.config = await sessionManager.getConfig();
        if (this.config && this.config.blogContent) {
            this.renderBlogContent();
        }
    }

    renderBlogContent() {
        const blogContent = document.getElementById('blog-content');
        if (!blogContent || !this.config.blogContent) return;

        let html = '';

        // Render sections based on type
        this.config.blogContent.sections.forEach(section => {
            switch (section.type) {
                case 'paragraph':
                    html += `<p>${section.content}</p>`;
                    break;
                case 'heading':
                    html += `<h3>${section.content}</h3>`;
                    break;
                case 'image':
                    html += `
                        <div class="post-image ${section.position || 'full-image'}">
                            <div class="color-box" style="--box-color: ${section.color || '#ff6b8b'}; --box-dark: ${section.darkColor || '#e55a7b'}">
                                <span>${section.caption || ''}</span>
                            </div>
                        </div>
                    `;
                    break;
                case 'gallery':
                    html += `
                        <div class="kitty-gallery">
                            ${section.images ? section.images.map(img => `
                                <img src="${img.src}" alt="${img.alt}" class="kitty-img" loading="lazy">
                            `).join('') : ''}
                        </div>
                    `;
                    break;
                case 'list':
                    html += `
                        <ul class="special-list">
                            ${section.items ? section.items.map(item => `<li>${item}</li>`).join('') : ''}
                        </ul>
                    `;
                    break;
                case 'wishes':
                    html += `
                        <div class="birthday-wishes">
                            ${section.wishes ? section.wishes.map(wish => `
                                <div class="wish-item">${wish}</div>
                            `).join('') : ''}
                        </div>
                    `;
                    break;
            }
        });

        // Add final message box
        html += `
            <div class="final-message-box">
                <h4>Forever Yours 💕</h4>
                <p>No matter where life takes us, always remember that you have my heart. You're the missing piece I never knew I needed, and now that I've found you, I'll never let go.</p>
                <p>Happy Birthday to the most wonderful person in my life! May this year be your best one yet, filled with love, laughter, and beautiful memories. 🎈</p>
            </div>
        `;

        blogContent.innerHTML = html;
    }

    async loadGuestbookMessages() {
        try {
            const response = await sessionManager.getMessages();
            this.guestbookMessages = response.messages || [];
            this.renderGuestbookMessages();
        } catch (error) {
            console.error('Failed to load guestbook messages:', error);
            // Try to load local messages as fallback
            this.guestbookMessages = await sessionManager.getLocalMessages();
            this.renderGuestbookMessages();
        }
    }

    renderGuestbookMessages() {
        const container = document.getElementById('guestbook-messages');
        if (!container) return;

        if (this.guestbookMessages.length === 0) {
            container.innerHTML = `
                <div class="no-messages">
                    <p>No messages yet. Be the first to leave a sweet message! 💕</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.guestbookMessages.map(message => `
            <div class="guestbook-message">
                <div class="message-header">
                    <span class="message-author">${this.escapeHtml(message.name)}</span>
                    <span class="message-time">${this.formatTime(message.created_at)}</span>
                </div>
                <div class="message-content">${this.escapeHtml(message.message)}</div>
            </div>
        `).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async submitGuestbookMessage() {
        const form = document.getElementById('guestbook-form');
        const nameInput = document.getElementById('guest-name');
        const messageInput = document.getElementById('guest-message');
        const submitBtn = form.querySelector('button[type="submit"]');

        const name = nameInput.value.trim();
        const message = messageInput.value.trim();

        if (!name || !message) {
            this.showMessage('Please fill in both name and message fields.', 'error');
            return;
        }

        // Disable form and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span>Sending...';
        form.classList.add('loading');

        try {
            await sessionManager.submitMessage(name, message);
            
            // Success
            this.showMessage('Message sent successfully! 💕', 'success');
            nameInput.value = '';
            messageInput.value = '';
            
            // Reload messages
            await this.loadGuestbookMessages();
            
        } catch (error) {
            this.showMessage('Failed to send message. Please try again.', 'error');
        } finally {
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message 💕';
            form.classList.remove('loading');
        }
    }

    showMessage(text, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = text;

        const guestbookSection = document.querySelector('.guestbook-section');
        if (guestbookSection) {
            guestbookSection.insertBefore(messageDiv, guestbookSection.querySelector('#guestbook-messages'));
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    async restartExperience() {
        audioManager.playSfx('sfx_click.mp3');
        
        // Show loading state
        const restartBtn = document.getElementById('blog-restart-btn');
        const originalText = restartBtn.textContent;
        restartBtn.innerHTML = '<span class="loading-spinner"></span>Restarting...';
        restartBtn.disabled = true;

        try {
            await sessionManager.resetSession();
            
            // Navigate back to landing page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Restart failed:', error);
            restartBtn.textContent = originalText;
            restartBtn.disabled = false;
            this.showMessage('Failed to restart. Please try again.', 'error');
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ResultPage());
} else {
    new ResultPage();
}