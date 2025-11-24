class Blog3Experience {
    constructor() {
        this.audio = document.getElementById('bg-music');
        this.isPlaying = false;
        this.hasStarted = false;
        this.sections = document.querySelectorAll('.story-section');
        this.closingNote = document.querySelector('.closing-note');
        this.init();
    }

    init() {
        this.setupAudio();
        this.setupScrollAnimations();
        this.startExperience();
        this.createFinalCelebration();
    }

    setupAudio() {
        // Set audio to start from 10 seconds
        this.audio.currentTime = 10;
        this.audio.volume = 0.6;

        // Auto-play after animations
        setTimeout(() => {
            if (!this.hasStarted) {
                this.startAudio();
            }
        }, 2000);
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
        // Intersection Observer for section animations
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
                        }, index * 100);
                    });
                }
            });
        }, { threshold: 0.1 });

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

        closingNoteObserver.observe(this.closingNote);
    }

    startExperience() {
        this.createFloatingElements();
    }

    createFloatingElements() {
        // Create additional floating celebration elements
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const element = document.createElement('div');
                const types = ['🎉', '🎊', '🌟', '💫', '✨', '🎁', '🎀', '👑', '💖', '🥳', '🌻', '🐱'];
                element.textContent = types[Math.floor(Math.random() * types.length)];
                element.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: 100%;
                    font-size: ${Math.random() * 25 + 15}px;
                    opacity: 0.8;
                    animation: floatCelebration ${Math.random() * 8 + 4}s ease-in-out infinite;
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

        // Create a storm of confetti
        for (let i = 0; i < 150; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 25 + 15}px;
                    opacity: 0.9;
                    animation: confettiStorm ${Math.random() * 3 + 2}s ease-out forwards;
                `;
                
                if (Math.random() > 0.4) {
                    confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
                    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                } else {
                    confetti.style.width = '15px';
                    confetti.style.height = '15px';
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
                            transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) rotate(180deg) scale(1);
                            opacity: 0.8;
                        }
                        100% {
                            transform: translate(${Math.random() * 400 - 200}px, 100vh) rotate(360deg) scale(0);
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
        // Create a grand celebration sound
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Blog3Experience();
});

// Add loading state
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});