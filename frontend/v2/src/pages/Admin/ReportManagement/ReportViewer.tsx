import React, { useState, useEffect } from 'react';
import { Row, Col, message, Modal, Input, Alert, Grid, Card, Select, Button, Space, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import PageLayout from '../../../components/common/PageLayout';
import {
  ReportTemplateSelector,
  ReportDataDisplay,
  ReportActionToolbar,
  ReportFilterModal,
  type ReportTemplate,
  type ReportData,
  type ReportFilter,
  type LayoutConfig
} from './components/ReportViewer';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../components/common/EnhancedProTable';
import { reportTemplateAPI, reportExecutionAPI } from '../../../api/reports';
import { FileExcelOutlined, FilePdfOutlined, ReloadOutlined } from '@ant-design/icons';

const { useBreakpoint } = Grid;

const ReportViewer: React.FC = () => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const screens = useBreakpoint();
  
  // 响应式配置
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // 状态管理
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilter>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // 加载报表模板列表
  const loadTemplates = async () => {
    try {
      const response = await reportTemplateAPI.getTemplates();
      setTemplates(response.data);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      message.error(`加载报表模板失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  // 生成报表数据
  const generateReport = async (templateId: string) => {
    try {
      setLoading(true);
      
      // 执行报表
      const executionResponse = await reportTemplateAPI.executeTemplate(Number(templateId));
      
      // 获取报表数据
      const dataResponse = await reportExecutionAPI.queryReportData({
        template_id: Number(templateId),
        page: 1,
        page_size: 100
      });
      
      // 获取模板详情以构建列配置
      const templateResponse = await reportTemplateAPI.getTemplate(Number(templateId));
      const template = templateResponse.data;
      
      // 根据模板字段配置构建列
      const columns: ProColumns<any>[] = (template.fields || []).map(field => ({
        title: field.field_alias || field.field_name,
        dataIndex: field.field_name,
        key: field.field_name,
        width: field.width || 120,
        sorter: field.is_sortable,
        search: field.is_filterable ? {} : false,
        hideInSearch: !field.is_filterable,
      }));
      
      const reportData: ReportData = {
        columns,
        dataSource: dataResponse.data || [],
        total: dataResponse.total || 0
      };
      
      setReportData(reportData);
      message.success('报表生成成功');
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      message.error(`生成报表失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 导出处理
  const handleExport = (format: string) => {
    message.success(t('exportingFormat', `正在导出为 ${format.toUpperCase()} 格式...`));
  };

  // 打印处理
  const handlePrint = () => {
    window.print();
    message.success(t('preparingPrint', '正在准备打印...'));
  };

  // 分享处理
  const handleShare = () => {
    Modal.info({
      title: t('shareReport', '分享报表'),
      content: (
        <div>
          <p>{t('reportLink', '报表链接：')}</p>
          <Input.TextArea
            value={`${window.location.origin}/reports/viewer/${selectedTemplate}`}
            readOnly
            rows={2}
          />
          <Alert
            message={t('shareConditionsNote', '分享的报表将使用当前的筛选条件')}
            type="info"
            style={{ marginTop: '16px' }}
          />
        </div>
      ),
    });
  };

  // 筛选确认
  const handleFilterConfirm = (newFilters: ReportFilter) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
    if (selectedTemplate) {
      generateReport(selectedTemplate);
    }
  };

  // 响应式布局配置
  const getLayoutConfig = (): LayoutConfig => {
    if (isMobile) {
      return { templateSpan: 24, contentSpan: 24, direction: 'vertical' };
    }
    if (isTablet) {
      return { templateSpan: 10, contentSpan: 14, direction: 'horizontal' };
    }
    return { templateSpan: 8, contentSpan: 16, direction: 'horizontal' };
  };

  const { templateSpan, contentSpan } = getLayoutConfig();

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <PageLayout
      title={t('reportViewer', '报表查看器')}
      breadcrumbItems={[
        { key: 'admin', title: t('admin', '系统管理') },
        { key: 'reports', title: t('reportManagement', '报表管理') },
        { key: 'viewer', title: t('reportViewer', '报表查看器') }
      ]}
      showCard={false}
    >
      <Row gutter={[16, 16]} style={{ height: '100%' }}>
        {/* 报表模板选择器 */}
        <Col span={templateSpan} order={isMobile ? 2 : 1}>
          <ReportTemplateSelector
            templates={templates}
            searchText={searchText}
            selectedCategory={selectedCategory}
            onSearchChange={setSearchText}
            onCategoryChange={setSelectedCategory}
            onTemplateSelect={generateReport}
            isMobile={isMobile}
          />
        </Col>

        {/* 报表数据展示 */}
        <Col span={contentSpan} order={isMobile ? 1 : 2}>
          <div style={{ marginBottom: 16 }}>
            <ReportActionToolbar
              selectedTemplate={selectedTemplate}
              reportData={reportData}
              onFilter={() => setFilterModalVisible(true)}
              onExport={handleExport}
              onPrint={handlePrint}
              onShare={handleShare}
              isMobile={isMobile}
            />
          </div>
          
          <ReportDataDisplay
            reportData={reportData}
            selectedTemplate={selectedTemplate}
            loading={loading}
            isMobile={isMobile}
          />
        </Col>
      </Row>

      {/* 筛选条件对话框 */}
      <ReportFilterModal
        visible={filterModalVisible}
        filters={filters}
        onCancel={() => setFilterModalVisible(false)}
        onConfirm={handleFilterConfirm}
        isMobile={isMobile}
      />
    </PageLayout>
  );
};

export default ReportViewer;