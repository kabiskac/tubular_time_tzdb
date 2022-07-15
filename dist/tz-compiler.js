"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TzCompiler = exports.CompilerError = void 0;
const tz_util_1 = require("./tz-util");
const tz_transition_list_1 = require("./tz-transition-list");
const util_1 = require("@tubular/util");
const time_1 = require("@tubular/time");
const tz_transition_1 = require("./tz-transition");
const math_1 = require("@tubular/math");
const tz_writer_1 = require("./tz-writer");
class CompilerError extends Error {
}
exports.CompilerError = CompilerError;
class TzCompiler {
    constructor(parser) {
        this.parser = parser;
    }
    async compileAll(minYear = tz_util_1.DEFAULT_MIN_YEAR, maxYear = tz_util_1.DEFAULT_MAX_YEAR, progressOrSdr, progress) {
        const strictDuplicateRemoval = (0, util_1.isBoolean)(progressOrSdr) ? progressOrSdr : false;
        const compiledZones = new Map();
        const zoneIds = this.parser.getZoneIds();
        const deferred = [];
        progress = (0, util_1.isFunction)(progressOrSdr) ? progressOrSdr : progress;
        for (const zoneId of zoneIds) {
            const transitions = await this.compile(zoneId, minYear, maxYear, strictDuplicateRemoval, true);
            if (transitions)
                compiledZones.set(zoneId, transitions);
            else
                deferred.push(zoneId);
            if (progress)
                progress(tz_writer_1.TzPhase.COMPILE, tz_writer_1.TzMessageLevel.INFO, zoneId + ': \x1B[50G%s of %s', compiledZones.size, zoneIds.length);
        }
        for (const zoneId of deferred) {
            const alias = this.parser.getAliasFor(zoneId);
            if (alias && compiledZones.get(alias))
                compiledZones.set(zoneId, compiledZones.get(alias).clone(zoneId, alias));
        }
        return compiledZones;
    }
    async compile(zoneId, minYear = tz_util_1.DEFAULT_MIN_YEAR, maxYear = tz_util_1.DEFAULT_MAX_YEAR, strictDuplicateRemoval = false, canDefer = false) {
        const transitions = new tz_transition_list_1.TzTransitionList(zoneId);
        const zpc = {};
        const zone = this.parser.getZone(zoneId);
        let index = 0;
        transitions.aliasFor = this.parser.getAliasFor(zoneId);
        if (canDefer && transitions.aliasFor)
            return null;
        zpc.zoneId = zoneId;
        zpc.lastUtcOffset = 0;
        zpc.lastUntil = Number.MIN_SAFE_INTEGER;
        zpc.lastUntilType = tz_util_1.ClockType.CLOCK_TYPE_WALL;
        zpc.format = null;
        transitions.setLastZoneRec((0, util_1.last)(zone));
        while (index < zone.length) {
            const startTime = (0, util_1.processMillis)();
            await new Promise(resolve => {
                do {
                    const zoneRec = zone[index];
                    let dstOffset = 0;
                    if (zoneRec.rules != null && zoneRec.rules.indexOf(':') >= 0)
                        dstOffset = (0, time_1.parseTimeOffset)(zoneRec.rules, true);
                    zpc.zoneIndex = zoneRec.zoneIndex;
                    zpc.utcOffset = zoneRec.utcOffset;
                    zpc.until = zoneRec.until;
                    zpc.untilType = zoneRec.untilType;
                    zpc.format = zoneRec.format;
                    if (zoneRec.rules == null || zoneRec.rules.indexOf(':') >= 0) {
                        const name = TzCompiler.createDisplayName(zoneRec.format, '?', dstOffset !== 0);
                        transitions.push(new tz_transition_1.TzTransition(zpc.lastUntil, zoneRec.utcOffset + dstOffset, dstOffset, name, zoneRec.zoneIndex, zpc.lastUntilType));
                        if (zoneRec.untilType === tz_util_1.ClockType.CLOCK_TYPE_WALL)
                            zpc.until -= dstOffset;
                    }
                    else
                        this.applyRules(zoneRec.rules, transitions, zpc, minYear, maxYear);
                    zpc.lastUtcOffset = zpc.utcOffset;
                    zpc.lastUntil = zpc.until;
                    zpc.lastUntilType = zpc.untilType;
                    if (zpc.until < Number.MAX_SAFE_INTEGER / 2) {
                        const ldt = (0, tz_util_1.makeTime)(zpc.until, zpc.utcOffset);
                        if (ldt.wallTime.y > maxYear)
                            break;
                    }
                    ++index;
                } while (index < zone.length && (0, util_1.processMillis)() < startTime + 100);
                resolve();
            });
        }
        transitions.removeDuplicateTransitions(strictDuplicateRemoval);
        transitions.trim(minYear, maxYear);
        return transitions;
    }
    applyRules(rulesName, transitions, zpc, minYear, maxYear) {
        const ruleSet = this.parser.getRuleSet(rulesName);
        if (!ruleSet)
            throw new CompilerError(`Unknown rule set "${rulesName}" for timezone ${zpc.zoneId}`);
        const minTime = zpc.lastUntil;
        let firstStdLetters = '?';
        let fallbackStdLetters = '?';
        const zoneOffset = zpc.utcOffset;
        let lastDst = 0;
        let highYear;
        if (transitions.length > 0)
            lastDst = (0, util_1.last)(transitions).dstOffset;
        if (zpc.until >= Number.MAX_SAFE_INTEGER)
            highYear = 9999;
        else
            highYear = (0, tz_util_1.makeTime)(zpc.until, zoneOffset).wallTime.y;
        const newTransitions = new tz_transition_list_1.TzTransitionList();
        for (const rule of ruleSet) {
            if (rule.startYear <= (0, math_1.min)(highYear, rule.endYear)) {
                const ruleTransitions = rule.getTransitions((0, math_1.min)(maxYear, highYear), zpc, lastDst);
                newTransitions.push(...ruleTransitions);
            }
        }
        // Transition times aren't exact yet (not adjusted for DST), but are accurate enough for sorting.
        newTransitions.sort((t1, t2) => (0, math_1.sign)(t1.time - t2.time));
        let lastTransitionBeforeMinTime = null;
        let addLeadingTransition = true;
        // Adjust wall time for DST where needed.
        for (let i = 1; i < newTransitions.length; ++i) {
            const prev = newTransitions[i - 1];
            const curr = newTransitions[i];
            if (curr.rule.atType === tz_util_1.ClockType.CLOCK_TYPE_WALL)
                curr.time -= prev.rule.save;
        }
        for (let i = 0; i < newTransitions.length; ++i) {
            const tzt = newTransitions[i];
            const lastRule = (i < 1 ? null : newTransitions[i - 1].rule);
            const maxTime = zpc.until - (lastRule != null && zpc.untilType === tz_util_1.ClockType.CLOCK_TYPE_WALL ? lastRule.save : 0);
            const year = (0, tz_util_1.makeTime)(tzt.time, 0).wallTime.y;
            if (minTime <= tzt.time && tzt.time < maxTime && minYear <= year && year <= maxYear) {
                if (firstStdLetters === '?' && tzt.dstOffset === 0)
                    firstStdLetters = tzt.rule.letters;
                if (tzt.time === minTime)
                    addLeadingTransition = false;
            }
            else {
                newTransitions.splice(i--, 1);
                // Find the last rule that was in effect before or at the time these rules were invoked.
                if (tzt.time < minTime && (lastTransitionBeforeMinTime == null || lastTransitionBeforeMinTime.time < tzt.time))
                    lastTransitionBeforeMinTime = tzt;
                if ((tzt.time < minTime || fallbackStdLetters === '?') && tzt.dstOffset === 0)
                    fallbackStdLetters = tzt.rule.letters;
            }
        }
        if (addLeadingTransition) {
            let name;
            let dstOffset = 0;
            let rule;
            if (lastTransitionBeforeMinTime != null) {
                rule = lastTransitionBeforeMinTime.rule;
                dstOffset = rule.save;
                name = TzCompiler.createDisplayName(zpc.format, lastTransitionBeforeMinTime.rule.letters, dstOffset !== 0);
            }
            else {
                const letters = (firstStdLetters === '?' ? fallbackStdLetters : firstStdLetters);
                name = TzCompiler.createDisplayName(zpc.format, letters, false);
            }
            newTransitions.splice(0, 0, new tz_transition_1.TzTransition(minTime, zpc.utcOffset + dstOffset, dstOffset, name, zpc.zoneIndex, zpc.lastUntilType, rule));
        }
        transitions.push(...newTransitions);
        if (zpc.untilType === tz_util_1.ClockType.CLOCK_TYPE_WALL && transitions.length > 0) {
            const tzt = (0, util_1.last)(transitions);
            if (tzt.rule != null && zpc.until !== Number.MAX_SAFE_INTEGER)
                zpc.until -= tzt.rule.save;
        }
    }
    static createDisplayName(format, letters, isDst) {
        let name;
        let pos = format.indexOf('%s');
        if (pos >= 0) {
            if (letters === '?')
                console.error('*** Error: unresolved time zone name ' + format + (isDst ? ', DST' : ''));
            name = format.substring(0, pos) + letters + format.substring(pos + 2);
        }
        else {
            pos = format.indexOf('/');
            if (pos >= 0)
                name = (isDst ? format.substring(pos + 1) : format.substring(0, pos));
            else
                name = format;
        }
        if (name.startsWith('+') || name.startsWith('-'))
            return null;
        else
            return name;
    }
}
exports.TzCompiler = TzCompiler;
//# sourceMappingURL=tz-compiler.js.map