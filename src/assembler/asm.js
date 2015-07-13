// src/assembler/asm.js

'use strict';

var ast = require('./ast');
var tokens = require('./tokens');
var opcodes = require('./opcodes');
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

    if (this.pos === this.src.length - 1)
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

Token.prototype.getCharAt = function(index) {
    return this._chars[index];
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
            scanChar();
            return token;
        }
    }

    // Single Characters
    if (contains(tokens.SINGLE_CHAR, this.c1.getChar())) {
        var token = new Token(tokens.TYPES.SINGLE_CHARACTER, this.c1.getPosition(), this.c1.getLine(), this.c1.getColumn());
        token.append(this.c1);
        scanChar();
        return token;
    }

    // IDENTIFIER_START
    if (contains(tokens.IDENTIFIER_START, this.c1.getChar())) {
        var token = new Token(tokens.TYPES.IDENTIFIER, this.c1.getPosition(), this.c1.getLine(), this.c1.getColumn());
        token.append(this.c1);
        scanChar();
        while(contains(tokens.IDENTIFIER_CONTAINS, this.c1.getChar()) && !isDone()) {
            token.append(this.c1);
            scanChar();
        }
        return token;
    }

    // Number literal
    if (contains(tokens.NUMBER_LITERAL_START, this.c1.getChar())) {
        var token = new Token(tokens.TYPES.NUMBER, this.c1.getPosition(), this.c1.getLine(), this.c1.getColumn());
        token.append(this.c1);
        scanChar();
        while(contains(tokens.NUMBER_LITERAL_CONTAINS, this.c1.getChar()) && !isDone()) {
            token.append(this.c1);
            scanChar();
        }
        return token;
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
var Parser = exports.Parser = function(tokenizer, options) {
    this.tokenizer = tokenizer;

    /** Store labels to be processed later */
    this._subRoutineMap = {};

    options = options || {};
    this.verbose = !!options['verbose'] || false;
    this.tokens = [];
    this.pt = 0;

    /** @type {Token} */
    this.token = null;

    this.root = new ast.ProgramNode();
}

Parser.prototype.readToken = function() {
    this.token = this.tokens[this.pt];
    this.pt++;
}

Parser.prototype.isDone = function() {
    return (this.tokens.length - 1) === this.pt || typeof this.token === 'undefined';
}

Parser.prototype._load = function() {

    var node = new ast.LoadNode(this.token);

    // Load must be followed by two tokens
    this.readToken();
    var left = this.token;

    this.readToken();
    var delim = this.token;

    this.readToken();
    var right = this.token;

    if (left.getCharAt(0).getChar().toUpperCase() === opcodes.DATA_REGISTER_PREFIX) {
        console.log('Load instruction');
        // If the left is a V register and the right is a number literal
        node.setLeft(new ast.DataRegisterNode(left));

        if (right.type === tokens.TYPES.NUMBER) {
            node.setRight(new ast.NumberLiteralNode(right));
            this.root.addChild(node);
            return;
        }

    }


}

Parser.prototype._keyword = function() {
    switch(this.token.toString().toUpperCase()) {
        case opcodes.OPCODES.LD:
            this._load();
        break;

        default:
            throw Error('Unknown keyword ' + this.token.toString());
    }
}

Parser.prototype.statement = function() {

    if (typeof this.token === 'undefined' || this.token === null)
        throw Error('Token has not been read');

    // Comments are ignored
    if (this.token.type === tokens.TYPES.COMMENT) {
        this.readToken();
        return;
    }

    if (contains(opcodes.KEYWORDS, this.token.toString().toUpperCase())) {
        this._keyword();
    }

    this.readToken();
}

Parser.prototype.parse = function() {

    // Initialize
    this.tokenizer.scanChar();

    while (!this.tokenizer.isDone()) {
        var token = this.tokenizer.get();
        console.log('[' + token.line + ':' + token.column + ']' + token.type + ' : ' + token.toString());
        this.tokens.push(token);
    }

    this.readToken();
    while(!this.isDone()) {
        this.statement();
    }

    console.log(this.root);

}

var Assembler = exports.Assembler = function() {

}
