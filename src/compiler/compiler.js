import { execSync } from "child_process";
import { writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

import { Compiler } from "../writer.js";

const MEM_CAPACITY = 640_000;

function compile(parsed) {
    var assembly = `section .text\nglobal _start\n`;
    var writer = new Compiler(MEM_CAPACITY);
    writer.write("_start:");
    writer.tab(1);
    writer.write("push rbp");
    writer.write("mov rbp, rsp");
    writer.write("");

    for (const tok of parsed) {
        if (tok.constructor.name != "BinOpNode" || tok.bypass == true) tok.compile(writer); // tok.compile()
        //writer.text = "";
    }
    assembly += writer.text;

    // prettier-ignore
    assembly += "\n" +
                "\txor rax, rax\n" +
                "\tpop rbp\n" + // restore rbp
                "\n" +
                "\tmov rax, 60\n" + // "exit" syscall
                "\tmov rdi, 0\n" + // exit with code 0
                "\tsyscall\n" + // call the function "exit(0)" aka "syscall(60, 0)"
                "\n" +
                "\tret\n"; // make sure it exits

    assembly += writer.end;

    // prettier-ignore
    assembly += "\n" +
                writer.finalized +
                "segment .bss\n" +
                `mem: resb ${MEM_CAPACITY}\n`

    const outputAsmPath = join(process.cwd(), "out.asm");
    const outputObjPath = join(process.cwd(), "out.o");
    const outputExePath = join(process.cwd(), "a.out");

    writeFileSync(outputAsmPath, assembly);
    execSync(`nasm -felf64 out.asm -o ${outputObjPath}`);
    execSync(`ld out.o -o ${outputExePath}`);

    //if (fs.existsSync(outputAsmPath)) fs.unlinkSync(outputAsmPath);
    if (existsSync(outputObjPath)) unlinkSync(outputObjPath);
}

export { compile };
