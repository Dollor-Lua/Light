var foreground = {
    reset: "\x1b[0m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bright_black: "\x1b[30;1m",
    bright_red: "\x1b[31;1m",
    bright_green: "\x1b[32;1m",
    bright_yellow: "\x1b[33;1m",
    bright_blue: "\x1b[34;1m",
    bright_magenta: "\x1b[35;1m",
    bright_cyan: "\x1b[36;1m",
    bright_white: "\x1b[37;1m",
};

var background = {
    reset: "\x1b[0m",
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    bright_black: "\x1b[40;1m",
    bright_red: "\x1b[41;1m",
    bright_green: "\x1b[42;1m",
    bright_yellow: "\x1b[43;1m",
    bright_blue: "\x1b[44;1m",
    bright_magenta: "\x1b[45;1m",
    bright_cyan: "\x1b[46;1m",
    bright_white: "\x1b[47;1m",
};

var t_foreground = foreground;
var t_background = background;

function supported() {
    var supports =
        process.env.TERM !== "dumb" &&
        (process.env.TERM_PROGRAM == "vscode" ||
            "CI" in process.env ||
            ("TF_BUILD" in process.env && "AGENT_NAME" in process.env) ||
            process.env.COLORTERM == "truecolor" ||
            process.env.TERM_PROGRAM == "iTerm.app" ||
            process.env.TERM_PROGRAM == "Apple_Terminal" ||
            /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(process.env.TERM) ||
            /-256(color)?$/i.test(process.env.TERM) ||
            "COLORTERM" in process.env); // prettier-ignore

    if (supports) {
        t_foreground = foreground;
        t_background = background;
    } else {
        for (obj in t_foreground) {
            t_foreground[obj] = "";
        }

        t_background = t_foreground;
    }
    return supports;
}

supported();

export const black = (text) => foreground.black + text + foreground.reset;
export const red = (text) => foreground.red + text + foreground.reset;
export const green = (text) => foreground.green + text + foreground.reset;
export const yellow = (text) => foreground.yellow + text + foreground.reset;
export const blue = (text) => foreground.blue + text + foreground.reset;
export const magenta = (text) => foreground.magenta + text + foreground.reset;
export const cyan = (text) => foreground.cyan + text + foreground.reset;
export const white = (text) => foreground.white + text + foreground.reset;

export const bblack = (text) => foreground.bright_black + text + foreground.reset;
export const bred = (text) => foreground.bright_red + text + foreground.reset;
export const bgreen = (text) => foreground.bright_green + text + foreground.reset;
export const byellow = (text) => foreground.bright_yellow + text + foreground.reset;
export const bblue = (text) => foreground.bright_blue + text + foreground.reset;
export const bmagenta = (text) => foreground.bright_magenta + text + foreground.reset;
export const bcyan = (text) => foreground.bright_cyan + text + foreground.reset;
export const bwhite = (text) => foreground.bright_white + text + foreground.reset;

export const fg = t_foreground;
export const bg = t_background;
export const trueFg = foreground;
export const trueBg = background;

export const supports = supported;
