import { enumerate } from "./enumerate.js";

const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");

/**
 *
 * @param {Dictionary} dict dictionary
 * @returns A dictionary where the values point towards the keys instead.
 */
function reverseDictionary(dict) {
    var newDict = {};
    for (const [key, value] of Object.entries(dict)) {
        newDict[value] = key;
    }

    return newDict;
}

// TT = TokenType
var TT = {
    TT_UNKNOWN: enumerate(true), // 0
    TT_INT: enumerate(), // 1
    TT_FLOAT: enumerate(), // 2
    TT_STRING: enumerate(), // 3
    TT_CHAR: enumerate(), // 4
    TT_PLUS: enumerate(), // 5
    TT_MINUS: enumerate(), // 6
    TT_MUL: enumerate(), // 7
    TT_DIV: enumerate(), // 8
    TT_MOD: enumerate(), // 9
    TT_EQU: enumerate(), // 10
    TT_LPAREN: enumerate(), // 11
    TT_RPAREN: enumerate(), // 12
    TT_LBRACE: enumerate(), // 13
    TT_RBRACE: enumerate(), // 14
    TT_COMMA: enumerate(), // 15
    TT_LTHAN: enumerate(), // 16
    TT_GTHAN: enumerate(), // 17
    TT_LEQU: enumerate(), // 18
    TT_GEQU: enumerate(), // 19
    TT_EQUTO: enumerate(), // 20
    TT_NOTEQU: enumerate(), // 21

    TT_PLUSEQU: enumerate(), // 22
    TT_MINEQU: enumerate(), // 23
    TT_DIVEQU: enumerate(), // 24
    TT_MULEQU: enumerate(), // 25
    TT_MODEQU: enumerate(), // 26

    TT_DUBPLUS: enumerate(), // 27
    TT_DUBMIN: enumerate(), // 28

    TT_KEYWORD: enumerate(), // 29
    TT_TYPE: enumerate(), // 30
    TT_IDENTIFIER: enumerate(), // 31

    TT_EOF: enumerate(), // 32
};

// TTI = TokenType (inverse)
var TTI = reverseDictionary(TT);

class Token {
    value = null;
    type = TT.TT_UNKNOWN;
    line = 0;
    start = 0;
    end = 0;

    /**
     *
     * @param {any} value
     * @param {TokenType} type TT.*
     * @param {Number} line line number
     * @param {Number} start column position start
     * @param {Number} end column position end
     */
    constructor(value, type, line = 0, start = 0, end = 0, file = "unknown") {
        this.value = value;
        this.type = type;
        this.line = line;
        this.start = start;
        this.end = end;
        this.file = file;
    }

    /**
     *
     * @returns {String} String that represents this token (by type and value)
     */
    repr() {
        return `[${this.type}: ${this.value}]`;
    }

    /**
     * returns true if both the type and the value of this token matches the arguments.
     * @param {TokenType} ttype TT.*, the token type
     * @param {any} value the value to match
     * @returns {Boolean} Boolean
     */
    matches(ttype, value) {
        return this.type == ttype && this.value == value;
    }

    [customInspectSymbol](depth, opts) {
        return `TOK[${this.type}:'${this.value}' / ${this.line}:${this.start}-${this.end}]`;
    }
}

const TOK = {
    PLUS: new Token("+", TT.TT_PLUS),
    MINUS: new Token("-", TT.TT_MINUS),
    MUL: new Token("*", TT.TT_MUL),
    DIV: new Token("/", TT.TT_DIV),
    MOD: new Token("%", TT.TT_MOD),
    ONE: new Token(1, TT.TT_INT),
};

export { Token, TT, TTI, TOK };
