"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TzTransition = void 0;
const time_1 = require("@tubular/time");
const tz_util_1 = require("./tz-util");
const util_1 = require("@tubular/util");
class TzTransition {
    constructor(time, // in seconds from epoch
    utcOffset, // seconds, positive eastward from UTC
    dstOffset, // seconds
    name, zoneIndex = 0, ruleOrClockType, rule) {
        this.time = time;
        this.utcOffset = utcOffset;
        this.dstOffset = dstOffset;
        this.name = name;
        this.zoneIndex = zoneIndex;
        if ((0, util_1.isObject)(ruleOrClockType)) {
            this.rule = ruleOrClockType;
            this.clockType = ruleOrClockType.atType;
        }
        else
            this.clockType = ruleOrClockType;
        if (rule)
            this.rule = rule;
    }
    get ruleIndex() {
        var _a, _b;
        return (_b = (_a = this.rule) === null || _a === void 0 ? void 0 : _a.ruleIndex) !== null && _b !== void 0 ? _b : Number.MAX_SAFE_INTEGER;
    }
    formatTime() {
        if (this.time === Number.MIN_SAFE_INTEGER)
            return '(arbitrary past)';
        const ldt = new time_1.DateTime((this.time + this.utcOffset) * 1000, time_1.Timezone.ZONELESS);
        return ldt.format(tz_util_1.DT_FORMAT + (ldt.wallTime.sec > 0 ? ':ss' : ''));
    }
    toString() {
        let s;
        if (this.time === Number.MIN_SAFE_INTEGER)
            s = '---';
        else
            s = this.formatTime();
        return [s, time_1.Timezone.formatUtcOffset(this.utcOffset, true),
            time_1.Timezone.formatUtcOffset(this.dstOffset, true), this.name].join(', ');
    }
}
exports.TzTransition = TzTransition;
//# sourceMappingURL=tz-transition.js.map