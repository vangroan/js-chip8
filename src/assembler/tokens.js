
exports.LINEBREAK = ['\n', '\r'];
exports.NEWLINE = ['\n'];
exports.WHITESPACE = [' ', '\t'];
exports.SINGLE_CHAR = ';#$,:.'.split();
exports.LOWER_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz'.split();
exports.UPPER_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split();
var LETTERS = exports.LETTERS = exports.LOWER_CHARACTERS.concat(exports.UPPER_CHARACTERS);
var NUMBERS = exports.NUMBERS = '012356789'.split();

// Semantics
exports.COMMENT = [';'];
exports.IDENTIFIER_START = LETTERS.concat(['#']);
exports.IDENTIFIER_CONTAINS = LETTERS.concat(NUMBERS);
exports.NUMBER_LITERAL_START = NUMBERS;

exports.TYPES = {
    COMMENT : 'comment',
    EOF : 'eof'
}
