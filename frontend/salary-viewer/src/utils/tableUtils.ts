import { TableColumnsType } from 'antd';
import { ColumnConfig } from '../components/table/ColumnSettingsDrawer';
import { FilterCondition, FilterGroup } from '../components/table/AdvancedFilterDrawer';

/**
 * 将表格列配置转换为Ant Design表格列
 * @param columns 列配置
 * @returns Ant Design表格列
 */
export const convertConfigToColumns = (columns: ColumnConfig[]): TableColumnsType<any> => {
  // 需要添加筛选功能的字段
  const filterableFields = [
    // 主要字段名
    'establishment_type',  // 编制类型
    'employee_type',       // 人员身份
    'position_type',       // 岗位类别
    'position_level',      // 职务级别
    'job_title',           // 职务名称

    // 备用字段名（带前缀）
    'sal_establishment_type_name',
    'sal_employee_type_name',
    'sal_employee_type_key',
    'sal_position_type_name',
    'sal_position_level_name',
    'sal_job_title_name',

    // 更多可能的变体
    'establishment_type_name',
    'employee_type_name',
    'position_type_name',
    'position_level_name',
    'job_level'
  ];

  return columns
    .filter(col => col.visible)
    .map(col => {
      const column: any = {
        key: col.key,
        dataIndex: col.dataIndex || col.key,
        title: col.title,
        fixed: col.fixed,
        width: col.width,
      };

      // 只为编制类型字段添加筛选功能
      const shouldHaveFilter = (col.dataIndex === 'establishment_type' ||
                              col.dataIndex === 'sal_establishment_type_name' ||
                              col.dataIndex === 'establishment_type_name' ||
                              (col.key && (col.key.includes('establishment_type') ||
                                          col.key === 'establishment_type')));

      if (shouldHaveFilter) {
        console.log(`Adding filter to column from config: ${col.key}`);

        // 根据字段名称添加不同的筛选选项
        let filterOptions: { text: string, value: string }[] = [];

        // 编制类型
        if (col.dataIndex === 'establishment_type' || col.key.includes('establishment')) {
          filterOptions = [
            { text: 'gwy', value: 'gwy' },
            { text: 'cg', value: 'cg' },
            { text: 'sy', value: 'sy' },
            { text: 'qp', value: 'qp' },
            { text: 'ytf', value: 'ytf' }
          ];
        }
        // 人员身份
        else if (col.dataIndex === 'employee_type' || col.key.includes('employee')) {
          filterOptions = [
            { text: 'gwy', value: 'gwy' },
            { text: 'cg', value: 'cg' },
            { text: 'sy', value: 'sy' },
            { text: 'qp', value: 'qp' },
            { text: 'ytf', value: 'ytf' }
          ];
        }
        // 岗位类别
        else if (col.dataIndex === 'position_type' || col.key.includes('position_type')) {
          filterOptions = [
            { text: '管理', value: '管理' },
            { text: '专业技术', value: '专业技术' },
            { text: '工勤', value: '工勤' }
          ];
        }
        // 职务级别
        else if (col.dataIndex === 'position_level' || col.key.includes('position_level')) {
          filterOptions = [
            { text: '科级', value: '科级' },
            { text: '科员', value: '科员' },
            { text: '办事员', value: '办事员' },
            { text: '一级主任科员', value: '一级主任科员' },
            { text: '二级主任科员', value: '二级主任科员' },
            { text: '三级主任科员', value: '三级主任科员' },
            { text: '四级主任科员', value: '四级主任科员' },
            { text: '一级科员', value: '一级科员' },
            { text: '二级科员', value: '二级科员' }
          ];
        }
        // 默认选项
        else {
          filterOptions = [{ text: '加载中...', value: 'loading' }];
        }

        // 添加筛选功能
        column.filters = filterOptions;
        column.onFilter = (value: string, record: any) => {
          if (value === 'loading') return true;
          const recordValue = record[col.dataIndex || col.key];
          return recordValue === value;
        };
        column.filterMultiple = true;
        column.filterSearch = true;

        // 添加排序功能 - 只为编制类型字段添加
        column.sorter = (a: any, b: any) => {
          const valueA = a[col.dataIndex || col.key] || '';
          const valueB = b[col.dataIndex || col.key] || '';
          return valueA.localeCompare(valueB);
        };
      }

      return column;
    });
};

