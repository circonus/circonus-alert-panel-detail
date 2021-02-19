import { PanelPlugin } from '@grafana/data';
import { CirconusAlertPanelDetailOptions } from './types';
import { CirconusAlertPanelDetail } from './CirconusAlertPanelDetail';

export const plugin = new PanelPlugin<CirconusAlertPanelDetailOptions>(CirconusAlertPanelDetail).setPanelOptions(
  builder => {
    return builder.addStringArray({
      path: 'exclude',
      name: 'Exclude tag categories',
      description: 'The list of tag categories to exclude from the tag listing on the detail page',
      defaultValue: [],
    });
  }
);
