var e = -1;

/**
 * Generates a number in incrementing order, resets to 0 when `reset` is true.
 * Acts like a C++ or TypeScript enum.
 * @param {Boolean} reset wheter to reset the enum count or not
 * @returns {Number}
 */
function enumerate(reset = false) {
    if (reset) e = -1;
    e++;
    return e;
}

export { enumerate };
