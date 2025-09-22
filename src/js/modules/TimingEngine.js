export class TimingEngine {
    constructor(wpm = 15) {
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
        this.dotMin = 50;
        this.dotMax = 200; // Hardcode to spec
        this.dashMin = 300;
        this.dashMax = 800;
        this.elementSeparatorMin = 50;
        this.elementSeparatorMax = 300;
        this.letterSeparatorMin = 500; // Spec: 500-1200ms
        this.letterSeparatorMax = 1200;
        this.wordSeparatorMin = 1500; // Spec: 1500ms+
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