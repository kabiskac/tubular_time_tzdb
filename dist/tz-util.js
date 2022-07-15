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
exports.hasCommand = exports.monitorProcess = exports.spawn = exports.formatPosixOffset = exports.parseUntilTime = exports.parseAtTime = exports.fromBase60 = exports.toBase60 = exports.indexOfFailNotFound = exports.makeTime = exports.parseTimeOffset = exports.ParseError = exports.calendar = exports.DT_FORMAT = exports.DEFAULT_MAX_YEAR = exports.DEFAULT_MIN_YEAR = exports.MONTHS = exports.DAYS = exports.ClockTypeLetters = exports.ClockType = void 0;
const util_1 = require("@tubular/util");
const time_1 = __importStar(require("@tubular/time"));
const math_1 = require("@tubular/math");
const child_process_1 = require("child_process");
var LAST = time_1.default.LAST;
var ClockType;
(function (ClockType) {
    ClockType[ClockType["CLOCK_TYPE_WALL"] = 0] = "CLOCK_TYPE_WALL";
    ClockType[ClockType["CLOCK_TYPE_STD"] = 1] = "CLOCK_TYPE_STD";
    ClockType[ClockType["CLOCK_TYPE_UTC"] = 2] = "CLOCK_TYPE_UTC";
})(ClockType = exports.ClockType || (exports.ClockType = {}));
exports.ClockTypeLetters = ['w', 's', 'u'];
exports.DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
exports.MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
exports.DEFAULT_MIN_YEAR = 1850;
exports.DEFAULT_MAX_YEAR = 2050;
exports.DT_FORMAT = 'Y-MM-DD HH:mm';
exports.calendar = new time_1.Calendar();
class ParseError extends Error {
}
exports.ParseError = ParseError;
const isWindows = (process.platform === 'win32');
const clockTypeMatcher = /.+\d([gsuwz])/i;
function parseTimeOffset(offset, roundToMinutes = false) {
    if (offset.length < 3 && !offset.includes(':'))
        offset += ':00';
    return (0, time_1.parseTimeOffset)(offset, roundToMinutes);
}
exports.parseTimeOffset = parseTimeOffset;
function makeTime(utcSeconds, utcOffset) {
    return new time_1.DateTime(utcSeconds * 1000, new time_1.Timezone({ zoneName: undefined, currentUtcOffset: utcOffset, usesDst: false, dstOffset: 0, transitions: null }));
}
exports.makeTime = makeTime;
function indexOfFailNotFound(s, query) {
    const result = s.indexOf(query);
    if (result < 0)
        throw new ParseError(`"${query}" not found in ${JSON.stringify(s)}`);
    return result;
}
exports.indexOfFailNotFound = indexOfFailNotFound;
function digitValueToChar(digit) {
    if (digit < 10)
        digit += 48;
    else if (digit < 36)
        digit += 87;
    else
        digit += 29;
    return String.fromCharCode(digit);
}
function toBase60(x, precision = 1) {
    let result = '';
    let sign = 1;
    if (x < 0) {
        x *= -1;
        sign = -1;
    }
    x += Math.pow(60, -precision) / 2;
    let whole = Math.floor(x);
    let fraction = x - whole;
    if (whole === 0)
        result += '0';
    else {
        while (whole > 0) {
            const digit = whole % 60;
            result = digitValueToChar(digit) + result;
            whole = (0, math_1.div_rd)(whole, 60);
        }
    }
    if (fraction !== 0) {
        result += '.';
        while (--precision >= 0) {
            fraction *= 60;
            const digit = Math.floor(fraction + 0.0083);
            fraction -= digit;
            result += digitValueToChar(digit);
        }
        let lastChar;
        while ((lastChar = result.charAt(result.length - 1)) === '0' || lastChar === '.') {
            result = result.slice(0, -1);
            if (lastChar === '.')
                break;
        }
    }
    if (sign < 0)
        result = '-' + result;
    return result;
}
exports.toBase60 = toBase60;
function fromBase60(x) {
    let sign = 1;
    let result = 0;
    let inFractionalPart = false;
    let power = 1;
    if (x.startsWith('-')) {
        sign = -1;
        x = x.substr(1);
    }
    else if (x.startsWith('+'))
        x = x.substr(1);
    for (let i = 0; i < x.length; ++i) {
        let digit = x.charCodeAt(i);
        if (digit === 46) {
            inFractionalPart = true;
            continue;
        }
        else if (digit > 96)
            digit -= 87;
        else if (digit > 64)
            digit -= 29;
        else
            digit -= 48;
        if (inFractionalPart) {
            power /= 60;
            result += power * digit;
        }
        else {
            result *= 60;
            result += digit;
        }
    }
    return result * sign;
}
exports.fromBase60 = fromBase60;
function parseAtTime(s) {
    const result = [0, 0, ClockType.CLOCK_TYPE_WALL];
    const $ = clockTypeMatcher.exec(s);
    if ($) {
        const marker = $[1].toLowerCase();
        if (marker === 's')
            result[2] = ClockType.CLOCK_TYPE_STD;
        else if (marker === 'g' || marker === 'u' || marker === 'z')
            result[2] = ClockType.CLOCK_TYPE_UTC;
        s = s.slice(0, -1);
    }
    const parts = s.split(':');
    result[0] = (0, util_1.toInt)(parts[0]); // hour
    result[1] = (0, util_1.toInt)(parts[1]); // minute
    return result;
}
exports.parseAtTime = parseAtTime;
function parseUntilTime(s, roundToMinutes = false) {
    const result = [0, 1, 1, 0, 0, 0, ClockType.CLOCK_TYPE_WALL];
    const $ = clockTypeMatcher.exec(s);
    if ($) {
        const marker = $[1].toLowerCase();
        if (marker === 's')
            result[6] = ClockType.CLOCK_TYPE_STD;
        else if (marker === 'g' || marker === 'u' || marker === 'z')
            result[6] = ClockType.CLOCK_TYPE_UTC;
        s = s.slice(0, -1);
    }
    const parts = s.split(/[ :]/);
    result[0] = (0, util_1.toInt)(parts[0]); // year
    if (parts.length > 1) {
        result[1] = indexOfFailNotFound(exports.MONTHS, parts[1].substr(0, 3)) + 1; // month
        if (parts.length > 2) {
            let pos;
            // date
            if (parts[2].startsWith('last')) {
                const dayOfWeek = indexOfFailNotFound(exports.DAYS, parts[2].substring(4, 7));
                result[2] = exports.calendar.getDateOfNthWeekdayOfMonth(result[0], result[1], dayOfWeek, LAST);
            }
            else if ((pos = parts[2].indexOf('>=')) > 0) {
                const dayOfMonth = (0, util_1.toInt)(parts[2].substring(pos + 2));
                const dayOfWeek = indexOfFailNotFound(exports.DAYS, parts[2].substring(0, 3));
                result[2] = exports.calendar.getDayOnOrAfter(result[0], result[1], dayOfWeek, dayOfMonth);
            }
            else if (parts[2].includes('<=')) {
                const dayOfMonth = (0, util_1.toInt)(parts[2].substring(pos + 2));
                const dayOfWeek = indexOfFailNotFound(exports.DAYS, parts[2].substring(0, 3));
                result[2] = exports.calendar.getDayOnOrBefore(result[0], result[1], dayOfWeek, dayOfMonth);
            }
            else
                result[2] = (0, util_1.toInt)(parts[2]);
            if (parts.length > 3) {
                result[3] = (0, util_1.toInt)(parts[3]); // hour
                if (parts.length > 4) {
                    result[4] = (0, util_1.toInt)(parts[4]); // minute
                    if (parts.length > 5) {
                        const sec = Math.round((0, util_1.toNumber)(parts[5])); // seconds
                        if (roundToMinutes) {
                            if (sec >= 30) {
                                ++result[4];
                                if (result[4] === 60) {
                                    result[4] = 0;
                                    ++result[3];
                                    if (result[3] === 24) {
                                        // In the rare event we get this far, just round off the seconds instead of rounding up.
                                        result[3] = 23;
                                        result[4] = 59;
                                    }
                                }
                            }
                        }
                        else
                            result[5] = Math.min(sec, 59);
                    }
                }
            }
        }
    }
    return result;
}
exports.parseUntilTime = parseUntilTime;
function formatPosixOffset(offsetSeconds, noColons = false) {
    if (offsetSeconds == null)
        return '?';
    const colon = noColons ? '' : ':';
    let result = offsetSeconds < 0 ? '-' : noColons ? '+' : '';
    offsetSeconds = Math.abs(offsetSeconds);
    const hours = (0, math_1.div_tt0)(offsetSeconds, 3600);
    offsetSeconds -= hours * 3600;
    const minutes = (0, math_1.div_tt0)(offsetSeconds, 60);
    offsetSeconds -= minutes * 60;
    result += (0, util_1.padLeft)(hours, noColons ? 2 : 1, '0');
    if (minutes !== 0 || offsetSeconds !== 0)
        result += colon + (0, util_1.padLeft)(minutes, 2, '0');
    if (offsetSeconds !== 0)
        result += colon + (0, util_1.padLeft)(offsetSeconds, 2, '0');
    return result;
}
exports.formatPosixOffset = formatPosixOffset;
function spawn(command, args, options) {
    let inputText;
    let childProcess;
    if (options === null || options === void 0 ? void 0 : options.inputText) {
        inputText = options.inputText;
        options = Object.assign({}, options);
        delete options.inputText;
    }
    if (isWindows) {
        if (command === 'which')
            command = 'where';
        const cmd = process.env.comspec || 'cmd';
        childProcess = (0, child_process_1.spawn)(cmd, ['/c', command, ...args], options);
    }
    else
        childProcess = (0, child_process_1.spawn)(command, args, options);
    if (inputText) {
        childProcess.stdin.setEncoding('utf8');
        childProcess.stdin.write(inputText);
        childProcess.stdin.end();
    }
    return childProcess;
}
exports.spawn = spawn;
function monitorProcess(proc) {
    let errors = '';
    let output = '';
    return new Promise((resolve, reject) => {
        proc.stderr.on('data', data => {
            data = data.toString();
            errors += data;
        });
        proc.stdout.on('data', data => {
            data = data.toString();
            output += data;
        });
        proc.on('error', err => {
            reject(err);
        });
        proc.on('close', () => {
            if (errors)
                reject(new Error(errors.trim()));
            else
                resolve(output);
        });
    });
}
exports.monitorProcess = monitorProcess;
async function hasCommand(command) {
    try {
        return !!(await monitorProcess(spawn('which', [command]))).trim();
    }
    catch (_a) { }
    return false;
}
exports.hasCommand = hasCommand;
//# sourceMappingURL=tz-util.js.map