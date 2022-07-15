#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const commander_1 = require("commander");
const read_tzdb_1 = require("./read-tzdb");
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const util_1 = require("@tubular/util");
const tz_writer_1 = require("./tz-writer");
const iana_zones_and_rules_parser_1 = require("./iana-zones-and-rules-parser");
const tz_util_1 = require("./tz-util");
const { version } = require('../package.json');
const program = new commander_1.Command();
const nl = '\n' + ' '.repeat(20);
const options = program
    .name('tzc')
    .description(`Downloads and compiles IANA timezone data, converting to text, zoneinfo binary\n\
files, or @tubular/time-compatible data.`)
    .usage('[options] [output_file_name_or_directory]')
    .version(version, '-v, --version')
    .addHelpText('after', '  -,                  Use dash by itself to output to stdout.')
    .option('-5, --systemv', `Include the SystemV timezones from the systemv file by${nl}\
uncommenting the commented-out zone descriptions.`)
    .option('-b, --binary', 'Output binary files to a directory, one file per timezone')
    .option('-B, --bloat', 'Equivalent to the zic "--bloat fat" option.')
    .option('-f', `Filter out Etc/GMTxxx and other timezones that are either${nl}\
redundant or covered by options for creating fixed-offset${nl}\
timezones.`)
    .option('-i', 'Include leap seconds in binary files.')
    .option('-j, --javascript', 'Output JavaScript instead of JSON.')
    .option('--large', 'Apply presets for "large" timezone definitions.')
    .option('--large-alt', 'Apply presets for "large-alt" timezone definitions.')
    .option('--list', 'List available tz database versions.')
    .option('-m', 'Round all UTC offsets to whole minutes.')
    .option('-n, --no-backward', 'Skip the additional aliases in the backward file.')
    .option('-o', 'Overwrite existing file/directory.')
    .option('-q', 'Display no progress messages, fewer warning messages.')
    .option('-R, --rearguard', 'Rearguard mode (skip vanguard features like negative DST).')
    .option('-r', `Remove 'calendar rollbacks' from time zone transitions --${nl}\
that is modify time zone data to prevent situations${nl}\
where the calendar date goes backwards as well as the${nl}\
hour and/or minute of the day.`)
    .option('-p, --packrat', 'Add additional timezones from the backzone file.')
    .option('-s <zone-id>', 'ID/name for a single timezone/region to be rendered.')
    .option('--small', 'Apply presets for "small" timezone definitions.')
    .option('-t, --typescript', 'Output TypeScript instead of JSON.')
    .option('--text', 'Output (somewhat) human-readable text')
    .option('-u, --url <url>', `URL or version number, such as '2018c', to parse and${nl}\
compile.${nl}\
Default: ${read_tzdb_1.DEFAULT_URL}`)
    .option('-V, --vanguard', 'Vanguard mode (use vanguard features like negative DST).')
    .option('-y <year-span>', `<min_year,max_year> Year range for explicit time zone${nl}\
transitions.${nl}\
Default: ${tz_util_1.DEFAULT_MIN_YEAR},${tz_util_1.DEFAULT_MAX_YEAR}`)
    .option('-z <zone-info-dir>', `Validate this tool's output against output from the${nl}\
standard zic tool stored in the given directory.${nl}\
(Validation is done before applying the -r option.)`)
    .arguments('[outfile]')
    .parse(process.argv).opts();
