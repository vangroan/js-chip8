// src/chip8.js

'use strict';

var util = require('./util');

var MEMORY_SIZE = 0x1000;
/**
 * Starting memory address for programs
 * @type {number}
 */
var BEGIN = 0x0200;

var DATA_REGISTER_SIZE = 16;

var SCREEN_WIDTH = 64;
var SCREEN_HEIGHT = 32;

/**
 * @typedef {number} Nibble - 4bit number
 */

/**
 * @typedef {number} Byte - 8bit number
 */

/**
 *
 */
function getScheduler(func) {
    return setImmediate(func);
}

module.exports = function() {

    var onDoneCallback = function() {};

    /**
     * Used to abort interpreter early
     */
    var _programLength = 0;

    var pc = BEGIN;
    var op = 0x0;

    var mem = util.initArray([], MEMORY_SIZE, 0);

    /** 8bit Data Registers */
    var v = util.initArray([], DATA_REGISTER_SIZE, 0);

    /** Address regsiter */
    var I = 0;

    /** Stack pointer */
    var sp = 0;
    var stack = util.initArray([], 0xF, 0);

    var graphics = util.initArray(util.initArray([], SCREEN_HEIGHT, 0), SCREEN_WIDTH, 0);

    var running = false;

    var opCode = util.initArray([], 0xF, opNoOp);
    var opCodeArithmetic = util.initArray([], 0xF, opNoOp);

    opCode[0x1] = opJumpTo;
    opCode[0x2] = opCallSub;
    opCode[0x3] = opSkipVXeqNN;
    opCode[0x4] = opSkipVXneqNN;
    opCode[0x5] = opSkipVXeqVY;
    opCode[0x6] = opLoadVXNN;
    opCode[0x7] = opAddNNtoVX;
    opCode[0x8] = handleArithmetic;
    opCode[0xA] = opSetI;
    opCode[0xB] = opJmpV0;
    opCode[0xC] = opRnd;

    // 0x8**X
    opCodeArithmetic[0x0] = opLoadVYtoVX;
    opCodeArithmetic[0x1] = opSetVXtoVXorVY;
    opCodeArithmetic[0x2] = opSetVXtoVXandVY;
    opCodeArithmetic[0x3] = opSetVXtoVXxorVY;
    opCodeArithmetic[0x4] = opAddVYtoVXCarry;
    opCodeArithmetic[0x5] = opSubVYfromVXBorrow;
    opCodeArithmetic[0x6] = opShiftVXRight;

    // ========
    // Op Codes
    // ========

    /**
     * Jump to address NNN
     * 0x1NNN
     */
    function opJumpTo() {
        pc = op & 0x0FFF;
    }

    /**
     * Call subroutine at NNN
     * 0x2NNN
     */
    function opCallSub() {
        stack[sp] = pc;
        sp++;
        pc = op & 0x0FFF;
    }

    /**
     * Skip the next instruction if VX equals NN
     * 0x3XNN
     */
    function opSkipVXeqNN() {
        //console.log('Skip opcode');
        //console.log('V%d is %s', (op & 0x0F00) >> 8, v[(op & 0x0F00) >> 8].toString(16));
        //console.log('NN is %s', (op & 0x00FF).toString(16));
        //console.log('VX === NN : ' + (v[(op & 0x0F00) >> 8] === (op & 0x00FF)));
        if (v[(op & 0x0F00) >> 8] === (op & 0x00FF))
            pc += 2;
        pc += 2;
    }

    /**
     * Skip next instruction if VX equals NN
     * 0x4XNN
     */
    function opSkipVXneqNN() {
        if (v[(op & 0x0F00) >> 8] !== (op & 0x00FF))
            pc += 2;
        pc += 2;
    }

    /**
     * Skip next instructio if VX equals VY
     * 0x5XY0
     */
    function opSkipVXeqVY() {
        if (v[(op & 0x0F00) >> 8] === v[(op & 0x00F0) >> 4])
            pc += 2;
        pc += 2;
    }

    /**
     * Sets VX to NN
     * 0x6XNN
     */
    function opLoadVXNN() {
        v[(op & 0x0F00) >> 8] = op & 0x00FF;
        pc += 2;
    }

    /**
     * Add NN to VX
     * 0x7XNN
     */
    function opAddNNtoVX() {
        v[(op & 0x0F00) >> 8] += op & 0x00FF;
        pc += 2;
    }

    /**
     * Sets VX to the value of VY
     * 0x8XY0
     * @param {number} op
     */
    function opLoadVYtoVX() {
        v[(op & 0x0F00) >> 8] = v[(op & 0x00F0) >> 4];
        pc += 2;
    }

    /**
     * Set VX to VX OR VY
     * 0x8XY1
     */
    function opSetVXtoVXorVY() {
        v[(op & 0x0F00) >> 8] |= v[(op & 0x00F0) >> 4];
        pc += 2;
    }

    /**
     * Set VX to VX AND VY
     * 0x8XY2
     */
    function opSetVXtoVXandVY() {
        v[(op & 0x0F00) >> 8] &= v[(op & 0x00F0) >> 4];
        pc += 2;
    }

    /**
     * Set VX to VX XOR VY
     * 0x8XY3
     */
    function opSetVXtoVXxorVY() {
        v[(op & 0x0F00) >> 8] ^= v[(op & 0x00F0) >> 4];
        pc += 2;
    }

    /**
     * Add VY to VX. VF is set to 1 when there is a carry.
     * 0x8XY4
     */
    function opAddVYtoVXCarry() {
        var x = (op & 0x0F00) >> 8;
        var y = (op & 0x00F0) >> 4;
        var result = v[x] + v[y];

        v[0xF] = result > 0xFF ? 1 : 0;
        v[x] = result & 0xFF;

        pc += 2;
    }

    /**
     * Subtract VY from VX. VF is set to 1 when there is a borrow
     * 0x8XY5
     */
    function opSubVYfromVXBorrow() {
        var x = (op & 0x0F00) >> 8;
        var y = (op & 0x00F0) >> 4;
        v[0xF] = v[y] > v[x] ? 0 : 1;
        v[x] = (v[x] - v[y]) & 0xFF;

        pc += 2;
    }

    /**
     * Shift VX right by one. VF is set to least significant bit before shift
     * 0x8XY6
     */
    function opShiftVXRight() {
        var x = (op & 0x0F00) >> 8;
        v[0xF] = v[x] & 0x01;
        v[x] >>= 1;
        pc += 2;
    }

    /**
     * 0x8XY7
     */

    /**
     * 0x8XYE
     */

     /**
      * Sets I to NNN
      * 0xANNN
      */
     function opSetI() {
         I = op & 0x0FFF;
         pc += 2;
     }

    /**
     * Jump to address NNN plus V0
     * 0xBNNN
     */
    function opJmpV0() {
        pc = (op & 0x0FFF) + v[0];
    }

    /**
     * Set VX to a random number and mask it by doing AND with NN
     * 0xCXNN
     */
    function opRnd() {
        v[(op & 0x0F00) >> 8] = Math.random() & (op & 0x00FF);
        pc += 2;
    }

    /**
     * Draw sprite located at I on screen at coordinate (VX, VY). N is the number of bytes
     * to read from memory. The pixels are contained in the bits and XORed to the screen.
     * If pixels are erased, VF is set to 1, otherwise 0
     * 0xDXYN
     */
    function opDraw() {

        var n = op & 0x000F;
        var coordx = (op & 0x0F00) >> 8;
        var coordy = (op & 0x00F0) >> 4;
        var y = coordy;

        for (var i = 0; i < n; i++) {
            var s = mem[I + i];

            for (var x = 0; x < 8; x++) {

                pixel = (s >> x) & 0x1;
                var tx = (coordx + x) % SCREEN_WIDTH;
                var ty = (coordy + y) % SCREEN_HEIGHT;

                if (pixel ^ graphics[tx][ty] === 1)
                    v[0xF] = 1;
                else
                    v[0xF] = 0;

                graphics[tx][ty] ^= pixel;
            }

            y++;
        }

        pc +=2;
    }

    /**
     * Do nothing
     */
    function opNoOp() {
        pc += 2;
    }

    function handleArithmetic() {
        opCodeArithmetic[op & 0x000F]();
    }

    function loadProgram(program, startIndex) {

        startIndex = typeof startIndex === 'undefined' ? BEGIN : startIndex;

        for (var i = 0; i < program.length; i++) {
            mem[startIndex + i] = program[i];
        }
        _programLength = program.length;
    }

    function reset() {
        _programLength = 0;
        pc = BEGIN;
        op = 0x0;
        util.initArray(mem, MEMORY_SIZE, 0);
        util.initArray(v, DATA_REGISTER_SIZE, 0)
        I = 0x000;
        sp = 0x0;
        util.initArray(stack, 0xF, 0);
    }

    function _run() {

        // Get op code
        op = (mem[pc] << 8) | mem[pc + 1];

        // Dispatch to function
        opCode[(op & 0xF000) >> 12]();

        if (pc >= MEMORY_SIZE) {
            running = false;
        }

        if (running) {
            getScheduler(_run);
        } else {
            onDoneCallback(null);
        }
    }

    function step() {
        _run();
    }

    /**
     * @param {Array<number>} program - program bytes
     * @param {function} callback - Called when interpreter is done
     */
    function run(program, callback) {

        onDoneCallback = callback;
        running = true;

        reset();
        loadProgram(program, BEGIN);

        //console.log((((mem[pc] << 8) | mem[pc + 1]) & 0xF000) >> 12);
        getScheduler(_run);

    }

    return {

        getCurrentOp: function() {
            return op;
        },

        getStartMemoryAddress: function() {
            return BEGIN
        },

        dumpMemory: function() {
            return mem;
        },

        getProgramCounter: function() {
            return pc;
        },

        getMemoryAt: function(address) {
            return mem[address];
        },

        getStack: function() {
            return stack;
        },

        getStackPointer: function() {
            return sp;
        },

        getDataRegister: function(index) {
            index = index || 0;
            if (index < 0 || index >= DATA_REGISTER_SIZE) throw new Error('Register index out of range');
            return v[index];
        },

        getDataRegisters: function() {
            return v.slice();
        },

        getAddressRegister: function() {
            return I;
        },

        isRunning: function() {
            return running;
        },

        loadProgram: loadProgram,

        step: step,

        reset: reset,

        run: run
    };

};
