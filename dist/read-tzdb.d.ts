import { TzCallback } from './tz-writer';
export interface TzData {
    version: string;
    leapSeconds?: string;
    deltaTs?: string;
    sources: Record<string, string>;
}
export declare const DEFAULT_URL = "https://www.iana.org/time-zones/repository/tzdata-latest.tar.gz";
export declare const MAIN_REGIONS: Set<string>;
export declare const TZ_REGION_FILES: Set<string>;
export declare const DELTA_T_URL = "https://maia.usno.navy.mil/ser7/finals.all";
export declare const LEAP_SECOND_URL = "https://hpiers.obspm.fr/iers/bul/bulc/ntp/leap-seconds.list";
export declare function getByUrlOrVersion(urlOrVersion?: string, progress?: TzCallback): Promise<TzData>;
export declare function getLatest(progress?: TzCallback): Promise<TzData>;
export declare function getAvailableVersions(countCodeVersions?: boolean): Promise<string[]>;
export declare function getRemoteDeltaTs(progress?: TzCallback): Promise<number[]>;
