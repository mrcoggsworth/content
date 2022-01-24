// Consts
var mandatoryLabels = ['cefVersion', 'vendor', 'product', 'version', 'signatureID', 'name', 'severity'];

// first, split the lines for multiple CEF rows
var rows = args.data.split('\nCEF:');
var data = [];

for (var i=0; i<rows.length; i++) {
    var o = {};
    // First, read the mandatory fields
    var start = 0;
    for (var j=0; j<mandatoryLabels.length; j++) {
        var end = rows[i].indexOf('|', start);
        if (end < 0) {
            throw 'Invalid format in row ' + i + '. Missing mandatory field ' + j + '.';
        }
        // Ignore escaped separators
        while (rows[i][end-1] === '\\') {
            end = rows[i].indexOf('|', end + 1);
            if (end < 0) {
                throw 'Invalid format in row ' + i + '. Missing mandatory field ' + j + '.';
            }
        }
        o[mandatoryLabels[j]] = (i === 0 && j === 0) ? rows[i].substring(4, end) : rows[i].substring(start, end);
        start = end + 1;
    }
    // Now, handle extensions which should be separated by '='
    var currLabel = '';
    var eq = rows[i].indexOf('=', start);
    while (eq > 0) {
        if (rows[i][eq-1] === '\\') {
            eq = rows[i].indexOf('=', eq + 1);
            continue;
        }
        // We found a good '=', now need to go back and find the beginning of the label
        for (var b=eq-1; b>start; b--) {
            if (rows[i][b] === ' ') {
                b++;
                break;
            }
        }
        if (currLabel === '') {
            currLabel = rows[i].substring(b, eq);
            start = eq + 1;
        } else {
            o[currLabel] = rows[i].substring(start, b).trim();
            currLabel = rows[i].substring(b, eq);
            start = eq + 1;
        }
        eq = rows[i].indexOf('=', start);
    }
    if (currLabel !== '' && start < rows[i].length - 1) {
        o[currLabel] = rows[i].substring(start);
    }
    // Convert labels of custom fields to actual attributes (cs1Label, cn1Label, cs1, cn1)
    var keys = Object.keys(o);
    for (var k=0; k<keys.length; k++) {
        if (keys[k].match(/c[ns]\d+Label/i) && keys.indexOf(keys[k].substring(0, keys[k].length-5)) >= 0) {
            o[o[keys[k]]] = o[keys[k].substring(0, keys[k].length-5)];
            delete o[keys[k]];
            delete o[keys[k].substring(0, keys[k].length-5)];
        }
    }
    data.push(o);
}
return {Type: entryTypes.note, Contents: data, ContentsFormat: formats.json, HumanReadable: tableToMarkdown('CEF Events', data), EntryContext: {CEFEvent: data}};