let lastWasInfo = false;
function progress(phase, level, message, step, stepCount) {
    const args = [message !== null && message !== void 0 ? message : ''];
    if (phase != null)
        args[0] = tz_writer_1.TzPhase[phase] + (args[0] ? ': ' + args[0] : '');
    if (step) {
        args.push((0, util_1.padLeft)(step, 3));
        if (stepCount)
            args.push(stepCount);
    }
    if (lastWasInfo)
        process.stdout.write('\x1B[A\x1B[K');
    if (level === tz_writer_1.TzMessageLevel.INFO && !options.q)
        console.info(...args);
    else if (level === tz_writer_1.TzMessageLevel.LOG && !options.q)
        console.log(...args);
    else if (level === tz_writer_1.TzMessageLevel.WARN)
        console.warn(...args);
    else if (level === tz_writer_1.TzMessageLevel.ERROR)
        console.error(...args);
    lastWasInfo = level === tz_writer_1.TzMessageLevel.INFO;
}
async function getUserInput() {
    return new Promise(resolve => {
        const callback = (data) => {
            process.stdin.off('data', callback);
            resolve(data.toString().trim());
        };
        process.stdin.on('data', callback);
    });
}
(async function () {
    var _a, _b;
    if (options.list) {
        try {
            (await (0, read_tzdb_1.getAvailableVersions)()).forEach(v => console.log(v));
            process.exit(0);
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
        return;
    }
    const tzOptions = {
        bloat: options.B,
        callback: progress,
        filtered: options.f,
        fixRollbacks: options.r,
        includeLeaps: options.i,
        mode: options.rearguard ? iana_zones_and_rules_parser_1.TzMode.REARGUARD : (options.vanguard ? iana_zones_and_rules_parser_1.TzMode.VANGUARD : iana_zones_and_rules_parser_1.TzMode.MAIN),
        noBackward: !options.backward,
        packrat: options.packrat,
        roundToMinutes: options.m,
        singleRegionOrZone: options.s,
        systemV: options.systemv,
        urlOrVersion: options.url,
        zoneInfoDir: options.z
    };
    if (options.small)
        tzOptions.preset = tz_writer_1.TzPresets.SMALL;
    else if (options.large)
        tzOptions.preset = tz_writer_1.TzPresets.LARGE;
    else if (options.largeAlt)
        tzOptions.preset = tz_writer_1.TzPresets.LARGE_ALT;
    let file = '';
    let fileStream;
    if (program.args[0] !== '-')
        file = program.args[0] || ('timezone' + (['s', '-small', '-large', '-large-alt'][(_a = tzOptions.preset) !== null && _a !== void 0 ? _a : 0]));
    if (options.binary)
        tzOptions.format = tz_writer_1.TzFormat.BINARY;
    else if (options.javascript || (!options.typescript && !options.text && file.endsWith('.js')))
        tzOptions.format = tz_writer_1.TzFormat.JAVASCRIPT;
    else if (options.typescript || (!options.text && file.endsWith('.ts')))
        tzOptions.format = tz_writer_1.TzFormat.TYPESCRIPT;
    else if (options.text || file.endsWith('.txt'))
        tzOptions.format = tz_writer_1.TzFormat.TEXT;
    else
        tzOptions.format = tz_writer_1.TzFormat.JSON;
    if (tzOptions.format === tz_writer_1.TzFormat.BINARY) {
        if (program.args[0] === '-') {
            console.error('stdout option (-) is not valid for binary format');
            process.exit(1);
        }
        else if (program.args[0])
            tzOptions.directory = program.args[0];
        else
            tzOptions.directory = 'zoneinfo';
        if (fs_1.default.existsSync(tzOptions.directory)) {
            const filePath = options.s ? path_1.default.join(tzOptions.directory, ...options.s.split('/')) : null;
            if (options.o) {
                if (filePath)
                    rimraf_1.default.sync(filePath);
                else
                    rimraf_1.default.sync(tzOptions.directory);
            }
            else if (filePath) {
                process.stdout.write(`File "${filePath}" already exists. Overwrite it? (y/N)? `);
                const response = await getUserInput();
                if (!/^y/i.test(response))
                    process.exit(0);
                else
                    rimraf_1.default.sync(filePath);
            }
            else {
                process.stdout.write(`Directory "${tzOptions.directory}" already exists. Overwrite it? (y/N)? `);
                const response = await getUserInput();
                if (!/^y/i.test(response))
                    process.exit(0);
                else
                    rimraf_1.default.sync(tzOptions.directory);
            }
        }
    }
    else if (file) {
        if (!file.includes('.'))
            file += ['', '.json', '.js', '.ts', '.txt'][(_b = tzOptions.format) !== null && _b !== void 0 ? _b : 0];
        if (!options.o && fs_1.default.existsSync(file)) {
            process.stdout.write(`File "${file}" already exists. Overwrite it? (y/N)? `);
            const response = await getUserInput();
            if (!/^y/i.test(response))
                process.exit(0);
            else
                rimraf_1.default.sync(file);
        }
        tzOptions.fileStream = (fileStream = fs_1.default.createWriteStream(file, 'utf8'));
    }
    if (options.y) {
        const parts = options.y.split(',');
        if (parts.length === 1)
            tzOptions.minYear = tzOptions.maxYear = (0, util_1.toInt)(parts[0]);
        else if (parts.length === 2) {
            tzOptions.minYear = parts[0] ? (0, util_1.toInt)(parts[0], tz_util_1.DEFAULT_MIN_YEAR) : undefined;
            tzOptions.maxYear = parts[1] ? (0, util_1.toInt)(parts[1], tz_util_1.DEFAULT_MAX_YEAR) : undefined;
        }
    }
    try {
        await (0, tz_writer_1.writeTimezones)(tzOptions);
        if (fileStream) {
            fileStream.close();
            await new Promise(resolve => fileStream.on('close', () => resolve()));
        }
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
//# sourceMappingURL=cli.js.map