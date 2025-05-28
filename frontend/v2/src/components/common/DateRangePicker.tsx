import React from 'react';
import { DatePicker, Space, Button, Dropdown, Menu } from 'antd';
import { CalendarOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

const { RangePicker } = DatePicker;

// 启用dayjs插件
dayjs.extend(quarterOfYear);

// 预设日期范围类型
export type PresetRange = 
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days';

// 预设范围配置
const PRESET_RANGES: Record<PresetRange, {
  label: string;
  getValue: () => [Dayjs, Dayjs];
}> = {
  today: {
    label: '今天',
    getValue: () => [dayjs().startOf('day'), dayjs().endOf('day')],
  },
  yesterday: {
    label: '昨天',
    getValue: () => [
      dayjs().subtract(1, 'day').startOf('day'),
      dayjs().subtract(1, 'day').endOf('day'),
    ],
  },
  thisWeek: {
    label: '本周',
    getValue: () => [dayjs().startOf('week'), dayjs().endOf('week')],
  },
  lastWeek: {
    label: '上周',
    getValue: () => [
      dayjs().subtract(1, 'week').startOf('week'),
      dayjs().subtract(1, 'week').endOf('week'),
    ],
  },
  thisMonth: {
    label: '本月',
    getValue: () => [dayjs().startOf('month'), dayjs().endOf('month')],
  },
  lastMonth: {
    label: '上月',
    getValue: () => [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  thisQuarter: {
    label: '本季度',
    getValue: () => [dayjs().startOf('quarter'), dayjs().endOf('quarter')],
  },
  lastQuarter: {
    label: '上季度',
    getValue: () => [
      dayjs().subtract(1, 'quarter').startOf('quarter'),
      dayjs().subtract(1, 'quarter').endOf('quarter'),
    ],
  },
  thisYear: {
    label: '今年',
    getValue: () => [dayjs().startOf('year'), dayjs().endOf('year')],
  },
  lastYear: {
    label: '去年',
    getValue: () => [
      dayjs().subtract(1, 'year').startOf('year'),
      dayjs().subtract(1, 'year').endOf('year'),
    ],
  },
  last7Days: {
    label: '最近7天',
    getValue: () => [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')],
  },
  last30Days: {
    label: '最近30天',
    getValue: () => [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')],
  },
  last90Days: {
    label: '最近90天',
    getValue: () => [dayjs().subtract(89, 'day').startOf('day'), dayjs().endOf('day')],
  },
};

interface DateRangePickerProps {
  /** 当前值 */
  value?: [Dayjs | null, Dayjs | null] | null;
  /** 值变化回调 */
  onChange?: (dates: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => void;
  /** 日期格式 */
  format?: string;
  /** 占位符 */
  placeholder?: [string, string];
  /** 是否允许清空 */
  allowClear?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选择器大小 */
  size?: 'small' | 'middle' | 'large';
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 是否显示快捷选择 */
  showPresets?: boolean;
  /** 启用的预设范围 */
  enabledPresets?: PresetRange[];
  /** 自定义预设范围 */
  customPresets?: Array<{
    label: string;
    value: [Dayjs, Dayjs];
  }>;
  /** 是否显示时间选择 */
  showTime?: boolean;
  /** 时间格式 */
  timeFormat?: string;
  /** 禁用日期函数 */
  disabledDate?: (current: Dayjs) => boolean;
  /** 最小日期 */
  minDate?: Dayjs;
  /** 最大日期 */
  maxDate?: Dayjs;
  /** 快捷选择按钮样式 */
  presetButtonStyle?: 'dropdown' | 'buttons';
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  format = 'YYYY-MM-DD',
  placeholder,
  allowClear = true,
  disabled = false,
  size = 'middle',
  style,
  className,
  showPresets = true,
  enabledPresets = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'last7Days', 'last30Days'],
  customPresets = [],
  showTime = false,
  timeFormat = 'HH:mm:ss',
  disabledDate,
  minDate,
  maxDate,
  presetButtonStyle = 'dropdown',
}) => {
  const { t } = useTranslation(['common']);
  
  // 构建禁用日期函数
  const getDisabledDate = (current: Dayjs) => {
    if (disabledDate && disabledDate(current)) return true;
    if (minDate && current.isBefore(minDate, 'day')) return true;
    if (maxDate && current.isAfter(maxDate, 'day')) return true;
    return false;
  };
  
  // 处理预设范围选择
  const handlePresetSelect = (range: [Dayjs, Dayjs]) => {
    const dateStrings: [string, string] = [
      range[0].format(showTime ? `${format} ${timeFormat}` : format),
      range[1].format(showTime ? `${format} ${timeFormat}` : format),
    ];
    onChange?.(range, dateStrings);
  };
  
  // 构建预设菜单
  const buildPresetMenu = () => {
    const menuItems = [
      ...enabledPresets.map(presetKey => ({
        key: presetKey,
        label: PRESET_RANGES[presetKey].label,
        onClick: () => handlePresetSelect(PRESET_RANGES[presetKey].getValue()),
      })),
      ...customPresets.map((preset, index) => ({
        key: `custom-${index}`,
        label: preset.label,
        onClick: () => handlePresetSelect(preset.value),
      })),
    ];
    
    return <Menu items={menuItems} />;
  };
  
  // 渲染预设按钮
  const renderPresetButtons = () => {
    if (!showPresets) return null;
    
    if (presetButtonStyle === 'dropdown') {
      return (
        <Dropdown overlay={buildPresetMenu()} trigger={['click']}>
          <Button size={size} icon={<CalendarOutlined />}>
            {t('date_range_picker.quick_select', { defaultValue: '快捷选择' })}
            <DownOutlined />
          </Button>
        </Dropdown>
      );
    }
    
    // 按钮组模式
    return (
      <Space wrap>
        {enabledPresets.map(presetKey => (
          <Button
            key={presetKey}
            size="small"
            onClick={() => handlePresetSelect(PRESET_RANGES[presetKey].getValue())}
          >
            {PRESET_RANGES[presetKey].label}
          </Button>
        ))}
        {customPresets.map((preset, index) => (
          <Button
            key={`custom-${index}`}
            size="small"
            onClick={() => handlePresetSelect(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </Space>
    );
  };
  
  // 获取占位符
  const getPlaceholder = (): [string, string] => {
    if (placeholder) return placeholder;
    return [
      t('date_range_picker.start_date', { defaultValue: '开始日期' }),
      t('date_range_picker.end_date', { defaultValue: '结束日期' }),
    ];
  };
  
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <RangePicker
          value={value}
          onChange={onChange}
          format={showTime ? `${format} ${timeFormat}` : format}
          placeholder={getPlaceholder()}
          allowClear={allowClear}
          disabled={disabled}
          size={size}
          style={style}
          className={className}
          showTime={showTime ? { format: timeFormat } : false}
          disabledDate={getDisabledDate}
        />
        {renderPresetButtons()}
      </Space>
    </Space>
  );
};

export default DateRangePicker; 