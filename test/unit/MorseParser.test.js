import { MorseParser } from '../../src/js/modules/MorseParser.js';

describe('MorseParser', () => {
    let parser;

    beforeEach(() => {
        parser = new MorseParser();
        parser.customMap = {}; // Reset custom map for tests
    });

    test('should initialize with empty state', () => {
        expect(parser.currentSequence).toBe('');
        expect(parser.buffer).toEqual([]);
    });

    test('should add dot to sequence', () => {
        parser.addElement('.');
        expect(parser.currentSequence).toBe('.');
    });

    test('should add dash to sequence', () => {
        parser.addElement('-');
        expect(parser.currentSequence).toBe('-');
    });

    test('should lookup correct characters', () => {
        expect(parser.lookupChar('.-')).toBe('A');
        expect(parser.lookupChar('.')).toBe('E');
        expect(parser.lookupChar('-')).toBe('T');
        expect(parser.lookupChar('invalid')).toBeNull();
    });

    test('should end letter and add to buffer', () => {
        parser.addElement('.');
        parser.addElement('-');
        parser.endLetter();
        expect(parser.getBuffer()).toBe('A');
        expect(parser.currentSequence).toBe('');
    });

    test('should handle unknown sequence', () => {
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.'); // Invalid sequence
        parser.endLetter();
        expect(parser.getBuffer()).toBe('�');
    });

    test('should end word correctly', () => {
        let wordReceived = '';
        parser.setCallbacks(null, (word) => { wordReceived = word; }, null);

        parser.addElement('.');
        parser.addElement('-');
        parser.endLetter();
        parser.endWord();

        expect(wordReceived).toBe('A');
        expect(parser.buffer).toEqual([]);
    });

    test('should clear state', () => {
        parser.addElement('.');
        parser.buffer = ['A'];
        parser.clear();
        expect(parser.currentSequence).toBe('');
        expect(parser.buffer).toEqual([]);
    });

    test('should add custom character', () => {
        parser.addCustom('[', '-.--.-.');
        expect(parser.lookupChar('-.--.-.')).toBe('[');
        expect(parser.getCustomMap()).toEqual({ '-.--.-.': '[' });
    });

    test('should throw error for duplicate sequence', () => {
        expect(() => parser.addCustom('[', '.-')).toThrow('Morse sequence already exists');
    });

    test('should throw error for duplicate character', () => {
        expect(() => parser.addCustom('A', '-.--.-.')).toThrow('Character already exists');
    });

    test('should remove custom character', () => {
        parser.addCustom('[', '-.--.-.');
        parser.removeCustom('-.--.-.');
        expect(parser.lookupChar('-.--.-.')).toBeNull();
        expect(parser.getCustomMap()).toEqual({});
    });

    test('should lookup custom before standard', () => {
        parser.addCustom('[', '-.--.-.');
        expect(parser.lookupChar('-.--.-.')).toBe('[');
    });

    test('should not lookup custom when disabled', () => {
        parser.addCustom('[', '-.--.-.');
        parser.setEnableCustom(false);
        expect(parser.lookupChar('-.--.-.')).toBeNull();
        expect(parser.lookupChar('.-')).toBe('A'); // Standard still works
    });

    test('should set include unknown', () => {
        parser.setIncludeUnknown(false);
        expect(parser.includeUnknown).toBe(false);
    });

    test('should not add unknown character when disabled', () => {
        parser.setIncludeUnknown(false);
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.');
        parser.addElement('.'); // Invalid sequence
        parser.endLetter();
        expect(parser.getBuffer()).toBe('');
    });
});