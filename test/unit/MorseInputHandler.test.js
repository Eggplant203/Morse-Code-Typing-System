import { MorseInputHandler } from '../../js/modules/MorseInputHandler.js';

describe('MorseInputHandler', () => {
    let handler;

    beforeEach(() => {
        handler = new MorseInputHandler(32); // Spacebar
    });

    test('should initialize with correct default values', () => {
        expect(handler.keyCode).toBe(32);
        expect(handler.state).toBe('IDLE');
        expect(handler.pressStartTime).toBeNull();
        expect(handler.releaseTime).toBeNull();
    });

    test('should handle keydown correctly', () => {
        const event = { keyCode: 32 };
        handler.handleKeyDown(event);
        expect(handler.state).toBe('PRESSING');
        expect(handler.pressStartTime).not.toBeNull();
    });

    test('should ignore keydown if not matching keyCode', () => {
        const event = { keyCode: 13 }; // Enter
        handler.handleKeyDown(event);
        expect(handler.state).toBe('IDLE');
    });

    test('should handle keyup and classify as dot', () => {
        const keydownEvent = { keyCode: 32 };
        const keyupEvent = { keyCode: 32 };

        let dotCalled = false;
        handler.setCallbacks(() => { dotCalled = true; }, null, null, null);

        handler.handleKeyDown(keydownEvent);
        // Simulate 100ms press
        setTimeout(() => {
            handler.handleKeyUp(keyupEvent);
            expect(dotCalled).toBe(true);
            expect(handler.state).toBe('PROCESSING');
        }, 100);
    });

    test('should handle keyup and classify as dash', () => {
        const keydownEvent = { keyCode: 32 };
        const keyupEvent = { keyCode: 32 };

        let dashCalled = false;
        handler.setCallbacks(null, () => { dashCalled = true; }, null, null);

        handler.handleKeyDown(keydownEvent);
        // Simulate 400ms press
        setTimeout(() => {
            handler.handleKeyUp(keyupEvent);
            expect(dashCalled).toBe(true);
        }, 400);
    });

    test('should ignore very short presses', () => {
        const keydownEvent = { keyCode: 32 };
        const keyupEvent = { keyCode: 32 };

        let dotCalled = false;
        let dashCalled = false;
        handler.setCallbacks(() => { dotCalled = true; }, () => { dashCalled = true; }, null, null);

        handler.handleKeyDown(keydownEvent);
        // Simulate 20ms press (too short)
        setTimeout(() => {
            handler.handleKeyUp(keyupEvent);
            expect(dotCalled).toBe(false);
            expect(dashCalled).toBe(false);
            expect(handler.state).toBe('IDLE');
        }, 20);
    });

    test('should get correct press duration', () => {
        handler.pressStartTime = Date.now() - 150;
        handler.releaseTime = Date.now();
        expect(handler.getPressDuration()).toBeGreaterThanOrEqual(140);
        expect(handler.getPressDuration()).toBeLessThanOrEqual(160);
    });

    test('should set key code', () => {
        handler.keyCode = 13; // Enter
        expect(handler.keyCode).toBe(13);
    });
});