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

  const style_ok = {
    fill: 'green',
    color: 'green',
  };
  const style_alert = {
    fill: 'red',
    color: 'red',
  };
  const style_acknowledged = {
    fill: 'orange',
    color: 'orange',
  };
  const heartSVG = (
    <span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" style={style_ok}>
        <path d="M12,20.8623a2.75115,2.75115,0,0,1-1.94922-.80468L3.83691,13.84277A6.27238,6.27238,0,0,1,12,4.36328a6.27239,6.27239,0,0,1,8.16309,9.47949l-6.21338,6.21387A2.75,2.75,0,0,1,12,20.8623Z"></path>
      </svg>
    </span>
  );

  const heartBreakSVG = (
    <span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" style={style_alert}>
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <path d="M18.17,1.85h0A6.25,6.25,0,0,0,12.12.23L9.42,6.56l2.83.71a1,1,0,0,1,.67,1.41l-2,4a1,1,0,0,1-.9.56,1.13,1.13,0,0,1-.44-.1h0a1,1,0,0,1-.46-1.33l1.4-2.89-2.77-.7a1,1,0,0,1-.65-.53,1,1,0,0,1,0-.83L9.58,1a6.27,6.27,0,0,0-7.73,9.77L9.3,18.18a1,1,0,0,0,1.42,0h0l7.45-7.46A6.27,6.27,0,0,0,18.17,1.85Z"></path>
          </g>
        </g>
      </svg>
    </span>
  );

  const ackSVG = (
    <div className="css-1vzus6i-Icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={style_acknowledged}>
        <g id="surface1">
          <path d="M 6.996094 2.25 C 4.378906 2.25 2.25 4.378906 2.25 6.996094 C 2.25 9.609375 4.378906 11.738281 6.996094 11.738281 C 9.609375 11.738281 11.738281 9.609375 11.738281 6.996094 C 11.738281 4.378906 9.609375 2.25 6.996094 2.25 Z M 9.773438 7.371094 L 6.996094 7.371094 C 6.789062 7.371094 6.621094 7.203125 6.621094 6.996094 L 6.621094 3.070312 L 7.371094 3.070312 L 7.371094 6.621094 L 9.773438 6.621094 Z M 9.773438 7.371094 " />
          <path d="M 23.738281 19.261719 C 21.917969 16.886719 20.914062 13.558594 20.914062 10.566406 L 20.914062 7.960938 C 20.914062 4.542969 18.316406 1.742188 14.996094 1.582031 C 14.25 1.550781 13.503906 1.652344 12.796875 1.882812 C 14 3.246094 14.738281 5.035156 14.738281 6.996094 C 14.738281 10.980469 11.710938 14.269531 7.835938 14.691406 C 7.355469 16.199219 6.617188 18.007812 5.65625 19.261719 C 5.363281 19.640625 5.3125 20.140625 5.523438 20.566406 C 5.726562 20.984375 6.144531 21.242188 6.613281 21.242188 L 11.589844 21.242188 C 11.773438 22.796875 13.09375 24 14.695312 24 C 16.300781 24 17.621094 22.796875 17.804688 21.242188 L 22.78125 21.242188 C 23.246094 21.242188 23.667969 20.984375 23.871094 20.566406 C 24.082031 20.140625 24.03125 19.640625 23.738281 19.261719 Z M 21.207031 19.570312 C 19.542969 16.984375 18.664062 13.628906 18.664062 10.566406 L 18.664062 7.960938 C 18.664062 5.78125 16.972656 3.929688 14.890625 3.832031 C 14.832031 3.828125 14.769531 3.828125 14.707031 3.828125 L 14.707031 3.078125 C 14.777344 3.078125 14.851562 3.078125 14.925781 3.082031 C 17.402344 3.199219 19.414062 5.386719 19.414062 7.960938 L 19.414062 10.566406 C 19.414062 13.484375 20.253906 16.699219 21.839844 19.164062 Z M 21.207031 19.570312 " />
          <path d="M 6.996094 0 C 3.136719 0 0 3.136719 0 6.996094 C 0 10.851562 3.136719 13.988281 6.996094 13.988281 C 10.851562 13.988281 13.988281 10.851562 13.988281 6.996094 C 13.988281 3.136719 10.851562 0 6.996094 0 Z M 6.996094 12.488281 C 3.964844 12.488281 1.5 10.023438 1.5 6.996094 C 1.5 3.964844 3.964844 1.5 6.996094 1.5 C 10.023438 1.5 12.488281 3.964844 12.488281 6.996094 C 12.488281 10.023438 10.023438 12.488281 6.996094 12.488281 Z M 6.996094 12.488281 " />
        </g>
      </svg>
    </div>
  );

  function createAlertTable() {
    if (data !== undefined && data.series.length > 0) {
      const dataframe = data.series[0];
      let state = getField(dataframe, 'state');
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
      const ack = getField(dataframe, 'acknowledgement');

      let alert_view_tags = [];
      if (tags && tags.length > 0) {
        alert_view_tags = tags.split('|');
      }

      const alert_ts_date = new Date(alert_timestamp);
      /* const clear_ts_date = new Date(cleared_timestamp); */

      /* const clear_ts_string = cleared_timestamp
       *   ? clear_ts_date.toISOString()
       *   : ""; */

      let iconState = state === 'ALERTING' ? 'alerting' : 'ok';
      let iconSVG = iconState === 'alerting' ? heartBreakSVG : heartSVG;
      if (ack) {
        iconState = 'acknowledged';
        iconSVG = ackSVG;
        state = 'ACKNOWLEDGED';
      }

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
        whiteSpace: 'normal',
      } as React.CSSProperties;

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
