class Blog3Experience {
    constructor() {
        this.audio = document.getElementById('bg-music');
        this.isPlaying = false;
        this.hasStarted = false;
        this.sections = document.querySelectorAll('.story-section');
        this.closingNote = document.querySelector('.closing-note');
        this.isMobile = this.checkMobile();
        this.init();
    }

    checkMobile() {
        return window.innerWidth <= 768;
    }

    init() {
        this.setupAudio();
        this.setupScrollAnimations();
        this.startExperience();
        this.createFinalCelebration();
        this.optimizeForMobile();
    }

    optimizeForMobile() {
        // Reduce animation intensity on mobile
        if (this.isMobile) {
            this.reduceAnimations();
        }

        // Setup mobile-specific optimizations
        this.setupViewportHandler();
        this.setupTouchOptimizations();

        // Add mobile class for CSS targeting
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            document.body.classList.add('blog-mobile');
        }
    }

    setupViewportHandler() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        const debouncedResize = this.debounce(() => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }, 250);

        window.addEventListener('resize', debouncedResize);

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                this.handleOrientationChange();
            }, 300);
        });
    }

    setupTouchOptimizations() {
        // Improve touch scrolling
        document.addEventListener('touchstart', function() {}, { passive: true });
        
        // Prevent zoom on double-tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Add touch feedback for interactive elements
        this.setupTouchFeedback();
    }

    setupTouchFeedback() {
        // Add touch feedback for buttons and interactive elements
        const interactiveElements = document.querySelectorAll('button, .gallery-item, .share-btn');
        interactiveElements.forEach(el => {
            el.addEventListener('touchstart', () => {
                el.style.transform = 'scale(0.98)';
            });
            
            el.addEventListener('touchend', () => {
                el.style.transform = 'scale(1)';
            });
            
            el.addEventListener('touchcancel', () => {
                el.style.transform = 'scale(1)';
            });
        });
    }

    handleOrientationChange() {
        // Recalculate any layout-dependent elements
        if (this.isMobile) {
            setTimeout(() => {
                this.recalculateLayout();
            }, 500);
        }
    }

    recalculateLayout() {
        // Adjust any layout elements for new orientation
        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.height = window.innerHeight > window.innerWidth ? '300px' : '400px';
        }
    }

    reduceAnimations() {
        // Reduce floating elements on mobile
        this.floatingElementCount = 8;
        
        // Reduce confetti count
        this.confettiCount = 80;
        
        // Reduce animation duration for better performance
        this.animationDuration = 2;
    }

    setupAudio() {
        // Set audio to start from 10 seconds
        this.audio.currentTime = 10;
        this.audio.volume = this.isMobile ? 0.5 : 0.6;

        // Auto-play after animations with mobile consideration
        setTimeout(() => {
            if (!this.hasStarted && !this.isMobile) {
                this.startAudio();
            }
        }, 2000);

        // On mobile, wait for user interaction
        if (this.isMobile) {
            this.setupMobileAudio();
        }
    }

    setupMobileAudio() {
        const enableAudio = () => {
            this.startAudio();
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('click', enableAudio);
        };

        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('click', enableAudio, { once: true });
    }

    startAudio() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.hasStarted = true;
            document.querySelector('.audio-control').textContent = '🔊';
        }).catch(error => {
            console.log('Audio play failed:', error);
        });
    }

    setupScrollAnimations() {
        // Use Intersection Observer with mobile-optimized settings
        const observerOptions = {
            threshold: this.isMobile ? 0.1 : 0.05,
            rootMargin: this.isMobile ? '50px' : '100px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Add staggered animation for gallery items
                    const galleryItems = entry.target.querySelectorAll('.gallery-item, .phadi-item, .gift-item, .food-item, .nickname-item, .final-gallery-item');
                    galleryItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('visible');
                        }, index * (this.isMobile ? 150 : 100));
                    });
                }
            });
        }, observerOptions);

        this.sections.forEach(section => {
            observer.observe(section);
        });

        // Observe closing note separately
        const closingNoteObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.3 });

        if (this.closingNote) {
            closingNoteObserver.observe(this.closingNote);
        }

        // Mobile: Add scroll performance optimization
        if (this.isMobile) {
            this.optimizeScrollPerformance();
        }
    }

    optimizeScrollPerformance() {
        // Use passive event listeners for better scroll performance
        document.addEventListener('touchmove', () => {}, { passive: true });
        
        // Debounce scroll events
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Handle scroll-end logic if needed
            }, 100);
        }, { passive: true });
    }

    startExperience() {
        this.createFloatingElements();
        
        // Mobile: Add loading optimization
        if (this.isMobile) {
            this.optimizeImageLoading();
        }
    }

    optimizeImageLoading() {
        // Lazy load images that are not in viewport
        const images = document.querySelectorAll('img[loading="lazy"]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => {
            if (img.dataset.src) {
                imageObserver.observe(img);
            }
        });
    }

    createFloatingElements() {
        const elementCount = this.isMobile ? 8 : 12;
        
        for (let i = 0; i < elementCount; i++) {
            setTimeout(() => {
                const element = document.createElement('div');
                const types = ['🎉', '🎊', '🌟', '💫', '✨', '🎁', '🎀', '👑', '💖', '🥳', '🌻', '🐱'];
                element.textContent = types[Math.floor(Math.random() * types.length)];
                element.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: 100%;
                    font-size: ${Math.random() * 20 + 12}px;
                    opacity: 0.8;
                    animation: floatCelebration ${Math.random() * 6 + 3}s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                `;
                
                document.body.appendChild(element);
            }, i * 500);
        }
        
        // Add celebration animation
        const celebrationKeyframes = `
            @keyframes floatCelebration {
                0% {
                    transform: translateY(0) rotate(0deg) scale(1);
                    opacity: 0;
                }
                10% {
                    opacity: 0.8;
                }
                90% {
                    opacity: 0.8;
                }
                100% {
                    transform: translateY(-120vh) rotate(360deg) scale(1.5);
                    opacity: 0;
                }
            }
        `;
        
        if (!document.getElementById('celebration-float-animation')) {
            const style = document.createElement('style');
            style.id = 'celebration-float-animation';
            style.textContent = celebrationKeyframes;
            document.head.appendChild(style);
        }
    }

    createFinalCelebration() {
        // Create a grand finale celebration after everything loads
        setTimeout(() => {
            this.createConfettiStorm();
            this.playFinalCelebrationSound();
        }, 5000);
    }

    createConfettiStorm() {
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(confettiContainer);

        const colors = ['#ff6b8b', '#ff8e53', '#4facfe', '#00f2fe', '#a8e6cf', '#dcedc1', '#ffd700', '#ff69b4'];
        const emojis = ['🎉', '✨', '🌟', '💫', '🎊', '💖', '🥳', '🎂', '🎁', '🎀', '🌻', '🐱'];

        // Reduce confetti count for mobile performance
        const confettiCount = this.isMobile ? 80 : 150;

        // Create a storm of confetti
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 20 + 12}px;
                    opacity: 0.9;
                    animation: confettiStorm ${Math.random() * 2 + 1.5}s ease-out forwards;
                `;
                
                if (Math.random() > 0.4) {
                    confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
                    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                } else {
                    confetti.style.width = '12px';
                    confetti.style.height = '12px';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.borderRadius = '50%';
                }
                
                // Add storm animation
                const stormKeyframes = `
                    @keyframes confettiStorm {
                        0% {
                            transform: translate(0, 0) rotate(0deg) scale(0);
                            opacity: 1;
                        }
                        50% {
                            transform: translate(${Math.random() * 150 - 75}px, ${Math.random() * 150 - 75}px) rotate(180deg) scale(1);
                            opacity: 0.8;
                        }
                        100% {
                            transform: translate(${Math.random() * 300 - 150}px, 100vh) rotate(360deg) scale(0);
                            opacity: 0;
                        }
                    }
                `;
                
                if (!document.getElementById('confetti-storm-animation')) {
                    const style = document.createElement('style');
                    style.id = 'confetti-storm-animation';
                    style.textContent = stormKeyframes;
                    document.head.appendChild(style);
                }
                
                confettiContainer.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 20);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    playFinalCelebrationSound() {
        // Create a grand celebration sound (only on non-mobile for better performance)
        if (this.isMobile) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Play a chord progression for celebration
            const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 1);
                }, index * 200);
            });
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Blog3Experience();
});

// Add loading state
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Mobile-specific optimizations after load
    if (window.innerWidth <= 768) {
        // Force layout recalculation for mobile
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }
});

// Mobile: Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause audio when page is hidden
        const audio = document.getElementById('bg-music');
        if (audio && !audio.paused) {
            audio.pause();
        }
    }
});