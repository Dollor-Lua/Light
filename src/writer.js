import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 *
 * @param {String} msg to repeat
 * @param {Number} amount times to repeat
 * @returns {String} `msg` repeated & concatenated `amount` of times.
 */
function rep(msg, amount) {
    if (amount == 0) return "";
    var finished = "";
    for (var i = 0; i < amount; i++) finished += msg;
    return finished;
}

class Writer {
    text = "";
    end = "";
    tabs = 0;

    /**
     *
     * @param {Number} MEM_CAPACITY
     * @param {Number} VAR_CAPACITY
     */
    constructor(MEM_CAPACITY, VAR_CAPACITY) {
        this.MEM_CAPACITY = MEM_CAPACITY;
        this.VAR_CAPACITY = VAR_CAPACITY;
    }

    /**
     * adds msg to the end of the current text
     * accounts for tabs (.tab(amount))
     * @param {String} msg
     */
    write(msg) {
        this.text += rep("\t", this.tabs) + msg + "\n";
    }

    /**
     * adds msg to the end of the 'end' text, should be manually appended once the writer is no longer in use.
     * ignores tabs
     * @param {String} msg
     */
    writeEnd(msg) {
        this.end += msg;
    }

    /**
     * Increases the tab count by amount (negative numbers subtract from the tab count)
     * @param {Number} amount
     */
    tab(amount) {
        this.tabs += amount;
    }
}

class Compiler extends Writer {
    usedMethods = {};

    functions = {};
    funcTypes = {};

    env = [];

    vars = {};
    varTypes = {};
    varPos = {};
    varExpr = {};
    rbpPos = 0; // actually the var pos, sorry :)

    lcPos = 0;

    prefixing = false;
    prefixed = "";

    endfix = false;
    endfixed = "";

    floats = {};

    finalized = "";

    /**
     *
     * @param {Number} MEM_CAPACITY
     * @param {Number} VAR_CAPACITY
     */
    constructor(MEM_CAPACITY, VAR_CAPACITY) {
        super(MEM_CAPACITY, VAR_CAPACITY);
    }

    pushFloatLC(lc, val) {
        if (this.floats[val]) return this.floats[val];
        this.floats[val] = lc;
        return lc;
    }

    getFloatLC(val) {
        if (this.floats[val]) return this.floats[val];
        return null;
    }

    registerFunction(funcNode) {
        var argtypes = "";
        for (const arg of funcNode.args) argtypes += "_" + arg.type.value;

        this.functions[`_L${funcNode.name.length}${funcNode.name}${argtypes}`] = funcNode;
        this.funcTypes[funcNode.name] = funcNode.type;
    }

    getFunction(fullName, identifier) {
        if (this.functions[fullName]) return fullName;
        return identifier;
    }

    getFuncType(identifier) {
        return this.funcTypes[identifier];
    }

    pushEnvironment(env) {
        this.env.push(env);
    }

    popEnvironment() {
        this.env.pop();
    }

    setPrefixWriting(on) {
        this.prefixing = on;
        if (!on) this.prefix(this.prefixed);
        this.prefixed = "";
    }

    setEndfixed(on) {
        this.endfix = on;
        if (!this.endfix) this.writeEnd(this.endfixed);
        this.endfixed = "";
    }

    write(msg) {
        const txt = rep("\t", this.tabs) + msg + "\n";
        if (this.prefixing) this.prefixed += txt;
        else if (this.endfix) this.endfixed += txt;
        else this.text += txt;
    }

    /**
     * Prefixes the current text with code (prepends, adds to the start)
     * @param {String} code
     */
    prefix(code) {
        this.text = code + "\n" + this.text;
    }

    /**
     * Loads assembly from the `asm` folder and prefixes the compiled assembly with it.
     * @param {String} method
     */
    request(method) {
        if (this.usedMethods[method] == true) return;
        this.usedMethods[method] = true;
        const file = readFileSync(join(__dirname, "asm/", `${method}.asm`), "utf8");
        const [data, ending] = file.split(";;-- SPLIT-SECTION DATA --;;");
        this.prefix(data);
        this.finalized += ending ? ending + "\n" : "";
    }

    /**
     * Generates a label with a compiler handled position and adds it to the current text.
     * @param {String} txt label block name (ex: `.LCBLOCK_`)
     * @returns {String} A label with a compiler handled position.
     */
    lc(txt = ".LCBLOCK_") {
        this.tab(-1);
        this.write(`${txt}${this.lcPos}:`);
        this.tab(1);
        this.lcPos++;
        return `${txt}${this.lcPos - 1}`;
    }

