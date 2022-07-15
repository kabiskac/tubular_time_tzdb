/// <reference types="node" />
import { TzMode } from './iana-zones-and-rules-parser';
export declare enum TzFormat {
    BINARY = 0,
    JSON = 1,
    JAVASCRIPT = 2,
    TYPESCRIPT = 3,
    TEXT = 4
}
export declare enum TzPresets {
    NONE = 0,
    SMALL = 1,
    LARGE = 2,
    LARGE_ALT = 3
}
export declare enum TzPhase {
    DOWNLOAD = 0,
    EXTRACT = 1,
    PARSE = 2,
    COMPILE = 3,
    VALIDATE = 4,
    REENCODE = 5,
    OUTPUT_OF_RESULTS = 6,
    DONE = 7
}
export declare enum TzMessageLevel {
    INFO = 0,
    LOG = 1,
    WARN = 2,
    ERROR = 3
}
export declare type TzCallback = (phase?: TzPhase, level?: TzMessageLevel, message?: string, step?: number, stepCount?: number) => void;
export interface TzOptions {
    callback?: TzCallback;
    filtered?: boolean;
    fixRollbacks?: boolean;
    format?: TzFormat;
    maxYear?: number;
    minYear?: number;
    mode?: TzMode;
    noBackward?: boolean;
    packrat?: boolean;
    preset?: TzPresets;
    roundToMinutes?: boolean;
    singleRegionOrZone?: string;
    systemV?: boolean;
    urlOrVersion?: string;
    zoneInfoDir?: string;
}
export interface TzOutputOptions extends TzOptions {
    bloat?: boolean;
    directory?: string;
    fileStream?: NodeJS.WriteStream;
    includeLeaps?: boolean;
}
export declare function getTzData(options?: TzOptions, asString?: boolean): Promise<any>;
export declare function writeTimezones(options?: TzOutputOptions): Promise<void>;
