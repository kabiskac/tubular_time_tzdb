"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemoteDeltaTs = exports.getAvailableVersions = exports.getLatest = exports.getByUrlOrVersion = exports.LEAP_SECOND_URL = exports.DELTA_T_URL = exports.TZ_REGION_FILES = exports.MAIN_REGIONS = exports.DEFAULT_URL = void 0;
const by_request_1 = require("by-request");
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const tar_stream_1 = __importDefault(require("tar-stream"));
const tz_writer_1 = require("./tz-writer");
const util_1 = require("@tubular/util");
const time_1 = require("@tubular/time");
const math_1 = require("@tubular/math");
exports.DEFAULT_URL = 'https://www.iana.org/time-zones/repository/tzdata-latest.tar.gz';
const URL_TEMPLATE_FOR_VERSION = 'https://data.iana.org/time-zones/releases/tzdata{version}.tar.gz';
const ALL_RELEASES = 'https://data.iana.org/time-zones/releases/';
const TZ_SOURCE_FILES = new Set(['main.zi', 'rearguard.zi', 'vanguard.zi']);
exports.MAIN_REGIONS = new Set(['africa', 'antarctica', 'asia', 'australasia', 'europe', 'northamerica',
    'pacificnew', 'southamerica', 'etcetera']);
exports.TZ_REGION_FILES = new Set([...Array.from(exports.MAIN_REGIONS), 'systemv', 'backward', 'backzone']);
const TZ_EXTENDED_SOURCE_FILES = new Set([...TZ_SOURCE_FILES, ...exports.TZ_REGION_FILES])
    .add('leap-seconds.list').add('version').add('ziguard.awk');
