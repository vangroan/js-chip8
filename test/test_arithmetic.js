
var test = require('unit.js');
var chip8 = require('../src/chip8');

describe('Chip8 Arithmetic', function(){

    it('should add 3 to 9 to get 12', function(done){

        var program = [
            0x60, 0x03, // 0x6003 : Load 0x03 into V0
            0x70, 0x09 // 0x7009 : Add 0x09 to V0
        ];
        var c = chip8();
        c.run(program, function(err){
            if (err) test.fail(err);
            test.value(c.getDataRegister(0)).isEqualTo(12);
            done();
        });
    });

});
