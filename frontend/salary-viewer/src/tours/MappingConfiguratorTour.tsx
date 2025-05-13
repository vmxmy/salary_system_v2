import React from 'react';
import { TourStep } from '../components/common/TourGuide';
import { AVAILABLE_TOURS } from '../components/common/TourManager';

/**
 * 字段映射配置页面的引导步骤
 */
export const getMappingConfiguratorTourSteps = (): TourStep[] => [
  {
    key: 'intro',
    title: '欢迎使用字段映射配置',
    description: (
      <>
        <p>在这个页面，您可以配置源数据字段与目标字段之间的映射关系。</p>
        <p>这些映射关系将用于数据导入过程中的字段转换。</p>
      </>
    ),
    target: '.ant-layout-content',
    placement: 'center',
  },
  {
    key: 'search',
    title: '搜索映射',
    description: '您可以在这里搜索特定的字段映射，支持按来源名称和目标名称搜索。',
    target: '[data-tour="search-input"]',
    placement: 'bottom',
  },
  {
    key: 'add_button',
    title: '添加映射',
    description: '点击此按钮可以添加新的字段映射关系。',
    target: '[data-tour="add-mapping-button"]',
    placement: 'bottom',
  },
  {
    key: 'mapping_table',
    title: '映射表格',
    description: (
      <>
        <p>这个表格显示了所有已配置的字段映射关系。</p>
        <p>您可以查看来源字段名、目标字段名、数据类型等信息。</p>
      </>
    ),
    target: '[data-tour="mapping-table"]',
    placement: 'top',
  },
  {
    key: 'edit_action',
    title: '编辑映射',
    description: '点击"编辑"按钮可以修改现有的字段映射关系。',
    target: '[data-tour="edit-action"]',
    placement: 'left',
  },
  {
    key: 'delete_action',
    title: '删除映射',
    description: '点击"删除"按钮可以删除不需要的字段映射关系。',
    target: '[data-tour="delete-action"]',
    placement: 'left',
  },
  {
    key: 'mapping_form',
    title: '映射表单',
    description: (
      <>
        <p>添加或编辑映射时，您需要填写这个表单。</p>
        <p>来源名称：Excel 文件中的列名</p>
        <p>目标名称：数据库中的字段名</p>
        <p>数据类型：字段的数据类型</p>
        <p>中间字段：标记为中间处理字段</p>
        <p>最终字段：标记为最终存储字段</p>
      </>
    ),
    target: '[data-tour="mapping-form"]',
    placement: 'right',
  },
  {
    key: 'conclusion',
    title: '引导结束',
    description: (
      <>
        <p>恭喜！您已经了解了字段映射配置的基本使用方法。</p>
        <p>正确的字段映射配置对于数据导入的准确性至关重要。</p>
        <p>如果您需要再次查看此引导，可以点击页面右上角的"功能引导"按钮。</p>
      </>
    ),
    target: '.ant-layout-content',
    placement: 'center',
  },
];

/**
 * 字段映射配置页面的引导配置
 */
export const MAPPING_CONFIGURATOR_TOUR = {
  id: AVAILABLE_TOURS.MAPPING_CONFIGURATOR,
  steps: getMappingConfiguratorTourSteps(),
};
