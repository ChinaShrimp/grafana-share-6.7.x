// Libraries
import React, { PureComponent, memo, FormEvent } from 'react';
import { css, cx } from 'emotion';

// Components
import { Tooltip } from '../Tooltip/Tooltip';
import { TimePickerContent } from './TimePickerContent/TimePickerContent';
import { ClickOutsideWrapper } from '../ClickOutsideWrapper/ClickOutsideWrapper';

// Utils & Services
import { stylesFactory } from '../../themes/stylesFactory';
import { withTheme, useTheme } from '../../themes/ThemeContext';

// Types
import { isDateTime, DateTime, rangeUtil, GrafanaTheme, TIME_FORMAT } from '@grafana/data';
import { TimeRange, TimeOption, TimeZone, dateMath } from '@grafana/data';
import { Themeable } from '../../types';

const quickOptions: TimeOption[] = [
  { from: 'now-5m', to: 'now', display: '过去 5 分钟', section: 3 },
  { from: 'now-15m', to: 'now', display: '过去 15 分钟', section: 3 },
  { from: 'now-30m', to: 'now', display: '过去 30 分钟', section: 3 },
  { from: 'now-1h', to: 'now', display: '过去 1 小时', section: 3 },
  { from: 'now-3h', to: 'now', display: '过去 3 小时', section: 3 },
  { from: 'now-6h', to: 'now', display: '过去 6 小时', section: 3 },
  { from: 'now-12h', to: 'now', display: '过去 12 小时', section: 3 },
  { from: 'now-24h', to: 'now', display: '过去 24 小时', section: 3 },
  { from: 'now-2d', to: 'now', display: '过去 2 天', section: 3 },
  { from: 'now-7d', to: 'now', display: '过去 7 天', section: 3 },
  { from: 'now-30d', to: 'now', display: '过去 30 天', section: 3 },
  { from: 'now-90d', to: 'now', display: '过去 90 天', section: 3 },
  { from: 'now-6M', to: 'now', display: '过去 6 月', section: 3 },
  { from: 'now-1y', to: 'now', display: '过去 1 年', section: 3 },
  { from: 'now-2y', to: 'now', display: '过去 2 年', section: 3 },
  { from: 'now-5y', to: 'now', display: '过去 5 年', section: 3 },
];

const otherOptions: TimeOption[] = [
  { from: 'now-1d/d', to: 'now-1d/d', display: '昨天', section: 3 },
  { from: 'now-2d/d', to: 'now-2d/d', display: '前天', section: 3 },
  { from: 'now-7d/d', to: 'now-7d/d', display: '7天前', section: 3 },
  { from: 'now-1w/w', to: 'now-1w/w', display: '上周', section: 3 },
  { from: 'now-1M/M', to: 'now-1M/M', display: '上个月', section: 3 },
  { from: 'now-1y/y', to: 'now-1y/y', display: '去年', section: 3 },
  { from: 'now/d', to: 'now/d', display: '今天', section: 3 },
  { from: 'now/d', to: 'now', display: '今天到目前为止', section: 3 },
  { from: 'now/w', to: 'now/w', display: '本周', section: 3 },
  { from: 'now/w', to: 'now', display: '本周到目前为止', section: 3 },
  { from: 'now/M', to: 'now/M', display: '本月', section: 3 },
  { from: 'now/M', to: 'now', display: '本月到目前为止', section: 3 },
  { from: 'now/y', to: 'now/y', display: '今年', section: 3 },
  { from: 'now/y', to: 'now', display: '今年到目前为止', section: 3 },
];

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      position: relative;
      display: flex;
      flex-flow: column nowrap;
    `,
    buttons: css`
      display: flex;
    `,
    caretIcon: css`
      margin-left: 3px;

      i {
        font-size: ${theme.typography.size.md};
      }
    `,
    noRightBorderStyle: css`
      label: noRightBorderStyle;
      border-right: 0;
    `,
  };
});

const getLabelStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      display: inline-block;
    `,
    utc: css`
      color: ${theme.colors.orange};
      font-size: 75%;
      padding: 3px;
      font-weight: ${theme.typography.weight.semibold};
    `,
  };
});

export interface Props extends Themeable {
  hideText?: boolean;
  value: TimeRange;
  timeZone?: TimeZone;
  timeSyncButton?: JSX.Element;
  isSynced?: boolean;
  onChange: (timeRange: TimeRange) => void;
  onMoveBackward: () => void;
  onMoveForward: () => void;
  onZoom: () => void;
  history?: TimeRange[];
}

