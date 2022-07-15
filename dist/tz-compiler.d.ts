import { ClockType } from './tz-util';
import { IanaZonesAndRulesParser } from './iana-zones-and-rules-parser';
import { TzTransitionList } from './tz-transition-list';
import { TzCallback } from './tz-writer';
export declare class CompilerError extends Error {
}
export interface ZoneProcessingContext {
    zoneId: string;
    zoneIndex: number;
    lastUtcOffset: number;
    lastUntil: number;
    lastUntilType: ClockType;
    utcOffset: number;
    until: number;
    untilType: ClockType;
    format: string;
}
export declare class TzCompiler {
    private parser;
    constructor(parser: IanaZonesAndRulesParser);
    compileAll(minYear?: number, maxYear?: number, progress?: TzCallback): Promise<Map<string, TzTransitionList>>;
    compileAll(minYear: any, maxYear: any, progress?: TzCallback): Promise<Map<string, TzTransitionList>>;
    compileAll(minYear?: number, maxYear?: number, strictDuplicateRemoval?: boolean, progress?: TzCallback): Promise<Map<string, TzTransitionList>>;
    compile(zoneId: string, minYear?: number, maxYear?: number, strictDuplicateRemoval?: boolean, canDefer?: boolean): Promise<TzTransitionList>;
    private applyRules;
    static createDisplayName(format: string, letters: string, isDst: boolean): string;
}