/**
 * 将Ant Design表格列转换为列配置
 * @param columns Ant Design表格列
 * @returns 列配置
 */
export const convertColumnsToConfig = (columns: TableColumnsType<any>): ColumnConfig[] => {
  return columns.map(col => ({
    key: col.key as string,
    title: col.title,
    visible: true,
    fixed: col.fixed,
    width: col.width as number,
    dataIndex: col.dataIndex as string,
  }));
};

/**
 * 应用单个筛选条件
 * @param record 记录
 * @param condition 筛选条件
 * @returns 是否匹配
 */
const applyCondition = (record: any, condition: FilterCondition): boolean => {
  try {
    const { field, operator, value } = condition;

    // 调试日志
    console.log('Applying condition:', { field, operator, value });

    // 如果字段不存在或值为空，则跳过此条件
    if (!field || value === undefined || value === null || value === '') {
      console.log('Skipping condition due to empty field or value');
      return true;
    }

    const recordValue = record[field];
    console.log('Record value:', recordValue);

    // 如果记录值为空，根据操作符决定是否匹配
    if (recordValue === undefined || recordValue === null) {
      const result = operator === 'neq'; // 只有不等于操作符会匹配空值
      console.log('Record value is empty, result:', result);
      return result;
    }

    // 处理字符串值，去除前导和尾随空格
    const normalizedRecordValue = typeof recordValue === 'string' ? recordValue.trim() : recordValue;
    const normalizedValue = typeof value === 'string' ? value.trim() : value;

    console.log('Normalized values for comparison:', {
      normalizedRecordValue,
      normalizedValue,
      recordValueType: typeof recordValue,
      valueType: typeof value
    });

    // 根据操作符进行比较
    let result = false;
    switch (operator) {
      case 'eq':
        if (typeof normalizedRecordValue === 'string' && typeof normalizedValue === 'string') {
          // 字符串比较时忽略前导和尾随空格
          result = normalizedRecordValue === normalizedValue;
        } else {
          // 非字符串类型使用普通比较
          result = String(normalizedRecordValue) === String(normalizedValue);
        }
        break;
      case 'neq':
        if (typeof normalizedRecordValue === 'string' && typeof normalizedValue === 'string') {
          // 字符串比较时忽略前导和尾随空格
          result = normalizedRecordValue !== normalizedValue;
        } else {
          // 非字符串类型使用普通比较
          result = String(normalizedRecordValue) !== String(normalizedValue);
        }
        break;
      case 'gt':
        result = Number(normalizedRecordValue) > Number(normalizedValue);
        break;
      case 'gte':
        result = Number(normalizedRecordValue) >= Number(normalizedValue);
        break;
      case 'lt':
        result = Number(normalizedRecordValue) < Number(normalizedValue);
        break;
      case 'lte':
        result = Number(normalizedRecordValue) <= Number(normalizedValue);
        break;
      case 'contains':
        // 字符串包含比较时忽略大小写
        result = String(normalizedRecordValue).toLowerCase().includes(String(normalizedValue).toLowerCase());
        break;
      case 'startsWith':
        // 字符串开头比较时忽略大小写
        result = String(normalizedRecordValue).toLowerCase().startsWith(String(normalizedValue).toLowerCase());
        break;
      case 'endsWith':
        // 字符串结尾比较时忽略大小写
        result = String(normalizedRecordValue).toLowerCase().endsWith(String(normalizedValue).toLowerCase());
        break;
      default:
        result = true;
        break;
    }

    console.log('Condition result:', result);
    return result;
  } catch (error) {
    console.error('Error applying condition:', condition, error);
    return true; // 出错时默认通过筛选
  }
};

/**
 * 应用筛选条件组到数据
 * @param data 原始数据
 * @param groups 筛选条件组
 * @returns 筛选后的数据
 */
