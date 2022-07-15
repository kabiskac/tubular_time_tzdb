"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IanaZone = exports.IanaZoneRecord = void 0;
const time_1 = require("@tubular/time");
const tz_util_1 = require("./tz-util");
class IanaZoneRecord {
    constructor() {
        this.zoneIndex = 0;
    }
    static parseZoneRecord(line, roundToMinutes = false) {
        // Unfortunately the use of tabs vs. spaces to delimit these files is wildly inconsistent,
        // so it takes some extra effort to parse correctly.
        let zoneId;
        let parts;
        if (line.startsWith('Zone')) {
            let sb = '';
            parts = line.split(/\s+/);
            zoneId = parts[1];
            for (let i = 2; i < parts.length; ++i) {
                if (i > 2)
                    sb += ' ';
                sb += parts[i];
            }
            line = sb.toString();
        }
        else {
            parts = line.trim().split(/\s+/);
            line = parts.join(' ');
        }
        const zoneRec = new IanaZoneRecord();
        // Older data (pre-1996k) contains quoted groups like `"EET DST"` which shouldn't get split,
        // but rather treated as `EET/DST`.
        if (line.includes('"'))
            line = line.replace(/".*?"/g, match => match.substr(1, match.length - 2).replace(/ /g, '/'));
        parts = line.split(' ');
        zoneRec.utcOffset = (0, tz_util_1.parseTimeOffset)(parts[0], roundToMinutes);
        zoneRec.rules = (parts[1] === '-' ? null : parts[1]);
        zoneRec.format = parts[2];
        if (parts.length > 3) {
            let sb = '';
            for (let i = 3; i < parts.length; ++i) {
                if (i > 3)
                    sb += ' ';
                sb += parts[i];
            }
            const timeArray = (0, tz_util_1.parseUntilTime)(sb.toString(), roundToMinutes);
            const clockType = timeArray[6];
            const ldt = new time_1.DateTime(timeArray.slice(0, -1), time_1.Timezone.ZONELESS);
            zoneRec.until = ldt.utcSeconds - (clockType !== tz_util_1.ClockType.CLOCK_TYPE_UTC ? zoneRec.utcOffset : 0);
            zoneRec.untilType = clockType;
        }
        else
            zoneRec.until = Number.MAX_SAFE_INTEGER;
        return [zoneRec, zoneId];
    }
    toString() {
        let s = `${this.utcOffset}, ${this.rules}, ${this.format}`;
        if (this.until !== Number.MAX_SAFE_INTEGER) {
            const ldt = new time_1.DateTime((this.until + (this.untilType !== tz_util_1.ClockType.CLOCK_TYPE_UTC ? this.utcOffset : 0)) * 1000, time_1.Timezone.ZONELESS);
            s += `, ${ldt.format(tz_util_1.DT_FORMAT)}${tz_util_1.ClockTypeLetters[this.untilType]}`;
        }
        return s;
    }
}
exports.IanaZoneRecord = IanaZoneRecord;
class IanaZone extends Array {
    constructor(zoneId) {
        super();
        this.zoneId = zoneId;
    }
}
exports.IanaZone = IanaZone;
//# sourceMappingURL=iana-zone-record.js.map