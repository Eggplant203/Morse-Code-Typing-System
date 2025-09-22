import { TimingEngine } from '../../js/modules/TimingEngine.js';

describe('TimingEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new TimingEngine(10);
    });

    test('should initialize with correct dot duration', () => {
        expect(engine.wpm).toBe(10);
        expect(engine.dotDuration).toBe(1200 / 10); // 120ms
    });

    test('should calculate dot duration correctly', () => {
        expect(engine.calculateDotDuration(10)).toBe(120);
        expect(engine.calculateDotDuration(20)).toBe(60);
    });

    test('should set WPM and update thresholds', () => {
        engine.setWPM(20);
        expect(engine.wpm).toBe(20);
        expect(engine.dotDuration).toBe(60);
    });

    test('should classify press durations correctly', () => {
        expect(engine.classifyPress(40)).toBe('invalid'); // Too short
        expect(engine.classifyPress(100)).toBe('dot'); // Within dot range (50-200)
        expect(engine.classifyPress(400)).toBe('dash'); // Within dash range (300-800)
        expect(engine.classifyPress(1000)).toBe('invalid'); // Too long
    });

    test('should classify pause durations correctly', () => {
        expect(engine.classifyPause(100)).toBe('element'); // Element separator (50-300)
        expect(engine.classifyPause(600)).toBe('letter'); // Letter separator (500-1200)
        expect(engine.classifyPause(1600)).toBe('word'); // Word separator (1500+)
        expect(engine.classifyPause(40)).toBe('none'); // Too short
    });

    test('should return correct thresholds', () => {
        const thresholds = engine.getThresholds();
        expect(thresholds.dot.min).toBe(50);
        expect(thresholds.dot.max).toBe(200);
        expect(thresholds.dash.min).toBe(300);
        expect(thresholds.dash.max).toBe(800);
        expect(thresholds.elementSeparator.min).toBe(50);
        expect(thresholds.elementSeparator.max).toBe(300);
        expect(thresholds.letterSeparator.min).toBe(500);
        expect(thresholds.letterSeparator.max).toBe(1200);
        expect(thresholds.wordSeparator.min).toBe(1500);
    });

    test('should calculate WPM correctly', () => {
        // 50 characters = 10 words, 2 minutes = 5 WPM (10 words / 2 min)
        expect(engine.calculateWPM(50, 2)).toBe(5);
        // 25 characters = 5 words, 1 minute = 5 WPM
        expect(engine.calculateWPM(25, 1)).toBe(5);
    });
});