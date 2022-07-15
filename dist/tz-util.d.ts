/// <reference types="node" />
import { Calendar, DateTime } from '@tubular/time';
import { ChildProcess } from 'child_process';
export declare enum ClockType {
    CLOCK_TYPE_WALL = 0,
    CLOCK_TYPE_STD = 1,
    CLOCK_TYPE_UTC = 2
}
export declare const ClockTypeLetters: string[];
export declare const DAYS: string[];
export declare const MONTHS: string[];
export declare const DEFAULT_MIN_YEAR = 1850;
export declare const DEFAULT_MAX_YEAR = 2050;
export declare const DT_FORMAT = "Y-MM-DD HH:mm";
export declare const calendar: Calendar;
export declare class ParseError extends Error {
}
export declare function parseTimeOffset(offset: string, roundToMinutes?: boolean): number;
export declare function makeTime(utcSeconds: number, utcOffset: number): DateTime;
export declare function indexOfFailNotFound(s: string[], query: string): number;
export declare function toBase60(x: number, precision?: number): string;
export declare function fromBase60(x: string): number;
export declare function parseAtTime(s: string): number[];
export declare function parseUntilTime(s: string, roundToMinutes?: boolean): number[];
export declare function formatPosixOffset(offsetSeconds: number, noColons?: boolean): string;
export declare function spawn(command: string, args: string[], options?: any): ChildProcess;
export declare function monitorProcess(proc: ChildProcess): Promise<string>;
export declare function hasCommand(command: string): Promise<boolean>;
