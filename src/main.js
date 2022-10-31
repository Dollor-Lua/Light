import { lex } from "./compiler/lexer.js";
import { parse } from "./compiler/parser.js";
import { compile } from "./compiler/compiler.js";

import { readFileSync } from "fs";
import { join } from "path";
import { logError } from "./logger.js";

async function main(argc, argv) {
    if (argc < 1) {
        console.log("No file specified");
        process.exit(1);
    }

    try {
        const file = join(process.cwd(), argv[0]);
        const data = readFileSync(file, "utf8");
        const [lexed, lexErrors] = lex(data, argv[0]);
        if (lexErrors.length > 0) {
            for (const lexError of lexErrors) logError(lexError);
            return;
        }
        const parsed = parse(lexed);
        compile(parsed);
    } catch (err) {
        if (err.constructor.name == "Error") console.error(err);
    }

    return 0;
}

{ process.argv.shift(); process.argv.shift(); } // prettier-ignore
process.exit(main(process.argv.length, process.argv));
