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
            const rect = canvas.getBoundingClientRect();
            this.state.pointerX = e.clientX - rect.left;
            this.state.pointerY = e.clientY - rect.top;
            this.state.pointerActive = true;
        };

        const pointerEnd = () => {
            this.state.pointerActive = false;
        };

        canvas.addEventListener('pointermove', pointerHandler);
        canvas.addEventListener('pointerdown', pointerHandler);
        canvas.addEventListener('pointerup', pointerEnd);
        canvas.addEventListener('pointerleave', pointerEnd);

        this.handlers.push(
            { type: 'pointermove', handler: pointerHandler, element: canvas },
            { type: 'pointerdown', handler: pointerHandler, element: canvas },
            { type: 'pointerup', handler: pointerEnd, element: canvas },
            { type: 'pointerleave', handler: pointerEnd, element: canvas }
        );
    }

    bindTouchButtons(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const leftBtn = container.querySelector('.left-btn');
        const rightBtn = container.querySelector('.right-btn');

        if (leftBtn) {
            const leftStart = () => this.state.left = true;
            const leftEnd = () => this.state.left = false;
            
            leftBtn.addEventListener('touchstart', leftStart);
            leftBtn.addEventListener('touchend', leftEnd);
            leftBtn.addEventListener('touchcancel', leftEnd);
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
            const rightStart = () => this.state.right = true;
            const rightEnd = () => this.state.right = false;
            
            rightBtn.addEventListener('touchstart', rightStart);
            rightBtn.addEventListener('touchend', rightEnd);
            rightBtn.addEventListener('touchcancel', rightEnd);
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
    }

    // Throttle pointer events for performance
    throttle(callback, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                callback.apply(this, args);
            }
        };
    }
}

const inputManager = new InputManager();
export default inputManager;