    /**
     * @param {String} txt
     * @returns {String} A string containing the current label with the current compiler position (doesn't add to text or increment)
     */
    getlc(txt = ".LCBLOCK_") {
        return `${txt}${this.lcPos}`;
    }

    /**
     * Generates or returns an assembly pointer for a variable.
     * @param {String} vname variable name
     * @param {Number} offset variable position offset
     * @returns {String} assembly pointer
     */
    getVar(vname, offset = 0) {
        // last 2400 bytes are preserved for variables
        if (this.rbpPos + 8 >= this.VAR_CAPACITY) throw new Error("Too many variables nerd");
        if (this.vars[vname] !== undefined) return [0, `[mem+${this.vars[vname] + offset}]`];
        else for (const env of this.env) if (env[vname]) return [1, env[vname][1]];
        this.rbpPos += 8;
        const rbp = `[mem+${this.MEM_CAPACITY - this.rbpPos}]`;
        this.vars[vname] = this.MEM_CAPACITY - this.rbpPos;
        this.varPos[vname] = this.MEM_CAPACITY - this.rbpPos;
        return [0, rbp];
    }

    /**
     * Sets a variable's type (ex: int)
     * @param {String} vname variable name
     * @param {String} type variable type
     */
    setVarType(vname, type) {
        this.varTypes[vname] = type;
    }

    /**
     *
     * @param {String} vname variable name
     * @returns {String} variable type
     */
    getVarType(vname) {
        return this.varTypes[vname];
    }

    /**
     * Shifts the "stack pointer" to the first position safe for 64 bit floats (or `offset`) from the variable specified. If the pointer is already far enough it isnt moved.
     * @param {String} vname variable name
     * @param {Number} offset minimum position offset (in bytes)
     */
    matchPlus8(vname, offset = 8) {
        if (this.varExists(vname))
            if (this.MEM_CAPACITY - this.rbpPos < this.vars[vname] - offset) this.rbpPos += offset;
    }

    /**
     * Sets the variable to the specified `dist` position.
     * @param {String} vname variable name
     * @param {Number} dist variable offset
     */
    setVar(vname, dist) {
        this.vars[vname] = dist;
        this.varPos[vname] = dist;
    }

    /**
     *
     * @param {String} vname variable name
     * @returns {Boolean} true if the variable exists
     */
    varExists(vname) {
        for (const env of this.env) if (env[vname]) return !!env[vname];
        return this.vars[vname] !== undefined;
    }

    /**
     * returns the pointer used to index the memory of the variable specified.
     * @param {String} vname variable name
     * @param {Number} offset variable offset count
     * @param {Number} mul variable step size (how large the variables are)
     * @returns {String} A pointer in assembly
     */
    indexVar(vname, offset, mul = 1) {
        if (!this.varExists(vname)) throw new Error("Cannot index an unknown variable");
        if (this.varPos[vname] + mul * offset <= 0) throw new Error("Cannot index outside of the stack");
        return `[mem+${this.varPos[vname] + mul * offset}]`;
    }

    /**
     * gives the offset from memory capacity, offset, and step size.
     * @param {Number} offset variable offset count
     * @param {Number} mul variable step size
     * @returns {Number}
     */
    vardoc(offset, mul = 1) {
        return this.MEM_CAPACITY - offset * mul;
    }

    /**
     * increases RBP by offset
     * @param {Number} offset
     */
    incRBP(offset) {
        this.rbpPos += offset;
    }

    /**
     *
     * @param {String} vname variable name
     * @returns {Number?} the pointer position of the variable, or null if it doesnt exist
     */
    getVarRBP(vname, num = false) {
        for (const env of this.env) if (env[vname]) return env[vname][1];
        if (this.varPos[vname] !== undefined) return num ? this.varPos[vname] : `[mem+${this.varPos[vname]}]`;
        return null;
    }

    /**
     * Stores the expreession with the variable for later compiler use
     * @param {String} vname variable name
     * @param {ASTNode} expr expression
     */
    storeVar(vname, expr) {
        this.varExpr[vname] = expr;
    }

    /**
     *
     * @param {String} vname variable name
     * @returns {ASTNode} expression stored with the variable
     */
    getVarExpr(vname) {
        return this.varExpr[vname];
    }
}

export { Writer, Compiler };
