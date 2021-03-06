var fs = require('fs'),
    sys = require('sys');

var wwwdude = require('wwwdude');

/**
 * Appends an array of objects as lined-delimited JSON to the file at the specified path
 */
exports.appendObjectsToFile = function(path, objects) {
    var stream = fs.createWriteStream(path, {'flags':'a', 'encoding': 'utf-8'});
    for(i in objects) {
        stream.write(JSON.stringify(objects[i]) + '\n');
    }
    stream.end();
}

/**
 * Writes an array of objects as lined-delimited JSON to the file at the specified path
 */
exports.writeObjectsToFile = function(path, objects) {
    var stream = fs.createWriteStream(path, {'encoding': 'utf-8'});
    for(i in objects) {
        stream.write(JSON.stringify(objects[i]) + '\n');
    }
    stream.end();
}

/**
 * Reads an array of objects as lined-delimited JSON from the file at the specified path
 */
exports.readObjectsFromFile = function(path, callback) {
    var stream = fs.createReadStream(path, {'encoding': 'utf-8'});
    var data = "";
    stream.on('data', function(newData) {
        data += newData;
    });
    stream.on('end', function() {
        var itemStrings = data.split('\n');
        var items = [];
        for(var i = 0; i < itemStrings.length; i++) {
            if(itemStrings[i])
                items.push(JSON.parse(itemStrings[i]));
        }
        callback(items);
    });
    stream.on('error', function(err) {
        callback([]);
    });
}

/**
 * Writes the metadata object to the metadata file (meta.json) for the specified account
 */
exports.syncMeData = function(metadata) {
    fs.writeFileSync('me.json', JSON.stringify(metadata)); // write this back to locker service?
}

/**
 * Reads the metadata file (meta.json) from the specificed account, or the first one found
 * if no account is specified
 */
exports.loadMeData = function() {
    try {
        return JSON.parse(fs.readFileSync('me.json'));
    } catch(err) {
        return {};
    }
}

/**
 * Downloads the contents of a URL and saves it to the path, retrying if requested
 */
function writeURLContentsToFile(accountID, url, filename, encoding, retryCount) {
    if(!url || !accountID || !filename)
        return;
    var wwwdude_client = wwwdude.createClient({
        encoding: encoding
    });
    wwwdude_client.get(url)
    .addListener('error',
    function(err) {
        sys.puts('Network Error: ' + sys.inspect(err));
        if(retryCount > 0)
            writeURLContentsToFile(accountID, url, filename, encoding, retryCount - 1);
    })
    .addListener('http-error',
    function(data, resp) {
        sys.puts('HTTP Error for: ' + resp.host + ' code: ' + resp.statusCode);
        if(retryCount > 0)
            writeURLContentsToFile(accountID, url, filename, encoding, retryCount - 1);
    })
    .addListener('success',
    function(data, resp) {
        fs.writeFileSync('my/' + accountID + '/' + filename, data, encoding);
    }).send();
}
exports.writeURLContentsToFile = function(accountID, url, filename, encoding, retryCount) {
    if(!retryCount)
        retryCount = 0;
    writeURLContentsToFile(accountID, url, filename, encoding, retryCount);
}

/**
 * Lists the subdirectories at the specified path
 */
function listSubdirectories(path) {
    var files = fs.readdirSync(path);
    var dirs = [];
    for(i in files) {    
        var fullPath = path + '/' + files[i];
        var stats = fs.statSync(fullPath);
        if(!stats.isDirectory())
            continue;
        dirs.push(files[i]);
    }
    return dirs;
}