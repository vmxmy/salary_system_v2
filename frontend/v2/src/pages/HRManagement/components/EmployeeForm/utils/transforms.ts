/**
 * 将原始数据转换为树形结构
 */
export const transformToTreeData = (items: Array<{ id: number | string; name: string; label?: string; value?: number | string; children?: any[] }>, valueKey = 'id', labelKey = 'name'): any[] => {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => ({
    title: item.label || item[labelKey as keyof typeof item],
    value: Number(item.value || item[valueKey as keyof typeof item]),
    key: item.id || item.value,
    children: item.children ? transformToTreeData(item.children, valueKey, labelKey) : [],
  }));
};

/**
 * 将平面列表转换为下拉选择选项
 */
export const transformListToSelectOptions = (items: Array<{ id: any; name: string }>) => {
  if (!items || !Array.isArray(items)) return [];
  return items
    .filter(item => item.id !== null && item.id !== undefined && !isNaN(Number(item.id)))
    .map(item => ({
      value: Number(item.id),
      label: item.name,
      key: Number(item.id),
    }));
};

/**
 * 将树形结构转换为带缩进的平面下拉选择选项
 */
export const transformTreeToFlatSelectOptions = (
  treeItems: Array<{ id: any; name: string; children?: any[], code?: string }>,
  options: Array<{ value: number; label: string; key: number }> = [],
  level = 0,
  parentName = ''
): Array<{ value: number; label: string; key: number }> => {
  const prefix = level > 0 ? '\u00A0\u00A0'.repeat(level) + '- ' : '';
  for (const item of treeItems) {
    if (item.id !== null && item.id !== undefined && !isNaN(Number(item.id))) {
      const label = prefix + item.name.trim();
      options.push({
        value: Number(item.id),
        label: label,
        key: Number(item.id),
      });
    }
    if (item.children && item.children.length > 0) {
      transformTreeToFlatSelectOptions(item.children, options, level + 1, item.name);
    }
  }
  return options;
}; 