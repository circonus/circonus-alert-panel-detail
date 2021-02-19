import React from 'react';
import { PanelProps } from '@grafana/data';
import { CirconusAlertPanelDetailOptions } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory /* , useTheme */ } from '@grafana/ui';
import { getLocationSrv, getTemplateSrv } from '@grafana/runtime';
import './module.css';
import { DataFrame } from '@grafana/data';
import * as Mustache from 'mustache';

interface Props extends PanelProps<CirconusAlertPanelDetailOptions> {}

export const CirconusAlertPanelDetail: React.FC<Props> = ({ options, data, width, height }) => {
  //const theme = useTheme();
  const styles = getStyles();
  const TAG_COLORS = [
    '#D32D20',
    '#1E72B8',
    '#B240A2',
    '#705DA0',
    '#466803',
    '#497A3C',
    '#3D71AA',
    '#B15415',
    '#890F02',
    '#6E6E6E',
    '#0A437C',
    '#6D1F62',
    '#584477',
    '#4C7A3F',
    '#2F4F4F',
    '#BF1B00',
    '#7662B1',
    '#8A2EB8',
    '#517A00',
    '#000000',
    '#3F6833',
    '#2F575E',
    '#99440A',
    '#AE561A',
    '#0E4AB4',
    '#58140C',
    '#052B51',
    '#511749',
    '#3F2B5B',
  ];

  const TAG_BORDER_COLORS = [
    '#FF7368',
    '#459EE7',
    '#E069CF',
    '#9683C6',
    '#6C8E29',
    '#76AC68',
    '#6AA4E2',
    '#E7823D',
    '#AF3528',
    '#9B9B9B',
    '#3069A2',
    '#934588',
    '#7E6A9D',
    '#88C477',
    '#557575',
    '#E54126',
    '#A694DD',
    '#B054DE',
    '#8FC426',
    '#262626',
    '#658E59',
    '#557D84',
    '#BF6A30',
    '#FF9B53',
    '#3470DA',
    '#7E3A32',
    '#2B5177',
    '#773D6F',
    '#655181',
  ];

  function djb2(str: string) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
    }
    return hash;
  }

  function getTagColor(index: number) {
    return { color: TAG_COLORS[index], borderColor: TAG_BORDER_COLORS[index] };
  }

  /**
   * Returns tag badge background and border colors based on hashed tag name.
   * @param name tag name
   */
  function getTagColorsFromName(name: string) {
    const hash = djb2(name.toLowerCase());
    const index = Math.abs(hash % TAG_COLORS.length);
    return getTagColor(index);
  }

  function millisecondsToStr(milliseconds: number) {
    function numberEnding(number: number) {
      return number > 1 ? 's' : '';
    }

    let temp = Math.floor(milliseconds / 1000);
    const years = Math.floor(temp / 31536000);
    if (years) {
      return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    const days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
      return days + ' day' + numberEnding(days);
    }
    const hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
      return hours + ' hour' + numberEnding(hours);
    }
    const minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
      return minutes + ' minute' + numberEnding(minutes);
    }
    const seconds = temp % 60;
    if (seconds) {
      return seconds + ' second' + numberEnding(seconds);
    }
    return 'just now';
  }

  function getField(f: DataFrame, name: string) {
    for (let i = 0; i < f.fields.length; i++) {
      if (f.fields[i].name === name) {
        return f.fields[i].values.get(0);
      }
    }
  }

  /* function convertUTCDateToLocalDate(date: Date) {
     *   const newDate = new Date(
     *     date.getTime() + date.getTimezoneOffset() * 60 * 1000
     *   );

     *   const offset = date.getTimezoneOffset() / 60;
     *   const hours = date.getHours();

     *   newDate.setHours(hours - offset);

     *   return newDate;
     * } */

  function getDay(date: Date) {
    switch (date.getDay()) {
      case 0:
        return 'Sunday';
      case 1:
        return 'Monday';
      case 2:
        return 'Tuesday';
      case 3:
        return 'Wednesday';
      case 4:
        return 'Thursday';
      case 5:
        return 'Friday';
      case 6:
        return 'Saturday';
    }
    return '';
  }

  function getSeverityStyle(severity: number) {
    let color = '#6818B1';
    let fontColor = 'white';
    switch (severity) {
      case 1:
        color = '#C13737';
        break;
      case 2:
        color = '#F9851B';
        fontColor = 'black';
        break;
      case 3:
        color = '#FCDC01';
        fontColor = 'black';
        break;
      case 4:
        color = '#2374D9';
        break;
    }
    return {
      backgroundColor: color,
      color: fontColor,
    };
  }
  const heartSVG = (
    <span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="alert-state-ok">
        <path d="M12,20.8623a2.75115,2.75115,0,0,1-1.94922-.80468L3.83691,13.84277A6.27238,6.27238,0,0,1,12,4.36328a6.27239,6.27239,0,0,1,8.16309,9.47949l-6.21338,6.21387A2.75,2.75,0,0,1,12,20.8623Z"></path>
      </svg>
    </span>
  );

  const heartBreakSVG = (
    <span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        className="alert-state-alerting"
      >
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <path d="M18.17,1.85h0A6.25,6.25,0,0,0,12.12.23L9.42,6.56l2.83.71a1,1,0,0,1,.67,1.41l-2,4a1,1,0,0,1-.9.56,1.13,1.13,0,0,1-.44-.1h0a1,1,0,0,1-.46-1.33l1.4-2.89-2.77-.7a1,1,0,0,1-.65-.53,1,1,0,0,1,0-.83L9.58,1a6.27,6.27,0,0,0-7.73,9.77L9.3,18.18a1,1,0,0,0,1.42,0h0l7.45-7.46A6.27,6.27,0,0,0,18.17,1.85Z"></path>
          </g>
        </g>
      </svg>
    </span>
  );

  function createAlertTable() {
    if (data !== undefined && data.series.length > 0) {
      const dataframe = data.series[0];
      const state = getField(dataframe, 'state');
      const notes = getField(dataframe, 'notes');
      const metric_name = getField(dataframe, 'metric_name');
      const tags = getField(dataframe, 'tags');
      const cleared_timestamp = getField(dataframe, 'cleared_timestamp');
      const severity = getField(dataframe, 'severity');
      const alert_value = getField(dataframe, 'alert_value');
      const cleared_value = getField(dataframe, 'cleared_value');
      const alert_timestamp = getField(dataframe, 'alert_timestamp');
      const rules = getField(dataframe, 'rule_text');
      const metric_link = getField(dataframe, 'metric_link');
      const circonus_alert_url = getField(dataframe, 'circonus_alert_url');

      let alert_view_tags = [];
      if (tags && tags.length > 0) {
        alert_view_tags = tags.split('|');
      }

      const alert_ts_date = new Date(alert_timestamp);
      /* const clear_ts_date = new Date(cleared_timestamp); */

      /* const clear_ts_string = cleared_timestamp
       *   ? clear_ts_date.toISOString()
       *   : ""; */

      const iconState = state === 'ALERTING' ? 'alerting' : 'ok';
      const iconSVG = iconState === 'alerting' ? heartBreakSVG : heartSVG;

      let alertName = '';
      if (notes !== '') {
        // attempt to parse row.notes in case it might be json
        try {
          const parsed = JSON.parse(notes);
          if (parsed['summary'] !== undefined) {
            alertName = parsed['summary'];
          } else {
            alertName = metric_name;
          }
        } catch (error) {
          alertName = notes;
        }
      } else {
        alertName = metric_name;
      }

      let humanReadableTime = 'for ';
      const now = new Date().valueOf();
      if (cleared_timestamp !== null) {
        humanReadableTime += millisecondsToStr(now - cleared_timestamp);
      } else {
        humanReadableTime += millisecondsToStr(now - alert_timestamp);
      }

      let tagList = [];
      var tagDict: Record<string, string> = {};
      for (let t = 0; t < alert_view_tags.length; t++) {
        const tag = alert_view_tags[t].split(':');
        const c = tag[0];
        tagDict[c + ''] = tag[1] + '';
        if (options.exclude.indexOf(c) >= 0) {
          continue;
        }
        const colors = getTagColorsFromName(alert_view_tags[t]);
        const style = {
          backgroundColor: colors.color,
        };
        tagList.push(
          <div className="label-tag label" style={style}>
            {alert_view_tags[t]}
          </div>
        );
      }

      let ruleList = [];
      if (rules && rules.length > 0) {
        const r = rules.split('|');
        for (let i = 0; i < r.length; i++) {
          ruleList.push(
            <div className="rule">
              {i + 1}. {r[i]}
            </div>
          );
        }
      }

      const localDate = alert_ts_date;
      alertName = Mustache.render(alertName, tagDict);
      const alertTimestamp =
        ' @ ' +
        localDate.getFullYear() +
        '-' +
        (localDate.getMonth() + 1) +
        '-' +
        localDate.getDate() +
        ' (' +
        getDay(localDate) +
        ') ' +
        localDate.toTimeString();

      const header = {
        fontSize: '18px',
        display: 'inline-block',
      };

      let rangeset = false;
      const dashVars = getTemplateSrv().getVariables();
      for (let i = 0; i < dashVars.length; i++) {
        if (dashVars[i].name === 'initial_range_set') {
          rangeset = getTemplateSrv().replace('{initial_range_set}') === 'true';
        }
      }
      const query: any = {};
      query['var-check_uuid'] = getField(dataframe, 'check_uuid');
      query['var-cn'] = getField(dataframe, 'canonical_metric_name');
      query['var-function'] = getField(dataframe, 'function');
      query['var-threshold_1'] = getField(dataframe, 'threshold_1');
      query['var-threshold_2'] = getField(dataframe, 'threshold_2');
      query['var-threshold_3'] = getField(dataframe, 'threshold_3');
      query['var-threshold_4'] = getField(dataframe, 'threshold_4');
      query['var-threshold_5'] = getField(dataframe, 'threshold_5');
      query['var-alert_id'] = getField(dataframe, 'alert_id');
      if (rangeset === false) {
        query['from'] = getField(dataframe, 'alert_window_start');
        query['to'] = getField(dataframe, 'alert_window_end');
        query['var-initial_range_set'] = 'true';
      }
      getLocationSrv().update({
        partial: true,
        query: query,
        replace: true,
      });

      return (
        <table>
          <tr>
            <td colSpan={5}>
              <span className="label" style={header}>
                {alertName}
              </span>
              <span className="darklabel" style={header}>
                {alertTimestamp}
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <hr />
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <span className="icon" style={header}>
                {iconSVG}
              </span>
              <span className={'state-' + iconState} style={header}>
                {state}
              </span>
              {' - '}
              <span id="severity" className="label-tag label" style={getSeverityStyle(severity)}>
                P{severity}
              </span>
              <span className="label" style={header}>
                {humanReadableTime}
              </span>
              <span className="label" style={header}>
                - Alert: {metric_name} == {alert_value}
              </span>
              {cleared_timestamp !== null ? (
                <span className="label" style={header}>
                  - Clear {metric_name} == {cleared_value}
                </span>
              ) : null}
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <hr />
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <span className="label" style={header}>
                {metric_name}
                {' | '}
                <span className="tag-container">{tagList}</span>
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <hr />
            </td>
          </tr>
          <tr>
            <td colSpan={5} valign="top">
              <span id="rule_text" className="label" style={header}>
                Rules: {ruleList}
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <hr />
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <span className="label" style={header}>
                Links:
              </span>
              <span className="label">
                {metric_link ? (
                  <a href={metric_link} target="_blank">
                    Alert info
                  </a>
                ) : null}
              </span>{' '}
              |{' '}
              <span className="label">
                <a href={circonus_alert_url} target="_blank">
                  Circonus Alert Page
                </a>
              </span>
            </td>
          </tr>
        </table>
      );
    } else {
      return <p className="label">Alert not found</p>;
    }
  }

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      {createAlertTable()}
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      position: relative;
    `,
  };
});