const NTP_BASE = -2208988800;
const FAKE_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15';
exports.DELTA_T_URL = 'https://maia.usno.navy.mil/ser7/finals.all';
exports.LEAP_SECOND_URL = 'https://hpiers.obspm.fr/iers/bul/bulc/ntp/leap-seconds.list';
const TIME_AND_DELTA = /^(\d{10,})\s+(\d{2,4})\s*#\s*1\s+[A-Za-z]{3}\s+\d{4}/;
function makeError(error) {
    return error instanceof Error ? error : new Error(error.toString());
}
async function getByUrlOrVersion(urlOrVersion, progress) {
    let url;
    let requestedVersion;
    let xCompress = false;
    if (!urlOrVersion)
        url = exports.DEFAULT_URL;
    else if (urlOrVersion.includes(':'))
        url = urlOrVersion;
    else {
        requestedVersion = urlOrVersion;
        if (requestedVersion.length >= 5 && requestedVersion < '1996l')
            requestedVersion = requestedVersion.substr(2); // Switch to two-digit year
        url = URL_TEMPLATE_FOR_VERSION.replace('{version}', requestedVersion);
        if (urlOrVersion < '1993g') {
            xCompress = true;
            url = url.replace(/\.gz$/, '.Z');
        }
        requestedVersion = urlOrVersion;
    }
    if (progress)
        progress(tz_writer_1.TzPhase.DOWNLOAD, tz_writer_1.TzMessageLevel.INFO);
    let data = await (0, by_request_1.requestBinary)(url, { headers: { 'User-Agent': 'curl/7.64.1' }, autoDecompress: !xCompress });
    if (xCompress) {
        // zlib.gunzip chokes on this file format, but command-line gzip handles it well.
        data = await new Promise((resolve, reject) => {
            const gzipProc = (0, child_process_1.spawn)('gzip', ['-dc']);
            let tarContent = Buffer.alloc(0);
            const stream = stream_1.Readable.from(data);
            stream.pipe(gzipProc.stdin);
            gzipProc.stdout.on('data', d => tarContent = Buffer.concat([tarContent, d], tarContent.length + d.length));
            gzipProc.stdout.on('error', err => reject(makeError(err)));
            gzipProc.stdout.on('end', () => resolve(tarContent));
        });
    }
    const extract = tar_stream_1.default.extract({ allowUnknownFormat: true });
    const stream = stream_1.Readable.from(data);
    const deltaTs = (await getRemoteDeltaTs(progress)).map(dt => dt.toFixed(2)).join(' ');
    const result = { version: requestedVersion || 'unknown', deltaTs, sources: {} };
    let error;
    extract.on('entry', (header, stream, next) => {
        const sourceName = header.name;
        if (!error && TZ_EXTENDED_SOURCE_FILES.has(sourceName)) {
            let data = '';
            if (progress && sourceName !== 'version')
                progress(tz_writer_1.TzPhase.EXTRACT, tz_writer_1.TzMessageLevel.INFO, `Extracting ${sourceName}`);
            stream.on('data', chunk => data += chunk.toString());
            stream.on('error', err => error = err);
            stream.on('end', () => {
                if (sourceName === 'version') {
                    result.version = data.trim();
                    if (progress && result.version)
                        progress(tz_writer_1.TzPhase.EXTRACT, tz_writer_1.TzMessageLevel.INFO, `tz database version ${result.version}`);
                }
                else if (sourceName === 'leap-seconds.list') {
                    const lines = (0, util_1.asLines)(data).filter(line => line && !line.startsWith('#'));
                    const leaps = lines.map(line => line.trim().split(/\s+/).map(n => (0, util_1.toNumber)(n))).map(a => [(a[0] + NTP_BASE) / 86400, a[1]]);
                    result.leapSeconds = leaps.map((a, i) => i === 0 ? '' : `${a[0] * (a[1] >= leaps[i - 1][1] ? 1 : -1)}`).join(' ').trim();
                }
                else
                    result.sources[sourceName] = data;
                next();
            });
        }
        else
            stream.on('end', next);
        if (progress && !result.version)
            progress(tz_writer_1.TzPhase.EXTRACT, tz_writer_1.TzMessageLevel.INFO, 'unknown tz database version');
        stream.resume();
    });
    return new Promise((resolve, reject) => {
        stream.pipe(extract);
        extract.on('finish', () => error ? reject(makeError(error)) : resolve(result));
        extract.on('error', err => {
            // tar-stream has a problem with the format of a few of the tar files
            // dealt with here, which nevertheless are valid archives.
            if (/unexpected end of data|invalid tar header/i.test(err.message))
                resolve(result);
            else
                reject(makeError(err));
        });
    });
}
exports.getByUrlOrVersion = getByUrlOrVersion;
async function getLatest(progress) {
    return getByUrlOrVersion(null, progress);
}
exports.getLatest = getLatest;
async function getAvailableVersions(countCodeVersions = false) {
    const releaseSet = new Set((await (0, by_request_1.requestText)(ALL_RELEASES))
        .split(/(href="tz[^"]+(?="))/g).filter(s => s.startsWith('href="tz')).map(s => s.substr(6))
        .map(s => {
        var _a, _b;
        return ((_a = /^tzdata(\d\d(?:\d\d)?[a-z][a-z]?)\.tar.(?:gz|Z)$/.exec(s)) !== null && _a !== void 0 ? _a : [])[1] ||
            (countCodeVersions && ((_b = /^tzcode(\d\d(?:\d\d)?[a-z][a-z]?)\.tar.(?:gz|Z)$/.exec(s)) !== null && _b !== void 0 ? _b : [])[1]);
    })
        .filter(s => !!s));
    // Treat the special code-only case of tzcode93.tar.Z as release 1993a
    if (countCodeVersions)
        releaseSet.add('1993a');
    return Array.from(releaseSet).map(v => /^\d{4}/.test(v) ? v : '19' + v).sort();
}
exports.getAvailableVersions = getAvailableVersions;
// ΔT at start of year, one value per year starting at 2020.
// Data from https://datacenter.iers.org/data/latestVersion/finals.data.iau2000.txt,
//   as linked to from https://www.iers.org/IERS/EN/DataProducts/EarthOrientationData/eop.html.
// ΔT = 32.184† + (TAI - UTC)‡ - (UT1 - UTC)§
// † TT - TAI (Terrestrial Time minus International Atomic Time), a constant value.
// ‡ 37 seconds as of 2021-11-21, as it will likely remain for some time.
// § From finals.data, numeric value starting at 59th character column.
async function getRemoteDeltaTs(progress) {
    try {
        const leapSecondData = (0, util_1.asLines)(await (0, by_request_1.requestText)(exports.LEAP_SECOND_URL, { headers: { 'User-Agent': FAKE_USER_AGENT } }))
            .filter(line => TIME_AND_DELTA.test(line)).reverse();
        const deltaTData = (0, util_1.asLines)(await (0, by_request_1.requestText)(exports.DELTA_T_URL, { headers: { 'User-Agent': FAKE_USER_AGENT } }));
        const lastYear = new time_1.DateTime().add('months', 3).wallTime.year % 100;
        const leaps = [];
        const deltaTs = [];
        for (const line of leapSecondData) {
            const $ = TIME_AND_DELTA.exec(line);
            leaps.push([(0, math_1.div_rd)((0, util_1.toNumber)($[1]) + NTP_BASE, 86400), (0, util_1.toNumber)($[2])]);
        }
        for (const line of deltaTData) {
            const mjd = (0, util_1.toNumber)(line.substr(7, 5));
            if (mjd < 58849 || line.substr(2, 4) !== ' 1 1')
                continue;
            const year = (0, util_1.toNumber)(line.substr(0, 2));
            if (year <= lastYear) {
                const dut = (0, util_1.toNumber)(line.substr(58).trim().replace(/\s.*$/, ''));
                const leapsForYear = getLeapsForYear(year + 2000, leaps);
                deltaTs.push(32.184 + leapsForYear - dut);
            }
            if (year >= lastYear)
                break;
        }
        return deltaTs;
    }
    catch (e) {
        if (progress) {
            progress(tz_writer_1.TzPhase.DOWNLOAD, tz_writer_1.TzMessageLevel.ERROR, `Delta-T error: ${e.message || e.toString()}`);
            progress(tz_writer_1.TzPhase.DOWNLOAD, tz_writer_1.TzMessageLevel.WARN, 'Using predefined delta-T values.');
        }
    }
    return [69.36, 69.36, 69.28];
}
exports.getRemoteDeltaTs = getRemoteDeltaTs;
function getLeapsForYear(year, leaps) {
    const dayNum = new time_1.DateTime([year, 1, 1], 'UTC').wallTime.n;
    for (const [n, leapValue] of leaps) {
        if (dayNum >= n)
            return leapValue;
    }
    return 37;
}
//# sourceMappingURL=read-tzdb.js.map