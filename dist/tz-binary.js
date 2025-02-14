"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeZoneInfoFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const util_1 = require("@tubular/util");
const tz_util_1 = require("./tz-util");
const time_1 = require("@tubular/time");
const math_1 = require("@tubular/math");
const Y1800 = new time_1.DateTime('1800-01-01Z').utcSeconds;
async function writeZoneInfoFile(directory, transitions, bloat = false, leapSeconds) {
    const zonePath = transitions.zoneId.split('/');
    directory = path_1.default.join(directory, ...zonePath.slice(0, zonePath.length - 1));
    await promises_1.default.mkdir(directory, { recursive: true });
    const fh = await promises_1.default.open(path_1.default.join(directory, (0, util_1.last)(zonePath)), 'w', 0o644);
    const buf1 = bloat ? createZoneInfoBuffer(transitions, 4, leapSeconds) :
        Buffer.from('TZif2' + '\x00'.repeat(34) + '\x01\x00\x00\x00\x01' + '\x00'.repeat(7), 'ascii');
    const buf2 = createZoneInfoBuffer(transitions, 8, leapSeconds, bloat);
    await fh.write(buf1);
    await fh.write(buf2);
    await fh.close();
}
exports.writeZoneInfoFile = writeZoneInfoFile;
function createZoneInfoBuffer(transitions, dataSize, leapSeconds, bloat = true) {
    const uniqueLocalTimeTypes = [];
    const names = new Set();
    const makeKey = (t) => {
        var _a;
        return (0, tz_util_1.toBase60)(t.utcOffset / 60) + '/' + (0, tz_util_1.toBase60)(t.dstOffset / 60) +
            '/' + ((_a = t.name) !== null && _a !== void 0 ? _a : (0, tz_util_1.formatPosixOffset)(t.utcOffset, true)) + '/' + (t.clockType);
    };
    let discarded = 0;
    let topDiscarded = 0;
    const leaps = !leapSeconds ? [] : leapSeconds.split(/\s+/).map(l => new time_1.DateTime({ n: (0, math_1.abs)((0, util_1.toNumber)(l)), utcOffset: 0 }).utcSeconds * (0, math_1.sign)((0, util_1.toNumber)(l)));
    const tzh_leapcnt = leaps.length;
    const deltaTais = [];
    let deltaTai10 = 0;
    const times = transitions.map(t => t.time);
    // I wouldn't have suspected this, but the seconds values for transition times have to have previous
    // leap seconds added (minus 10) in if leap seconds are included in the file.
    leaps.forEach(l => {
        deltaTai10 += (l < 0 ? -1 : 1);
        deltaTais.push(deltaTai10);
    });
    let deltaEpoch = 0;
    let leapIndex = 0;
    times.forEach((t, i) => {
        if (leapIndex < leaps.length && t >= (0, math_1.abs)(leaps[leapIndex]))
            deltaEpoch = deltaTais[leapIndex++];
        times[i] = t + deltaEpoch;
    });
    for (let i = 0; i < transitions.length; ++i) {
        const t = transitions[i];
        if (t.time < Y1800 || (dataSize === 4 && times[i] < -0x80000000))
            ++discarded;
        else
            break;
    }
    let lastZoneIndex = -1;
    let lastRuleIndex = -1;
    let lastDst = 0;
    for (let i = (0, math_1.max)(discarded - 1, 0); i < transitions.length; ++i) {
        const t = transitions[i];
        if (times[i] > 0x7FFFFFFF) { // For now, discard data beyond 2038-01-19T03:14:07Z even when 8 bytes are available.
            ++topDiscarded;
            continue;
        }
        const localTimeType = { key: makeKey(t), name: t.name, trans: t };
        if (!t.name)
            localTimeType.name = (0, tz_util_1.formatPosixOffset)(t.utcOffset, true);
        if (!uniqueLocalTimeTypes.find(ltt => ltt.key === localTimeType.key)) {
            uniqueLocalTimeTypes.push(localTimeType);
            // This swapping of the order of local time types isn't strictly necessary, but makes the output more
            // like the output from zic, facilitating code testing by helping to produce identical binaries.
            if ((t.ruleIndex < lastRuleIndex && t.zoneIndex <= lastZoneIndex) ||
                (t.zoneIndex === lastZoneIndex && (0, math_1.abs)(t.dstOffset) > (0, math_1.abs)(lastDst))) {
                uniqueLocalTimeTypes[uniqueLocalTimeTypes.length - 1] = uniqueLocalTimeTypes[uniqueLocalTimeTypes.length - 2];
                uniqueLocalTimeTypes[uniqueLocalTimeTypes.length - 2] = localTimeType;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            lastZoneIndex = t.zoneIndex;
            lastRuleIndex = t.ruleIndex;
            lastDst = t.dstOffset;
        }
    }
    uniqueLocalTimeTypes.forEach(ltt => names.add(ltt.name));
    const allNames = Array.from(names).join('\x00') + '\x00';
    // Variable names tzh_timecnt, tzh_typecnt, etc. from https://man7.org/linux/man-pages/man5/tzfile.5.html
    const tzh_timecnt = transitions.length - discarded - topDiscarded;
    const tzh_typecnt = uniqueLocalTimeTypes.length;
    let size = 20 + 6 * 4 + tzh_timecnt * (dataSize + 1) + tzh_typecnt * (bloat ? 8 : 6) + allNames.length +
        tzh_leapcnt * (4 + dataSize);
    let posixRule = '';
    if (dataSize > 4) {
        const [stdOffset, , finalStdRule, finalDstRule, stdName, dstName] = transitions.findFinalRulesAndOffsets();
        const lastT = (0, util_1.last)(transitions);
        if (finalStdRule)
            posixRule = '\x0A' + finalStdRule.toPosixRule(stdOffset, stdName, finalDstRule, dstName) + '\x0A';
        else if (lastT === null || lastT === void 0 ? void 0 : lastT.name)
            posixRule = '\x0A' + lastT.name + (0, tz_util_1.formatPosixOffset)(-lastT.utcOffset) + '\x0A';
        else
            posixRule = '\x0A<' + (0, tz_util_1.formatPosixOffset)(stdOffset, true) + '>' + (0, tz_util_1.formatPosixOffset)(-stdOffset) + '\x0A';
        size += posixRule.length;
    }
    const buf = Buffer.alloc(size, 0);
    buf.write('TZif2', 0, 'ascii');
    buf.writeUInt32BE(bloat ? tzh_typecnt : 0, 20);
    buf.writeUInt32BE(bloat ? tzh_typecnt : 0, 24);
    buf.writeUInt32BE(tzh_leapcnt, 28);
    buf.writeUInt32BE(tzh_timecnt, 32);
    buf.writeUInt32BE(tzh_typecnt, 36);
    buf.writeUInt32BE(allNames.length, 40);
    let offset = 44;
    for (let i = discarded; i < times.length - topDiscarded; ++i) {
        const t = times[i];
        if (dataSize === 4)
            buf.writeInt32BE(t, offset);
        else
            buf.writeBigInt64BE(BigInt(t), offset);
        offset += dataSize;
    }
    for (let i = discarded; i < transitions.length - topDiscarded; ++i) {
        const key = makeKey(transitions[i]);
        buf.writeInt8((0, math_1.max)(uniqueLocalTimeTypes.findIndex(ltt => ltt.key === key), 0), offset++);
    }
    for (const ltt of uniqueLocalTimeTypes) {
        const name = '\x00' + (ltt.trans.name || (0, tz_util_1.formatPosixOffset)(ltt.trans.utcOffset, true)) + '\x00';
        buf.writeInt32BE(ltt.trans.utcOffset, offset);
        offset += 4;
        buf.writeUInt8(ltt.trans.dstOffset ? 1 : 0, offset++);
        buf.writeUInt8(('\x00' + allNames).indexOf(name), offset++);
    }
    buf.write(allNames, offset, 'ascii');
    offset += allNames.length;
    leaps.forEach((l, index) => {
        var _a;
        const t = (0, math_1.abs)(l) + ((_a = deltaTais[index - 1]) !== null && _a !== void 0 ? _a : 0);
        if (dataSize === 4)
            buf.writeUInt32BE(t, offset);
        else
            buf.writeBigInt64BE(BigInt(t), offset);
        offset += dataSize;
        buf.writeInt32BE(deltaTais[index], offset);
        offset += 4;
    });
    if (bloat) {
        for (const ltt of uniqueLocalTimeTypes)
            buf.writeUInt8(ltt.trans.clockType ? 1 : 0, offset++);
        for (const ltt of uniqueLocalTimeTypes)
            buf.writeUInt8(ltt.trans.clockType === 2 ? 1 : 0, offset++);
    }
    if (posixRule)
        buf.write(posixRule, size - posixRule.length);
    return buf;
}
//# sourceMappingURL=tz-binary.js.map