
var test = require('unit.js');
var chip8 = require('../src/chip8');

describe('Chip8 Interpreter', function(){

    it('should load program into memory when running', function(done){

        var program = [0x80];
        var c = chip8();
        var begin = c.getStartMemoryAddress();

        c.run(program, function() {
            test.value(c.getMemoryAt(begin)).isEqualTo(0x80);
            done();
        });
    });

    it('should load program into memory via interface', function(){

        var program = [0x80];
        var c = chip8();
        var begin = c.getStartMemoryAddress();

        c.loadProgram(program);

        test.value(c.getMemoryAt(begin)).isEqualTo(0x80);;
    });

    it('should step through program when not running', function(){

        var program = [
            0x60, 0x01, // Load 0x01 into V0
            0x60, 0x02, // Load 0x02 into V0
            0x60, 0x03, // Load 0x03 into V0
            0x60, 0x04, // Load 0x04 into V0
        ];
        var c = chip8();
        c.reset();
        c.loadProgram(program, c.getStartMemoryAddress());

        c.step();
        c.step();
        c.step();
        c.step();

        test.value(c.getCurrentOp() & 0x000F).isEqualTo(4);

    });

});
