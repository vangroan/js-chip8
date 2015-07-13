
var argv = require('minimist')(process.argv.slice(2));
var asm = require('./asm');
var fs = require('fs');

(function main(){

    var infile = argv._[0] || '';
    var outfile = argv._[1] || infile.replace('.asm', '.ch8');
    var buffer = fs.readFileSync(infile);
    var verbose = !!argv.verbose || false;

    var scanner = new asm.Scanner();
    var tokenizer = new asm.Tokenizer(scanner, { verbose : verbose });
    var parser = new asm.Parser(tokenizer);

    scanner.setSource(buffer.toString());
    parser.parse();

})();
