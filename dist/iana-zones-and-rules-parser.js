"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IanaZonesAndRulesParser = exports.IanaParserError = exports.TzMode = void 0;
const iana_zone_record_1 = require("./iana-zone-record");
const tz_rule_1 = require("./tz-rule");
const util_1 = require("@tubular/util");
const read_tzdb_1 = require("./read-tzdb");
const tz_writer_1 = require("./tz-writer");
const tz_util_1 = require("./tz-util");
var TzMode;
(function (TzMode) {
    TzMode[TzMode["REARGUARD"] = 0] = "REARGUARD";
    TzMode[TzMode["MAIN"] = 1] = "MAIN";
    TzMode[TzMode["VANGUARD"] = 2] = "VANGUARD";
})(TzMode = exports.TzMode || (exports.TzMode = {}));
var TzModeInternal;
(function (TzModeInternal) {
    TzModeInternal[TzModeInternal["MAIN_EXPLICIT"] = 3] = "MAIN_EXPLICIT";
})(TzModeInternal || (TzModeInternal = {}));
class IanaParserError extends Error {
    constructor(lineNo, sourceName, message) {
        super(lineNo && sourceName ? `${sourceName}, line ${lineNo}: ${message}` : message);
        this.lineNo = lineNo;
        this.sourceName = sourceName;
    }
}
exports.IanaParserError = IanaParserError;
class IanaZonesAndRulesParser {
    constructor() {
        this.zoneMap = new Map();
        this.zoneAliases = new Map();
        this.ruleSetMap = new Map();
        this.currentMode = TzMode.MAIN;
        this.lineNo = 0;
        this.mode = TzMode.MAIN;
        this.noBackward = false;
        this.packrat = false;
        this.preAwked = false;
        this.roundToMinutes = false;
        this.ruleIndex = 0;
        this.systemV = false;
    }
    async parseFromOnline(options) {
        this.parseOptions(options);
        let tzData;
        if (options.urlOrVersion)
            tzData = await (0, read_tzdb_1.getByUrlOrVersion)(options.urlOrVersion, this.progress);
        else
            tzData = await (0, read_tzdb_1.getLatest)(this.progress);
        return this.parseTzData(tzData, options);
    }
    parseOptions(options) {
        var _a, _b, _c, _d, _e;
        options = Object.assign({}, options !== null && options !== void 0 ? options : {});
        this.mode = (_a = options.mode) !== null && _a !== void 0 ? _a : TzMode.MAIN;
        this.noBackward = (_b = options.noBackward) !== null && _b !== void 0 ? _b : false;
        this.packrat = (_c = options.packrat) !== null && _c !== void 0 ? _c : false;
        this.progress = options.progress;
        this.roundToMinutes = (_d = options.roundToMinutes) !== null && _d !== void 0 ? _d : false;
        this.singleRegion = options.singleRegion;
        this.systemV = (_e = options.systemV) !== null && _e !== void 0 ? _e : false;
    }
    async parseTzData(tzData, options) {
        this.parseOptions(options);
        if (this.progress)
            this.progress(tz_writer_1.TzPhase.PARSE, tz_writer_1.TzMessageLevel.INFO, 'Parsing tz database sources');
        const awkFile = this.mode !== TzMode.MAIN && (await (0, tz_util_1.hasCommand)('awk')) && tzData.sources['ziguard.awk'];
        delete tzData.sources['ziguard.awk'];
        if (this.noBackward)
            delete tzData.sources.backward;
        if (!this.packrat)
            delete tzData.sources.backzone;
        const dataForm = TzMode[this.mode].toLowerCase();
        const sourceName = dataForm + '.zi';
        if (this.singleRegion) {
            Object.keys(tzData.sources).forEach(key => {
                if (read_tzdb_1.MAIN_REGIONS.has(key) && key !== this.singleRegion)
                    delete tzData.sources[key];
            });
        }
        else if (tzData.sources[sourceName]) {
            this.mode = TzMode.MAIN;
            this.preAwked = true;
            Object.keys(tzData.sources).forEach(name => {
                if (name !== sourceName && !/^(backward|leap-seconds\.list|systemv|version)$/.test(name))
                    delete tzData.sources[name];
            });
        }
        if (awkFile) {
            this.mode = TzMode.MAIN;
            for (const name of Object.keys(tzData.sources)) {
                if (read_tzdb_1.TZ_REGION_FILES.has(name))
                    tzData.sources[name] = await (0, tz_util_1.monitorProcess)((0, tz_util_1.spawn)('awk', ['-v', 'DATAFORM=' + dataForm, awkFile], { inputText: tzData.sources[name] }));
            }
        }
        if (!this.systemV)
            delete tzData.sources.systemv;
        else if (tzData.sources.systemv)
            // Uncomment the commented-out rules and timezones in the systemv file
            tzData.sources.systemv = tzData.sources.systemv.replace(/## (Rule\s+SystemV|Zone)/g, '$1');
        this.deltaTs = tzData.deltaTs;
        this.leapSeconds = tzData.leapSeconds;
        this.parseSources(tzData);
        // Add aliases if needed for legacy time zones. Not all substitutes exactly duplicate their originals.
        if (this.systemV && !tzData.sources.systemv) {
            this.addAlias('SystemV/AST4', 'America/Anguilla');
            this.addAlias('SystemV/AST4ADT', 'America/Goose_Bay');
            this.addAlias('SystemV/CST6', 'America/Belize');
            this.addAlias('SystemV/CST6CDT', 'America/Chicago');
            this.addAlias('SystemV/EST5', 'America/Atikokan');
            this.addAlias('SystemV/EST5EDT', 'America/New_York');
            this.addAlias('SystemV/HST10', 'HST');
            this.addAlias('SystemV/MST7', 'America/Creston');
            this.addAlias('SystemV/MST7MDT', 'America/Boise');
            this.addAlias('SystemV/PST8', 'Etc/GMT+8');
            this.addAlias('SystemV/PST8PDT', 'America/Los_Angeles');
            this.addAlias('SystemV/YST9', 'Etc/GMT+8');
            this.addAlias('SystemV/YST9YDT', 'America/Anchorage');
        }
        if (!tzData.sources.pacificnew)
            this.addAlias('US/Pacific-New', 'America/Los_Angeles');
        return tzData.version;
    }
    getZoneIds() {
        let zoneIds = Array.from(this.zoneMap.keys()).map(zone => '*' + zone);
        zoneIds.push(...Array.from(this.zoneAliases.keys()));
        zoneIds = zoneIds.sort();
        zoneIds = zoneIds.map(zone => zone.replace('*', ''));
        return zoneIds;
    }
    getAliasFor(zoneId) {
        return this.zoneAliases.get(zoneId);
    }
    getZone(zoneId) {
        if (this.zoneAliases.has(zoneId))
            zoneId = this.zoneAliases.get(zoneId);
        return this.zoneMap.get(zoneId);
    }
    getRuleSet(rulesName) {
        return this.ruleSetMap.get(rulesName);
    }
    getDeltaTs() {
        return this.deltaTs;
    }
    getLeapSeconds() {
        return this.leapSeconds;
    }
    addAlias(alias, original) {
        const rootZone = this.getRootZone(original);
        if (rootZone)
            this.zoneAliases.set(alias, rootZone);
    }
    getRootZone(zoneId) {
        while (this.zoneAliases.has(zoneId))
            zoneId = this.zoneAliases.get(zoneId);
        return zoneId;
    }
    parseSources(tzData) {
        const sourceNames = Object.keys(tzData.sources);
        const sortKey = (key) => key === 'backward' ? 'zzz' : key === 'backzone' ? 'zzzzzz' : key;
        // Sort backward and backzone to the end
        sourceNames.sort((a, b) => (0, util_1.compareStrings)(sortKey(a), sortKey(b)));
        for (const sourceName of sourceNames)
            this.parseSource(sourceName, tzData.sources[sourceName]);
        // Remove aliases for anything that actually has its own defined zone.
        for (const zoneId of this.zoneMap.keys()) {
            if (this.zoneAliases.has(zoneId))
                this.zoneAliases.delete(zoneId);
        }
        // Make sure remaining aliases point to a defined zone.
        for (const zoneId of this.zoneAliases.keys()) {
            let original = zoneId;
            do { // Earlier version of the database has indirect links.
                original = this.zoneAliases.get(original);
            } while (this.zoneAliases.has(original));
            if (!this.zoneMap.has(original)) {
                if (this.singleRegion)
                    delete this.zoneAliases[original];
                else
                    throw new IanaParserError(0, null, `${zoneId} is mapped to unknown time zone ${original}`);
            }
        }
    }
    parseSource(sourceName, source) {
        let zone = null;
        let zoneId;
        let zoneRec;
        let zoneIndex = 0;
        const lines = (0, util_1.asLines)(source);
        let line;
        this.currentMode = TzMode.MAIN;
        this.lineNo = 0;
        this.currentSource = sourceName;
        while ((line = this.readLine(lines)) != null) {
            zoneRec = null;
            if (line.startsWith('Rule')) {
                const rule = tz_rule_1.TzRule.parseRule(line, ++this.ruleIndex);
                const ruleName = rule.name;
                let ruleSet = this.ruleSetMap.get(ruleName);
                if (ruleSet == null) {
                    ruleSet = new tz_rule_1.TzRuleSet(ruleName);
                    this.ruleSetMap.set(ruleName, ruleSet);
                }
                ruleSet.push(rule);
            }
            else if (line.startsWith('Link')) {
                const parts = line.split(/\s+/);
                this.zoneAliases.set(parts[2], parts[1]);
            }
            else if (line.startsWith('Zone')) {
                if (zone != null)
                    throw new IanaParserError(this.lineNo, this.currentSource, `Zone ${zoneId} was not properly terminated`);
                [zoneRec, zoneId] = iana_zone_record_1.IanaZoneRecord.parseZoneRecord(line, this.roundToMinutes);
                zone = new iana_zone_record_1.IanaZone(zoneId);
            }
            else if (zone != null)
                [zoneRec] = iana_zone_record_1.IanaZoneRecord.parseZoneRecord(line, this.roundToMinutes);
            if (zoneRec != null) {
                zoneRec.zoneIndex = zoneIndex++;
                zone.push(zoneRec);
                if (zoneRec.until === Number.MAX_SAFE_INTEGER) {
                    this.zoneMap.set(zoneId, zone);
                    zone = null;
                    zoneIndex = 0;
                }
            }
        }
    }
    readLine(lines) {
        let line;
        do {
            do {
                line = lines[0];
                ++this.lineNo;
                lines.splice(0, 1);
            } while (line != null && line.length === 0);
            if (line != null) {
                if (this.preAwked && this.noBackward && line === '# tzdb links for backward compatibility')
                    return undefined;
                const pos = line.indexOf('#');
                const commented = (pos === 0);
                if (commented && this.mode === TzMode.MAIN) {
                    line = '';
                    continue;
                }
                else if (commented) {
                    if (this.currentMode !== TzMode.MAIN && !/^# \S/.test(line))
                        line = line.substr(1);
                    else {
                        if (/^# Vanguard section\b/i.test(line))
                            this.currentMode = TzMode.VANGUARD;
                        else if (/^# Main section\b/i.test(line))
                            this.currentMode = TzModeInternal.MAIN_EXPLICIT;
                        else if (/^# Rearguard section\b/i.test(line))
                            this.currentMode = TzMode.REARGUARD;
                        else if (/^# End of (main|rearguard|vanguard) section\b/i.test(line))
                            this.currentMode = TzMode.MAIN;
                        line = '';
                    }
                }
                else if (pos > 0)
                    line = line.substring(0, pos);
                line = line.trimEnd();
                if (line.length > 0 && this.currentMode !== TzMode.MAIN && this.currentMode !== this.mode)
                    line = '';
            }
        } while (line != null && line.length === 0);
        return line;
    }
}
exports.IanaZonesAndRulesParser = IanaZonesAndRulesParser;
//# sourceMappingURL=iana-zones-and-rules-parser.js.map