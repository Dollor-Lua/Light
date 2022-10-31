class LightError {
    constructor(msg, file, line, start, end, notes = []) {
        this.msg = msg;
        this.file = file;
        this.line = line;
        this.start = start;
        this.end = end;
        this.name = "Error";
        this.notes = notes;
    }
}

class SyntaxError extends LightError {
    constructor(msg, file, line, start, end, notes = []) {
        super(msg, file, line, start, end, notes);
        this.name = "SyntaxError";
    }
}

export { LightError, SyntaxError };
