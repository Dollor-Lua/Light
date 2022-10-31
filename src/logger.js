import { readFileSync } from "fs";
import { join } from "path";
import { bmagenta as pntError, byellow as pntWarn, bcyan as pntNote } from "./paint.js";

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

function writePosition(src, line, start, end) {
    const lineTxt = src.split("\n")[line - 1];
    console.log(
        `${`${line}`.padStart(5)} | ${lineTxt.substring(0, start - 1)}${pntError(
            lineTxt.substring(start - 1, end - 1)
        )}${lineTxt.substring(end - 1)}`
    );
    console.log(`      | ${pntError(`${rep(" ", start - 1)}^${rep("~", end - start == 0 ? 0 : end - start - 1)}`)}`);
}

function logError(err) {
    console.error(`${err.file}:${err.line + 1}:${err.start + 1}: ${pntError("ERROR:")} (${err.name}) ${err.msg}`);
    const fdata = readFileSync(join(process.cwd(), err.file), "utf8");
    writePosition(fdata, err.line + 1, err.start + 1, err.end + 1);
    if (err.notes.length > 0) for (const note of err.notes) logInfo(note, err.file, err.line + 1, err.start + 1);
    return err;
}

function logFatal(msg, file = "unknown", line = 0, pos = 0) {
    console.error(`${file}:${line + 1}:${pos + 1}: ${pntError("ERROR:")} (FATAL) ${msg}`);
}

function logInfo(msg, file = "unknown", line = 0, pos = 0) {
    console.info(`${file}:${line + 1}:${pos + 1}: ${pntNote("NOTE:")} ${msg}`);
}

function logWarn(msg, file = "unknown", line = 0, pos = 0) {
    console.warn(`${file}:${line + 1}:${pos + 1}: ${pntWarn("WARN:")} ${msg}`);
}

export { logError, logFatal, logInfo, logWarn };
