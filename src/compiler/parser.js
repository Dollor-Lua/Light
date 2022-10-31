import {
    StringNode,
    CharNode,
    MemNode,
    FloatNode,
    IntNode,
    BinOpNode,
    UnaryOpNode,
    IdentifierNode,
    CallNode,
    VarNode,
    AssignmentNode,
    BlockNode,
    IfNode,
    WhileNode,
    ArgNode,
    FunctionNode,
    ReturnNode,
} from "./AST.js";
import { TT, Token } from "../token.js";
import { logError, logFatal } from "../logger.js";
import { LightError, SyntaxError } from "../error.js";

function parse(lexed) {
    var result = [];

    var current = 0;
    var current_token = lexed[current];

    function next(reason = "unknown") {
        current++;
        if (current < lexed.length) current_token = lexed[current];
        return current_token;
    }

    function getnext() {
        if (current + 1 < lexed.length) return lexed[current + 1];
        return false;
    }

    function genBinOpNode(func, operators) {
        var left = func();

        while (operators.includes(current_token.type)) {
            const operator = current_token;
            next("BIN OP");
            const right = func();
            // TODO: Finish adding arithmetic optimization
            if (
                ["IntNode", "FloatNode"].includes(left.constructor.name) &&
                ["IntNode", "FloatNode"].includes(right.constructor.name)
            ) {
                var prevleft = left;
                if (operator.type == TT.TT_PLUS)
                    left = new IntNode(new Token((left.value.value + right.value.value) >> 0), TT.TT_INT);
                else if (operator.type == TT.TT_MINUS)
                    left = new IntNode(new Token((left.value.value - right.value.value) >> 0), TT.TT_INT);
                else if (operator.type == TT.TT_MUL)
                    left = new IntNode(new Token((left.value.value * right.value.value) >> 0), TT.TT_INT);
                else if (operator.type == TT.TT_DIV)
                    left = new IntNode(new Token((left.value.value / right.value.value) >> 0), TT.TT_INT);
                else if (operator.type == TT.TT_MOD)
                    left = new IntNode(new Token(left.value.value % right.value.value >> 0), TT.TT_INT);
                if (left != prevleft) continue;
            }

            left = new BinOpNode(left, right, operator);
        }

        return left;
    }

    function value() {
        const token = current_token;

        if ([TT.TT_MINUS].includes(token.type)) {
            next("value() - unary");
            const right = value();
            return new UnaryOpNode(token, right);
        } else if (token.type == TT.TT_FLOAT) {
            next("value() - float");
            return new FloatNode(token);
        } else if (token.type == TT.TT_INT) {
            next("value() - int");
            return new IntNode(token);
        } else if (token.type == TT.TT_CHAR) {
            next("value() - char");
            return new CharNode(token);
        } else if (token.type == TT.TT_STRING) {
            next("value() - str");
            return new StringNode(token);
        } else if (token.type == TT.TT_IDENTIFIER) {
            next("value() - identifier");
            if (token.value == "mem") return new MemNode(token);

            if (current_token.type == TT.TT_EQU) {
                next("value() - assignment");
                const expr = var_expr();
                return new AssignmentNode(new IdentifierNode(token), expr);
            } else if (current_token.type == TT.TT_DUBPLUS || current_token.type == TT.TT_DUBMIN) {
                const ctok = current_token;
                next("value() - DOUBLE +/-");
                return new BinOpNode(new IdentifierNode(token), null, ctok);
            }

            return new IdentifierNode(token);
        } else if (token.type == TT.TT_LPAREN) {
            next("value() - lparen");
            const expr = expression();
            if (current_token.type == TT.TT_RPAREN) {
                next();
                return expr;
            } else {
                logError(
                    new SyntaxError(
                        `Got '${current_token.value}', expected ')'`,
                        current_token.file,
                        current_token.line,
                        current_token.start,
                        current_token.end
                    )
                );
                // invalid syntax error
            }
        } else if (token.matches(TT.TT_KEYWORD, "if")) {
            const ifexpr = ifExpression();
            return ifexpr;
        } else if (token.matches(TT.TT_KEYWORD, "while")) {
            const whileExpr = whileExpression();
            return whileExpr;
        } else if (token.type == TT.TT_LBRACE) {
            next("value() - lbrace");

            const exprs = [];
            while (current_token.type != TT.TT_RBRACE) {
                const expr = var_expr();
                exprs.push(expr);
            }

            next("value() - rbrace");

            return new BlockNode(exprs);
        }

        logFatal(
            `Unknown token type: ${current_token.type} / '${current_token.value}'`,
            current_token.file,
            current_token.line,
            current_token.start
        );
    }

    function whileExpression() {
        if (!current_token.matches(TT.TT_KEYWORD, "while"))
            logError(
                new SyntaxError(
                    `Got ${current_token.value}, expected 'while'`,
                    current_token.file,
                    current_token.line,
                    current_token.start,
                    current_token.end
                )
            );
        next("while-expr_1");

        const condition = expression();
        const executes = expression();

        return new WhileNode(condition, executes);
    }

    function ifExpression() {
        const cases = [];
        var elz = null;

        if (!current_token.matches(TT.TT_KEYWORD, "if"))
            logError(
                new SyntaxError(
                    `Got ${current_token.value}, expected 'if'`,
                    current_token.file,
                    current_token.line,
                    current_token.start,
                    current_token.end
                )
            );

        next("if-expr_1");

        var condition = expression();
        var execution = expression();

        cases.push([condition, execution]);

        while (current_token.matches(TT.TT_KEYWORD, "elseif")) {
            next("elseif-expr_1");

            condition = expression();
            execution = expression();

            cases.push([condition, execution]);
        }

        if (current_token.matches(TT.TT_KEYWORD, "else")) {
            next("else-expr_1");
            elz = expression();
        }

        return new IfNode(cases, elz);
    }

    function call() {
        if (current_token.type == TT.TT_IDENTIFIER && getnext().type == TT.TT_LPAREN) {
            const v = value();
            if (current_token.type == TT.TT_LPAREN) {
                next();
                var start = current_token.type != TT.TT_RPAREN;

                const expressions = [];

                while (current_token.type == TT.TT_COMMA || start) {
                    if (!start) next();
                    start = false;
                    expressions.push(expression());
                }

                if (current_token.type !== TT.TT_RPAREN)
                    logError(
                        new SyntaxError(
                            `Got ${current_token.value}, expected ')'`,
                            current_token.file,
                            current_token.line,
                            current_token.start,
                            current_token.end
                        )
                    );

                next();

                return new CallNode(v, expressions);
            }
        }

        return value();
    }

    function factor() {
        return genBinOpNode(call, [TT.TT_PLUSEQU, TT.TT_MINEQU, TT.TT_MULEQU, TT.TT_DIVEQU, TT.TT_MODEQU]);
    }

    function term() {
        return genBinOpNode(factor, [TT.TT_MUL, TT.TT_DIV, TT.TT_MOD]);
    }

    function arithmetic() {
        return genBinOpNode(term, [TT.TT_PLUS, TT.TT_MINUS]);
    }

    //  arithmetic is part of expression, pulled apart to simplify.

    function expression() {
        return genBinOpNode(arithmetic, [TT.TT_LTHAN, TT.TT_GTHAN, TT.TT_LEQU, TT.TT_GEQU, TT.TT_EQUTO, TT.TT_NOTEQU]);
    }

    function ret_expr() {
        if (current_token.type == TT.TT_KEYWORD && current_token.value == "return") {
            next("ret-expr");
            return new ReturnNode(expression());
        }

        return expression();
    }

    function var_expr() {
        const type = current_token;
        if (type.type == TT.TT_TYPE) {
            next();
            const ident = current_token;
            if (ident.type == TT.TT_IDENTIFIER) {
                next();
                if (current_token.type == TT.TT_EQU) {
                    next();
                    return new VarNode(type, new IdentifierNode(ident), expression());
                } else if (current_token.type == TT.TT_LPAREN) {
                    next();
                    var start = current_token.type != TT.TT_RPAREN;

                    const args = [];

                    while (current_token.type == TT.TT_COMMA || start) {
                        if (!start) next();
                        start = false;
                        if (current_token.type != TT.TT_TYPE)
                            logError(
                                new SyntaxError(
                                    `Got ${current_token.value}, expected type`,
                                    current_token.file,
                                    current_token.line,
                                    current_token.start,
                                    current_token.end
                                )
                            );
                        const toktype = current_token;
                        next();
                        if (current_token.type != TT.TT_IDENTIFIER)
                            logError(
                                new SyntaxError(
                                    `Got ${current_token.value}, expected identifier`,
                                    current_token.file,
                                    current_token.line,
                                    current_token.start,
                                    current_token.end
                                )
                            );
                        const arg = new ArgNode(toktype, new IdentifierNode(current_token));
                        args.push(arg);
                        next();
                    }

                    const ctok = current_token;
                    if (current_token.type != TT.TT_RPAREN)
                        logError(
                            new SyntaxError(
                                `Got ${current_token.value}, expected ')'`,
                                current_token.file,
                                current_token.line,
                                current_token.start,
                                current_token.end
                            )
                        );
                    next();
                    const contents = expression();
                    if (contents.constructor.name != "BlockNode")
                        logError(
                            new SyntaxError(
                                `Expected code block after function definition`,
                                ctok.file,
                                ctok.line,
                                ctok.start,
                                ctok.end
                            )
                        );
                    return new FunctionNode(ident.value, args, contents, type);
                }
            }
        }

        return ret_expr();
    }

    function entry() {
        return var_expr();
    }

    while (current < lexed.length && current_token.type != TT.TT_EOF) {
        const res = entry();
        if (res !== undefined) result.push(res);
        //console.log(result);
    }

    return result;
}

export { parse };
