import { ClockType } from './tz-util';
export declare class IanaZoneRecord {
    utcOffset: number;
    rules: string;
    format: string;
    until: number;
    untilType: ClockType;
    zoneIndex: number;
    static parseZoneRecord(line: string, roundToMinutes?: boolean): [IanaZoneRecord, string];
    toString(): string;
}
export declare class IanaZone extends Array<IanaZoneRecord> {
    zoneId: string;
    constructor(zoneId: string);
}
