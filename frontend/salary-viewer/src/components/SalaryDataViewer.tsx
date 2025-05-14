import React from 'react';
import SalaryDataViewerComponent from './SalaryDataViewer/index';

/**
 * 薪资数据查看器组件
 *
 * 此组件已重构为模块化结构，以提高可维护性和性能。
 * 主要功能包括：
 * 1. 查看薪资数据
 * 2. 筛选和排序数据
 * 3. 自定义表格列显示
 * 4. 保存和加载表格布局
 * 5. 导出数据
 *
 * 新的组件结构：
 * - SalaryDataViewer/
 *   - index.tsx (主入口)
 *   - SalaryContext.tsx (状态上下文)
 *   - SalaryTable.tsx (表格组件)
 *   - SalaryFilters.tsx (筛选组件)
 * - hooks/
 *   - useSalaryData.ts (数据获取和处理)
 *   - useTableColumns.ts (表格列配置)
 *   - useTableFilters.ts (表格筛选)
 *   - useTableLayout.ts (表格布局)
 *   - useTableExport.ts (表格导出)
 */
const SalaryDataViewer: React.FC = () => {
    // 使用新的模块化组件
    return <SalaryDataViewerComponent />;
};

export default SalaryDataViewer;
