import each from 'lodash/each';
import groupBy from 'lodash/groupBy';

import { RawTimeRange } from '../types/time';

import * as dateMath from './datemath';
import { isDateTime, DateTime } from './moment_wrapper';

const spans: { [key: string]: { display: string; section?: number } } = {
  s: { display: '秒' },
  m: { display: '分钟' },
  h: { display: '小时' },
  d: { display: '天' },
  w: { display: '周' },
  M: { display: '月' },
  y: { display: '年' },
};

const rangeOptions = [
  { from: 'now/d', to: 'now/d', display: '今天', section: 2 },
  { from: 'now/d', to: 'now', display: '今天到目前为止', section: 2 },
  { from: 'now/w', to: 'now/w', display: '本周', section: 2 },
  { from: 'now/w', to: 'now', display: '本周到目前为止', section: 2 },
  { from: 'now/M', to: 'now/M', display: '本月', section: 2 },
  { from: 'now/M', to: 'now', display: '本月到目前为止', section: 2 },
  { from: 'now/y', to: 'now/y', display: '今年', section: 2 },
  { from: 'now/y', to: 'now', display: '今年到目前为止', section: 2 },

  { from: 'now-1d/d', to: 'now-1d/d', display: '昨天', section: 1 },
  {
    from: 'now-2d/d',
    to: 'now-2d/d',
    display: '前天',
    section: 1,
  },
  {
    from: 'now-7d/d',
    to: 'now-7d/d',
    display: '7天前',
    section: 1,
  },
  { from: 'now-1w/w', to: 'now-1w/w', display: '上一周', section: 1 },
  { from: 'now-1M/M', to: 'now-1M/M', display: '上个月', section: 1 },
  { from: 'now-1y/y', to: 'now-1y/y', display: '去年', section: 1 },

  { from: 'now-5m', to: 'now', display: '过去 5 分钟', section: 3 },
  { from: 'now-15m', to: 'now', display: '过去 15 分钟', section: 3 },
  { from: 'now-30m', to: 'now', display: '过去 30 分钟', section: 3 },
  { from: 'now-1h', to: 'now', display: '过去 1 小时', section: 3 },
  { from: 'now-3h', to: 'now', display: '过去 3 小时', section: 3 },
  { from: 'now-6h', to: 'now', display: '过去 6 小时', section: 3 },
  { from: 'now-12h', to: 'now', display: '过去 12 小时', section: 3 },
  { from: 'now-24h', to: 'now', display: '过去 24 小时', section: 3 },
  { from: 'now-2d', to: 'now', display: '过去 2 天', section: 0 },
  { from: 'now-7d', to: 'now', display: '过去 7 天', section: 0 },
  { from: 'now-30d', to: 'now', display: '过去 30 天', section: 0 },
  { from: 'now-90d', to: 'now', display: '过去 90 天', section: 0 },
  { from: 'now-6M', to: 'now', display: '过去 6 月', section: 0 },
  { from: 'now-1y', to: 'now', display: '过去 1 年', section: 0 },
  { from: 'now-2y', to: 'now', display: '过去 2 年', section: 0 },
  { from: 'now-5y', to: 'now', display: '过去 5 年', section: 0 },
];

const absoluteFormat = 'YYYY-MM-DD HH:mm:ss';

const rangeIndex: any = {};
each(rangeOptions, (frame: any) => {
  rangeIndex[frame.from + ' to ' + frame.to] = frame;
});

export function getRelativeTimesList(timepickerSettings: any, currentDisplay: any) {
  const groups = groupBy(rangeOptions, (option: any) => {
    option.active = option.display === currentDisplay;
    return option.section;
  });

  // _.each(timepickerSettings.time_options, (duration: string) => {
  //   let info = describeTextRange(duration);
  //   if (info.section) {
  //     groups[info.section].push(info);
  //   }
  // });

  return groups;
}

function formatDate(date: DateTime) {
  return date.format(absoluteFormat);
}

// handles expressions like
// 5m
// 5m to now/d
// now/d to now
// now/d
// if no to <expr> then to now is assumed
export function describeTextRange(expr: any) {
  const isLast = expr.indexOf('+') !== 0;
  if (expr.indexOf('now') === -1) {
    expr = (isLast ? 'now-' : 'now') + expr;
  }

  let opt = rangeIndex[expr + ' to now'];
  if (opt) {
    return opt;
  }

  if (isLast) {
    opt = { from: expr, to: 'now' };
  } else {
    opt = { from: 'now', to: expr };
  }

  const parts = /^now([-+])(\d+)(\w)/.exec(expr);
  if (parts) {
    const unit = parts[3];
    const amount = parseInt(parts[2], 10);
    const span = spans[unit];
    if (span) {
      opt.display = isLast ? 'Last ' : 'Next ';
      opt.display += amount + ' ' + span.display;
      opt.section = span.section;
      if (amount > 1) {
        opt.display += 's';
      }
    }
  } else {
    opt.display = opt.from + ' to ' + opt.to;
    opt.invalid = true;
  }

  return opt;
}

/**
 * Use this function to get a properly formatted string representation of a {@link @grafana/data:RawTimeRange | range}.
 *
 * @example
 * ```
 * // Prints "2":
 * console.log(add(1,1));
 * ```
 * @category TimeUtils
 * @param range - a time range (usually specified by the TimePicker)
 * @alpha
 */
export function describeTimeRange(range: RawTimeRange): string {
  const option = rangeIndex[range.from.toString() + ' 至 ' + range.to.toString()];
  if (option) {
    return option.display;
  }

  if (isDateTime(range.from) && isDateTime(range.to)) {
    return formatDate(range.from) + ' 至 ' + formatDate(range.to);
  }

  if (isDateTime(range.from)) {
    const toMoment = dateMath.parse(range.to, true);
    return toMoment ? formatDate(range.from) + ' 至 ' + toMoment.fromNow() : '';
  }

  if (isDateTime(range.to)) {
    const from = dateMath.parse(range.from, false);
    return from ? from.fromNow() + ' 至 ' + formatDate(range.to) : '';
  }

  if (range.to.toString() === 'now') {
    const res = describeTextRange(range.from);
    return res.display;
  }

  return range.from.toString() + ' 至 ' + range.to.toString();
}

export const isValidTimeSpan = (value: string) => {
  if (value.indexOf('$') === 0 || value.indexOf('+$') === 0) {
    return true;
  }

  const info = describeTextRange(value);
  return info.invalid !== true;
};
