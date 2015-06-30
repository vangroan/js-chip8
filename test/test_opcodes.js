var test = require('unit.js');
var chip8 = require('../src/chip8');

describe('Chip8 OpCode', function() {

    var c = chip8();

    describe('1NNN', function(){

        it('should set program counter to jump address', function(){
            var program = [
                0x13, 0x24 // 0x2324 : Jump to 0x324
            ];
            c.loadProgram(program);
            c.step();

            test.value(c.getProgramCounter() & 0x0FFF).isEqualTo(0x324);

            c.reset();
        });

    });

    describe('2NNN', function() {

        before(function(){
            var program = [
                0x22, 0x05 // 0x2205 : Call Subroutine at 0x205
            ];
            c.loadProgram(program);
            c.step();
        });

        after(function(){
            c.reset();
        });

        it('should push the current program counter value to the stack', function() {
            test.value(c.getStack()[0]).isEqualTo(c.getStartMemoryAddress());
        });

        it('should increase the stack pointer', function(){
            // Check if stack pointer is incremented
            test.value(c.getStackPointer()).isEqualTo(1);
        });

        it('should jump to the address in the subroutine call', function(){
            test.value(c.getProgramCounter()).isEqualTo(0x205);
        });

    });

    describe('3XNN', function() {

        it('should skip the next instruction since V1 equals 9', function(){

            var program = [
                0x61, 0x09, // 0x6109 : Load 0x09 into V1
                0x31, 0x09, // 0x3109 : Skip next if V1 equals 09
                0x62, 0x03, // Junk. If test fails, then V2 will be 3
                0x62, 0x01, // 0x6101 : Load 0x01 into V2
                0x62, 0x02 // 0x6102 : Load 0x02 into V2 // If interpreter runs off, then V2 will be 2
            ];
            c.loadProgram(program);
            c.step();
            c.step();
            c.step();

            test.value(c.getDataRegister(2)).isEqualTo(0x01);

            c.reset();
        });

        it('should not skip the next instruction since V1 does not equal 9', function(){

            var program = [
                0x61, 0x08, // 0x6108 : Load 0x09 into V1
                0x31, 0x09, // 0x3109 : Skip next if V1 equals 09
                0x62, 0x03, // 0x6103 : Load 0x03 into V2
                0x62, 0x01 // 0x6101 : Load 0x01 into V2
            ];
            c.loadProgram(program);
            c.step();
            c.step();
            c.step();

            test.value(c.getDataRegister(2)).isEqualTo(0x03);

            c.reset();

        });

    });

    describe('4XNN', function(){

        it('should skip the next instruction since V1 equals 7, and not 8', function(){
            var program = [
                0x61, 0x07, // 0x6107 : Load 7 into V1
                0x41, 0x08, // 0x4108 : Skip next instruction if V1 not equal to 8
                0x62, 0x03, // 0x6203 : Load 3 into V2
                0x62, 0x05, // 0x6205 : Load 5 into V2
                0x62, 0x07 // 0x6207 : Load 7 into V2 // Interpreter ran off
            ];
            c.loadProgram(program);
            c.step(); // Load V1
            c.step(); // Skip
            c.step(); // Load V2

            test.value(c.getDataRegister(2)).isEqualTo(0x05);

            c.reset();
        });

    });

    describe('5XY0', function(){

        it('should skip the next instruction since V0 equals V1', function(){
            var program = [
                0x60, 0x04, // 0x6004 : Load 4 into V0
                0x61, 0x04, // 0x6104 : Load 4 into V1
                0x50, 0x10, // 0x5010 : Skip next instruction if V0 equals V1
                0x63, 0x03, // 0x6303 : Load 3 into V3 // Test fail
                0x63, 0x02, // 0x6302 : Load 2 into V3 // Test Success
                0x63, 0x01, // 0x6301 : Load 1 into V3 // Test fail
            ];
            c.loadProgram(program);
            c.step(); // Load V0
            c.step(); // Load V1
            c.step(); // Skip
            c.step(); // Load V3

            test.value(c.getDataRegister(3)).isEqualTo(2);

            c.reset();
        });

    });

    describe('6XNN', function(){
        it('should load value 9 into register V6', function(){
            var program = [
                0x66, 0x09 // 0x6609 : Load 9 into V6
            ];
            c.loadProgram(program);
            c.step();

            test.value(c.getDataRegister(6)).isEqualTo(9);

            c.reset();
        });
    });

    describe('7XNN', function(){

        it('should add 4 to value of V1, 3, resulting in 7', function(){
            var program = [
                0x61, 0x03, // 0x6103 : Load 3 into V1
                0x71, 0x04 // 0x7104 : Add 4 to V1
            ];
            c.loadProgram(program);
            c.step();
            c.step();

            test.value(c.getDataRegister(1)).isEqualTo(0x07);

            c.reset();

        });

    });

    describe('8XY0', function(){

        it('should set V2 to the value of V6, which is 9', function(){
            var program = [
                0x62, 0x03, // 0x6203 : Load 3 into V2
                0x66, 0x09, // 0x6609 : Load 9 into V6
                0x82, 0x60 // 0x8260 : Load V6 into V2
            ];
            c.loadProgram(program);
            c.step();
            c.step();
            c.step();

            test.value(c.getDataRegister(2)).isEqualTo(9);

            c.reset();
        });

    });

    describe('8XY1', function(){

        it('should OR V1 (9) with V2 (3) and set V1 to the result (11)', function(){
            var program = [
                0x61, 0x09, // 0x6109 : Load 9 into V1
                0x62, 0x03, // 0x6303 : Load 3 into V2
                0x81, 0x21 // 0x8121 : V1 OR V2
            ];
            c.loadProgram(program);
            c.step();
            c.step();
            c.step();

            test.value(c.getDataRegister(1)).isEqualTo(11);

            c.reset();
        });

    });

    describe('8XY2', function(){

        it('should AND V1 (9) with V2 (3) and set V1 to the result (1)', function(){
            var program = [
                0x61, 0x09, // 0x6109 : Load 9 into V1
                0x62, 0x03, // 0x6303 : Load 3 into V2
                0x81, 0x22 // 0x8121 : V1 AND V2
            ];
            c.loadProgram(program);
            c.step();
            c.step();
            c.step();

            test.value(c.getDataRegister(1)).isEqualTo(1);

            c.reset();
        });

    });

    describe('8XY3', function(){

        it('should XOR V1 (9) with V2 (3) and set V1 to the result (10)', function(){
            var program = [
                0x61, 0x09, // 0x6109 : Load 9 into V1
                0x62, 0x03, // 0x6303 : Load 3 into V2
                0x81, 0x23 // 0x8121 : V1 AND V2
            ];
            c.loadProgram(program);
            c.step();
            c.step();
            c.step();

            test.value(c.getDataRegister(1)).isEqualTo(10);

            c.reset();
        });

    });

    describe('8XY4', function(){

        before(function(){
            var program = [
                0x60, 0xFF, // 0x60FF : Load 0xFF into V0
                0x61, 0x10, // 0x6110 : Load 0x10 into V1
                0x80, 0x14 // 0x8014 : Add V1 to V0
            ];
            c.loadProgram(program);
            c.step();
            c.step();
            c.step();
        });

        after(function(){
            c.reset();
        });

        it('should add 15 to 255 and result in the remainer 15', function(){
            test.value(c.getDataRegister(0)).isEqualTo(0xF);
        });

        it('should set the carry', function(){
            test.value(c.getDataRegister(0xF)).isEqualTo(1);
        });

    });

    describe('8XY5', function(){

        describe('subtracting large from small', function(){
            before(function(){
                var program = [
                    0x60, 0x28, // 0x6028 : Load 40 into V0
                    0x61, 0x82, // 0x6182 : Load 130 into V1
                    0x80, 0x15 // 0x8015 : Subtract V1 from V0
                ];
                c.loadProgram(program);
                c.step();
                c.step();
                c.step();
            });

            after(function(){
                c.reset();
            });

            it('should subtract 130 from 40 to wrap around to 166, set borrow to 0', function(){
                test.value(c.getDataRegister(0)).isEqualTo(0xA6);
            });

            it('borrow register must be 0', function(){
                test.value(c.getDataRegister(0xF)).isEqualTo(0);
            });
        });

    });

    describe('8XY6', function(){

        before(function(){
            var program = [
                0x60, 0x0B, // 0x600B : Load 11 into V0
                0x80, 0x06 // 0x8006 : Shift V0 right by one
            ];
            c.loadProgram(program);
            c.step();
            c.step();
        });

        after(function(){
            c.reset();
        });

        it('should shift 11 right to get 5', function(){
            test.value(c.getDataRegister(0)).isEqualTo(0x05);
        });

        it('should set VF to 1', function(){
            test.value(c.getDataRegister(0xF)).isEqualTo(1);
        });

    });

    describe('8XY7', function(){

    });

    describe('ANNN', function(){
        it('should set register I to 0x300', function(){
            var program = [
                0xA3, 0x00 // 0xA300 : set I to 0x300
            ];
            c.loadProgram(program);
            c.step();

            test.value(c.getAddressRegister()).isEqualTo(0x300);

            c.reset();
        });
    });

    describe('BNNN', function(){
        it('should jump to address 0x300 + 0xF', function(){
            var program = [
                0x60, 0x0F, // 0x600F : Load 0xF into V0
                0xB3, 0x00 // 0xB300 : Jump to 0x300 + V0
            ];
            c.loadProgram(program);
            c.step();
            c.step();

            test.value(c.getProgramCounter()).isEqualTo(0x030F);

            c.reset();
        });
    });

});
