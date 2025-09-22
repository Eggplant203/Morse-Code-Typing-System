export class MorseParser {
    constructor() {
        this.morseMap = {
            '.-': 'A',
            '-...': 'B',
            '-.-.': 'C',
            '-..': 'D',
            '.': 'E',
            '..-.': 'F',
            '--.': 'G',
            '....': 'H',
            '..': 'I',
            '.---': 'J',
            '-.-': 'K',
            '.-..': 'L',
            '--': 'M',
            '-.': 'N',
            '---': 'O',
            '.--.': 'P',
            '--.-': 'Q',
            '.-.': 'R',
            '...': 'S',
            '-': 'T',
            '..-': 'U',
            '...-': 'V',
            '.--': 'W',
            '-..-': 'X',
            '-.--': 'Y',
            '--..': 'Z',
            '.----': '1',
            '..---': '2',
            '...--': '3',
            '....-': '4',
            '.....': '5',
            '-....': '6',
            '--...': '7',
            '---..': '8',
            '----.': '9',
            '-----': '0'
        };
        this.customMap = {};
    this.enableCustom = true; // Default enabled
    this.includeUnknown = true; // Default enabled
        this.loadCustomFromStorage();
        this.currentSequence = '';
        this.buffer = [];
        this.onCharacter = null;
        this.onWord = null;
        this.onEndLetter = null;
    }

    setCallbacks(onCharacter, onWord, onEndLetter) {
        this.onCharacter = onCharacter;
        this.onWord = onWord;
        this.onEndLetter = onEndLetter;
    }

    addElement(element) {
        if (element === '.') {
            this.currentSequence += '.';
        } else if (element === '-') {
            this.currentSequence += '-';
        }
    }

    endLetter() {
        const char = this.lookupChar(this.currentSequence);
        if (char) {
            this.buffer.push(char);
            if (this.onCharacter) this.onCharacter(char, this.currentSequence);
        } else {
            // Unknown sequence
            if (this.includeUnknown) {
                this.buffer.push('�');
                if (this.onCharacter) this.onCharacter('�', this.currentSequence);
            }
        }
        this.currentSequence = '';
        if (this.onEndLetter) this.onEndLetter();
    }

    setIncludeUnknown(enabled) {
        this.includeUnknown = enabled;
    }

    endWord() {
        if (this.buffer.length > 0) {
            const word = this.buffer.join('');
            if (this.onWord) this.onWord(word);
            this.buffer = [];
        }
    }

    lookupChar(sequence) {
        if (this.enableCustom) {
            return this.customMap[sequence] || this.morseMap[sequence] || null;
        } else {
            return this.morseMap[sequence] || null;
        }
    }

    addCustom(char, sequence) {
        // Validate char not in standard
        if (this.morseMap[sequence] || this.customMap[sequence]) {
            throw new Error('Morse sequence already exists');
        }
        if (Object.values(this.morseMap).includes(char) || Object.values(this.customMap).includes(char)) {
            throw new Error('Character already exists');
        }
        this.customMap[sequence] = char;
        this.saveCustomToStorage();
    }

    removeCustom(sequence) {
        if (this.customMap[sequence]) {
            delete this.customMap[sequence];
            this.saveCustomToStorage();
        }
    }

    getCustomMap() {
        return { ...this.customMap };
    }

    setEnableCustom(enabled) {
        this.enableCustom = enabled;
    }

    loadCustomFromStorage() {
        const stored = localStorage.getItem('morseCustomMap');
        if (stored) {
            this.customMap = JSON.parse(stored);
        }
    }

    saveCustomToStorage() {
        localStorage.setItem('morseCustomMap', JSON.stringify(this.customMap));
    }

    getCurrentSequence() {
        return this.currentSequence;
    }

    getBuffer() {
        return this.buffer.join('');
    }

    clear() {
        this.currentSequence = '';
        this.buffer = [];
    }
    setIncludeUnknown(enabled) {
        this.includeUnknown = enabled;
    }
}