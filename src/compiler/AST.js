const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");
import { Compiler } from "../writer.js";
import { TTI, TT, TOK } from "../token.js";
import { logError } from "../logger.js";
import { LightError } from "../error.js";

class ASTNode {
    evaluate() {
        return false;
    }

    repr() {
        return "UNKNOWN";
    }

    compile(writer) {
        writer.write(";; UNKNOWN ASTNode");
        return ["unknown", null];
    }

    interpret() {
        return 0;
    }

    asfree() {
        return `ASTNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class IntNode extends ASTNode {
    value = null;
    type = "int";

    constructor(number) {
        super();
        this.value = number;
    }

    compile(writer) {
        writer.write(`push ${this.value.value}`);
    }

    repr() {
        return `${this.value.value}`;
    }

    asfree() {
        return `IntNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class FloatNode extends ASTNode {
    value = null;
    type = "float";

    constructor(number) {
        super();
        this.value = number;
    }

    compile(writer) {
        writer.setEndfixed(true);
        var lc = writer.getFloatLC(this.value.value);
        if (!lc) lc = writer.lc();
        writer.pushFloatLC(lc, this.value.value);
        writer.write(`dd ${this.value.value}`);
        writer.setEndfixed(false);

        writer.write(`push ${lc}`);
    }

    repr() {
        return `${this.value.value}`;
    }

    asfree() {
        return `FloatNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class CharNode extends ASTNode {
    value = null;
    type = "char";

    constructor(val) {
        super();
        this.value = val;
    }

    compile(writer) {
        writer.write(`push ${this.value.value.charCodeAt(0)}`);
        return ["char", null];
    }

    repr() {
        return `${this.value.value.charCodeAt(0)}`;
    }

    asfree() {
        return `CharNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class StringNode extends ASTNode {
    value = null;
    type = "str";

    constructor(val) {
        super();
        this.value = val;
    }

    charCompile(writer) {
        for (var i = 0; i < this.value.value.length; i++) writer.write(`push ${this.value.value.charCodeAt(i)}`);
        return ["strchar", null];
    }

    compile(writer) {
        return this.charCompile(writer);
    }

    getchars() {
        return this.value.value;
    }

    repr() {
        return this.value.value;
    }

    asfree() {
        return `StringNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class MemNode extends ASTNode {
    type = "int";
    value = null;

    constructor(number) {
        super();
        this.value = number;
    }

    compile(writer) {
        writer.write(`push mem`);
        return ["mem", null];
    }

    repr() {
        return `mem`;
    }

    asfree() {
        return `MemNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class IdentifierNode extends ASTNode {
    value = null;
    type = null;

    constructor(tok, type = null) {
        super();
        this.value = tok;
        this.type = type;
    }

    compile(writer, val = false) {
        if (writer.varExists(this.read())) {
            if (!!val == true) {
                writer.write(`mov rax, ${writer.getVarRBP(this.read())}`);
                writer.write(`push rax`);
                return;
            }
            writer.write(`push mem+${writer.getVarRBP(this.read(), true)}`);
            return;
        }

        throw logError(
            new LightError(
                "Cannot compile an identifier node",
                this.value.file,
                this.value.line,
                this.value.start,
                this.value.end,
                ["HOW?? How did you even do this??"]
            )
        );

        return ["unknown", null];
    }

    read() {
        return this.value.value;
    }

    repr() {
        return `${this.value.value}`;
    }

    asfree() {
        return `IdentifierNode: ${this.repr()}`;
    }

    popoverride(writer, addr, offset = null) {
        if (offset !== null) {
            writer.write(`mov ${addr}, ${writer.indexVar(this.read(), offset)}`);
            return;
        }

        const info = writer.getVar(this.read());
        if (info[0] == 0) writer.write(`mov ${addr}, ${info[1]}`);
        else writer.write(info[1]);
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class CallNode extends ASTNode {
    identifier = null;
    args = [];
    type = "any";

    constructor(identifier, args) {
        super();
        this.identifier = identifier;
        this.args = args;
    }

    updateType(writer) {
        this.type = writer.getFuncType(this.identifier.read());
    }

    compile(writer, flags = "") {
        this.updateType(writer);

        const compileBlock = ["store", "len", "dumpf"];
        const falseBlock = ["write"];
        if (!compileBlock.includes(this.identifier.read()))
            if (!falseBlock.includes(this.identifier.read()))
                for (var i = 0; i < this.args.length; i++) this.args[i].compile(writer, "--push");
            else for (var i = 0; i < this.args.length; i++) this.args[i].compile(writer, false);

        if (this.identifier.read() == "store") {
            if (this.args.length < 2)
                throw logError(
                    new LightError(
                        "Not enough arguments for store",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end,
                        ["store requires a minimum of 2 arguments."]
                    )
                );
            this.args[0].compile(writer);
            const length = this.args.length >= 2 ? this.args[2].value.value : 1;
            if (this.args[1].value.type == TT.TT_STRING) {
                writer.write("pop rax");
                for (var i = 0; i < this.args[1].value.value.length; i++) {
                    const code = this.args[1].value.value.charCodeAt(i);
                    writer.write(`mov rbx, ${code}`);
                    if (i !== 0) writer.write("add rax, 1");
                    writer.write("mov [rax], bl");
                    writer.write("push rax");
                }
            } else {
                writer.write("pop rax");
                for (var i = length; i > 0; i--) {
                    if (typeof this.args[1].popoverride == "function") this.args[1].popoverride(writer, `rbx`, i);
                    else writer.write("pop rbx");
                    writer.write(`mov [rax+${length - i}], bl`);
                }
            }

            return ["call", null];
        } else if (this.identifier.read() == "load") {
            if (this.args.length < 1)
                throw logError(
                    new LightError(
                        "Not enough arguments for load",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end,
                        ["Load requires a minimum of 1 argument."]
                    )
                );
            writer.write("pop rax");
            writer.write("xor rbx, rbx");
            writer.write("mov bl, [rax]");
            writer.write("push rbx");
            return ["call", null];
        } else if (this.identifier.read() == "write") {
            if (this.args.length < 3)
                throw logError(
                    new LightError(
                        "Not enough arguments for write",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end,
                        ["Write requires a minimum of 3 arguments."]
                    )
                );
            writer.write("mov rax, 1");
            writer.write("pop rdx");
            writer.write("pop rsi");
            writer.write("pop rdi");
            writer.write("syscall");
            return ["call", null];
        } else if (this.identifier.read() == "len") {
            if (this.args.length < 1)
                throw logError(
                    new LightError(
                        "Not enough arguments for len",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end,
                        ["Len requires a minimum of 1 argument."]
                    )
                );
            var arg0 = this.args[0];
            var trueArg0 = arg0;
            if (arg0.constructor.name == "IdentifierNode") arg0 = writer.getVarExpr(arg0.read());
            if (arg0.constructor.name != "StringNode")
                throw logError(
                    new LightError(
                        "Cannot take len of non string value",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end,
                        ["Store requires a minimum of 2 arguments."]
                    )
                );

            const info = writer.getVar(trueArg0.read(), -8);
            if (info[0] == 1) {
                writer.write(`mov rax, ${info[1]}`);
                writer.write(`push rax`);
            } else {
                writer.write(`xor rax, rax`);
                writer.write(`movsx rax, DWORD ${info[1]}`);
                writer.write(`push rax`);
            }
            return ["call", null];
        }

        // for (var i = 0; i < this.args.length; i++) writer.write(`pop ${registers[i]}`);

        var argtypes = "";
        for (const arg of this.args) if (arg["updateType"]) arg.updateType(writer);
        for (const arg of this.args) argtypes += "_" + arg.type;

        if (this.identifier.read() == "dumpf") {
            this.args[0].compile(writer, true);
            writer.write(`pop rbx`);
            writer.write(`movsd xmm0, [rbx]`);
            //writer.write(`mov rax, [rbx]`);
            //writer.write(`pxor xmm0, xmm0`);
        }

        writer.write(
            `call ${writer.getFunction(
                `_L${this.identifier.read().length}${this.identifier.read()}${argtypes}`,
                this.identifier.read()
            )}`
        );

        writer.write("pop rbx");
        writer.write("xor rbx, rbx");

        if (this.type && this.type != "void") if (flags == "--push") writer.write("push rax");

        if (this.identifier.read() == "dump") writer.request("dump");
        else if (this.identifier.read() == "dumpf") writer.request("dumpf");

        return ["call", null];
    }

    repr() {
        return `<CALL ${this.identifier.read()}(${(() => {
            const j = [];
            for (var i = 0; i < this.args.length; i++) j.push(this.args[i].repr());
            return j.join(", ");
        })()})>`;
    }

    asfree() {
        return `CallNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class BinOpNode extends ASTNode {
    left = null;
    right = null;
    operator = null;
    bypass = false;

    type = null;

    constructor(left, right, operator) {
        super();
        this.left = left;
        this.right = right;
        this.operator = operator;

        this.type = this.left.type;

        if (!this.right) this.bypass = true;
    }

    compile(writer) {
        // ++, --
        {
            if (this.operator.type == TT.TT_DUBPLUS) {
                // prettier-ignore
                const assignment = new AssignmentNode(this.left, new BinOpNode(this.left, new IntNode(TOK.ONE), TOK.PLUS));
                assignment.compile(writer);
                return;
            } else if (this.operator.type == TT.TT_DUBMIN) {
                // prettier-ignore
                const assignment = new AssignmentNode(this.left, new BinOpNode(this.left, new IntNode(TOK.ONE), TOK.MINUS));
                assignment.compile(writer);
                return;
            }
        }

        // operator assignments
        {
            if (this.operator.type == TT.TT_PLUSEQU) {
                // prettier-ignore
                const assignment = new AssignmentNode(this.left, new BinOpNode(this.left, this.right, TOK.PLUS));
                assignment.compile(writer);
                return;
            } else if (this.operator.type == TT.TT_MINEQU) {
                // prettier-ignore
                const assignment = new AssignmentNode(this.left, new BinOpNode(this.left, this.right, TOK.MINUS));
                assignment.compile(writer);
                return;
            } else if (this.operator.type == TT.TT_DIVEQU) {
                // prettier-ignore
                const assignment = new AssignmentNode(this.left, new BinOpNode(this.left, this.right, TOK.DIV));
                assignment.compile(writer);
                return;
            } else if (this.operator.type == TT.TT_MULEQU) {
                // prettier-ignore
                const assignment = new AssignmentNode(this.left, new BinOpNode(this.left, this.right, TOK.MUL));
                assignment.compile(writer);
                return;
            } else if (this.operator.type == TT.TT_MODEQU) {
                // prettier-ignore
                const assignment = new AssignmentNode(this.left, new BinOpNode(this.left, this.right, TOK.MOD));
                assignment.compile(writer);
                return;
            }
        }

        // normal operators
        {
            if (this.operator.type == TT.TT_PLUS) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rax`);
                writer.write(`pop rbx`);
                writer.write(`add rax, rbx`);
                writer.write(`push rax`);

                // if (this.left.type == "float" || this.right.type == "float") {
                //     writer.write(`pxor xmm0, xmm0`);
                //     writer.write(`pxor xmm1, xmm1`);
                //     writer.write(`pop rax`);
                //     writer.write(`pop rbx`);

                //     if (this.left.type == "float") writer.write(`movsd xmm1, QWORD [rbx]`);
                //     else writer.write(`movsd xmm0, QWORD [rax]`);
                //     if (this.left.type != "float") writer.write(`cvtsi2sd xmm1, QWORD [rbx]`);
                //     else writer.write(`cvtsi2sd xmm0, QWORD [rax]`);

                //     writer.write(`addsd xmm0, xmm1`);
                //     writer.write(`push 0 ;; open an empty spot`);
                //     writer.write(`movsd [rbp-8], xmm0`);
                //     writer.write(`push rbp-8`);
                // } else {
                //     writer.write(`pop rax`);
                //     writer.write(`pop rbx`);
                //     writer.write(`add rax, rbx`);
                //     writer.write(`push rax`);
                // }
            } else if (this.operator.type == TT.TT_MINUS) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`sub rax, rbx`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_MUL) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rax`);
                writer.write(`pop rbx`);
                writer.write(`imul rax, rbx`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_DIV) {
                const [ra, xa] = this.left.compile(writer, true);
                const [rb, xb] = this.right.compile(writer, true);

                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`xor rdx, rdx`);
                writer.write(`div rbx`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_MOD) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`xor rdx, rdx`);
                writer.write(`div rbx`);
                writer.write(`push rdx`);
            } else if (this.operator.type == TT.TT_LTHAN) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`cmp rax, rbx`);
                writer.write(`setl al`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_GTHAN) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`cmp rax, rbx`);
                writer.write(`setg al`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_LEQU) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`cmp rax, rbx`);
                writer.write(`setle al`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_GEQU) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`cmp rax, rbx`);
                writer.write(`setge al`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_EQUTO) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`cmp rax, rbx`);
                writer.write(`sete al`);
                writer.write(`push rax`);
            } else if (this.operator.type == TT.TT_NOTEQU) {
                this.left.compile(writer, true);
                this.right.compile(writer, true);
                writer.write(`pop rbx`);
                writer.write(`pop rax`);
                writer.write(`cmp rax, rbx`);
                writer.write(`setne al`);
                writer.write(`push rax`);
            }
        }

        return ["unknown", null];
    }

    repr() {
        if (!this.right) return `BINOP (${this.left.repr()}, ${TTI[this.operator.type]})`;
        return `BINOP (${this.left.repr()}, ${TTI[this.operator.type]}, ${this.right.repr()})`;
    }

    asfree() {
        return `BinOpNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class UnaryOpNode extends ASTNode {
    operator = null;
    right = null;
    type = null;

    constructor(operator, right) {
        super();
        this.operator = operator;
        this.right = right;
        this.type = this.right.type;
    }

    compile(writer) {
        // prettier-ignore
        this.right.compile(writer);
        writer.write(`pop rax`);
        writer.write(`neg rax`);
        writer.write(`push rax`);
    }

    repr() {
        return `(${TTI[this.operator.type]}, ${this.right.repr()})`;
    }

    asfree() {
        return `UnaryOpNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class VarNode extends ASTNode {
    type = null;
    identifier = null;
    expr = null;

    constructor(type, identifier, expr) {
        super();
        this.type = type.value;
        this.identifier = identifier;
        this.expr = expr;
    }

    compile(writer) {
        writer.getVar(this.identifier.read());
        writer.storeVar(this.identifier.read(), this.expr);
        writer.setVarType(this.identifier.read(), this.type);
        if (this.type == "str") {
            if (this.expr.constructor.name != "StringNode")
                throw logError(
                    new LightError(
                        "Cannot assign a non-string value to a string variable.",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end
                    )
                );
            const str = this.expr.getchars().split("").reverse().join("");

            var info = writer.getVar(this.identifier.read());

            for (var i = 0; i < str.length; i++) {
                writer.write(`mov BYTE ${info[1]}, ${str.charCodeAt(i)}`);
                writer.setVar(this.identifier.read(), writer.getVarRBP(this.identifier.read(), true) - 1);
                writer.incRBP(1);
            }

            info = writer.getVar(this.identifier.read(), -8);
            writer.write(`mov DWORD ${info[1]}, ${str.length}`);

            writer.matchPlus8(this.identifier.read(), 16);

            return;
        }

        this.expr.compile(writer, "--push"); // "--push" acts as true for identifiers

        var info = writer.getVar(this.identifier.read());
        if (info[0] == 0) {
            writer.write(`pop rax`);
            writer.write(`mov ${info[1]}, rax`);
        } else
            throw logError(
                new LightError(
                    "Cannot assign a function parameter.",
                    this.identifier.value.file,
                    this.identifier.value.line,
                    this.identifier.value.start,
                    this.identifier.value.end,
                    ["Support coming soon"]
                )
            );
    }

    repr() {
        if (!this.expr || !this.expr.repr) return `<SET ${this.identifier.read()} TO (UNKNOWN)>`;
        return `<SET (VAR-C) ${this.type} ${this.identifier.read()} TO (${this.expr.repr().split("\n").join("\\n")})>`;
    }

    asfree() {
        return `VarNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class AssignmentNode extends ASTNode {
    identifier = null;
    expr = null;
    type = "any";

    constructor(identifier, expr) {
        super();
        this.identifier = identifier;
        this.expr = expr;
    }

    updateType(writer) {
        this.type = writer.getVarType(this.identifier.read());
    }

    compile(writer) {
        this.updateType(writer);
        if (!writer.varExists(this.identifier.read()))
            throw logError(
                new LightError(
                    "Cannot assign value to null (This should not be possible; please send a snapshot of your code and a bugreport with it)",
                    this.identifier.value.file,
                    this.identifier.value.line,
                    this.identifier.value.start,
                    this.identifier.value.end
                )
            );

        writer.storeVar(this.identifier.read(), this.expr);
        if (writer.getVarType(this.identifier.read()) == "str") {
            if (this.expr.constructor.name != "StringNode")
                throw logError(
                    new LightError(
                        "Cannot assign a non-string value to a string variable.",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end
                    )
                );
            const str = this.expr.getchars().split("").reverse().join("");

            var info = writer.getVar(this.identifier.read());
            if (info[0] == 1)
                throw logError(
                    new LightError(
                        "Cannot assign a function parameter.",
                        this.identifier.value.file,
                        this.identifier.value.line,
                        this.identifier.value.start,
                        this.identifier.value.end,
                        ["Support coming soon"]
                    )
                );

            for (var i = 0; i < str.length; i++) {
                info = writer.getVar(this.identifier.read(), str.length - i);
                writer.write(`mov BYTE ${info[1]}, ${str.charCodeAt(i)}`);
            }

            info = writer.getVar(this.identifier.read(), -8);
            writer.write(`mov DWORD ${info[1]}, ${str.length}`);

            writer.matchPlus8(this.identifier.read(), 16);

            return;
        }

        var info = writer.getVar(this.identifier.read());
        if (info[0] == 1)
            throw logError(
                new LightError(
                    "Cannot assign a function parameter.",
                    this.identifier.value.file,
                    this.identifier.value.line,
                    this.identifier.value.start,
                    this.identifier.value.end,
                    ["Support coming soon"]
                )
            );

        this.expr.compile(writer);
        writer.write(`pop rax`);
        writer.write(`mov ${info[1]}, rax`);
    }

    repr() {
        return `<SET ${this.identifier.read()} TO (${this.expr.repr().split("\n").join("\\n")})>`;
    }

    asfree() {
        return `AssignmentNode: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class BlockNode extends ASTNode {
    expressions = [];
    type = "NULL";

    constructor(expressions) {
        super();
        this.expressions = expressions;
    }

    compile(writer) {
        for (const expr of this.expressions) {
            expr.compile(writer);
        }
    }

    repr() {
        return `{${(() => {
            var str = "";
            var s = true;
            for (const expr of this.expressions) {
                if (!s) str += "; ";
                s = false;
                str += expr.repr();
            }

            return str;
        })()}}`;
    }

    asfree() {
        return `Code Block: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class IfNode extends ASTNode {
    cases = [];
    elz = null;
    type = "NULL";

    constructor(cases, elz) {
        super();
        this.cases = cases;
        this.elz = elz;
    }

    compile(writer) {
        for (var i = 0; i < this.cases.length; i++) {
            const expr = this.cases[i];

            expr[0].compile(writer, true);
            writer.write(`pop rax`);
            writer.write(`cmp rax, 0`);
            if (this.elz && i == this.cases.length - 1)
                writer.write(`je .LBLOCK_${this.cases.length + writer.lcPos - i}`);
            else writer.write(`je ${writer.getlc(".LBLOCK_")}`);
            expr[1].compile(writer);

            writer.write(`jmp .LBLOCK_${this.cases.length - 1 + writer.lcPos - i}`);

            if (this.elz && i == this.cases.length - 1) {
                writer.lcPos++;
                writer.lc(".LBLOCK_");

                this.elz.compile(writer);

                writer.lcPos -= 2;
            }

            writer.lc(".LBLOCK_");
        }
    }

    repr() {
        return `<IF (...) {...}>`;
    }

    asfree() {
        return `if: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class WhileNode extends ASTNode {
    condition = null;
    executes = null;
    type = "NULL";

    constructor(condition, execution) {
        super();
        this.condition = condition;
        this.executes = execution;
    }

    compile(writer) {
        writer.write(`jmp ${writer.getlc(".LBLOCK_")}`);
        const lcPrePos = writer.lcPos;
        writer.lcPos++;
        writer.lc(".LBLOCK_");
        this.executes.compile(writer);
        const newLcPos = writer.lcPos;
        writer.lcPos = lcPrePos;
        writer.lc(".LBLOCK_");
        this.condition.compile(writer, true);
        writer.write(`pop rax`);
        writer.write(`cmp rax, 0`);
        writer.write(`jne .LBLOCK_${lcPrePos + 1}`);
        if (newLcPos > writer.lcPos) writer.lcPos = newLcPos;
    }

    repr() {
        return `<WHILE (...) {...}>`;
    }

    asfree() {
        return `while: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class ArgNode extends ASTNode {
    id = null;
    type = null;

    constructor(type, id) {
        super();
        this.type = type;
        this.id = id;
    }

    compile(writer) {}

    repr() {
        return `<ARG (${this.type.value}) "${this.id.read()}">`;
    }

    asfree() {
        return `arg: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class FunctionNode extends ASTNode {
    name = "";
    retType = null;
    contents = null;
    args = [];
    type = "NULL";

    constructor(name, args, contents, retType) {
        super();
        this.name = name;
        this.args = args;
        this.contents = contents;
        this.retType = retType;
        this.type = this.retType.value;
    }

    compile(writer) {
        writer.registerFunction(this);

        var argtypes = "";
        for (const arg of this.args) argtypes += "_" + arg.type.value;

        const env = {};
        var inc = 16 + this.args.length * 8;
        for (const arg of this.args) {
            inc -= 8;
            env[arg.id.read()] = [arg.type.value, `[rbp+${inc}]`];
        }

        writer.setPrefixWriting(true);

        writer.tab(-1);
        writer.write(`_L${this.name.length}${this.name}${argtypes}:`);
        writer.tab(1);
        writer.write("push rbp");
        writer.write("mov rbp, rsp");
        writer.write("");

        writer.pushEnvironment(env);

        this.contents.compile(writer);

        writer.popEnvironment();

        writer.write("");
        writer.write("pop rbp");
        writer.write("ret");

        writer.setPrefixWriting(false);
    }

    repr() {
        return `<FUNC ${this.name}(${(() => {
            var str = "";
            var s = true;
            for (const arg of this.args) {
                if (!s) str += ", ";
                s = false;
                str += arg.type.value;
            }
            return str;
        })()}) ${this.contents.repr()}>`;
    }

    asfree() {
        return `function: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

class ReturnNode extends ASTNode {
    expression = null;

    constructor(expr) {
        super();
        this.expression = expr;
    }

    compile(writer) {
        this.expression.compile(writer, true);
        writer.write(`pop rax`);
    }

    repr() {
        return `<RET <...>>`;
    }

    asfree() {
        return `return: ${this.repr()}`;
    }

    [customInspectSymbol](depth, opts) { return this.repr(); } // prettier-ignore
}

export {
    StringNode,
    CharNode,
    MemNode,
    ASTNode,
    BinOpNode,
    IntNode,
    FloatNode,
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
};
