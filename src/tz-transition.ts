import { TzRule } from './tz-rule';
import { DateTime, Timezone } from '@tubular/time';
import { DT_FORMAT } from './tz-util';

export class TzTransition {
  constructor(
    public time: number, // in seconds from epoch
    public utcOffset: number, // seconds, positive eastward from UTC
    public dstOffset: number, // seconds
    public name: string,
    public rule?: TzRule
  ) {}

  formatTime(): string {
    if (this.time === Number.MIN_SAFE_INTEGER)
      return '(arbitrary past)';

    const ldt = new DateTime((this.time + this.utcOffset) * 1000, Timezone.ZONELESS);

    return ldt.format(DT_FORMAT + (ldt.wallTime.sec > 0 ? ':ss' : ''));
  }

  toString(): string {
    let s: string;

    if (this.time === Number.MIN_SAFE_INTEGER)
      s = '---';
    else
      s = this.formatTime();

    return [s, Timezone.formatUtcOffset(this.utcOffset, true),
            Timezone.formatUtcOffset(this.dstOffset, true), this.name].join(', ');
  }
}
