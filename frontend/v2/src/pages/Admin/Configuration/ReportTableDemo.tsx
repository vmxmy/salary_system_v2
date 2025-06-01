import React, { useState } from 'react';
import { Tag, Card, Form, Input, Button, Space, Divider } from 'antd';
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

const ReportTableDemo: React.FC = () => {
  // 报表配置状态
  const [reportTitle, setReportTitle] = useState('员工信息报表');
  const [reportDescription, setReportDescription] = useState([
    "单位名称：财政局",
    "单位：元", 
    "经办人签字：",
    "制表时间：" + new Date().toLocaleDateString()
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
    setReportTitle('员工信息报表');
    setReportDescription([
      "单位名称：财政局",
      "单位：元", 
      "经办人签字：",
      "制表时间：" + new Date().toLocaleDateString()
    ]);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 报表配置面板 */}
      <Card 
        title="报表配置" 
        size="small"
        style={{ marginBottom: '16px' }}
        bodyStyle={{ padding: '16px' }}
      >
        <Form layout="inline" style={{ width: '100%' }}>
          <Form.Item label="标题" style={{ marginBottom: '12px', minWidth: '300px' }}>
            <Input 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="请输入报表标题"
              size="small"
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: '12px' }}>
            <Space size="small">
              <Button size="small" type="dashed" onClick={addDescriptionItem}>
                添加说明
              </Button>
              <Button size="small" onClick={resetToDefault}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>说明行配置：</div>
          {reportDescription.map((desc, index) => (
            <div key={index} style={{ display: 'flex', marginBottom: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#999', width: '60px', flexShrink: 0 }}>
                说明{index + 1}：
              </span>
              <Input
                value={desc}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={`说明行 ${index + 1}`}
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
                  删除
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