/// <reference types="node" />
import { TzTransition } from './tz-transition';
import { IanaZoneRecord } from './iana-zone-record';
import { TzRule } from './tz-rule';
import { TzCallback } from './tz-writer';
export declare enum Rollbacks {
    NO_ROLLBACKS = 0,
    ROLLBACKS_FOUND = 1,
    ROLLBACKS_REMOVED = 2,
    ROLLBACKS_REMAIN = 3
}
export declare class TzTransitionList extends Array<TzTransition> {
    zoneId?: string;
    aliasFor?: string;
    private lastZoneRec;
    constructor(zoneId?: string, aliasFor?: string);
    clone(withId?: string, aliasFor?: string): TzTransitionList;
    getLastZoneRec(): IanaZoneRecord;
    setLastZoneRec(lastZoneRec: IanaZoneRecord): void;
    findCalendarRollbacks(fixRollbacks: boolean, progress: TzCallback): Rollbacks;
    removeDuplicateTransitions(strict?: boolean): void;
    eliminateNegativeDst(): void;
    trim(minYear: number, maxYear: number): void;
    createCompactTransitionTable(fixCalendarRollbacks?: boolean): string;
    dump(out?: NodeJS.WriteStream, roundToMinutes?: boolean): void;
    static getZoneTransitionsFromZoneinfo(zoneInfoPath: string, zoneId: string, roundToMinutes?: boolean): TzTransitionList;
    transitionsMatch(otherList: TzTransitionList, exact?: boolean, roundToMinutes?: boolean, progress?: TzCallback): boolean;
    findFinalRulesAndOffsets(): [number, number, TzRule, TzRule, string, string];
}
