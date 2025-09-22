export class TimingEngine {
    constructor(wpm = 10) {
        this.wpm = wpm;
        this.dotDuration = this.calculateDotDuration(wpm);
        this.updateThresholds();
    }

    calculateDotDuration(wpm) {
        // Standard PARIS timing: 50 units per minute
        // 1 WPM = 50 units/minute
        // 1 unit = 1.2 seconds / WPM
        return 1200 / wpm; // milliseconds
    }

    updateThresholds() {
        // Base thresholds for 10 WPM (120ms dot duration)
        const baseDotDuration = 120; // 10 WPM
        const scale = this.dotDuration / baseDotDuration;

        // Scale thresholds based on WPM
        this.dotMin = Math.round(50 * scale);
        this.dotMax = Math.round(200 * scale);
        this.dashMin = Math.round(300 * scale);
        this.dashMax = Math.round(800 * scale);
        this.elementSeparatorMin = Math.round(50 * scale);
        this.elementSeparatorMax = Math.round(300 * scale);
        this.letterSeparatorMin = Math.round(500 * scale);
        this.letterSeparatorMax = Math.round(1200 * scale);
        this.wordSeparatorMin = Math.round(1500 * scale);
    }

    setWPM(wpm) {
        this.wpm = wpm;
        this.dotDuration = this.calculateDotDuration(wpm);
        this.updateThresholds();
    }

    classifyPress(duration) {
        if (duration >= this.dotMin && duration <= this.dotMax) {
            return 'dot';
        } else if (duration >= this.dashMin && duration <= this.dashMax) {
            return 'dash';
        } else {
            return 'invalid';
        }
    }

    classifyPause(duration) {
        if (duration >= this.wordSeparatorMin) {
            return 'word';
        } else if (duration >= this.letterSeparatorMin) {
            return 'letter';
        } else if (duration >= this.elementSeparatorMin) {
            return 'element';
        } else {
            return 'none';
        }
    }

    getThresholds() {
        return {
            dot: { min: this.dotMin, max: this.dotMax },
            dash: { min: this.dashMin, max: this.dashMax },
            elementSeparator: { min: this.elementSeparatorMin, max: this.elementSeparatorMax },
            letterSeparator: { min: this.letterSeparatorMin, max: this.letterSeparatorMax },
            wordSeparator: { min: this.wordSeparatorMin }
        };
    }

    calculateWPM(characters, timeInMinutes) {
        // Standard: 5 characters = 1 word
        const words = characters / 5;
        return words / timeInMinutes;
    }
}