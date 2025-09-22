import { MorseInputHandler } from './MorseInputHandler.js';
import { MorseParser } from './MorseParser.js';
import { TimingEngine } from './TimingEngine.js';

export class App {
    constructor() {
        this.inputHandler = new MorseInputHandler();
        this.parser = new MorseParser();
        this.timingEngine = new TimingEngine();
        this.outputText = '';
        this.currentWordBuffer = ''; // Track completed characters in current word
        this.currentLetterSequence = ''; // Track current letter sequence being typed
        this.sessionStartTime = Date.now();
        this.lastActionTime = Date.now();
        this.pauseTimer = null;
        this.isSessionStarted = false;
        this.wordStartTime = null; // Track start time for current word
        this.totalTime = 0; // Accumulated time for all words
        this.includeUnknown = true; // Default true
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.mode = 'practice'; // 'practice' or 'challenge'
        this.targetWord = '';
        this.score = 0;
        this.isSwitchingMode = false;
        this.lastTargetWord = '';
        this.lastScore = 0;
        this.lastDisplayedWPM = 0; // Track last displayed WPM for debounce

        this.init();
        this.setupEventListeners();
    }

    init() {
        this.loadSettings();
        this.updateUI();
        this.updateCurrentWordDisplay();
        this.updateCustomList();
        this.applyCustomSetting();
        this.updateModeUI();
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('morseSettings') || '{}');
        const keyBinding = settings.keyBinding || 32;
        const targetWPM = settings.targetWPM || 10;
        const theme = settings.theme || 'dark';
        const enableCustom = settings.enableCustom !== false; // Default true
        const includeUnknown = settings.includeUnknown !== false; // Default true

        this.inputHandler.keyCode = keyBinding;
        this.timingEngine.setWPM(targetWPM);
        document.body.className = theme === 'light' ? 'light-theme' : '';

        // Set form values
        const keyBindingEl = document.getElementById('key-binding');
        if (keyBindingEl) keyBindingEl.value = keyBinding;

        const targetWPMEl = document.getElementById('target-wpm');
        if (targetWPMEl) targetWPMEl.value = targetWPM;

        const themeEl = document.getElementById('theme');
        if (themeEl) themeEl.value = theme;

        const enableCustomEl = document.getElementById('enable-custom');
        if (enableCustomEl) enableCustomEl.checked = enableCustom;

        const includeUnknownEl = document.getElementById('include-unknown');
        if (includeUnknownEl) includeUnknownEl.checked = includeUnknown;

