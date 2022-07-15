import { IanaZone } from './iana-zone-record';
import { TzRuleSet } from './tz-rule';
import { TzData } from './read-tzdb';
import { TzCallback } from './tz-writer';
export declare enum TzMode {
    REARGUARD = 0,
    MAIN = 1,
    VANGUARD = 2
}
export interface ParseOptions {
    mode?: TzMode;
    noBackward?: boolean;
    packrat?: boolean;
    progress?: TzCallback;
    roundToMinutes?: boolean;
    singleRegion?: string;
    systemV?: boolean;
    urlOrVersion?: string;
}
export declare class IanaParserError extends Error {
    lineNo: number;
    sourceName: string;
    constructor(lineNo: number, sourceName: string, message: string);
}
export declare class IanaZonesAndRulesParser {
    private readonly zoneMap;
    private readonly zoneAliases;
    private readonly ruleSetMap;
    private currentSource;
    private deltaTs;
    private currentMode;
    private leapSeconds;
    private lineNo;
    private mode;
    private noBackward;
    private packrat;
    private preAwked;
    private progress;
    private roundToMinutes;
    private ruleIndex;
    private singleRegion;
    private systemV;
    parseFromOnline(options?: ParseOptions): Promise<string>;
    private parseOptions;
    parseTzData(tzData: TzData, options?: ParseOptions): Promise<string>;
    getZoneIds(): string[];
    getAliasFor(zoneId: string): string;
    getZone(zoneId: string): IanaZone;
    getRuleSet(rulesName: string): TzRuleSet;
    getDeltaTs(): string;
    getLeapSeconds(): string;
    private addAlias;
    private getRootZone;
    private parseSources;
    private parseSource;
    private readLine;
}
