import React from 'react';
import { TourStep } from '../components/common/TourGuide';
import { AVAILABLE_TOURS } from '../components/common/TourManager';

/**
 * 文件导入页面的引导步骤
 */
export const getFileConverterTourSteps = (): TourStep[] => [
  {
    key: 'intro',
    title: '欢迎使用文件导入功能',
    description: (
      <>
        <p>在这个页面，您可以导入工资数据文件，系统会自动处理并导入到数据库中。</p>
        <p>让我们一起了解如何使用这个功能。</p>
      </>
    ),
    target: '.ant-layout-content',
    placement: 'center',
  },
  {
    key: 'pay_period',
    title: '选择工资发放周期',
    description: (
      <>
        <p>首先，您需要选择工资发放周期（年月）。</p>
        <p>这个信息将用于标识导入的数据属于哪个月份。</p>
      </>
    ),
    target: '[data-tour="pay-period-picker"]',
    placement: 'bottom',
  },
  {
    key: 'file_upload',
    title: '选择文件',
    description: (
      <>
        <p>点击此按钮选择要导入的 Excel 文件。</p>
        <p>系统支持 .xlsx 和 .xls 格式的文件。</p>
      </>
    ),
    target: '[data-tour="file-upload-button"]',
    placement: 'bottom',
  },
  {
    key: 'upload_button',
    title: '上传文件',
    description: (
      <>
        <p>选择文件后，点击此按钮开始上传和处理文件。</p>
        <p>系统会自动验证数据、映射字段并将其导入到数据库中。</p>
      </>
    ),
    target: '[data-tour="upload-button"]',
    placement: 'bottom',
  },
  {
    key: 'progress',
    title: '上传进度',
    description: '这里会显示文件上传和处理的进度。',
    target: '[data-tour="upload-progress"]',
    placement: 'top',
  },
  {
    key: 'result',
    title: '处理结果',
    description: (
      <>
        <p>文件处理完成后，这里会显示处理结果。</p>
        <p>您可以查看导入的记录数、成功和失败的记录等信息。</p>
      </>
    ),
    target: '[data-tour="result-area"]',
    placement: 'top',
  },
  {
    key: 'conclusion',
    title: '引导结束',
    description: (
      <>
        <p>恭喜！您已经了解了文件导入功能的基本使用方法。</p>
        <p>如果您需要再次查看此引导，可以点击页面右上角的"功能引导"按钮。</p>
      </>
    ),
    target: '.ant-layout-content',
    placement: 'center',
  },
];

/**
 * 文件导入页面的引导配置
 */
export const FILE_CONVERTER_TOUR = {
  id: AVAILABLE_TOURS.FILE_CONVERTER,
  steps: getFileConverterTourSteps(),
};
