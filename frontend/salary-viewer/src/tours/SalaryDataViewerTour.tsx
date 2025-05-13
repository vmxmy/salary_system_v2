import React from 'react';
import { TourStep } from '../components/common/TourGuide';
import { AVAILABLE_TOURS } from '../components/common/TourManager';

/**
 * 工资数据查看器页面的引导步骤
 */
export const getSalaryDataViewerTourSteps = (): TourStep[] => [
  {
    key: 'intro',
    title: '欢迎使用工资数据查看器',
    description: (
      <>
        <p>这是系统的核心功能页面，您可以在这里查看、筛选和导出工资数据。</p>
        <p>让我们一起了解如何使用这些功能。</p>
      </>
    ),
    target: '.ant-layout-content',
    placement: 'center',
  },
  {
    key: 'table_layout',
    title: '报表布局',
    description: (
      <>
        <p>点击此按钮可以保存和加载不同的表格布局配置。</p>
        <p>您可以为不同的使用场景创建多个布局，并在需要时快速切换。</p>
      </>
    ),
    target: '[data-tour="table-layout-button"]',
    placement: 'bottom',
  },
  {
    key: 'export',
    title: '导出数据',
    description: (
      <>
        <p>点击此按钮可以将当前表格数据导出为 Excel 或 CSV 文件。</p>
        <p>导出的数据会包含当前筛选和排序的结果。</p>
      </>
    ),
    target: '[data-tour="export-button"]',
    placement: 'bottom',
  },
  {
    key: 'column_settings',
    title: '列设置',
    description: (
      <>
        <p>点击此按钮可以自定义表格显示的列。</p>
        <p>您可以选择显示或隐藏特定列，以及调整列的顺序。</p>
      </>
    ),
    target: '[data-tour="column-settings-button"]',
    placement: 'bottom',
  },
  {
    key: 'advanced_filter',
    title: '高级筛选',
    description: (
      <>
        <p>点击此按钮可以设置复杂的筛选条件。</p>
        <p>您可以创建多个筛选条件组，每组内的条件使用"与"关系，组之间使用"或"关系。</p>
      </>
    ),
    target: '[data-tour="advanced-filter-button"]',
    placement: 'bottom',
  },
  {
    key: 'refresh',
    title: '刷新数据',
    description: '点击此按钮可以刷新表格数据，获取最新的工资信息。',
    target: '[data-tour="refresh-button"]',
    placement: 'bottom',
  },
  {
    key: 'table',
    title: '数据表格',
    description: (
      <>
        <p>这是工资数据表格，显示了所有员工的工资信息。</p>
        <p>您可以点击列标题进行排序，或者使用表头的筛选功能进行简单筛选。</p>
        <p>表格支持分页，您可以在底部调整每页显示的记录数。</p>
      </>
    ),
    target: '.ant-table',
    placement: 'top',
  },
  {
    key: 'conclusion',
    title: '引导结束',
    description: (
      <>
        <p>恭喜！您已经了解了工资数据查看器的基本功能。</p>
        <p>如果您需要再次查看此引导，可以点击页面右上角的"功能引导"按钮。</p>
      </>
    ),
    target: '.ant-layout-content',
    placement: 'center',
  },
];

/**
 * 工资数据查看器页面的引导配置
 */
export const SALARY_DATA_VIEWER_TOUR = {
  id: AVAILABLE_TOURS.SALARY_VIEWER,
  steps: getSalaryDataViewerTourSteps(),
};
