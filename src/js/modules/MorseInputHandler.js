export class MorseInputHandler {
    constructor(keyCode = 32) { // Default: Spacebar
        this.keyCode = keyCode;
        this.pressStartTime = null;
        this.releaseTime = null;
        this.state = 'IDLE';
        this.onDot = null;
        this.onDash = null;
        this.onPause = null;
        this.onError = null;
    }

    setCallbacks(onDot, onDash, onPause, onError) {
        this.onDot = onDot;
        this.onDash = onDash;
        this.onPause = onPause;
        this.onError = onError;
    }

    handleKeyDown(event) {
        if (event.keyCode !== this.keyCode || this.state !== 'IDLE') return;

        this.state = 'PRESSING';
        this.pressStartTime = Date.now();
        // Trigger visual feedback
    }

    handleKeyUp(event) {
        if (event.keyCode !== this.keyCode || this.state !== 'PRESSING') return;

        this.releaseTime = Date.now();
        this.state = 'RELEASED';
        this.processPress();
    }

    processPress() {
        const duration = this.releaseTime - this.pressStartTime;

        if (duration < 50) {
            // Ignore as accidental
            this.state = 'IDLE';
            return;
        } else if (duration <= 200) {
            // Dot
            if (this.onDot) this.onDot(duration);
        } else if (duration <= 800) {
            // Dash
            if (this.onDash) this.onDash(duration);
        } else {
            // Error
            if (this.onError) this.onError(duration);
        }

        this.state = 'PROCESSING';
        // Start pause timer
        setTimeout(() => this.checkPause(), 50);
    }

    checkPause() {
        // This would be called periodically to check for pauses
        // For simplicity, we'll assume pause detection is handled elsewhere
        this.state = 'IDLE';
    }

    getState() {
        return this.state;
    }

    getPressDuration() {
        if (this.pressStartTime && this.releaseTime) {
            return this.releaseTime - this.pressStartTime;
        }
        return 0;
    }
}