export interface State {
  isOpen: boolean;
}

export class UnthemedTimePicker extends PureComponent<Props, State> {
  state: State = {
    isOpen: false,
  };

  onChange = (timeRange: TimeRange) => {
    this.props.onChange(timeRange);
    this.setState({ isOpen: false });
  };

  onOpen = (event: FormEvent<HTMLButtonElement>) => {
    const { isOpen } = this.state;
    event.stopPropagation();
    this.setState({ isOpen: !isOpen });
  };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const {
      value,
      onMoveBackward,
      onMoveForward,
      onZoom,
      timeZone,
      timeSyncButton,
      isSynced,
      theme,
      history,
    } = this.props;

    const { isOpen } = this.state;
    const styles = getStyles(theme);
    const hasAbsolute = isDateTime(value.raw.from) || isDateTime(value.raw.to);
    const syncedTimePicker = timeSyncButton && isSynced;
    const timePickerIconClass = cx('fa fa-clock-o fa-fw', { ['icon-brand-gradient']: syncedTimePicker });
    const timePickerButtonClass = cx('btn navbar-button navbar-button--tight', {
      [`btn--radius-right-0 ${styles.noRightBorderStyle}`]: !!timeSyncButton,
      [`explore-active-button`]: syncedTimePicker,
    });

    return (
      <div className={styles.container}>
        <div className={styles.buttons}>
          {hasAbsolute && (
            <button className="btn navbar-button navbar-button--tight" onClick={onMoveBackward}>
              <i className="fa fa-chevron-left" />
            </button>
          )}
          <div>
            <Tooltip content={<TimePickerTooltip timeRange={value} />} placement="bottom">
              <button aria-label="TimePicker Open Button" className={timePickerButtonClass} onClick={this.onOpen}>
                <i className={timePickerIconClass} />
                <TimePickerButtonLabel {...this.props} />
                <span className={styles.caretIcon}>
                  {isOpen ? <i className="fa fa-caret-up fa-fw" /> : <i className="fa fa-caret-down fa-fw" />}
                </span>
              </button>
            </Tooltip>
            {isOpen && (
              <ClickOutsideWrapper onClick={this.onClose}>
                <TimePickerContent
                  timeZone={timeZone}
                  value={value}
                  onChange={this.onChange}
                  otherOptions={otherOptions}
                  quickOptions={quickOptions}
                  history={history}
                />
              </ClickOutsideWrapper>
            )}
          </div>

          {timeSyncButton}

          {hasAbsolute && (
            <button className="btn navbar-button navbar-button--tight" onClick={onMoveForward}>
              <i className="fa fa-chevron-right" />
            </button>
          )}

          <Tooltip content={ZoomOutTooltip} placement="bottom">
            <button className="btn navbar-button navbar-button--zoom" onClick={onZoom}>
              <i className="fa fa-search-minus" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }
}

const ZoomOutTooltip = () => (
  <>
    Time range zoom out <br /> CTRL+Z
  </>
);

const TimePickerTooltip = ({ timeRange }: { timeRange: TimeRange }) => (
  <>
    {timeRange.from.format(TIME_FORMAT)}
    <div className="text-center">to</div>
    {timeRange.to.format(TIME_FORMAT)}
  </>
);

const TimePickerButtonLabel = memo<Props>(props => {
  const theme = useTheme();
  const styles = getLabelStyles(theme);
  const isUTC = props.timeZone === 'utc';

  if (props.hideText) {
    return null;
  }

  return (
    <span className={styles.container}>
      <span>{formattedRange(props.value, isUTC)}</span>
      {isUTC && <span className={styles.utc}>UTC</span>}
    </span>
  );
});

const formattedRange = (value: TimeRange, isUTC: boolean) => {
  const adjustedTimeRange = {
    to: dateMath.isMathString(value.raw.to) ? value.raw.to : adjustedTime(value.to, isUTC),
    from: dateMath.isMathString(value.raw.from) ? value.raw.from : adjustedTime(value.from, isUTC),
  };
  return rangeUtil.describeTimeRange(adjustedTimeRange);
};

const adjustedTime = (time: DateTime, isUTC: boolean) => {
  if (isUTC) {
    return time.utc() || null;
  }
  return time.local() || null;
};

export const TimePicker = withTheme(UnthemedTimePicker);
