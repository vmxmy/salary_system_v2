import React, { useState } from 'react';
import { Tag, Card, Form, Input, Button, Space, Switch, message } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { ReportTable } from '@/components/common/ReportTable';

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

// 模拟报表模板配置
interface ReportTemplateConfig {
  reportTitle?: string;
  reportDescription?: string;
  reportDescriptionLines?: string[];
  selectedDataSourceIds: string[];
  fields: any[];
  version: number;
}

const ReportTemplateDemo: React.FC = () => {
  // 模拟报表模板配置数据
  const [templateConfig, setTemplateConfig] = useState<ReportTemplateConfig>({
    reportTitle: '员工薪资报表',
    reportDescriptionLines: [
      "单位名称：高新区财政局",
      "单位：元", 
      "经办人签字：张三",
      "制表时间：" + new Date().toLocaleDateString()
    ],
    selectedDataSourceIds: ['employee_data'],
    fields: [],
    version: 1
  });

  // 是否使用模板配置
  const [useTemplateConfig, setUseTemplateConfig] = useState(true);

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
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        active: { text: '在职', status: 'Success' },
        inactive: { text: '离职', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : 'error'}>
          {record.status === 'active' ? '在职' : '离职'}
        </Tag>
      ),
    },
    {
      title: '入职日期',
      dataIndex: 'joinDate',
      width: 120,
      valueType: 'date',
    },
  ];

  // 更新模板配置
  const updateTemplateConfig = (field: string, value: any) => {
    setTemplateConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 更新说明行
  const updateDescriptionLine = (index: number, value: string) => {
    const newLines = [...(templateConfig.reportDescriptionLines || [])];
    newLines[index] = value;
    updateTemplateConfig('reportDescriptionLines', newLines);
  };

  // 添加说明行
  const addDescriptionLine = () => {
    const newLines = [...(templateConfig.reportDescriptionLines || []), ''];
    updateTemplateConfig('reportDescriptionLines', newLines);
  };

  // 删除说明行
  const removeDescriptionLine = (index: number) => {
    const newLines = (templateConfig.reportDescriptionLines || []).filter((_, i) => i !== index);
    updateTemplateConfig('reportDescriptionLines', newLines);
  };

  // 保存模板配置（模拟API调用）
  const saveTemplateConfig = async () => {
    try {
      // 这里应该调用实际的API来保存模板配置
      console.log('保存模板配置:', templateConfig);
      message.success('模板配置保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 模板配置管理面板 */}
      <Card 
        title="报表模板配置管理" 
        size="small"
        style={{ marginBottom: '16px' }}
        bodyStyle={{ padding: '16px' }}
        extra={
          <Space>
            <Switch 
              checked={useTemplateConfig}
              onChange={setUseTemplateConfig}
              checkedChildren="使用模板配置"
              unCheckedChildren="使用直接配置"
            />
            <Button type="primary" size="small" onClick={saveTemplateConfig}>
              保存模板配置
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" size="small">
          <Form.Item label="报表标题">
            <Input 
              value={templateConfig.reportTitle}
              onChange={(e) => updateTemplateConfig('reportTitle', e.target.value)}
              placeholder="请输入报表标题"
            />
          </Form.Item>
          
          <Form.Item label="说明行配置">
            {(templateConfig.reportDescriptionLines || []).map((line, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#999', width: '60px', flexShrink: 0 }}>
                  说明{index + 1}：
                </span>
                <Input
                  value={line}
                  onChange={(e) => updateDescriptionLine(index, e.target.value)}
                  placeholder={`说明行 ${index + 1}`}
                  size="small"
                  style={{ flex: 1, marginRight: '8px' }}
                />
                {(templateConfig.reportDescriptionLines || []).length > 1 && (
                  <Button 
                    type="link" 
                    danger 
                    size="small"
                    onClick={() => removeDescriptionLine(index)}
                    style={{ padding: '0 4px', fontSize: '12px' }}
                  >
                    删除
                  </Button>
                )}
              </div>
            ))}
            <Button size="small" type="dashed" onClick={addDescriptionLine}>
              添加说明行
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 报表表格 */}
      <ReportTable<ReportData>
        // 根据开关决定使用哪种配置方式
        reportConfig={useTemplateConfig ? templateConfig : undefined}
        reportTitle={!useTemplateConfig ? '直接配置的标题' : undefined}
        reportDescription={!useTemplateConfig ? ['直接配置的说明1', '直接配置的说明2'] : undefined}
        columns={columns}
        dataSource={dataSource}
        exportConfig={{
          enabled: true,
          filename: templateConfig.reportTitle || '报表',
          formats: ['excel', 'csv'],
        }}
        printConfig={{
          enabled: true,
          title: templateConfig.reportTitle || '报表',
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

export default ReportTemplateDemo; 