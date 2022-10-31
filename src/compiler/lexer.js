import { Token, TT } from "../token.js";
import { SyntaxError } from "../error.js";

const keywords = ["if", "elseif", "else", "while", "return"];
const types = ["int", "char", "str", "bool", "float", "void"];

/**
 * Checks if the character provided is a number 0-9
 * @param {character | String} c character
 * @returns {Boolean}
 */
function isdigit(c) {
    return !isNaN(c - parseFloat(c));
}

/**
 * Checks if the character provided is a letter a-z & A-Z
 * @param {character | String} c character
 * @returns {Boolean}
 */
function isalpha(c) {
    // if c is a string and c is only one char and c is between a and z or between A and Z then return true
    return typeof c === "string" && c.length === 1 && ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z"));
}

/**
 * Checks if the character provided is alpha-numeric (a number or letter)
 * @param {character | String} c character
 * @returns {Boolean}
 */
function isalnum(c) {
    return isdigit(c) || isalpha(c);
}

/**
 * Splits the code into tokens
 * @param {String} source source code
 * @returns {Token[]} array of tokens
 */
function lex(source, file) {
    var result = [];
    var errors = [];
    var line = 0;

    var instr = false;
    var cstr = "";
    var strstart = -1;

    var column = 0;
    for (var i = 0; i < source.length; i++) {
        const current_char = source[i];
        column++;
        if (current_char == "\n") {
            if (instr)
                errors.push(new SyntaxError("Expected end of string, Got 'EOL'", file, line, column, column + 1));
            line++;
            column = 0;
            continue;
        }

        if (current_char == '"' || instr) {
            if (!instr) { strstart = i; cstr = ""; } // prettier-ignore

            cstr += current_char;

            if (current_char == '"' && instr) {
                instr = false;

                cstr = cstr.replace("\\n", "\n");
                cstr = cstr.replace("\\t", "\t");
                cstr = cstr.replace("\\r", "\r");
                cstr = cstr.replace("\\0", "\0");
                cstr = cstr.replace("\\\\", "\\");
                const tok = new Token(cstr.slice(1, -1) + "\0", TT.TT_STRING, line, strstart, i, file);
                result.push(tok);

                continue;
            }

            instr = true;
            continue;
        }

        if (" \t\r".includes(current_char)) continue;
        if (current_char == "'") {
            const start = i;
            var ch = source[i + 1];

            if (ch == "\\") {
                const nch = source[i + 2];
                if (source[i + 3] !== "'")
                    errors.push(
                        new SyntaxError("Multiple characters in char", file, line, column, column + 1, [
                            "define a string using double quotes ('\"')",
                        ])
                    );
                if (nch == "\\") ch = "\\";
                else if (nch == "n") ch = "\n";
                else if (nch == "r") ch = "\r";
                else if (nch == "t") ch = "\t";
                else ch = nch;
                i += 4;
            } else {
                if (source[i + 2] !== "'")
                    errors.push(
                        new SyntaxError("Multiple characters in char", file, line, column, column + 1, [
                            "define a string using double quotes ('\"')",
                        ])
                    );
                i += 3;
            }

            const tok = new Token(ch, TT.TT_CHAR, line, start, i, file);
            result.push(tok);
            i--;
            continue;
        } else if (isdigit(current_char)) {
            const start = i;
            var deci = false;
            while (isdigit(source[i]) || source[i] == "_") i++; // _ represents a comma/period, ex 1,000 (1.000 in europe)
            if (source[i] == ".") {
                i++;
                deci = true;
            } // check for a decimal place
            while (isdigit(source[i])) i++;
            const end = i;

            const number = source.substring(start, end).split("_").join(""); // remove underscores for parsing
            const tok = new Token(parseFloat(number), deci ? TT.TT_FLOAT : TT.TT_INT, line, start, end, file);
            result.push(tok);

            if (deci)
                errors.push(
                    new SyntaxError("Floating point arithmetic is not supported", file, line, start, end, [
                        "Support will come in the future",
                    ])
                );

            i--;
            continue;
        } else if (isalpha(current_char) || current_char == "_") {
            const start = i;
            while (isalnum(source[i]) || source[i] == "_") i++;
            const end = i;

            const str = source.substring(start, end);
            var type = TT.TT_IDENTIFIER;
            if (keywords.includes(str)) type = TT.TT_KEYWORD;
            if (types.includes(str)) type = TT.TT_TYPE;

            if (str == "true" || str == "false") {
                const tok = new Token(str == "true" ? 1 : 0, TT.TT_INT, line, start, end, file);
                result.push(tok);

                i--;
                continue;
            }

            const tok = new Token(str, type, line, start, end, file);
            result.push(tok);

            i--;
            continue;
        } else {
            if (current_char == "+") {
                if (source[i + 1] == "+") {
                    result.push(new Token("++", TT.TT_DUBPLUS, line, i, i + 1, file));
                    i++;
                } else if (source[i + 1] == "=") {
                    result.push(new Token("+=", TT.TT_PLUSEQU, line, i, i + 1, file));
                    i++;
                } else result.push(new Token("+", TT.TT_PLUS, line, i, i, file));
            } else if (current_char == "-") {
                if (source[i + 1] == "-") {
                    result.push(new Token("--", TT.TT_DUBMIN, line, i, i + 1, file));
                    i++;
                } else if (source[i + 1] == "=") {
                    result.push(new Token("-=", TT.TT_MINEQU, line, i, i + 1, file));
                    i++;
                } else result.push(new Token("-", TT.TT_MINUS, line, i, i, file));
            } else if (current_char == "*") {
                if (source[i + 1] == "=") {
                    result.push(new Token("*=", TT.TT_MULEQU, line, i, i + 1, file));
                    i++;
                } else result.push(new Token("*", TT.TT_MUL, line, i, i, file));
            } else if (current_char == "/") {
                if (source[i + 1] == "=") {
                    result.push(new Token("/=", TT.TT_DIVEQU, line, i, i + 1, file));
                    i++;
                } else result.push(new Token("/", TT.TT_DIV, line, i, i, file));
            } else if (current_char == "%") {
                if (source[i + 1] == "=") {
                    result.push(new Token("%=", TT.TT_MODEQU, line, i, i + 1, file));
                    i++;
                } else result.push(new Token("%", TT.TT_MOD, line, i, i, file));
            } else if (current_char == "(") result.push(new Token("(", TT.TT_LPAREN, line, i, i, file));
            else if (current_char == ")") result.push(new Token(")", TT.TT_RPAREN, line, i, i, file));
            else if (current_char == "{") result.push(new Token("{", TT.TT_LBRACE, line, i, i, file));
            else if (current_char == "}") result.push(new Token("}", TT.TT_RBRACE, line, i, i, file));
            else if (current_char == ",") result.push(new Token(",", TT.TT_COMMA, line, i, i, file));
            else if (current_char == "=") {
                if (source[i + 1] == "=") {
                    result.push(new Token("==", TT.TT_EQUTO, line, i, i + 1, file));
                    i++;
                } else result.push(new Token("=", TT.TT_EQU, line, i, i, file));
            } else if (current_char == "<") {
                if (source[i + 1] == "=") {
                    result.push(new Token("<=", TT.TT_LEQU, line, i, i + 1, file));
                    i++;
                } else result.push(new Token("<", TT.TT_LTHAN, line, i, i, file));
            } else if (current_char == ">") {
                if (source[i + 1] == "=") {
                    result.push(new Token(">=", TT.TT_GEQU, line, i, i + 1, file));
                    i++;
                } else result.push(new Token(">", TT.TT_GTHAN, line, i, i, file));
            } else if (current_char == "!" && source[i + 1] == "=") {
                result.push(new Token("!=", TT.TT_NOTEQU, line, i, i, file));
                i++;
            } else console.log(`UNKNOWN CHAR/SYMBOL '${current_char}'`);
        }
    }

    result.push(new Token("\0", TT.TT_EOF, line));
    return [result, errors];
}

export { lex };
