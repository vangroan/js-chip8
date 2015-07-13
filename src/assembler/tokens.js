
exports.LINEBREAK = ['\n', '\r'];
exports.NEWLINE = ['\n'];
exports.WHITESPACE = [' ', '\t'];
exports.SINGLE_CHAR = ';#$,:.'.split('');
var LOWER_CHARACTERS = exports.LOWER_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
var UPPER_CHARACTERS = exports.UPPER_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
var LETTERS = exports.LETTERS = LOWER_CHARACTERS.concat(UPPER_CHARACTERS);
var NUMBERS = exports.NUMBERS = '012356789'.split('');

// Semantics
exports.COMMENT = [';'];
exports.IDENTIFIER_START = LETTERS.concat(['#']);
exports.IDENTIFIER_CONTAINS = LETTERS.concat(NUMBERS);
exports.NUMBER_LITERAL_START = NUMBERS;
exports.NUMBER_LITERAL_CONTAINS = NUMBERS.concat(['x']);

exports.TYPES = {
    IDENTIFIER : 'identifier',
    NUMBER : 'number',
    SINGLE_CHARACTER : 'character',
    COMMENT : 'comment',
    EOF : 'eof'
}