export const applyFilters = (data: any[], groups: FilterGroup[] | FilterCondition[]): any[] => {
  try {
    console.log('Applying filters with groups:', groups);

    if (!groups || groups.length === 0) {
      console.log('No filter groups, returning all data');
      return data;
    }

    // 检查groups是否是有效的数组
    if (!Array.isArray(groups)) {
      console.error('Invalid filter groups format, not an array:', groups);
      return data;
    }

    // 兼容旧版本的筛选条件格式
    if (groups.length > 0 && 'field' in groups[0]) {
      console.log('Using old format (FilterCondition[])');
      // 旧格式：FilterCondition[]
      const conditions = groups as FilterCondition[];
      const result = data.filter(record => {
        return conditions.every(condition => {
          const matches = applyCondition(record, condition);
          return matches;
        });
      });
      console.log(`Filtered data: ${result.length} of ${data.length} records`);
      return result;
    }

    // 新格式：FilterGroup[]
    console.log('Using new format (FilterGroup[])');
    const typedGroups = groups as FilterGroup[];

    // 验证每个组是否有有效的conditions数组
    const validGroups = typedGroups.filter(group => {
      if (!group || !group.conditions || !Array.isArray(group.conditions)) {
        console.error('Invalid filter group, missing conditions array:', group);
        return false;
      }
      return true;
    });

    if (validGroups.length === 0) {
      console.error('No valid filter groups found');
      return data;
    }

    const result = data.filter(record => {
      // 组之间使用OR逻辑，只要有一个组匹配就返回true
      return validGroups.some(group => {
        // 组内条件使用AND逻辑，所有条件都必须匹配
        const groupMatches = group.conditions.every(condition => {
          const matches = applyCondition(record, condition);
          return matches;
        });
        return groupMatches;
      });
    });

    console.log(`Filtered data: ${result.length} of ${data.length} records`);
    return result;
  } catch (error) {
    console.error('Error applying filters:', error);
    return data; // 出错时返回原始数据
  }
};

/**
 * 将筛选条件转换为API查询参数
 * @param filters 筛选条件或条件组
 * @returns API查询参数
 */
export const convertFiltersToParams = (filters: FilterGroup[] | FilterCondition[]): Record<string, any> => {
  const params: Record<string, any> = {};

  // 兼容旧版本的筛选条件格式
  if (filters.length > 0 && 'field' in filters[0]) {
    // 旧格式：FilterCondition[]
    const conditions = filters as FilterCondition[];
    conditions.forEach(condition => {
      const { field, operator, value } = condition;

      // 如果字段不存在或值为空，则跳过此条件
      if (!field || value === undefined || value === null || value === '') {
        return;
      }

      // 简单处理：只支持等于操作符直接传递给API
      if (operator === 'eq') {
        params[field] = value;
      } else {
        // 对于其他操作符，可以使用特定格式，如 field__gt=value
        params[`${field}__${operator}`] = value;
      }
    });

    return params;
  }

  // 新格式：FilterGroup[]
  // 注意：这里的实现是简化的，只处理第一个条件组
  // 实际上，OR逻辑的API参数处理可能需要后端支持
  const groups = filters as FilterGroup[];
  if (groups.length > 0) {
    // 添加一个标记，表示使用了多个条件组（OR逻辑）
    if (groups.length > 1) {
      params['_has_or_conditions'] = true;
    }

    // 将每个组的条件添加到参数中
    groups.forEach((group, groupIndex) => {
      group.conditions.forEach(condition => {
        const { field, operator, value } = condition;

        // 如果字段不存在或值为空，则跳过此条件
        if (!field || value === undefined || value === null || value === '') {
          return;
        }

        // 对于多组条件，使用 field__g{groupIndex}__{operator} 格式
        // 例如：name__g0__eq=张三, name__g1__eq=李四
        const paramKey = groups.length > 1
          ? `${field}__g${groupIndex}__${operator}`
          : operator === 'eq' ? field : `${field}__${operator}`;

        params[paramKey] = value;
      });
    });
  }

  return params;
};

/**
 * 保存表格设置到localStorage
 * @param key 存储键
 * @param value 存储值
 */
export const saveTableSetting = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save table setting for key ${key}:`, e);
  }
};

/**
 * 从localStorage加载表格设置
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 加载的设置或默认值
 */
export const loadTableSetting = <T>(key: string, defaultValue: T): T => {
  try {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
      return JSON.parse(savedValue);
    }
  } catch (e) {
    console.error(`Failed to load table setting for key ${key}:`, e);
  }
  return defaultValue;
};

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export const generateUniqueId = (): string => {
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 规范化筛选条件值，去除字符串值的前导和尾随空格
 * @param value 原始值
 * @returns 规范化后的值
 */
export const normalizeFilterValue = (value: any): any => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};
