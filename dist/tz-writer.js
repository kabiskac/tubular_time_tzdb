"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTimezones = exports.getTzData = exports.TzMessageLevel = exports.TzPhase = exports.TzPresets = exports.TzFormat = void 0;
const iana_zones_and_rules_parser_1 = require("./iana-zones-and-rules-parser");
const population_and_country_data_1 = require("./population-and-country-data");
const math_1 = require("@tubular/math");
const time_1 = __importStar(require("@tubular/time"));
const util_1 = require("@tubular/util");
const tz_compiler_1 = require("./tz-compiler");
const tz_transition_list_1 = require("./tz-transition-list");
const stream_1 = require("stream");
const tz_binary_1 = require("./tz-binary");
const tz_util_1 = require("./tz-util");
const read_tzdb_1 = require("./read-tzdb");
var TzFormat;
(function (TzFormat) {
    TzFormat[TzFormat["BINARY"] = 0] = "BINARY";
    TzFormat[TzFormat["JSON"] = 1] = "JSON";
    TzFormat[TzFormat["JAVASCRIPT"] = 2] = "JAVASCRIPT";
    TzFormat[TzFormat["TYPESCRIPT"] = 3] = "TYPESCRIPT";
    TzFormat[TzFormat["TEXT"] = 4] = "TEXT";
})(TzFormat = exports.TzFormat || (exports.TzFormat = {}));
var TzPresets;
(function (TzPresets) {
    TzPresets[TzPresets["NONE"] = 0] = "NONE";
    TzPresets[TzPresets["SMALL"] = 1] = "SMALL";
    TzPresets[TzPresets["LARGE"] = 2] = "LARGE";
    TzPresets[TzPresets["LARGE_ALT"] = 3] = "LARGE_ALT";
})(TzPresets = exports.TzPresets || (exports.TzPresets = {}));
var TzPhase;
(function (TzPhase) {
    TzPhase[TzPhase["DOWNLOAD"] = 0] = "DOWNLOAD";
    TzPhase[TzPhase["EXTRACT"] = 1] = "EXTRACT";
    TzPhase[TzPhase["PARSE"] = 2] = "PARSE";
    TzPhase[TzPhase["COMPILE"] = 3] = "COMPILE";
    TzPhase[TzPhase["VALIDATE"] = 4] = "VALIDATE";
    TzPhase[TzPhase["REENCODE"] = 5] = "REENCODE";
    TzPhase[TzPhase["OUTPUT_OF_RESULTS"] = 6] = "OUTPUT_OF_RESULTS";
    TzPhase[TzPhase["DONE"] = 7] = "DONE";
})(TzPhase = exports.TzPhase || (exports.TzPhase = {}));
var TzMessageLevel;
(function (TzMessageLevel) {
    TzMessageLevel[TzMessageLevel["INFO"] = 0] = "INFO";
    TzMessageLevel[TzMessageLevel["LOG"] = 1] = "LOG";
    TzMessageLevel[TzMessageLevel["WARN"] = 2] = "WARN";
    TzMessageLevel[TzMessageLevel["ERROR"] = 3] = "ERROR";
})(TzMessageLevel = exports.TzMessageLevel || (exports.TzMessageLevel = {}));
const skippedZones = /America\/Indianapolis|America\/Knox_IN|Asia\/Riyadh\d\d/;
const extendedRegions = /(America\/Argentina|America\/Indiana)\/(.+)/;
const skippedRegions = /Etc|GB|GB-Eire|GMT0|NZ|NZ-CHAT|SystemV|W-SU|Zulu|Mideast|[A-Z]{3}(\d[A-Z]{3})?/;
const miscUnique = /CST6CDT|EET|EST5EDT|MST7MDT|PST8PDT|SystemV\/AST4ADT|SystemV\/CST6CDT|SystemV\/EST5EDT|SystemV\/MST7MDT|SystemV\/PST8PDT|SystemV\/YST9YDT|WET/;
async function getTzData(options = {}, asString = false) {
    const stream = new stream_1.Writable();
    const output = [];
    if (options.format !== TzFormat.JSON)
        asString = true;
    stream.write = (chunk) => {
        output.push(chunk.toString());
        return true;
    };
    await writeTimezones(Object.assign({ fileStream: stream, format: TzFormat.JSON }, options));
    return asString ? output.join('') : JSON.parse(output.join(''));
}
exports.getTzData = getTzData;
async function writeTimezones(options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    options.format = (_a = options.format) !== null && _a !== void 0 ? _a : TzFormat.JSON;
    options.preset = (_b = options.preset) !== null && _b !== void 0 ? _b : TzPresets.NONE;
    let minYear = (_c = options.minYear) !== null && _c !== void 0 ? _c : tz_util_1.DEFAULT_MIN_YEAR;
    let maxYear = (_d = options.maxYear) !== null && _d !== void 0 ? _d : tz_util_1.DEFAULT_MAX_YEAR;
    let variableName = 'tzData';
    const currentYear = (0, time_1.default)().wallTime.y;
    const cutoffYear = currentYear + 67;
    const qt = (options.format > TzFormat.JSON) ? "'" : '"';
    const iqt = (options.format > TzFormat.JSON) ? '' : '"';
    const stream = (_e = options.fileStream) !== null && _e !== void 0 ? _e : process.stdout;
    const progress = options.callback;
    let trimMarkers = false;
    const report = (phase, level, message, n, m) => {
        if (progress)
            progress(phase, level, message, n, m);
    };
    const write = (s = '') => {
        stream.write(s + '\n');
    };
    switch (options.preset) {
        case TzPresets.SMALL:
            variableName = 'timezoneSmall';
            minYear = (_f = options.minYear) !== null && _f !== void 0 ? _f : currentYear - 5;
            maxYear = (_g = options.maxYear) !== null && _g !== void 0 ? _g : currentYear + 5;
            options.filtered = (_h = options.filtered) !== null && _h !== void 0 ? _h : false;
            options.roundToMinutes = (_j = options.roundToMinutes) !== null && _j !== void 0 ? _j : false;
            options.fixRollbacks = (_k = options.fixRollbacks) !== null && _k !== void 0 ? _k : false;
            options.systemV = true;
            trimMarkers = true;
            break;
        case TzPresets.LARGE:
            variableName = 'timezoneLarge';
            minYear = (_l = options.minYear) !== null && _l !== void 0 ? _l : 1800;
            maxYear = (_m = options.maxYear) !== null && _m !== void 0 ? _m : cutoffYear;
            options.filtered = (_o = options.filtered) !== null && _o !== void 0 ? _o : false;
            options.roundToMinutes = (_p = options.roundToMinutes) !== null && _p !== void 0 ? _p : false;
            options.fixRollbacks = (_q = options.fixRollbacks) !== null && _q !== void 0 ? _q : false;
            options.systemV = true;
            trimMarkers = true;
            break;
        case TzPresets.LARGE_ALT:
            variableName = 'timezoneLargeAlt';
            minYear = (_r = options.minYear) !== null && _r !== void 0 ? _r : 1800;
            maxYear = (_s = options.maxYear) !== null && _s !== void 0 ? _s : cutoffYear;
            options.filtered = true;
            options.roundToMinutes = true;
            options.fixRollbacks = true;
            options.systemV = true;
            trimMarkers = true;
    }
    const parser = new iana_zones_and_rules_parser_1.IanaZonesAndRulesParser();
    const singleZone = options.singleRegionOrZone && !read_tzdb_1.MAIN_REGIONS.has(options.singleRegionOrZone) &&
        options.singleRegionOrZone;
    const singleRegion = !singleZone && ((_t = options.singleRegionOrZone) === null || _t === void 0 ? void 0 : _t.toLowerCase());
    const version = await parser.parseFromOnline({
        mode: options.mode,
        noBackward: options.noBackward,
        roundToMinutes: options.roundToMinutes,
        packrat: options.packrat,
        progress,
        singleRegion,
        systemV: options.systemV,
        urlOrVersion: options.urlOrVersion
    });
    if (!singleZone)
        report(TzPhase.PARSE, TzMessageLevel.INFO, version);
    let comment = `tz database version: ${version}, years ${minYear}-${maxYear}`;
    if (options.mode === iana_zones_and_rules_parser_1.TzMode.REARGUARD)
        comment += ', rearguard';
    else if (options.mode === iana_zones_and_rules_parser_1.TzMode.VANGUARD)
        comment += ', vanguard';
    if (options.roundToMinutes)
        comment += ', rounded to nearest minute';
    if (options.filtered)
        comment += ', filtered';
    if (options.fixRollbacks)
        comment += ', calendar rollbacks eliminated';
    const compiler = new tz_compiler_1.TzCompiler(parser);
    let zoneMap;
    if (singleZone)
        zoneMap = new Map().set(singleZone, await compiler.compile(singleZone, minYear, maxYear));
    else
        zoneMap = await compiler.compileAll(minYear, maxYear, progress);
    let zoneList = Array.from(zoneMap.keys());
    const sortKey = (zoneId) => zoneMap.get(zoneId).aliasFor ? zoneId : '*' + zoneId;
    const zonesByCTT = new Map();
    const cttsByZone = new Map();
    let duplicatesFound = false;
    const notOriginallyAliased = new Set(Array.from(zoneMap.values()).filter(z => !z.aliasFor).map(z => z.zoneId));
    zoneList = zoneList.sort((a, b) => (0, util_1.compareStrings)(sortKey(a), sortKey(b))).filter(z => !shouldFilter(z, options, singleZone));
    // Purge duplicates
    for (let i = 0; i < zoneList.length; ++i) {
        const zoneId = zoneList[i];
        const zone = zoneMap.get(zoneId);
        if (zone.aliasFor && !singleZone)
            continue;
        else if (options.zoneInfoDir) {
            const tzInfo = tz_transition_list_1.TzTransitionList.getZoneTransitionsFromZoneinfo(options.zoneInfoDir, zoneId, options.roundToMinutes);
            if (tzInfo)
                zone.transitionsMatch(tzInfo, false, options.roundToMinutes, progress);
            else
                progress(TzPhase.VALIDATE, TzMessageLevel.ERROR, `*** ${zoneId}: matching zoneinfo file unavailable for validation`);
        }
        if (options.fixRollbacks &&
            zone.findCalendarRollbacks(true, progress) === tz_transition_list_1.Rollbacks.ROLLBACKS_REMAIN)
            report(TzPhase.REENCODE, TzMessageLevel.ERROR, `*** Failed to fix calendar rollbacks in ${zoneId}`);
        report(TzPhase.REENCODE, TzMessageLevel.INFO, `Compressing ${zoneId} \x1B[50G%s of %s`, i + 1, zoneList.length);
        const ctt = zone.createCompactTransitionTable(options.fixRollbacks);
        if (zonesByCTT.has(ctt)) {
            duplicatesFound = true;
            const prevId = zonesByCTT.get(ctt);
            // Keep the zoneId with the higher population
            if ((0, population_and_country_data_1.getPopulation)(prevId) > (0, population_and_country_data_1.getPopulation)(zoneId))
                zone.aliasFor = prevId;
            else {
                zone.aliasFor = undefined;
                zonesByCTT.set(ctt, zoneId);
                cttsByZone.set(zoneId, ctt);
                zoneMap.get(prevId).aliasFor = zoneId;
            }
        }
        else {
            zonesByCTT.set(ctt, zoneId);
            cttsByZone.set(zoneId, ctt);
        }
    }
    for (const zoneId of zoneList) {
        const zone = zoneMap.get(zoneId);
        if (zone.aliasFor) {
            let parent;
            while ((_u = (parent = zoneMap.get(zone.aliasFor))) === null || _u === void 0 ? void 0 : _u.aliasFor)
                zone.aliasFor = parent.aliasFor;
        }
    }
    if (duplicatesFound)
        zoneList.sort((a, b) => (0, util_1.compareStrings)(sortKey(a), sortKey(b)));
    report(TzPhase.OUTPUT_OF_RESULTS);
    if (options.format === TzFormat.JSON)
        write('{');
    else if (options.format === TzFormat.JAVASCRIPT || options.format === TzFormat.TYPESCRIPT) {
        write('/* eslint-disable quote-props */');
        write('/* cspell:disable */ // noinspection SpellCheckingInspection');
        write(`const ${variableName} = ${trimMarkers ? '/* trim-file-start */' : ''}{ // ${comment}`);
    }
    else if (options.format === TzFormat.TEXT) {
        write(comment);
        write('-'.repeat(comment.length));
        write();
    }
    const deltaTs = (_v = parser.getDeltaTs()) === null || _v === void 0 ? void 0 : _v.trim();
    const leaps = (_w = parser.getLeapSeconds()) === null || _w === void 0 ? void 0 : _w.trim();
    if (options.format !== TzFormat.BINARY && options.format !== TzFormat.TEXT) {
        write(`  ${iqt}version${iqt}: ${qt}${version}${qt},`);
        write(`  ${iqt}years${iqt}: ${qt}${minYear}-${maxYear}${qt},`);
        if (deltaTs)
            write(`  ${iqt}deltaTs${iqt}: ${qt}${deltaTs}${qt},`);
        if (leaps)
            write(`  ${iqt}leapSeconds${iqt}: ${qt}${leaps}${qt},`);
    }
    else if (options.format === TzFormat.TEXT && !singleZone) {
        if (deltaTs) {
            write('----------- Delta T -----------');
            let lines = '';
            deltaTs.split(/\s+/).forEach((dt, i, dts) => {
                if (i % 10 === 0)
                    lines += (2020 + i).toString() +
                        (i === dts.length - 1 ? '     ' : '-' + (2020 + i + (0, math_1.min)(dts.length - i - 1, 9))) + ':';
                lines += ' ' + dt + (i < dts.length - 1 ? ',' : '');
                lines += (i === dts.length - 1 || (i + 1) % 10 === 0 ? '\n' : '');
            });
            write(lines);
        }
        if (leaps) {
            write('----------- Leap seconds -----------');
            let deltaTAI = 10;
            leaps.split(/\s+/).map(day => (0, util_1.toNumber)(day)).forEach(day => {
                deltaTAI += (day > 0 ? 1 : -1);
                write(new time_1.DateTime((0, math_1.abs)(day) * 86400000 - 1000, 'UTC').format('MMM DD, Y HH:mm:ss')
                    .replace(/:59$/, day > 0 ? ':60' : ':58') + ` TAI = UTC + ${deltaTAI}`
                    + (day < 0 ? ' (negative leap second)' : ''));
            });
            write();
        }
    }
    for (let i = 0; i < zoneList.length; ++i) {
        await new Promise(resolve => {
            const zoneId = zoneList[i];
            const zone = zoneMap.get(zoneId);
            if (options.format === TzFormat.TEXT) {
                zone.dump(stream, options.roundToMinutes);
                if (i < zoneList.length)
                    write();
                resolve();
                return;
            }
            else if (options.format === TzFormat.BINARY) {
                (0, tz_binary_1.writeZoneInfoFile)(options.directory, zone, options.bloat, options.includeLeaps ? leaps : null).then(() => resolve());
                return;
            }
            const delim = (i < zoneList.length - 1 ? ',' : '');
            if (!options.noAliases && zone.aliasFor && zoneList.includes(zone.aliasFor)) {
                let aliasFor = zone.aliasFor;
                const popAndC = (0, population_and_country_data_1.getPopulationAndCountries)(zoneId);
                const aliasPopAndC = (0, population_and_country_data_1.getPopulationAndCountries)(aliasFor);
                if (popAndC !== aliasPopAndC) {
                    if (!popAndC)
                        aliasFor = '!' + aliasFor;
                    else
                        aliasFor = `!${popAndC.replace(/;/g, ',')},${aliasFor}`;
                }
                else if (notOriginallyAliased.has(zoneId))
                    aliasFor = '!' + aliasFor;
                write(`  ${qt}${zoneId}${qt}: ${qt}${aliasFor}${qt}${delim}`);
            }
            else {
                if (options.posixFormat) {
                    write(`  ${qt}${zoneId}${qt}: ${qt}${zone.createPosixRule()}${qt}${delim}`);
                }
                else {
                    let ctt = cttsByZone.get(zoneId);
                    if (!ctt)
                        ctt = zone.createCompactTransitionTable(options.fixRollbacks);
                    write(`  ${qt}${zoneId}${qt}: ${qt}${(0, population_and_country_data_1.appendPopulationAndCountries)(ctt, zoneId)}${qt}${delim}`);
                }
            }
            resolve();
        });
    }
    if (options.format !== TzFormat.TEXT && options.format !== TzFormat.BINARY) {
        write('}' + (options.format !== TzFormat.JSON && trimMarkers ? '/* trim-file-end */;' :
            options.format === TzFormat.JSON ? '' : ';'));
        if (options.format !== TzFormat.JSON) {
            write();
            write(`Object.freeze(${variableName});`);
            if (options.format === TzFormat.JAVASCRIPT)
                write(`module.exports = ${variableName};`);
            else if (options.format === TzFormat.TYPESCRIPT)
                write(`export default ${variableName};`);
        }
    }
    report(TzPhase.DONE);
}
exports.writeTimezones = writeTimezones;
function shouldFilter(zoneId, options, singleZone) {
    if ((options.filtered && skippedZones.test(zoneId)) || (singleZone && zoneId !== singleZone))
        return true;
    let region;
    let locale;
    const $ = extendedRegions.exec(zoneId);
    if ($) {
        region = $[1];
        locale = $[2];
    }
    else {
        const pos = zoneId.indexOf('/');
        region = (pos < 0 ? zoneId : zoneId.substr(0, pos));
        locale = (pos < 0 ? null : zoneId.substr(pos + 1));
    }
    return (options.filtered && (locale == null || skippedRegions.test(region)) && !miscUnique.test(zoneId));
}
//# sourceMappingURL=tz-writer.js.map