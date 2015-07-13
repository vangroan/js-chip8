// src/assembler/ast.js

'use strict';

var SyntaxNode = exports.SyntaxNode = function() {}

/**
 * @constructor
 */
var ProgramNode = exports.ProgramNode = function() {
    this.children = [];
}
ProgramNode.prototype = Object.create(SyntaxNode.prototype);
ProgramNode.constructor = ProgramNode;

/**
 * @param {SyntaxNode} node
 */
ProgramNode.prototype.addChild = function(node) {
    this.children.push(node);
}

/**
 * @constructor
 * @param {Token} token
 */
var LoadNode = exports.LoadNode = function(token) {

    this.token = token;

    /** @type {SyntaxNode} */
    this.left = null;

    /** @type {SyntaxNode} */
    this.right = null;
}
LoadNode.prototype = Object.create(SyntaxNode.prototype);
LoadNode.constructor = LoadNode;

/**
 * @param {SyntaxNode} node
 */
LoadNode.prototype.setLeft = function(node) {
    this.left = node;
}

/**
 * @param {SyntaxNode} node
 */
LoadNode.prototype.setRight = function(node) {
    this.right = node;
}

/**
 * @constructor
 * @param {Token} token
 */
var DataRegisterNode = exports.DataRegisterNode = function(token) {
    this.token = token;
}
DataRegisterNode.prototype = Object.create(SyntaxNode.prototype);
DataRegisterNode.constructor = LoadNode;

/**
 * @constructor
 * @param {Token} token
 */
var NumberLiteralNode = exports.NumberLiteralNode = function(token) {
    this.token = token;
}
NumberLiteralNode.prototype = Object.create(SyntaxNode.prototype);
NumberLiteralNode.constructor = LoadNode;
