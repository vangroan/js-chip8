// src/assembler/asm.js

'use strict';

var tokens = require('./tokens');
var util = require('../util');
var contains = util.arrayContains;

/**
 * @constructor
 * @param {string} char
 * @param {number} position
 * @param {number} line
 * @param {number} column
 */
var Character = exports.Character = function(char, position, line, column) {
    this._char = char;
    this._position = position;
    this._line = line;
    this._column = column;
}

Character.prototype.getChar = function() {
    return this._char;
}
Character.prototype.getPosition = function() {
    return this._position;
}
Character.prototype.getLine = function() {
    return this._line;
}
Character.prototype.getColumn = function() {
    return this._column;
}
Character.prototype.toString = function() {
    return this._char;
}

/**
 * @constructor
 */
var Scanner = exports.Scanner = function() {
    this.pos = -1;
    this.line = 0;
    this.column = -1;
    this.char = null;
    this.src = '';
    this._isSourceSet = false;
    this._isDone = false;
}

Scanner.prototype.isSourceSet = function() {
    return this._isSourceSet;
}

Scanner.prototype.isDone = function() {
    return this._isDone;
}

/**
 * @param {string} source
 */
Scanner.prototype.setSource = function(source) {
    if (this._isSourceSet)
        throw Error('Scanner source already set');
    this.src = source;
    this._isSourceSet = true;
}

Scanner.prototype.get = function() {

    if (this.isDone())
        throw Error('Scanner is done');

    if (this.position === this.src.length - 1)
        this._isDone = true;

    if (this.char !== null && contains(tokens.NEWLINE, this.char.getChar())) {
        this.column = -1;
        this.line++;
    }

    this.pos++;
    var c = this.src[this.pos];

    this.column++;
    this.char = new Character(c, this.pos, this.line, this.column);

    return this.char;
}

/**
 * @constructor
 */
var Token = exports.Token = function(type, position, line, column) {
    this.position = position;
    this.line = line;
    this.column = column;
    this._chars = [];
    this._str = '';
    this._dirty = false;
    this.type = type;
}

Token.prototype.append = function(char) {
    if (!(char instanceof Character))
        throw Error('Token can only append instances of Character');
    this._chars.push(char);
    this._dirty = true;
}

Token.prototype.toString = function() {
    if (this._dirty) {
        var c = [];
        for (var i = 0; i < this._chars.length; i++)
            c.push(this._chars[i].getChar());
        this._str = c.join('');
        this._dirty = false;
    }
    return this._str;
}

/**
 * @constructor
 */
var Tokenizer = exports.Tokenizer = function(scanner, options) {
    this.scanner = scanner;
    this.c1 = null;

    options = options || {};
    this.verbose = !!options['verbose'] || false;
}

Tokenizer.prototype.isDone = function() {
    return this.scanner.isDone();
}

Tokenizer.prototype.scanChar = function() {
    this.c1 = this.scanner.get();
}

Tokenizer.prototype.get = function() {

    var scanChar = this.scanChar.bind(this);
    var isDone = this.isDone.bind(this);

    // Initialize
    scanChar();

    // Ignore Whitespace
    while (contains(tokens.WHITESPACE, this.c1.getChar()) && !isDone()) {
        scanChar();
    }

    // Ignore linebreaks
    while (contains(tokens.LINEBREAK, this.c1.getChar()) && !isDone()) {
        scanChar();
    }

    // Collect comment into string
    if (contains(tokens.COMMENT, this.c1.getChar())) {
        var token = new Token(tokens.TYPES.COMMENT, this.c1.getPosition(), this.c1.getLine(), this.c1.getColumn());

        // Ignore Comment starting characters and leading whitespace
        while ((contains(tokens.COMMENT, this.c1.getChar()) || contains(tokens.WHITESPACE, this.c1.getChar())) && !isDone()) {
            scanChar();
        }

        // Was comment was empty all along
        if (!contains(tokens.NEWLINE, this.c1.getChar())) {
            // Build token until NEWLINE
            while (!contains(tokens.NEWLINE, this.c1.getChar()) && !isDone()) {
                token.append(this.c1);
                scanChar();
                if (contains(tokens.NEWLINE, this.c1.getChar())) {
                    break;
                }
            }
            return token;
        }
    }

    if (isDone())
        return new Token(tokens.TYPES.EOF, this.c1.getPosition(), this.c1.getLine(), this.c1.getColumn());

    // Character not recognised
    throw Error('[' + this.scanner.line + ', ' + this.scanner.column + ']' + ' Unknown token: ' + this.c1.toString() + '\n');

}

/**
 * @constructor
 * @param {Scanner} scanner
 */
var Assembler = exports.Assembler = function(tokenizer, options) {
    this.tokenizer = tokenizer;

    /** Store labels to be processed later */
    this._subRoutineMap = {};

    options = options || {};
    this.verbose = !!options['verbose'] || false;
}

Assembler.prototype.statement = function(tokens) {

}

Assembler.prototype.parse = function() {
    while (!this.tokenizer.isDone()) {
        var token = this.tokenizer.get();
        console.log('[' + token.line + ', ' + token.column + ']' + token.type + ' : ' + token.toString());
    }
}
