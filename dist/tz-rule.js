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
exports.TzRuleSet = exports.TzRule = void 0;
const util_1 = require("@tubular/util");
const tz_util_1 = require("./tz-util");
const math_1 = require("@tubular/math");
const tz_transition_list_1 = require("./tz-transition-list");
const time_1 = __importStar(require("@tubular/time"));
const tz_transition_1 = require("./tz-transition");
const tz_compiler_1 = require("./tz-compiler");
var LAST = time_1.default.LAST;
class TzRule {
    constructor() {
        this.ruleIndex = Number.MAX_SAFE_INTEGER;
    }
    static parseRule(line, index = Number.MAX_SAFE_INTEGER) {
        const rule = new TzRule();
        const parts = line.split(/\s+/);
        let pos;
        rule.name = parts[1];
        rule.ruleIndex = index;
        if (/^min(imum)?$/i.test(parts[2]))
            rule.startYear = Number.MIN_SAFE_INTEGER;
        else
            rule.startYear = (0, util_1.toInt)(parts[2]);
        if (/^only$/i.test(parts[3]))
            rule.endYear = rule.startYear;
        else if (/^max(imum)?$/i.test(parts[3]))
            rule.endYear = Number.MAX_SAFE_INTEGER;
        else
            rule.endYear = (0, util_1.toInt)(parts[3]);
        rule.month = (0, tz_util_1.indexOfFailNotFound)(tz_util_1.MONTHS, parts[5].substring(0, 3)) + 1;
        if (/^last/i.test(parts[6])) {
            rule.dayOfMonth = 0;
            rule.dayOfWeek = (0, tz_util_1.indexOfFailNotFound)(tz_util_1.DAYS, parts[6].substring(4, 7)) + 1;
        }
        else if ((pos = parts[6].indexOf('>=')) > 0) {
            rule.dayOfMonth = (0, util_1.toInt)(parts[6].substring(pos + 2));
            rule.dayOfWeek = (0, tz_util_1.indexOfFailNotFound)(tz_util_1.DAYS, parts[6].substring(0, 3)) + 1;
        }
        else if (parts[6].includes('<=')) {
            rule.dayOfMonth = -(0, util_1.toInt)(parts[6].substring(pos + 2));
            rule.dayOfWeek = (0, tz_util_1.indexOfFailNotFound)(tz_util_1.DAYS, parts[6].substring(0, 3)) + 1;
        }
        else {
            rule.dayOfMonth = (0, util_1.toInt)(parts[6]);
            rule.dayOfWeek = -1;
        }
        const hmc = (0, tz_util_1.parseAtTime)(parts[7]);
        rule.atHour = hmc[0];
        rule.atMinute = hmc[1];
        rule.atType = hmc[2];
        rule.save = (0, tz_util_1.parseTimeOffset)(parts[8], true);
        if (parts.length < 10 || parts[9] === '-')
            rule.letters = '';
        else
            rule.letters = parts[9];
        return rule;
    }
    toCompactTailRule() {
        return [this.startYear, this.month, this.dayOfMonth, this.dayOfWeek, this.atHour + ':' + this.atMinute,
            this.atType, (0, math_1.div_rd)(this.save, 60)].join(' ');
    }
    toPosixRule(offset, stdName, dstRule, dstName) {
        if (this.save !== 0 && dstRule && dstRule.save === 0)
            return dstRule.toPosixRule(offset, dstName, this, stdName);
        let tz = (/^[a-z]+$/i.test(stdName) ? stdName : '<' + stdName + '>') + (0, tz_util_1.formatPosixOffset)(-offset);
        if (!dstRule)
            return tz;
        tz += /^[a-z]+$/i.test(dstName) ? dstName : '<' + dstName + '>';
        if (dstRule.save !== 3600) {
            offset += dstRule.save;
            tz += (0, tz_util_1.formatPosixOffset)(-offset);
        }
        // No POSIX representation for "on or before" a date, only "on or after".
        if (this.dayOfMonth < 0 || dstRule.dayOfMonth < 0)
            return tz;
        let hour = dstRule.atHour * 3600 + dstRule.atMinute * 60;
        let date;
        let nth;
        if (dstRule.atType === tz_util_1.ClockType.CLOCK_TYPE_UTC)
            hour += offset;
        if (dstRule.dayOfWeek < 0)
            date = 'J' + (0, time_1.getDayNumber_SGC)(1970, dstRule.month, dstRule.dayOfMonth);
        else {
            nth = dstRule.dayOfMonth === 0 ? 5 : (0, math_1.div_rd)(dstRule.dayOfMonth - 1, 7) + 1;
            date = `M${dstRule.month}.${nth}.${dstRule.dayOfWeek - 1}`;
        }
        tz += ',' + date;
        //if (hour !== 7200)
        tz += '/' + (0, tz_util_1.formatPosixOffset)(hour);
        let hourStd = this.atHour * 3600 + this.atMinute * 60;
        if (this.atType === tz_util_1.ClockType.CLOCK_TYPE_UTC)
            hourStd += offset;
        else if (this.atType === tz_util_1.ClockType.CLOCK_TYPE_STD)
            hourStd += dstRule.save * 60;
        if (this.dayOfWeek < 0)
            date = 'J' + ((0, time_1.getDayNumber_SGC)(1970, this.month, this.dayOfMonth) + 1);
        else {
            nth = this.dayOfMonth === 0 ? 5 : (0, math_1.div_rd)(this.dayOfMonth - 1, 7) + 1;
            date = `M${this.month}.${nth}.${this.dayOfWeek - 1}`;
        }
        tz += ',' + date;
        //if (hourStd !== hour)
        tz += '/' + (0, tz_util_1.formatPosixOffset)(hourStd);
        return tz;
    }
    toString() {
        const month = tz_util_1.MONTHS[this.month - 1];
        const dayOfWeek = tz_util_1.DAYS[this.dayOfWeek - 1];
        let s = this.name + ': ' +
            (this.startYear === this.endYear ? this.startYear + ' only' :
                ((this.startYear < -9999 ? '-inf' : this.startYear) + ' to ' +
                    (this.endYear > 9999 ? '+inf' : this.endYear))) + ', ';
        if (this.dayOfMonth === 0)
            s += `last ${dayOfWeek} of ${month}`;
        else if (this.dayOfWeek < 0)
            s += `${month} ${this.dayOfMonth}`;
        else if (this.dayOfMonth > 0)
            s += `first ${dayOfWeek} on/after ${month} ${this.dayOfMonth}`;
        else
            s += `last ${dayOfWeek} on/before ${month} ${-this.dayOfMonth}`;
        s += `, at ${this.atHour}:${(0, util_1.padLeft)(this.atMinute, 2, '0')} `;
        s += ['wall time', 'std time', 'UTC'][this.atType];
        if (this.save === 0)
            s += ' begin std time';
        else {
            s += ` save ${(0, math_1.div_rd)(this.save, 60)} mins`;
            if (this.save % 60 !== 0)
                s += ` ${this.save % 60} secs`;
        }
        if (this.letters)
            s += `, ${this.letters}`;
        return s;
    }
    getTransitions(maxYear, zpc, lastDst) {
        const newTransitions = new tz_transition_list_1.TzTransitionList();
        const minTime = zpc.lastUntil;
        const zoneOffset = zpc.utcOffset;
        const lastZoneOffset = zpc.lastUtcOffset;
        for (let year = (0, math_1.max)(this.startYear, 1800); year <= (0, math_1.min)(maxYear, this.endYear); ++year) {
            let ldtDate;
            let ldtMonth = this.month;
            let ldtYear = year;
            if (this.dayOfWeek > 0 && this.dayOfMonth > 0) {
                ldtDate = tz_util_1.calendar.getDayOnOrAfter(year, ldtMonth, this.dayOfWeek - 1, this.dayOfMonth);
                if (ldtDate <= 0) {
                    // Use first occurrence of dayOfWeek in next month instead
                    ldtMonth += (ldtMonth < 12 ? 1 : -11);
                    ldtYear += (ldtMonth === 1 ? 1 : 0);
                    ldtDate = tz_util_1.calendar.getDayOnOrAfter(ldtYear, ldtMonth, this.dayOfWeek - 1, 1);
                }
            }
            else if (this.dayOfWeek > 0 && this.dayOfMonth < 0) {
                ldtDate = tz_util_1.calendar.getDayOnOrBefore(year, ldtMonth, this.dayOfWeek - 1, -this.dayOfMonth);
                if (ldtDate <= 0) {
                    // Use last occurrence of dayOfWeek in previous month instead
                    ldtMonth -= (ldtMonth > 1 ? 1 : -11);
                    ldtYear -= (ldtMonth === 12 ? 1 : 0);
                    ldtDate = tz_util_1.calendar.getDateOfNthWeekdayOfMonth(ldtYear, ldtMonth, this.dayOfWeek - 1, LAST);
                }
            }
            else if (this.dayOfWeek > 0)
                ldtDate = tz_util_1.calendar.getDateOfNthWeekdayOfMonth(year, ldtMonth, this.dayOfWeek - 1, LAST);
            else
                ldtDate = this.dayOfMonth;
            const ldt = new time_1.DateTime([ldtYear, ldtMonth, ldtDate, this.atHour, this.atMinute], time_1.Timezone.UT_ZONE);
            let epochSecond = ldt.utcSeconds - (this.atType === tz_util_1.ClockType.CLOCK_TYPE_UTC ? 0 : zoneOffset);
            const altEpochSecond = ldt.utcSeconds - (this.atType === tz_util_1.ClockType.CLOCK_TYPE_UTC ? 0 : lastZoneOffset) -
                (this.atType === tz_util_1.ClockType.CLOCK_TYPE_WALL ? lastDst : 0);
            if (altEpochSecond === minTime)
                epochSecond = minTime;
            const name = tz_compiler_1.TzCompiler.createDisplayName(zpc.format, this.letters, this.save !== 0);
            const tzt = new tz_transition_1.TzTransition(epochSecond, zpc.utcOffset + this.save, this.save, name, zpc.zoneIndex, this);
            newTransitions.push(tzt);
        }
        return newTransitions;
    }
}
exports.TzRule = TzRule;
class TzRuleSet extends Array {
    constructor(name) {
        super();
        this.name = name;
    }
}
exports.TzRuleSet = TzRuleSet;
//# sourceMappingURL=tz-rule.js.map