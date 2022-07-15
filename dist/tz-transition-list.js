"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TzTransitionList = exports.Rollbacks = void 0;
const math_1 = require("@tubular/math");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tz_transition_1 = require("./tz-transition");
const util_1 = require("@tubular/util");
const time_1 = require("@tubular/time");
const tz_util_1 = require("./tz-util");
const population_and_country_data_1 = require("./population-and-country-data");
const tz_writer_1 = require("./tz-writer");
var Rollbacks;
(function (Rollbacks) {
    Rollbacks[Rollbacks["NO_ROLLBACKS"] = 0] = "NO_ROLLBACKS";
    Rollbacks[Rollbacks["ROLLBACKS_FOUND"] = 1] = "ROLLBACKS_FOUND";
    Rollbacks[Rollbacks["ROLLBACKS_REMOVED"] = 2] = "ROLLBACKS_REMOVED";
    Rollbacks[Rollbacks["ROLLBACKS_REMAIN"] = 3] = "ROLLBACKS_REMAIN";
})(Rollbacks = exports.Rollbacks || (exports.Rollbacks = {}));
const ZONE_MATCHING_TOLERANCE = 3600 * 24 * 30 * 3; // Three months, in seconds.
const formatUtcOffset = time_1.Timezone.formatUtcOffset;
class TzTransitionList extends Array {
    constructor(zoneId, aliasFor) {
        super();
        this.zoneId = zoneId;
        this.aliasFor = aliasFor;
    }
    clone(withId, aliasFor) {
        const theClone = (0, util_1.clone)(this);
        if (withId)
            theClone.zoneId = withId; // Not a perfect clone anymore
        if (aliasFor)
            theClone.aliasFor = aliasFor; // Not a perfect clone anymore
        return theClone;
    }
    getLastZoneRec() {
        return this.lastZoneRec;
    }
    setLastZoneRec(lastZoneRec) {
        this.lastZoneRec = lastZoneRec;
    }
    findCalendarRollbacks(fixRollbacks, progress) {
        let rollbackCount = 0;
        let warningShown = false;
        for (let i = 1; i < this.length; ++i) {
            const prev = this[i - 1];
            const curr = this[i];
            const before = (0, tz_util_1.makeTime)(curr.time - 1, prev.utcOffset).tz(time_1.Timezone.ZONELESS, true);
            const after = (0, tz_util_1.makeTime)(curr.time, curr.utcOffset).tz(time_1.Timezone.ZONELESS, true);
            if (after.compare(before, 'days') < 0) {
                ++rollbackCount;
                const turnbackTime = (0, tz_util_1.makeTime)(curr.time, prev.utcOffset);
                const wallTime = turnbackTime.wallTime;
                const midnight = new time_1.DateTime({ y: wallTime.y, m: wallTime.m, d: wallTime.d, utcOffset: prev.utcOffset });
                const forayIntoNextDay = turnbackTime.utcSeconds - midnight.utcSeconds;
                if (forayIntoNextDay === 0)
                    --rollbackCount;
                else if (progress && !warningShown) {
                    const forayMinutes = (0, math_1.div_rd)(forayIntoNextDay, 60);
                    const foraySeconds = forayIntoNextDay % 60;
                    progress(tz_writer_1.TzPhase.REENCODE, tz_writer_1.TzMessageLevel.LOG, `* ${this.zoneId}: ${before.format(tz_util_1.DT_FORMAT)} rolls back to ${after.format(tz_util_1.DT_FORMAT)}` +
                        ` (${forayMinutes} minute${foraySeconds > 0 ? ', ' + foraySeconds + ' second' : ''} foray into next day)`);
                    warningShown = true;
                }
                if (fixRollbacks)
                    curr.time -= forayIntoNextDay;
            }
        }
        let stillHasRollbacks = false;
        if (rollbackCount > 0 && fixRollbacks)
            stillHasRollbacks = (this.findCalendarRollbacks(false, progress) === Rollbacks.ROLLBACKS_FOUND);
        if (warningShown) {
            if (fixRollbacks) {
                if (stillHasRollbacks)
                    progress(tz_writer_1.TzPhase.REENCODE, tz_writer_1.TzMessageLevel.WARN, `  *** ${this.zoneId} rollback${rollbackCount > 1 ? 's' : ''} NOT FIXED ***`);
                else
                    progress(tz_writer_1.TzPhase.REENCODE, tz_writer_1.TzMessageLevel.LOG, '  * fixed *');
            }
        }
        if (rollbackCount === 0)
            return Rollbacks.NO_ROLLBACKS;
        else if (!fixRollbacks)
            return Rollbacks.ROLLBACKS_FOUND;
        else if (stillHasRollbacks)
            return Rollbacks.ROLLBACKS_REMAIN;
        else
            return Rollbacks.ROLLBACKS_REMOVED;
    }
    removeDuplicateTransitions(strict = false) {
        for (let i = 1; i < this.length; ++i) {
            const prev = this[i - 1];
            const curr = this[i];
            if (curr.time === prev.time ||
                !strict && curr.utcOffset === prev.utcOffset && curr.dstOffset === prev.dstOffset && curr.name === prev.name)
                this.splice(i--, 1);
        }
    }
    eliminateNegativeDst() {
        let lastWasNegative = false;
        let lastNegativeOffset = 0;
        let lastNegativeSave = 0;
        for (let i = 0; i < this.length; ++i) {
            const t = this[i];
            let prev;
            if (i > 0 && t.utcOffset === (prev = this[i - 1]).utcOffset && t.name === prev.name &&
                prev.dstOffset > 0 && t.dstOffset === 0) {
                lastWasNegative = true;
                lastNegativeOffset = -prev.dstOffset;
                lastNegativeSave = prev.rule ? -prev.rule.save : lastNegativeOffset;
            }
            if (t.dstOffset < 0) {
                lastWasNegative = true;
                lastNegativeOffset = t.dstOffset;
                t.dstOffset = 0;
                if (t.rule) {
                    t.rule = (0, util_1.clone)(t.rule);
                    if (t.rule.save < 0) {
                        lastNegativeSave = t.rule.save;
                        t.rule.save = 0;
                    }
                }
            }
            else if (lastWasNegative) {
                if (t.dstOffset === 0) {
                    t.dstOffset = -lastNegativeOffset;
                    if (t.rule) {
                        t.rule = (0, util_1.clone)(t.rule);
                        t.rule.save = -lastNegativeSave;
                        if (t.rule.atType === tz_util_1.ClockType.CLOCK_TYPE_STD && lastNegativeSave === -3600 && t.rule.atHour < 23)
                            --t.rule.atHour;
                    }
                }
                lastWasNegative = false;
            }
        }
    }
    trim(minYear, maxYear) {
        if (minYear !== Number.MIN_SAFE_INTEGER) {
            // Find the latest Standard Time transition before minYear. Change the start time of that
            // transition to the programmatic beginning of time, and delete all other transitions before it.
            let match = -1;
            let tzt;
            for (let i = 0; i < this.length; ++i) {
                tzt = this[i];
                if (tzt.time === Number.MIN_SAFE_INTEGER)
                    continue;
                const ldt = (0, tz_util_1.makeTime)(tzt.time + 1, tzt.utcOffset);
                if (ldt.wallTime.y >= minYear)
                    break;
                else if (tzt.dstOffset === 0)
                    match = i;
            }
            if (match >= 0) {
                this.splice(0, match);
                this[0].time = Number.MIN_SAFE_INTEGER;
            }
        }
        // End on a transition to Standard Time within the proper year range
        for (let i = this.length - 1; i >= 0; --i) {
            const tzt = this[i];
            if (tzt.time === Number.MIN_SAFE_INTEGER)
                continue;
            const ldt = (0, tz_util_1.makeTime)(tzt.time + tzt.utcOffset, 0);
            if (tzt.dstOffset !== 0 || ldt.wallTime.y > maxYear)
                this.splice(i, 1);
            else
                break;
        }
    }
    // The format produced here borrows some key ideas, like the use of base-60 numbers, from the moment.js timezone package.
    // https://momentjs.com/timezone/
    //
    // Though somewhat similar in appearance, the format is not compatible.
    createCompactTransitionTable(fixCalendarRollbacks = false) {
        let sb = '';
        const baseOffset = this[0].utcOffset;
        const [nominalStdOffset, nominalDstOffset, finalStdRule, finalDstRule] = this.findFinalRulesAndOffsets();
        sb += formatUtcOffset(baseOffset, true) + ' ' + formatUtcOffset(nominalStdOffset, true) +
            ' ' + (0, math_1.div_rd)(nominalDstOffset, 60) + ';';
        const uniqueOffsetList = [];
        const offsetList = [];
        for (const t of this) {
            let offset = (0, tz_util_1.toBase60)(t.utcOffset / 60) + '/' + (0, tz_util_1.toBase60)(t.dstOffset / 60);
            if (t.name != null && t.name.length !== 0)
                offset += '/' + t.name;
            if (!uniqueOffsetList.includes(offset))
                uniqueOffsetList.push(offset);
            offsetList.push(offset);
        }
        for (const offset of uniqueOffsetList)
            sb += offset + ' ';
        sb = sb.trimEnd() + ';';
        for (let i = 1; i < this.length; ++i)
            sb += (0, tz_util_1.toBase60)(uniqueOffsetList.indexOf(offsetList[i]));
        sb += ';';
        let lastTime = 0;
        for (let i = 1; i < this.length; ++i) {
            const t = this[i];
            sb += (0, tz_util_1.toBase60)((t.time - lastTime) / 60) + ' ';
            lastTime = t.time;
        }
        sb = sb.trimEnd();
        if (finalStdRule != null && finalDstRule != null) {
            if (fixCalendarRollbacks) {
                let fallBackRule = finalStdRule;
                let aheadRule = finalDstRule;
                let fallBackAmount = finalDstRule.save;
                if (fallBackAmount < 0) {
                    fallBackRule = finalDstRule;
                    aheadRule = finalStdRule;
                    fallBackAmount *= -1;
                }
                let turnbackTime = (fallBackRule.atHour * 60 + fallBackRule.atMinute) * 60;
                if (fallBackRule.atType === tz_util_1.ClockType.CLOCK_TYPE_UTC)
                    turnbackTime += nominalStdOffset + aheadRule.save;
                else if (fallBackRule.atType === tz_util_1.ClockType.CLOCK_TYPE_STD)
                    turnbackTime += aheadRule.save;
                if (turnbackTime > 0 && turnbackTime - fallBackAmount < 0) {
                    fallBackRule.atMinute -= turnbackTime;
                    while (fallBackRule.atMinute < 0) {
                        fallBackRule.atMinute += 60;
                        --fallBackRule.atHour;
                    }
                }
            }
            sb += `;${finalStdRule.toCompactTailRule()},${finalDstRule.toCompactTailRule()}`;
        }
        sb = sb.replace(/;$/, '');
        return sb;
    }
    dump(out = process.stdout, roundToMinutes = false) {
        const write = (s) => {
            out.write(s + '\n');
        };
        const formatOffset = (offset) => {
            return formatUtcOffset(offset, true).padEnd(roundToMinutes ? 5 : 7, '0');
        };
        write(`-------- ${this.zoneId} --------`);
        if (this.aliasFor)
            write(`  Alias for ${this.aliasFor}`);
        else if (this.length === 0)
            write('  (empty)');
        else if (this.length === 1) {
            const tzt = this[0];
            write(`  Fixed UTC offset at ${formatUtcOffset(tzt.utcOffset)}${tzt.name != null ? ' ' + tzt.name : ''}`);
        }
        else {
            const tzt = this[0];
            const format = tz_util_1.DT_FORMAT + (roundToMinutes ? '' : ':ss');
            const offsetSpace = '_'.repeat(roundToMinutes ? 4 : 6);
            const secs = roundToMinutes ? '' : ':__';
            write(`  ____-__-__ __:__${secs} ±${offsetSpace} ±${offsetSpace} --> ____-__-__ __:__${secs} ` +
                formatOffset(tzt.utcOffset) + ' ' + formatOffset(tzt.dstOffset) +
                (tzt.name != null ? ' ' + tzt.name : ''));
            for (let i = 1; i < this.length; ++i) {
                const prev = this[i - 1];
                const prevOffset = prev.utcOffset;
                const curr = this[i];
                const currOffset = curr.utcOffset;
                const prevDateTime = (0, tz_util_1.makeTime)(curr.time - 1, prevOffset);
                const currDateTime = (0, tz_util_1.makeTime)(curr.time, currOffset);
                write('  ' + prevDateTime.format(format) + ' ' + formatOffset(prev.utcOffset) +
                    ' ' + formatOffset(prev.dstOffset) + ' --> ' +
                    currDateTime.format(format) + ' ' + formatOffset(curr.utcOffset) +
                    ' ' + formatOffset(curr.dstOffset) +
                    (curr.name != null ? ' ' + curr.name : '') + (curr.dstOffset !== 0 ? '*' : ''));
            }
            const [, , finalStdRule, finalDstRule] = this.findFinalRulesAndOffsets();
            if (finalStdRule)
                write(`  Final Standard Time rule: ${finalStdRule.toString()}`);
            if (finalDstRule)
                write(`  Final Daylight Saving Time rule: ${finalDstRule.toString()}`);
        }
        if ((0, population_and_country_data_1.getPopulation)(this.zoneId) > 0)
            write(`  Population: ${(0, population_and_country_data_1.getPopulation)(this.zoneId)}`);
        if ((0, population_and_country_data_1.getCountries)(this.zoneId))
            write(`  Countries: ${(0, population_and_country_data_1.getCountries)(this.zoneId)}`);
    }
    static getZoneTransitionsFromZoneinfo(zoneInfoPath, zoneId, roundToMinutes = false) {
        function conditionallyRoundToMinutes(seconds, roundToMinutes) {
            if (roundToMinutes)
                seconds = (0, math_1.div_rd)(seconds + 30, 60) * 60;
            return seconds;
        }
        // Derived from bsmi.util.ZoneInfo.java, http://bmsi.com/java/ZoneInfo.java, Copyright (C) 1999 Business Management Systems, Inc.
        // Modified to handle version 2 data.
        const transitions = new TzTransitionList(zoneId);
        const ziPath = path_1.default.join(zoneInfoPath, zoneId);
        if (!fs_1.default.existsSync(ziPath))
            return null;
        const buf = fs_1.default.readFileSync(ziPath);
        const format = (0, math_1.max)(buf.readUInt8(4) - 48, 1);
        let offset = 20;
        if (format > 1) {
            const tzh_ttisutcnt = buf.readUInt32BE(offset);
            const tzh_ttisstdcnt = buf.readUInt32BE(offset + 4);
            const tzh_leapcnt = buf.readUInt32BE(offset + 8);
            const transitionCount1 = buf.readUInt32BE(offset + 12);
            const typeCount1 = buf.readUInt32BE(offset + 16);
            const charCount = buf.readUInt32BE(offset + 20);
            offset += tzh_ttisutcnt + tzh_ttisstdcnt + tzh_leapcnt * 4 + transitionCount1 * 5 + typeCount1 * 6 + charCount + 56;
        }
        const transitionCount = buf.readUInt32BE(offset);
        const typeCount = buf.readUInt32BE(offset += 4);
        const times = new Array(transitionCount);
        const typeIndices = new Uint8Array(transitionCount);
        offset += 8;
        for (let i = 0; i < transitionCount; ++i) {
            if (format > 1) {
                times[i] = Number(buf.readBigInt64BE(offset));
                offset += 8;
            }
            else {
                times[i] = buf.readInt32BE(offset);
                offset += 4;
            }
        }
        buf.copy(typeIndices, 0, offset, offset += transitionCount);
        const offsets = new Array(typeCount);
        const dstFlags = new Array(typeCount);
        const nameIndices = new Uint8Array(typeCount);
        const names = new Array(typeCount);
        for (let i = 0; i < typeCount; ++i) {
            offsets[i] = buf.readInt32BE(offset);
            dstFlags[i] = (buf.readInt8(offset += 4) !== 0);
            nameIndices[i] = buf.readInt8(offset += 1);
            ++offset;
        }
        const namesOffset = offset;
        let lastStdOffset = offsets[0];
        for (let i = 0; i < typeCount; ++i) {
            const index = nameIndices[i];
            let end = index;
            while (buf.readInt8(namesOffset + end) !== 0)
                ++end;
            names[i] = buf.toString('utf8', namesOffset + index, namesOffset + end);
        }
        for (let i = 0; i <= transitionCount; ++i) {
            const type = (i < 1 ? 0 : typeIndices[i - 1]);
            let tTime;
            const offset = conditionallyRoundToMinutes(offsets[type], roundToMinutes);
            const isDst = dstFlags[type];
            const dst = isDst ? offset - lastStdOffset : 0;
            const name = names[type];
            if (i === 0 || times[i - 1] === -0x8000000)
                tTime = Number.MIN_SAFE_INTEGER;
            else
                tTime = conditionallyRoundToMinutes(times[i - 1], roundToMinutes);
            transitions.push(new tz_transition_1.TzTransition(tTime, offset, dst, /^[-+]/.test(name) ? null : name));
            if (!isDst)
                lastStdOffset = offset;
        }
        transitions.removeDuplicateTransitions();
        return transitions;
    }
    transitionsMatch(otherList, exact = true, roundToMinutes = false, progress) {
        const report = (message) => {
            if (progress)
                progress(tz_writer_1.TzPhase.VALIDATE, tz_writer_1.TzMessageLevel.ERROR, message);
        };
        if (exact && this.length !== otherList.length) {
            report(`*** ${this.zoneId}: ${this.length} != ${otherList.length}`);
            return false;
        }
        const roundingAllowance = (roundToMinutes ? 60 : 0);
        const start = (exact ? 0 : 1);
        for (let i = start, j = start; i < this.length && j < otherList.length; ++i, ++j) {
            const ti1 = this[i];
            const ti2 = otherList[j];
            if (!exact && ti1.time + ZONE_MATCHING_TOLERANCE < ti2.time) {
                --i;
                continue;
            }
            else if (ti2.time + ZONE_MATCHING_TOLERANCE < ti1.time) {
                --j;
                continue;
            }
            if ((0, math_1.abs)(ti1.time - ti2.time) < roundingAllowance ||
                (0, math_1.abs)(ti1.utcOffset - ti2.utcOffset) < roundingAllowance ||
                (0, math_1.abs)(ti1.dstOffset - ti2.dstOffset) < roundingAllowance ||
                ti1.name !== ti2.name) {
                report(`*** ${this.zoneId}, mismatch at index ${i}${i !== j ? '/' + j : ''}`);
                report(`  1: ${ti1.time}, ${ti1.utcOffset}, ${ti1.dstOffset}, ${ti1.name}: ${ti1.formatTime()}`);
                report(`  2: ${ti2.time}, ${ti2.utcOffset}, ${ti2.dstOffset}, ${ti2.name}: ${ti2.formatTime()}`);
                report(`  -: ${ti2.time - ti1.time}`);
                return false;
            }
        }
        return true;
    }
    findFinalRulesAndOffsets() {
        let nominalStdOffset = 0;
        let nominalDstOffset = 0;
        let finalStdRule;
        let finalDstRule;
        let lookingForStd = true;
        let lookingForStdRule = true;
        let lookingForDst = true;
        let lastRuleSet = null;
        let stdName = null;
        let dstName = null;
        if (this.lastZoneRec != null && this.lastZoneRec.rules == null) {
            nominalStdOffset = this.lastZoneRec.utcOffset;
            lookingForStd = lookingForDst = false;
        }
        for (let i = this.length - 1; i >= 0 && (lookingForStd || lookingForStdRule || lookingForDst); --i) {
            const tzt = this[i];
            if (tzt.rule == null) {
                if (lookingForStd)
                    nominalStdOffset = tzt.utcOffset - tzt.dstOffset;
                if (lookingForDst)
                    nominalDstOffset = tzt.dstOffset;
                break;
            }
            if (lastRuleSet == null)
                lastRuleSet = tzt.rule.name;
            else if (tzt.rule.name !== lastRuleSet)
                break;
            if (lookingForStd) {
                nominalStdOffset = tzt.utcOffset - tzt.dstOffset;
                lookingForStd = false;
            }
            if (lookingForStdRule && tzt.dstOffset === 0 && tzt.rule.endYear === Number.MAX_SAFE_INTEGER) {
                finalStdRule = tzt.rule;
                stdName = tzt.name || (0, tz_util_1.formatPosixOffset)(tzt.utcOffset, true);
                lookingForStdRule = false;
            }
            if (lookingForDst && tzt.dstOffset !== 0 && tzt.rule.endYear === Number.MAX_SAFE_INTEGER) {
                nominalDstOffset = tzt.dstOffset;
                finalDstRule = tzt.rule;
                dstName = tzt.name || (0, tz_util_1.formatPosixOffset)(tzt.utcOffset, true);
                lookingForDst = false;
            }
        }
        return [nominalStdOffset, nominalDstOffset, finalStdRule, finalDstRule, stdName, dstName];
    }
}
exports.TzTransitionList = TzTransitionList;
//# sourceMappingURL=tz-transition-list.js.map