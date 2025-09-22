import { App } from '../../src/js/modules/App.js';

// Mock DOM elements
document.body.innerHTML = `
    <div id="input-buffer"></div>
    <div id="current-letter"></div>
    <div id="output-text"></div>
    <div id="char-count"></div>
    <div id="word-count"></div>
    <div id="time"></div>
    <div id="progress-fill"></div>
    <div id="current-action"></div>
    <div id="status"></div>
    <button id="settings-btn"></button>
    <button id="mode-btn"></button>
    <button id="save-settings"></button>
    <button id="close-settings"></button>
    <button id="toggle-reference"></button>
    <select id="export-type"></select>
    <button id="clear-text">Clear</button>
    <button id="add-custom"></button>
    <button id="toggle-custom"></button>
    <input id="custom-char">
    <input id="custom-sequence">
    <div id="custom-list"></div>
    <div id="settings-panel" class="hidden"></div>
    <select id="key-binding"></select>
    <input id="target-wpm" value="15">
    <select id="theme"></select>
    <input type="checkbox" id="enable-custom" checked>
    <input type="checkbox" id="include-unknown" checked>
    <div id="target-word-section" style="display: none;"></div>
    <div id="score-section" style="display: none;"></div>
    <span id="target-word"></span>
    <span id="score"></span>
    <div id="feedback-dialog" class="dialog hidden">
        <div class="dialog-content">
            <h3 id="dialog-title"></h3>
            <p id="dialog-message"></p>
            <button id="dialog-ok"></button>
        </div>
    </div>
`;

