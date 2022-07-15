import { TzRule } from './tz-rule';
import { ClockType } from './tz-util';
export declare class TzTransition {
    time: number;
    utcOffset: number;
    dstOffset: number;
    name: string;
    zoneIndex: number;
    rule?: TzRule;
    clockType?: ClockType;
    constructor(time: number, // in seconds from epoch
    utcOffset: number, // seconds, positive eastward from UTC
    dstOffset: number, // seconds
    name: string, zoneIndex?: number, ruleOrClockType?: TzRule | ClockType, rule?: TzRule);
    get ruleIndex(): number;
    formatTime(): string;
    toString(): string;
}
