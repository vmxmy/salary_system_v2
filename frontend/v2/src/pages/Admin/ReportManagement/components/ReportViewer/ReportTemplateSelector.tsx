import React from 'react';
import { Button, Space, Tag, Typography, Input, Select } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import {
  BarChartOutlined,
  ReloadOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ReportTemplateSelectorProps, ReportTemplate } from './types';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

const ReportTemplateSelector: React.FC<ReportTemplateSelectorProps> = ({
  templates,
  searchText,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onTemplateSelect,
  onToggleFavorite,
  onRefresh,
  isMobile = false
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchText || 
      template.name.toLowerCase().includes(searchText.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 模板卡片组件
  const TemplateCard: React.FC<{ template: ReportTemplate }> = ({ template }) => (
    <ProCard
      hoverable
      style={{ marginBottom: 8, cursor: 'pointer' }}
      // @ts-ignore: ProCard supports styles.body but missing in type definition
      styles={{ body: { padding: 12 } }}
      onClick={() => onTemplateSelect(template)}
      actions={[
        <Button
          key="favorite"
          type="text"
          icon={template.is_favorite ? <StarFilled /> : <StarOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(template);
          }}
          style={{ color: template.is_favorite ? '#faad14' : undefined }}
        />
      ]}
    >
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Space>
          <Text strong>{template.name}</Text>
          <Tag color={
            template.category === 'salary' ? 'blue' :
            template.category === 'hr' ? 'green' : 'orange'
          }>
            {template.category === 'salary' ? t('salary', '薪资') :
             template.category === 'hr' ? t('hr', '人事') : t('finance', '财务')}
          </Tag>
        </Space>
        {template.description && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {template.description}
          </Text>
        )}
        <Space style={{ fontSize: '12px' }}>
          <Text type="secondary">
            {t('runCount', '运行次数')}: {template.run_count}
          </Text>
          {template.last_run_at && (
            <Text type="secondary">
              {t('lastRun', '最后运行')}: {new Date(template.last_run_at).toLocaleDateString()}
            </Text>
          )}
        </Space>
      </Space>
    </ProCard>
  );

  return (
    <ProCard
      title={
        <Space>
          <BarChartOutlined />
          <span>{t('reportTemplates', '报表模板')}</span>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          size="small"
          onClick={onRefresh}
        >
          {t('refresh', '刷新')}
        </Button>
      }
      style={{ height: isMobile ? 'auto' : '100%' }}
    >
      {/* 搜索和筛选 */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Search
          placeholder={t('searchReportName', '搜索报表名称')}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
        />
        <Select
          placeholder={t('selectCategory', '选择分类')}
          value={selectedCategory}
          onChange={onCategoryChange}
          allowClear
          style={{ width: '100%' }}
        >
          <Option value="salary">{t('salaryReports', '薪资报表')}</Option>
          <Option value="hr">{t('hrReports', '人事报表')}</Option>
          <Option value="finance">{t('financeReports', '财务报表')}</Option>
        </Select>
      </Space>

      {/* 报表列表 */}
      <div style={{ maxHeight: isMobile ? 300 : 600, overflowY: 'auto' }}>
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </ProCard>
  );
};

export default ReportTemplateSelector; 