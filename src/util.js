
/**
 * @param {Array} a
 * @param {number} size
 * @param defaultVal
 * @returns {Array}
 */
exports.initArray = function(a, size, defaultVal) {
    for (var i = 0; i < size; i++)
        a[i] = defaultVal;
    return a;
}

exports.dumpByteArray = function(bytes) {
    var sb = [];
    for (var i = 0; i < bytes.length; i++) {
        sb.push(i.toString() + ':');
        sb.push(bytes[i].toString(16));
        sb.push('\n');
    }
    return sb.join('');
}