describe('App', () => {
    let app;

    beforeEach(() => {
        // Mock URL.createObjectURL and revokeObjectURL
        global.URL.createObjectURL = jest.fn(() => 'mock-url');
        global.URL.revokeObjectURL = jest.fn();

        // Mock Blob
        global.Blob = jest.fn((content, options) => ({
            content,
            options
        }));

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                setItem: jest.fn(),
                getItem: jest.fn(() => '{}')
            },
            writable: true
        });

        // Mock AudioContext
        global.AudioContext = jest.fn(() => ({
            state: 'running',
            currentTime: 0,
            resume: jest.fn(),
            createOscillator: jest.fn(() => ({
                connect: jest.fn(),
                frequency: { value: 0 },
                type: '',
                start: jest.fn(),
                stop: jest.fn()
            })),
            createGain: jest.fn(() => ({
                connect: jest.fn(),
                gain: {
                    setValueAtTime: jest.fn(),
                    exponentialRampToValueAtTime: jest.fn()
                }
            })),
            destination: {}
        }));

        // Mock fetch
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(['test'])
            })
        );

        // Mock fetch for API calls
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(['TEST'])
            })
        );

        app = new App();

        // Mock playBeep to avoid audio issues in tests
        app.playBeep = jest.fn();

        // Set default values after app init
        document.getElementById('key-binding').value = '32';
        document.getElementById('theme').value = 'dark';
    });

    test('should initialize with correct components', () => {
        expect(app.inputHandler).toBeDefined();
        expect(app.parser).toBeDefined();
        expect(app.timingEngine).toBeDefined();
        expect(app.outputText).toBe('');
        expect(app.currentWordBuffer).toBe('');
    });

    test('should handle dot input', () => {
        app.handleDot(100);
        expect(app.parser.getCurrentSequence()).toBe('.');
    });

    test('should handle dash input', () => {
        app.handleDash(400);
        expect(app.parser.getCurrentSequence()).toBe('-');
    });

    test('should handle character completion', () => {
        app.parser.addElement('.');
        app.parser.addElement('-');
        app.parser.endLetter();

        expect(app.currentWordBuffer).toBe('A');
    });

    test('should handle word completion', () => {
        app.parser.addElement('.');
        app.parser.addElement('-');
        app.parser.endLetter();
        app.handleWord('A');

        expect(app.outputText).toBe('A ');
        expect(app.currentWordBuffer).toBe('');
    });

    test('should update UI elements', () => {
        app.updateUI();
        expect(document.getElementById('input-buffer').textContent).toBe('-');

        app.outputText = 'HELLO';
        app.updateOutputText();
        expect(document.getElementById('output-text').textContent).toBe('HELLO');

        app.updateStats();
        expect(document.getElementById('word-count').textContent).toBe('Words: 1');

        app.outputText = '';
        app.updateStats();
        expect(document.getElementById('word-count').textContent).toBe('Words: 0');
    });

    test('should show and hide settings', () => {
        app.showSettings();
        expect(document.getElementById('settings-panel').classList.contains('hidden')).toBe(false);

        app.hideSettings();
        expect(document.getElementById('settings-panel').classList.contains('hidden')).toBe(true);
    });

    test('should add custom character', () => {
        document.getElementById('custom-char').value = '[';
        document.getElementById('custom-sequence').value = '_._._.';
        app.addCustomChar();
        expect(app.parser.lookupChar('-.-.-.')).toBe('[');
        expect(document.getElementById('custom-char').value).toBe('');
        expect(document.getElementById('custom-sequence').value).toBe('');
    });

    test('should handle invalid custom character input', () => {
        // Mock alert
        global.alert = jest.fn();
        document.getElementById('custom-char').value = '';
        document.getElementById('custom-sequence').value = '-.--.-.';
        app.addCustomChar();
        expect(global.alert).toHaveBeenCalledWith('Please enter both character and Morse sequence');
    });

    test('should clear text', () => {
        app.outputText = 'HELLO';
        app.currentWordBuffer = 'HI';
        app.currentLetterSequence = '..';
        app.clearText();
        expect(app.outputText).toBe('');
        expect(app.currentWordBuffer).toBe('');
        expect(app.currentLetterSequence).toBe('');
        expect(document.getElementById('output-text').textContent).toBe('');
    });

    test('should export text', () => {
        app.outputText = 'HELLO WORLD';
        app.exportText();
        expect(global.Blob).toHaveBeenCalledWith(['HELLO WORLD'], { type: 'text/plain' });
    });

    test('should export morse log', () => {
        app.outputText = 'HI';
        app.exportMorseLog();
        expect(global.Blob).toHaveBeenCalled();
    });

    test('should export json', () => {
        app.outputText = 'TEST';
        app.exportJSON();
        expect(global.Blob).toHaveBeenCalled();
    });

    test('should show settings', () => {
        app.showSettings();
        expect(document.getElementById('settings-panel').classList.contains('hidden')).toBe(false);
    });

    test('should hide settings', () => {
        document.getElementById('settings-panel').classList.remove('hidden');
        app.hideSettings();
        expect(document.getElementById('settings-panel').classList.contains('hidden')).toBe(true);
    });

    test('should toggle mode from practice to challenge', () => {
        app.mode = 'practice';
        app.toggleMode();
        expect(app.mode).toBe('challenge');
        expect(document.getElementById('mode-btn').textContent).toBe('Mode: Challenge');
        expect(document.getElementById('target-word-section').style.display).toBe('flex');
        expect(document.getElementById('score-section').style.display).toBe('flex');
        expect(document.getElementById('clear-text').textContent).toBe('Clear & New Word');
    });

    test('should toggle mode from challenge to practice', () => {
        app.mode = 'challenge';
        app.toggleMode();
        expect(app.mode).toBe('practice');
        expect(document.getElementById('mode-btn').textContent).toBe('Mode: Practice');
        expect(document.getElementById('target-word-section').style.display).toBe('none');
        expect(document.getElementById('score-section').style.display).toBe('none');
        expect(document.getElementById('clear-text').textContent).toBe('Clear');
    });

    test('should fetch random word', async () => {
        await app.fetchRandomWord();
        expect(global.fetch).toHaveBeenCalledWith('https://random-word-api.herokuapp.com/word');
        expect(app.targetWord).toBe('TEST');
        expect(document.getElementById('target-word').textContent).toBe('TEST');
    });

    test('should handle correct challenge word', () => {
        app.mode = 'challenge';
        app.targetWord = 'HELLO'; // 5 characters
        app.score = 5;
        app.outputText = '';
        app.totalTime = 1000; // Initial time
        const startTime = Date.now() - 3000;
        app.wordStartTime = startTime;
        app.handleChallengeWord('HELLO');
        expect(app.score).toBe(5 + 15); // 5 + (5 * 6 / 2)
        expect(app.outputText).toBe('HELLO ');
        expect(app.totalTime).toBeGreaterThan(1000); // Should add time for correct attempt
        expect(app.wordStartTime).toBeNull();
        expect(document.getElementById('score').textContent).toBe('20');
        expect(document.getElementById('feedback-dialog').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('dialog-title').textContent).toBe('Correct!');
        expect(document.getElementById('dialog-message').textContent).toBe('You typed "HELLO" correctly!\n(+15 points)');
        expect(document.getElementById('dialog-ok').textContent).toBe('Next Word');
    });

    test('should handle incorrect challenge word', () => {
        app.mode = 'challenge';
        app.targetWord = 'HELLO';
        app.score = 5;
        app.totalTime = 1000; // Initial time
        const startTime = Date.now() - 2000;
        app.wordStartTime = startTime;
        app.handleChallengeWord('WORLD');
        expect(app.score).toBe(0); // Should reset score
        expect(app.outputText).toBe(''); // Should reset output text
        expect(app.totalTime).toBe(0); // Should reset total time
        expect(app.wordStartTime).toBeNull(); // Should reset timer
        expect(document.getElementById('score').textContent).toBe('0');
        expect(document.getElementById('feedback-dialog').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('dialog-title').textContent).toBe('Incorrect');
        expect(document.getElementById('dialog-message').textContent).toBe('You typed "WORLD", but the target was "HELLO".\nFinal score: 5');
        expect(document.getElementById('dialog-ok').textContent).toBe('Try Again');
    });

    test('should show dialog', () => {
        app.showDialog('Test Title', 'Test Message', true, 'Next Word');
        expect(document.getElementById('dialog-title').textContent).toBe('Test Title');
        expect(document.getElementById('dialog-message').textContent).toBe('Test Message');
        expect(document.getElementById('dialog-ok').textContent).toBe('Next Word');
        expect(document.getElementById('feedback-dialog').classList.contains('hidden')).toBe(false);
    });

    test('should hide dialog', () => {
        document.getElementById('feedback-dialog').classList.remove('hidden');
        app.hideDialog();
        expect(document.getElementById('feedback-dialog').classList.contains('hidden')).toBe(true);
    });

    test('should preserve target word and score when switching modes', () => {
        app.mode = 'challenge';
        app.targetWord = 'HELLO';
        app.score = 15;
        app.lastTargetWord = '';
        app.lastScore = 0;
        app.toggleMode(); // Switch to practice
        expect(app.lastTargetWord).toBe('HELLO');
        expect(app.lastScore).toBe(15);
        
        app.toggleMode(); // Switch back to challenge
        expect(app.targetWord).toBe('HELLO');
        expect(app.score).toBe(15);
        expect(document.getElementById('target-word').textContent).toBe('HELLO');
        expect(document.getElementById('score').textContent).toBe('15');
    });

    test('should set word start time on first input', () => {
        app.wordStartTime = null;
        app.handleDot(100);
        expect(app.wordStartTime).toBeTruthy();
        expect(typeof app.wordStartTime).toBe('number');
    });

    test('should not reset word start time if word buffer is not empty', () => {
        app.wordStartTime = 1000;
        app.currentWordBuffer = 'A';
        app.handleDot(100);
        expect(app.wordStartTime).toBe(1000);
    });

    test('should reset word start time when word is completed', () => {
        app.wordStartTime = 1000;
        app.handleWord('TEST');
        expect(app.wordStartTime).toBeNull();
    });

    test('should reset word start time when challenge word is submitted', () => {
        app.mode = 'challenge';
        app.targetWord = 'HELLO';
        app.wordStartTime = 1000;
        app.handleChallengeWord('HELLO');
        expect(app.wordStartTime).toBeNull();
    });

    test('should accumulate word time when word is completed', () => {
        const startTime = Date.now() - 3000;
        const initialTotal = 5000;
        app.wordStartTime = startTime;
        app.totalTime = initialTotal;
        app.handleWord('TEST');
        expect(app.totalTime).toBeGreaterThanOrEqual(initialTotal);
        expect(app.wordStartTime).toBeNull();
    });

    test('should accumulate word time when challenge word is correct', () => {
        const startTime = Date.now() - 2000;
        const initialTotal = 3000;
        app.mode = 'challenge';
        app.targetWord = 'HELLO';
        app.wordStartTime = startTime;
        app.totalTime = initialTotal;
        app.handleChallengeWord('HELLO');
        expect(app.totalTime).toBeGreaterThanOrEqual(initialTotal);
        expect(app.wordStartTime).toBeNull();
    });

    test('should not accumulate word time when challenge word is incorrect', () => {
        const startTime = Date.now() - 2000;
        const initialTotal = 3000;
        app.mode = 'challenge';
        app.targetWord = 'HELLO';
        app.wordStartTime = startTime;
        app.totalTime = initialTotal;
        app.handleChallengeWord('WORLD');
        expect(app.totalTime).toBe(0); // Should reset time for incorrect attempt
        expect(app.wordStartTime).toBeNull();
    });

    test('should reset total time in clearText', () => {
        app.totalTime = 10000;
        app.clearText();
        expect(app.totalTime).toBe(0);
    });

    test('should use word start time in updateStats', () => {
        const mockNow = Date.now();
        app.wordStartTime = mockNow - 5000; // 5 seconds ago
        app.totalTime = 10000; // 10 seconds already accumulated
        app.outputText = 'TEST';
        app.updateStats();
        const timeElement = document.getElementById('time');
        expect(timeElement.textContent).toMatch(/Time: 00:10\.\d{3}/); // Should show only accumulated time (10 seconds)
    });

    test('should show total time when no current word', () => {
        app.wordStartTime = null;
        app.totalTime = 8000; // 8 seconds
        app.outputText = 'TEST';
        app.updateStats();
        const timeElement = document.getElementById('time');
        expect(timeElement.textContent).toMatch(/Time: 00:08\.\d{3}/);
    });
});