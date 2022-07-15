import { ClockType } from './tz-util';
import { TzTransitionList } from './tz-transition-list';
import { ZoneProcessingContext } from './tz-compiler';
export declare class TzRule {
    name: string;
    startYear: number;
    endYear: number;
    month: number;
    dayOfMonth: number;
    dayOfWeek: number;
    atHour: number;
    atMinute: number;
    atType: ClockType;
    save: number;
    letters: string;
    ruleIndex: number;
    static parseRule(line: string, index?: number): TzRule;
    toCompactTailRule(): string;
    toPosixRule(offset?: number, stdName?: string, dstRule?: TzRule, dstName?: string): string;
    toString(): string;
    getTransitions(maxYear: number, zpc: ZoneProcessingContext, lastDst: any): TzTransitionList;
}
export declare class TzRuleSet extends Array<TzRule> {
    name: string;
    constructor(name: string);
}
