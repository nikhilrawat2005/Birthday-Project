class InputManager {
    constructor() {
        this.state = {
            left: false,
            right: false,
            up: false,
            down: false,
            pointerX: 0,
            pointerY: 0,
            pointerActive: false
        };
        
        this.handlers = [];
        this.initialized = false;
        this.isMobile = this.checkMobile();
        this.touchId = null;
    }

    checkMobile() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    bindKeyboard() {
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') this.state.left = (e.type === 'keydown');
            if (e.key === 'ArrowRight') this.state.right = (e.type === 'keydown');
            if (e.key === 'ArrowUp') this.state.up = (e.type === 'keydown');
            if (e.key === 'ArrowDown') this.state.down = (e.type === 'keydown');
        };

        window.addEventListener('keydown', keyHandler);
        window.addEventListener('keyup', keyHandler);
        this.handlers.push({ type: 'keydown', handler: keyHandler });
        this.handlers.push({ type: 'keyup', handler: keyHandler });
    }

    bindPointer(canvas) {
        if (!canvas) return;

        const pointerHandler = (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            this.state.pointerX = e.clientX - rect.left;
            this.state.pointerY = e.clientY - rect.top;
            this.state.pointerActive = true;
            
            // Store touch ID for mobile to handle multiple touches
            if (e.pointerType === 'touch') {
                this.touchId = e.pointerId;
            }
        };

        const pointerEnd = () => {
            this.state.pointerActive = false;
            this.touchId = null;
        };

        // Use pointer events for better mobile support
        canvas.addEventListener('pointermove', pointerHandler, { passive: false });
        canvas.addEventListener('pointerdown', pointerHandler, { passive: false });
        canvas.addEventListener('pointerup', pointerEnd, { passive: false });
        canvas.addEventListener('pointerleave', pointerEnd, { passive: false });
        canvas.addEventListener('pointercancel', pointerEnd, { passive: false });

        this.handlers.push(
            { type: 'pointermove', handler: pointerHandler, element: canvas },
            { type: 'pointerdown', handler: pointerHandler, element: canvas },
            { type: 'pointerup', handler: pointerEnd, element: canvas },
            { type: 'pointerleave', handler: pointerEnd, element: canvas },
            { type: 'pointercancel', handler: pointerEnd, element: canvas }
        );

        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Mobile-specific optimizations
        if (this.isMobile) {
            this.optimizeForMobile(canvas);
        }
    }

    optimizeForMobile(canvas) {
        // Prevent elastic scrolling on mobile
        canvas.addEventListener('touchmove', (e) => {
            if (this.state.pointerActive) {
                e.preventDefault();
            }
        }, { passive: false });

        // Improve touch response
        canvas.style.touchAction = 'none';
        canvas.style.webkitTapHighlightColor = 'transparent';
    }

    bindTouchButtons(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const leftBtn = container.querySelector('.left-btn');
        const rightBtn = container.querySelector('.right-btn');

        if (leftBtn) {
            const leftStart = (e) => {
                e.preventDefault();
                this.state.left = true;
                leftBtn.style.transform = 'scale(0.9)';
                leftBtn.style.backgroundColor = 'rgba(255, 107, 139, 0.3)';
                
                // Haptic feedback on mobile
                if (this.isMobile && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            };
            const leftEnd = (e) => {
                e.preventDefault();
                this.state.left = false;
                leftBtn.style.transform = 'scale(1)';
                leftBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            };
            
            // Touch events for mobile
            leftBtn.addEventListener('touchstart', leftStart, { passive: false });
            leftBtn.addEventListener('touchend', leftEnd, { passive: false });
            leftBtn.addEventListener('touchcancel', leftEnd, { passive: false });
            
            // Mouse events for desktop
            leftBtn.addEventListener('mousedown', leftStart);
            leftBtn.addEventListener('mouseup', leftEnd);
            leftBtn.addEventListener('mouseleave', leftEnd);

            this.handlers.push(
                { type: 'touchstart', handler: leftStart, element: leftBtn },
                { type: 'touchend', handler: leftEnd, element: leftBtn },
                { type: 'touchcancel', handler: leftEnd, element: leftBtn },
                { type: 'mousedown', handler: leftStart, element: leftBtn },
                { type: 'mouseup', handler: leftEnd, element: leftBtn },
                { type: 'mouseleave', handler: leftEnd, element: leftBtn }
            );
        }

        if (rightBtn) {
            const rightStart = (e) => {
                e.preventDefault();
                this.state.right = true;
                rightBtn.style.transform = 'scale(0.9)';
                rightBtn.style.backgroundColor = 'rgba(255, 107, 139, 0.3)';
                
                // Haptic feedback on mobile
                if (this.isMobile && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            };
            const rightEnd = (e) => {
                e.preventDefault();
                this.state.right = false;
                rightBtn.style.transform = 'scale(1)';
                rightBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            };
            
            // Touch events for mobile
            rightBtn.addEventListener('touchstart', rightStart, { passive: false });
            rightBtn.addEventListener('touchend', rightEnd, { passive: false });
            rightBtn.addEventListener('touchcancel', rightEnd, { passive: false });
            
            // Mouse events for desktop
            rightBtn.addEventListener('mousedown', rightStart);
            rightBtn.addEventListener('mouseup', rightEnd);
            rightBtn.addEventListener('mouseleave', rightEnd);

            this.handlers.push(
                { type: 'touchstart', handler: rightStart, element: rightBtn },
                { type: 'touchend', handler: rightEnd, element: rightBtn },
                { type: 'touchcancel', handler: rightEnd, element: rightBtn },
                { type: 'mousedown', handler: rightStart, element: rightBtn },
                { type: 'mouseup', handler: rightEnd, element: rightBtn },
                { type: 'mouseleave', handler: rightEnd, element: rightBtn }
            );
        }
    }

    unbindAll() {
        this.handlers.forEach(({ type, handler, element }) => {
            const target = element || window;
            target.removeEventListener(type, handler);
        });
        this.handlers = [];
        
        // Reset state
        this.state = {
            left: false,
            right: false,
            up: false,
            down: false,
            pointerX: 0,
            pointerY: 0,
            pointerActive: false
        };
        
        this.touchId = null;
    }

    // Enhanced throttle for mobile performance
    throttle(callback, delay) {
        let lastCall = 0;
        let timeoutId;
        
        return function (...args) {
            const now = Date.now();
            const timeSinceLastCall = now - lastCall;
            
            if (timeSinceLastCall >= delay) {
                lastCall = now;
                callback.apply(this, args);
            } else {
                // Clear existing timeout and set new one
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    callback.apply(this, args);
                }, delay - timeSinceLastCall);
            }
        };
    }

    // Mobile-specific method to handle orientation
    handleOrientationChange() {
        if (this.isMobile) {
            // Reset input state on orientation change
            this.state.left = false;
            this.state.right = false;
            this.state.pointerActive = false;
        }
    }
}

const inputManager = new InputManager();

// Export for global access
window.inputManager = inputManager;

export default inputManager;