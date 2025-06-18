import React, { useState } from 'react';
import { Tag, Card, Form, Input, Button, Space, Divider } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { ReportTable } from '@/components/common/ReportTable';
import { useTranslation } from 'react-i18next';

// 示例数据类型
type ReportData = {
  id: string;
  name: string;
  department: string;
  position: string;
  salary: number;
  status: 'active' | 'inactive';
  joinDate: string;
};

const ReportTableDemo: React.FC = () => {
  const { t } = useTranslation();

  // 报表配置状态
  const [reportTitle, setReportTitle] = useState('员工信息报表');
  const [reportDescription, setReportDescription] = useState<string[]>([
    t('admin:report_demo_default_description_line1'),
    t('admin:report_demo_default_description_line2'),
    t('admin:report_demo_default_description_line3'),
    t('admin:report_demo_default_description_line4') + new Date().toLocaleDateString()
  ]);
  
  const [dataSource] = useState<ReportData[]>([
    {
      id: '001',
      name: '张三',
      department: '技术部',
      position: '高级工程师',
      salary: 15000,
      status: 'active',
      joinDate: '2023-01-15',
    },
    {
      id: '002',
      name: '李四',
      department: '市场部',
      position: '市场经理',
      salary: 18000,
      status: 'active',
      joinDate: '2023-03-20',
    },
    {
      id: '003',
      name: '王五',
      department: '人事部',
      position: 'HR专员',
      salary: 12000,
      status: 'inactive',
      joinDate: '2023-06-10',
    },
  ]);

  const columns: ProColumns<ReportData>[] = [
    {
      title: '员工ID',
      dataIndex: 'id',
      width: 100,
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 150,
      filters: [
        { text: '技术部', value: '技术部' },
        { text: '市场部', value: '市场部' },
        { text: '人事部', value: '人事部' },
      ],
    },
    {
      title: '职位',
      dataIndex: 'position',
      width: 150,
    },
    {
      title: '工资',
      dataIndex: 'salary',
      width: 120,
      valueType: 'money',
      sorter: (a, b) => a.salary - b.salary,
    },
    {
      title: t('admin:report_demo_status_title'),
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        active: { text: t('admin:report_demo_status_active'), status: 'Success' },
        inactive: { text: t('admin:report_demo_status_inactive'), status: 'Error' },
      },
      render: (_, record, index) => (
        <Tag color={record.status === 'active' ? 'success' : 'error'}>
          {record.status === 'active' ? t('admin:report_demo_status_active') : t('admin:report_demo_status_inactive')}
        </Tag>
      ),
    },
    {
      title: t('admin:report_demo_join_date_title'),
      dataIndex: 'joinDate',
      width: 120,
      valueType: 'date',
    },
  ];

  // 更新说明行的处理函数
  const handleDescriptionChange = (index: number, value: string) => {
    const newDescription = [...reportDescription];
    newDescription[index] = value;
    setReportDescription(newDescription);
  };

  // 添加说明行
  const addDescriptionItem = () => {
    setReportDescription([...reportDescription, ""]);
  };

  // 删除说明行
  const removeDescriptionItem = (index: number) => {
    const newDescription = reportDescription.filter((_, i) => i !== index);
    setReportDescription(newDescription);
  };

  // 重置为默认值
  const resetToDefault = () => {
    setReportTitle(t('admin:report_demo_default_report_title'));
    setReportDescription([
      t('admin:report_demo_default_description_line1'),
      t('admin:report_demo_default_description_line2'),
      t('admin:report_demo_default_description_line3'),
      t('admin:report_demo_default_description_line4') + new Date().toLocaleDateString()
    ]);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 报表配置面板 */}
      <Card 
        title={t('admin:report_demo_config_panel_title')} 
        size="small"
        style={{ marginBottom: '16px' }}
        styles={{ body: { padding: '16px' } }}
      >
        <Form layout="inline" style={{ width: '100%' }}>
          <Form.Item label={t('admin:report_demo_title_label')} style={{ marginBottom: '12px', minWidth: '300px' }}>
            <Input 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder={t('admin:report_demo_title_placeholder')}
              size="small"
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: '12px' }}>
            <Space size="small">
              <Button size="small" type="dashed" onClick={addDescriptionItem}>
                {t('admin:report_demo_add_description_button')}
              </Button>
              <Button size="small" onClick={resetToDefault}>
                {t('common:reset')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{t('admin:report_demo_description_lines_config_title')}</div>
          {reportDescription.map((desc, index) => (
            <div key={index} style={{ display: 'flex', marginBottom: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#999', width: '60px', flexShrink: 0 }}>
                {t('admin:report_demo_description_line_number', { index: index + 1 })}
              </span>
              <Input
                value={desc}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={t('admin:report_demo_description_line_placeholder', { index: index + 1 })}
                size="small"
                style={{ flex: 1, marginRight: '8px' }}
              />
              {reportDescription.length > 1 && (
                <Button 
                  type="link" 
                  danger 
                  size="small"
                  onClick={() => removeDescriptionItem(index)}
                  style={{ padding: '0 4px', fontSize: '12px' }}
                >
                  {t('common:button.delete')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 报表表格 */}
      <ReportTable<ReportData>
        reportTitle={reportTitle}
        reportDescription={reportDescription}
        columns={columns}
        dataSource={dataSource}
        exportConfig={{
          enabled: true,
          filename: reportTitle,
          formats: ['excel', 'pdf', 'csv'],
        }}
        printConfig={{
          enabled: true,
          title: reportTitle,
        }}
        tableConfig={{
          showIndex: true,
          showSelection: true,
          showPagination: true,
          showToolbar: true,
          showDensity: true,
          showColumnSetting: true,
          showFullscreen: true,
          showRefresh: true,
          pagination: {
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: true,
          },
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
      />
    </div>
  );
};

export default ReportTableDemo; 