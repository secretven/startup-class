#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var restler = require("restler");
var util = require("util");

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};


var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);

    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var runChecks = function(htmlFile, checksFile) {
    var checkJson = checkHtmlFile(htmlFile, checksFile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

var runChecksOnUrl = function(url, htmlFile, checksFile) {
    var responseWriteFile = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            fs.writeFileSync(htmlFile, result);
	    runChecks(htmlFile, checksFile);
        }
    };

    return responseWriteFile;
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <html_file_url>', 'URL Path to index.html', "")
        .parse(process.argv);
    console.log(program.checks + " " + program.file + " " + program.url);
    if (program.url != "") {
        program.file = "tmp.html";
        var responseWriteFile = runChecksOnUrl(program.url, program.file, program.checks);
        restler.get(program.url).on('complete', responseWriteFile);
    } else {
        runChecks(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