        this.parser.setEnableCustom(enableCustom);
        this.parser.setIncludeUnknown(includeUnknown);
        this.includeUnknown = includeUnknown;
    }    setupEventListeners() {
        // Input handler callbacks
        this.inputHandler.setCallbacks(
            (duration) => this.handleDot(duration),
            (duration) => this.handleDash(duration),
            null, // No longer using handlePause from inputHandler
            (duration) => this.handleError(duration)
        );

        // Parser callbacks
        this.parser.setCallbacks(
            (char, sequence) => this.handleCharacter(char, sequence),
            (word) => this.handleWord(word),
            () => this.handleEndLetter()
        );

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 32) { // Spacebar
                e.preventDefault(); // Prevent page scroll
                if (this.pauseTimer) {
                    clearTimeout(this.pauseTimer);
                    this.pauseTimer = null;
                }
            }
            this.inputHandler.handleKeyDown(e);
        });
        document.addEventListener('keyup', (e) => this.inputHandler.handleKeyUp(e));

        // UI events
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());

        const modeBtn = document.getElementById('mode-btn');
        if (modeBtn) modeBtn.addEventListener('click', () => this.toggleMode());

        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveSettings());

        const closeSettingsBtn = document.getElementById('close-settings');
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.hideSettings());

        const toggleRefBtn = document.getElementById('toggle-reference');
        if (toggleRefBtn) toggleRefBtn.addEventListener('click', () => this.toggleReference());

        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.handleExport());

        const clearTextBtn = document.getElementById('clear-text');
        if (clearTextBtn) clearTextBtn.addEventListener('click', () => this.clearText());

        const addCustomBtn = document.getElementById('add-custom');
        if (addCustomBtn) addCustomBtn.addEventListener('click', () => this.addCustomChar());

        const toggleCustomBtn = document.getElementById('toggle-custom');
        if (toggleCustomBtn) toggleCustomBtn.addEventListener('click', () => this.toggleCustom());

        const dialogOkBtn = document.getElementById('dialog-ok');
        if (dialogOkBtn) dialogOkBtn.addEventListener('click', () => this.hideDialog());
    }

    handleDot(duration) {
        if (!this.isSessionStarted) {
            this.sessionStartTime = Date.now();
            this.isSessionStarted = true;
            this.startRealtimeUpdates(); // Start real-time WPM updates
        }
        if (!this.wordStartTime || this.currentWordBuffer === '') {
            this.wordStartTime = Date.now();
        }
        this.parser.addElement('.');
        this.currentLetterSequence += '.';
        this.updateInputBuffer();
        this.updateCurrentWordDisplay();
        this.updateProgressBar(0);
        this.updateFeedback('Dot added', `Duration: ${duration}ms`);
        this.playBeep(800, 0.1);
        this.startPauseDetection();
    }

    handleDash(duration) {
        if (!this.isSessionStarted) {
            this.sessionStartTime = Date.now();
            this.isSessionStarted = true;
            this.startRealtimeUpdates(); // Start real-time WPM updates
        }
        if (!this.wordStartTime || this.currentWordBuffer === '') {
            this.wordStartTime = Date.now();
        }
        this.parser.addElement('-');
        this.currentLetterSequence += '-';
        this.updateInputBuffer();
        this.updateCurrentWordDisplay();
        this.updateProgressBar(0);
        this.updateFeedback('Dash added', `Duration: ${duration}ms`);
        this.playBeep(800, 0.3);
        this.startPauseDetection();
    }

    startPauseDetection() {
        if (this.pauseTimer) clearTimeout(this.pauseTimer);
        this.lastActionTime = Date.now();
        // First timeout for letter separator
        this.pauseTimer = setTimeout(() => {
            const pauseDuration = Date.now() - this.lastActionTime;
            if (pauseDuration >= this.timingEngine.getThresholds().letterSeparator.min) {
                this.parser.endLetter();
                this.currentLetterSequence = '';
                this.updateCurrentWordDisplay();
                this.updateFeedback('Letter completed', 'Pause detected');
                // Then set timeout for word separator
                this.pauseTimer = setTimeout(() => {
                    const wordPauseDuration = Date.now() - this.lastActionTime;
                    if (wordPauseDuration >= this.timingEngine.getThresholds().wordSeparator.min) {
                        this.parser.endWord();
                        this.updateFeedback('Word completed', 'Long pause detected');
                    }
                }, this.timingEngine.getThresholds().wordSeparator.min - pauseDuration);
            }
        }, this.timingEngine.getThresholds().letterSeparator.min);
    }

    handleCharacter(char, sequence) {
        this.currentWordBuffer += char;
        this.updateFeedback(`Character: ${char}`, `Sequence: ${sequence}`);
    }

    handleEndLetter() {
        this.currentLetterSequence = '';
        this.updateCurrentWordDisplay();
        this.updateInputBuffer();
    }

    handleWord(word) {
        if (this.mode === 'challenge') {
            this.handleChallengeWord(word);
        } else {
            // Add current word time to total
            if (this.wordStartTime) {
                this.totalTime += Date.now() - this.wordStartTime;
            }
            this.outputText += word + ' ';
            this.updateOutputText();
            this.updateStats();
            this.parser.clear();
            this.updateInputBuffer();
            this.currentWordBuffer = '';
            this.currentLetterSequence = '';
            this.updateCurrentWordDisplay();
            this.updateFeedback('Word added', `Word: ${word}`);
            // Reset word timer for next word
            this.wordStartTime = null;
        }
    }

    handleChallengeWord(word) {
        const isCorrect = word.toUpperCase() === this.targetWord;
        if (isCorrect) {
            // Base points based on word length: longer words = more points using arithmetic series
            const basePoints = Math.floor(word.length * (word.length + 1) / 2);
            
            // Calculate current WPM using same logic as updateStats
            const chars = this.outputText.replace(/\s/g, '').length;
            const timeElapsed = this.totalTime + (this.wordStartTime ? (Date.now() - this.wordStartTime) : 0);
            let currentWPM = 0;
            if (timeElapsed > 0 && chars > 0) {
                const wordCount = chars / 5;
                const minutesElapsed = timeElapsed / 60000;
                currentWPM = wordCount / minutesElapsed;
                
                // Ensure WPM is a valid number
                if (!isFinite(currentWPM) || isNaN(currentWPM)) {
                    currentWPM = 0;
                }
            }
            
            // WPM bonus: higher speed = higher multiplier (minimum 1x, scales with WPM)
            const wpmMultiplier = Math.max(1, currentWPM / 10);
            
            // Final points = base points × WPM multiplier
            const points = Math.floor(basePoints * wpmMultiplier);
            
            this.score += points;
            // Add current word time to total only if correct
            if (this.wordStartTime) {
                this.totalTime += Date.now() - this.wordStartTime;
            }
            this.outputText += word + ' ';
            this.updateOutputText();
            this.showDialog('Correct!', `You typed "${word}" correctly!\n(+${points} points)`, true, 'Next Word');
        } else {
            const finalScore = this.score; // Save score before reset
            // Reset score and output when incorrect
            this.score = 0;
            this.outputText = '';
            this.totalTime = 0;
            this.updateOutputText();
            const scoreEl = document.getElementById('score');
            if (scoreEl) scoreEl.textContent = this.score;
            this.showDialog('Incorrect', `You typed "${word}", but the target was "${this.targetWord}".\nFinal score: ${finalScore}`, false, 'Try Again');
        }
        // Reset word timer for next attempt/word BEFORE updating stats
        this.wordStartTime = null;
        const scoreEl2 = document.getElementById('score');
        if (scoreEl2) scoreEl2.textContent = this.score;
        this.updateStats();
        this.parser.clear();
        this.updateInputBuffer();
        this.currentWordBuffer = '';
        this.currentLetterSequence = '';
        this.updateCurrentWordDisplay();
        this.updateFeedback('Word submitted', `Word: ${word}`);
    }

    handleError(duration) {
        this.updateFeedback('Invalid input', `Duration: ${duration}ms`);
    }

    updateUI() {
        this.updateInputBuffer();
        this.updateOutputText();
        this.updateStats();
        this.updateProgressBar(0);
        this.updateFeedback('Ready', 'Press spacebar to start');
    }

    updateInputBuffer() {
        const inputBufferEl = document.getElementById('input-buffer');
        if (inputBufferEl) inputBufferEl.textContent = this.parser.getCurrentSequence() || '-';
    }

    updateCurrentWordDisplay() {
        const sequence = this.currentLetterSequence;
        const predictedChar = this.parser.lookupChar(sequence);
        const predictedText = sequence ? (predictedChar ? predictedChar : (this.includeUnknown ? '�' : '')) : '';

        const currentLetterElement = document.getElementById('current-letter');

        // Clear existing content
        currentLetterElement.innerHTML = '';

        // Add completed characters (normal color)
        if (this.currentWordBuffer) {
            const completedSpan = document.createElement('span');
            completedSpan.className = 'completed-char';
            completedSpan.textContent = this.currentWordBuffer;
            currentLetterElement.appendChild(completedSpan);
        }

        // Add predicted character (different color)
        if (predictedText) {
            const predictedSpan = document.createElement('span');
            predictedSpan.className = 'predicted-char';
            predictedSpan.textContent = predictedText;
            currentLetterElement.appendChild(predictedSpan);
        } else if (!this.currentWordBuffer) {
            currentLetterElement.textContent = '-';
        }

        // Update target word highlighting if in challenge mode
        this.updateTargetWordDisplay();
    }

    updateTargetWordDisplay() {
        if (this.mode !== 'challenge' || !this.targetWord) return;
        
        const targetElement = document.getElementById('target-word');
        if (!targetElement) return;
        
        const matchedLength = this.getMatchedPrefixLength();
        const matched = this.targetWord.substring(0, matchedLength);
        const unmatched = this.targetWord.substring(matchedLength);
        
        targetElement.innerHTML = '';
        if (matched) {
            const matchedSpan = document.createElement('span');
            matchedSpan.className = 'matched-char';
            matchedSpan.textContent = matched;
            targetElement.appendChild(matchedSpan);
        }
        if (unmatched) {
            const unmatchedSpan = document.createElement('span');
            unmatchedSpan.textContent = unmatched;
            targetElement.appendChild(unmatchedSpan);
        }
    }

    getMatchedPrefixLength() {
        if (!this.targetWord || !this.currentWordBuffer) return 0;
        let len = 0;
        for (let i = 0; i < this.currentWordBuffer.length && i < this.targetWord.length; i++) {
            if (this.currentWordBuffer[i] === this.targetWord[i]) {
                len++;
            } else {
                break;
            }
        }
        return len;
    }

    updateOutputText() {
        const outputTextEl = document.getElementById('output-text');
        if (outputTextEl) outputTextEl.textContent = this.outputText.trim();
    }

    updateStats() {
        const chars = this.outputText.replace(/\s/g, '').length;
        const trimmed = this.outputText.trim();
        const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
        const timeElapsed = this.totalTime + (this.wordStartTime ? (Date.now() - this.wordStartTime) : 0);
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor((timeElapsed % 60000) / 1000);
        const milliseconds = timeElapsed % 1000;
        
        // Calculate real-time WPM
        let currentWPM = 0;
        if (timeElapsed > 0 && chars > 0) {
            // Use standard: 5 characters = 1 word
            const wordCount = chars / 5;
            const minutesElapsed = timeElapsed / 60000;
            currentWPM = wordCount / minutesElapsed;
            
            // Ensure WPM is a valid number
            if (!isFinite(currentWPM) || isNaN(currentWPM)) {
                currentWPM = 0;
            }
        }
        
        const charCountEl = document.getElementById('char-count');
        if (charCountEl) charCountEl.textContent = `Characters: ${chars}`;
        
        const wordCountEl = document.getElementById('word-count');
        if (wordCountEl) wordCountEl.textContent = `Words: ${words}`;
        
        const timeEl = document.getElementById('time');
        if (timeEl) timeEl.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        
        const speedEl = document.getElementById('speed');
        if (speedEl) {
            const displayWPM = currentWPM > 0 ? currentWPM.toFixed(1) : '0.0';
            
            // Only update if WPM changed significantly (>= 0.5) or if it was 0
            const wpmChange = Math.abs(parseFloat(displayWPM) - this.lastDisplayedWPM);
            if (wpmChange >= 0.5 || this.lastDisplayedWPM === 0) {
                speedEl.textContent = `${displayWPM} WPM`;
                this.lastDisplayedWPM = parseFloat(displayWPM);
                
                // Force DOM update in case of rendering issues
                speedEl.style.display = 'inline';
            }
        }
    }

    updateProgressBar(percentage) {
        const progressFillEl = document.getElementById('progress-fill');
        if (progressFillEl) progressFillEl.style.width = `${percentage}%`;
    }

    updateFeedback(action, details) {
        const currentActionEl = document.getElementById('current-action');
        if (currentActionEl) currentActionEl.textContent = action;
        
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = `Status: ${details}`;
    }

    showSettings() {
        document.getElementById('settings-panel').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-panel').classList.add('hidden');
    }

    saveSettings() {
        const keyBinding = parseInt(document.getElementById('key-binding').value);
        const targetWPM = parseInt(document.getElementById('target-wpm').value);
        const theme = document.getElementById('theme').value;
        const enableCustom = document.getElementById('enable-custom').checked;
        const includeUnknown = document.getElementById('include-unknown').checked;

        this.inputHandler.keyCode = keyBinding;
        this.timingEngine.setWPM(targetWPM);
        document.body.className = theme === 'light' ? 'light-theme' : '';

        localStorage.setItem('morseSettings', JSON.stringify({
            keyBinding,
            targetWPM,
            theme,
            enableCustom,
            includeUnknown
        }));

        this.applyCustomSetting();
        this.parser.setIncludeUnknown(includeUnknown);
        this.includeUnknown = includeUnknown;
        this.hideSettings();
    }

    toggleReference() {
        // Implement toggle full reference
        alert('Full reference toggle not implemented yet');
    }

    clearText() {
        this.outputText = '';
        this.currentWordBuffer = '';
        this.currentLetterSequence = '';
        this.parser.clear();
        this.isSessionStarted = false;
        this.lastActionTime = Date.now();
        this.wordStartTime = null; // Reset word timer
        this.totalTime = 0; // Reset total time
        this.lastDisplayedWPM = 0; // Reset displayed WPM
        this.updateUI();
        this.updateCurrentWordDisplay();
        this.updateInputBuffer();
        this.updateStats(); // Ensure time resets
        if (this.mode === 'challenge' && !this.isSwitchingMode) {
            this.clearChallengeData();
            this.fetchRandomWord();
        }
        // Stop real-time updates when clearing
        this.stopRealtimeUpdates();
    }

    handleExport() {
        const exportType = document.getElementById('export-type').value;
        if (exportType === 'text') {
            this.exportText();
        } else if (exportType === 'morse') {
            this.exportMorseLog();
        } else if (exportType === 'json') {
            this.exportJSON();
        }
        // Reset select to default
        document.getElementById('export-type').value = '';
    }

    exportText() {
        const blob = new Blob([this.outputText.trim()], { type: 'text/plain' });
        this.downloadBlob(blob, 'morse_output.txt');
    }

    exportMorseLog() {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const chars = this.outputText.replace(/\s/g, '').length;
        const words = this.outputText.trim().split(/\s+/).length;
        const timeElapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const wpm = this.timingEngine.calculateWPM(chars, timeElapsed / 60);

        let log = `# Morse Typing Session - ${timestamp}\n`;
        log += `# Settings: Key=SPACE, Target WPM=${this.timingEngine.wpm}\n`;
        log += `# Statistics: ${chars} chars, ${words} words, ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')} duration, ${wpm.toFixed(2)} avg WPM\n\n`;
        log += `${this.outputText.trim()}|${this.getMorseSequence()}|${this.getTimingSequence()}\n`;

        const blob = new Blob([log], { type: 'text/plain' });
        this.downloadBlob(blob, 'morse_session.morse');
    }

    exportJSON() {
        const timestamp = new Date().toISOString();
        const chars = this.outputText.replace(/\s/g, '').length;
        const words = this.outputText.trim().split(/\s+/).length;
        const timeElapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const wpm = this.timingEngine.calculateWPM(chars, timeElapsed / 60);

        const report = {
            session: {
                startTime: new Date(this.sessionStartTime).toISOString(),
                duration: timeElapsed,
                settings: { targetWPM: this.timingEngine.wpm, keyBinding: this.inputHandler.keyCode }
            },
            statistics: {
                charactersTyped: chars,
                wordsCompleted: words,
                averageWPM: parseFloat(wpm.toFixed(2)),
                accuracyRate: 100, // Placeholder
                commonErrors: [] // Placeholder
            },
            timeline: [] // Placeholder for detailed timeline
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, 'morse_report.json');
    }

    getMorseSequence() {
        // Placeholder - would need to track morse sequences
        return '····· ·- ·-·· ·-·· ---';
    }

    getTimingSequence() {
        // Placeholder - would need to track timings
        return 'timing data';
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    addCustomChar() {
        const charInput = document.getElementById('custom-char');
        const sequenceInput = document.getElementById('custom-sequence');
        const char = charInput.value.trim().toUpperCase();
        let sequence = sequenceInput.value.trim();

        if (!char || !sequence) {
            alert('Please enter both character and Morse sequence');
            return;
        }

        // Convert · to . and _ to - for consistency
        sequence = sequence.replace(/·/g, '.').replace(/_/g, '-');
        // Remove spaces
        sequence = sequence.replace(/\s/g, '');

        // Validate sequence contains only dots, dashes, ·, and _
        if (!/^[\.\-·_]+$/.test(sequence)) {
            alert('Morse sequence can only contain dots (.), dashes (-), ·, or _');
            return;
        }

        try {
            this.parser.addCustom(char, sequence);
            this.updateCustomList();
            charInput.value = '';
            sequenceInput.value = '';
        } catch (error) {
            alert(error.message);
        }
    }

    removeCustomChar(sequence) {
        this.parser.removeCustom(sequence);
        this.updateCustomList();
    }

    updateCustomList() {
        const customList = document.getElementById('custom-list');
        if (!customList) return; // For testing environment
        customList.innerHTML = '';

        const customMap = this.parser.getCustomMap();
        for (const [seq, char] of Object.entries(customMap)) {
            const item = document.createElement('div');
            item.className = 'custom-item';
            item.innerHTML = `
                <span>${char}: ${seq.replace(/\./g, '·').replace(/-/g, '-')}</span>
                <button onclick="window.app.removeCustomChar('${seq}')">×</button>
            `;
            customList.appendChild(item);
        }
    }

    applyCustomSetting() {
        const enableCustomEl = document.getElementById('enable-custom');
        const customRef = document.querySelector('.custom-reference');
        if (enableCustomEl && customRef) {
            const enabled = enableCustomEl.checked;
            customRef.style.display = enabled ? 'block' : 'none';
            this.parser.setEnableCustom(enabled);
        }
    }

    toggleCustom() {
        const enableCustomEl = document.getElementById('enable-custom');
        if (!enableCustomEl || !enableCustomEl.checked) return; // Only toggle if enabled

        const customInput = document.querySelector('.custom-input');
        const customList = document.getElementById('custom-list');
        const toggleBtn = document.getElementById('toggle-custom');

        if (customInput && customList) {
            const isHidden = customInput.style.display === 'none';
            customInput.style.display = isHidden ? 'flex' : 'none';
            customList.style.display = isHidden ? 'flex' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
        }
    }

    toggleMode() {
        this.isSwitchingMode = true;
        const oldMode = this.mode;
        this.mode = this.mode === 'practice' ? 'challenge' : 'practice';
        this.updateModeUI();
        this.clearText();
        if (this.mode === 'challenge') {
            if (oldMode === 'practice' && this.lastTargetWord) {
                // Restore previous target word and score
                this.targetWord = this.lastTargetWord;
                this.score = this.lastScore;
                document.getElementById('target-word').textContent = this.targetWord;
                document.getElementById('score').textContent = this.score;
            } else {
                this.fetchRandomWord();
            }
        } else {
            // Save current target word and score when switching to practice
            this.lastTargetWord = this.targetWord;
            this.lastScore = this.score;
            this.clearChallengeData();
        }
        this.isSwitchingMode = false;
        // Start real-time WPM updates
        this.startRealtimeUpdates();
    }

    startRealtimeUpdates() {
        // Clear any existing interval first
        this.stopRealtimeUpdates();
        
        // Update WPM every 1000ms for smoother display
        this.realtimeInterval = setInterval(() => {
            if (this.isSessionStarted) {
                this.updateStats();
            }
        }, 1000);
    }

    stopRealtimeUpdates() {
        if (this.realtimeInterval) {
            clearInterval(this.realtimeInterval);
            this.realtimeInterval = null;
        }
    }

    updateModeUI() {
        const modeBtn = document.getElementById('mode-btn');
        const targetSection = document.getElementById('target-word-section');
        const scoreSection = document.getElementById('score-section');
        const clearBtn = document.getElementById('clear-text');

        if (this.mode === 'practice') {
            modeBtn.textContent = 'Mode: Practice';
            targetSection.style.display = 'none';
            scoreSection.style.display = 'none';
            if (clearBtn) clearBtn.textContent = 'Clear';
        } else {
            modeBtn.textContent = 'Mode: Challenge';
            targetSection.style.display = 'flex';
            scoreSection.style.display = 'flex';
            if (clearBtn) clearBtn.textContent = 'Clear & New Word';
        }
    }

    async fetchRandomWord() {
        try {
            const response = await fetch('https://random-word-api.herokuapp.com/word');
            const words = await response.json();
            this.targetWord = words[0].toUpperCase();
            document.getElementById('target-word').textContent = this.targetWord;
            this.updateTargetWordDisplay();
        } catch (error) {
            console.error('Failed to fetch random word:', error);
            this.targetWord = 'HELLO'; // Fallback
            document.getElementById('target-word').textContent = this.targetWord;
            this.updateTargetWordDisplay();
        }
    }

    clearChallengeData() {
        this.targetWord = '';
        // Don't reset score here, only when explicitly needed
        document.getElementById('target-word').textContent = '-';
        // Don't update score display here
    }

    showDialog(title, message, isCorrect, buttonText = 'OK') {
        const dialog = document.getElementById('feedback-dialog');
        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const okBtn = document.getElementById('dialog-ok');

        titleEl.textContent = title;
        messageEl.textContent = message;
        okBtn.textContent = buttonText;
        okBtn.style.backgroundColor = isCorrect ? '#4CAF50' : '#f44336';

        dialog.classList.remove('hidden');
    }

    hideDialog() {
        document.getElementById('feedback-dialog').classList.add('hidden');
        if (this.mode === 'challenge') {
            this.fetchRandomWord();
        }
    }

    playBeep(frequency, duration) {
        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            // Ignore audio errors
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});