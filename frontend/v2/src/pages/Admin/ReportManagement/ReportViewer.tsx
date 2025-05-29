import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
  Alert,
  Empty,
  Input,
  Select,
  DatePicker,
  Dropdown,
  Spin,
  Grid
} from 'antd';
import {
  ProTable,
  ProCard,
  StatisticCard,
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormDateRangePicker
} from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  BarChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  StarOutlined,
  StarFilled,
  SearchOutlined,
  TableOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import PageLayout from '../../../components/common/PageLayout';
import EnhancedProTable from '../../../components/common/EnhancedProTable';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface ReportTemplate {
  id: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  is_favorite?: boolean;
  last_run_at?: string;
  run_count?: number;
}

interface ReportData {
  columns: ProColumns<any>[];
  data: any[];
  total: number;
  summary?: {
    [key: string]: number | string;
  };
}

interface ReportFilter {
  dateRange?: [string, string];
  department?: string;
  employee?: string;
  [key: string]: any;
}

const ReportViewer: React.FC = () => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const screens = useBreakpoint();
  const actionRef = useRef<ActionType>();
  
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilter>({});
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 响应式配置
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // 加载报表模板列表
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const mockTemplates: ReportTemplate[] = [
        {
          id: 1,
          name: '员工薪资明细表',
          title: '2024年员工薪资明细报表',
          description: '包含员工基本信息和薪资详细信息的综合报表',
          category: 'salary',
          is_favorite: true,
          last_run_at: '2024-01-20T14:30:00Z',
          run_count: 156
        },
        {
          id: 2,
          name: '部门薪资汇总表',
          title: '各部门薪资统计汇总',
          description: '按部门统计的薪资汇总信息',
          category: 'salary',
          is_favorite: false,
          last_run_at: '2024-01-19T10:15:00Z',
          run_count: 89
        },
        {
          id: 3,
          name: '员工档案信息表',
          title: '员工基础档案信息',
          description: '员工的基本信息、入职信息等档案数据',
          category: 'hr',
          is_favorite: true,
          last_run_at: '2024-01-20T09:00:00Z',
          run_count: 234
        },
        {
          id: 4,
          name: '年度薪资统计表',
          title: '2024年度薪资统计分析',
          description: '年度薪资总览和趋势分析',
          category: 'finance',
          is_favorite: false,
          last_run_at: '2024-01-18T16:45:00Z',
          run_count: 45
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      message.error(t('loadTemplatesFailed', '加载报表模板失败'));
    }
  };

  const runReport = async (template: ReportTemplate) => {
    setLoading(true);
    setSelectedTemplate(template);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockColumns: ProColumns<any>[] = [
        { 
          title: '员工编号', 
          dataIndex: 'employee_code', 
          key: 'employee_code', 
          width: 120,
          fixed: 'left',
          search: false
        },
        { 
          title: '姓名', 
          dataIndex: 'name', 
          key: 'name', 
          width: 100,
          fixed: 'left',
          search: false
        },
        { 
          title: '部门', 
          dataIndex: 'department', 
          key: 'department', 
          width: 120,
          valueType: 'select',
          valueEnum: {
            '技术部': { text: '技术部' },
            '市场部': { text: '市场部' },
            '财务部': { text: '财务部' },
            '人事部': { text: '人事部' },
          }
        },
        { 
          title: '职位', 
          dataIndex: 'position', 
          key: 'position', 
          width: 120,
          search: false
        },
        { 
          title: '基本工资', 
          dataIndex: 'basic_salary', 
          key: 'basic_salary', 
          width: 120, 
          align: 'right',
          valueType: 'money',
          search: false
        },
        { 
          title: '津贴', 
          dataIndex: 'allowance', 
          key: 'allowance', 
          width: 100, 
          align: 'right',
          valueType: 'money',
          search: false
        },
        { 
          title: '扣除', 
          dataIndex: 'deduction', 
          key: 'deduction', 
          width: 100, 
          align: 'right',
          valueType: 'money',
          search: false
        },
        { 
          title: '实发工资', 
          dataIndex: 'net_pay', 
          key: 'net_pay', 
          width: 120, 
          align: 'right',
          valueType: 'money',
          search: false
        },
      ];

      const mockData: ReportData = {
        columns: mockColumns,
        data: Array.from({ length: 50 }, (_, index) => ({
          key: index,
          employee_code: `EMP${String(index + 1).padStart(3, '0')}`,
          name: `员工${index + 1}`,
          department: ['技术部', '市场部', '财务部', '人事部'][index % 4],
          position: ['工程师', '经理', '专员', '主管'][index % 4],
          basic_salary: 8000 + index * 500,
          allowance: 1000 + index * 100,
          deduction: 500 + index * 50,
          net_pay: 8500 + index * 550,
        })),
        total: 50,
        summary: {
          total_basic_salary: 425000,
          total_allowance: 52500,
          total_deduction: 26250,
          total_net_pay: 451250,
          employee_count: 50
        }
      };
      
      setReportData(mockData);
      message.success(t('reportGeneratedSuccess', '报表生成成功'));
    } catch (error) {
      message.error(t('reportGenerationFailed', '生成报表失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: string) => {
    message.success(t('exportingFormat', `正在导出为 ${format.toUpperCase()} 格式...`));
  };

  const handlePrint = () => {
    window.print();
    message.success(t('preparingPrint', '正在准备打印...'));
  };

  const handleShare = () => {
    Modal.info({
      title: t('shareReport', '分享报表'),
      content: (
        <div>
          <p>{t('reportLink', '报表链接：')}</p>
          <Input.TextArea
            value={`${window.location.origin}/reports/viewer/${selectedTemplate?.id}`}
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

  const toggleFavorite = async (template: ReportTemplate) => {
    try {
      const newTemplates = templates.map(t => 
        t.id === template.id ? { ...t, is_favorite: !t.is_favorite } : t
      );
      setTemplates(newTemplates);
      message.success(template.is_favorite ? t('favoriteRemoved', '已取消收藏') : t('favoriteAdded', '已添加收藏'));
    } catch (error) {
      message.error(t('operationFailed', '操作失败'));
    }
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Excel',
      onClick: () => handleExport('excel'),
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'PDF',
      onClick: () => handleExport('pdf'),
    },
    {
      key: 'csv',
      icon: <TableOutlined />,
      label: 'CSV',
      onClick: () => handleExport('csv'),
    },
  ];

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
      bodyStyle={{ padding: 12 }}
      onClick={() => runReport(template)}
      actions={[
        <Button
          key="favorite"
          type="text"
          icon={template.is_favorite ? <StarFilled /> : <StarOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(template);
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

  // 响应式布局配置
  const getLayoutConfig = () => {
    if (isMobile) {
      return { templateSpan: 24, contentSpan: 24, direction: 'vertical' as const };
    }
    if (isTablet) {
      return { templateSpan: 10, contentSpan: 14, direction: 'horizontal' as const };
    }
    return { templateSpan: 8, contentSpan: 16, direction: 'horizontal' as const };
  };

  const { templateSpan, contentSpan, direction } = getLayoutConfig();

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
        {/* 报表模板列表 */}
        <Col span={templateSpan} order={isMobile ? 2 : 1}>
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
                onClick={loadTemplates}
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
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                placeholder={t('selectCategory', '选择分类')}
                value={selectedCategory}
                onChange={setSelectedCategory}
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
        </Col>

        {/* 报表内容 */}
        <Col span={contentSpan} order={isMobile ? 1 : 2}>
          <ProCard
            title={selectedTemplate ? (
              <Space>
                <TableOutlined />
                <span>{selectedTemplate.title || selectedTemplate.name}</span>
              </Space>
            ) : t('selectReport', '请选择报表')}
            extra={selectedTemplate && reportData && !isMobile && (
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterModalVisible(true)}
                >
                  {t('filter', '筛选')}
                </Button>
                <Dropdown menu={{ items: exportMenuItems }}>
                  <Button icon={<DownloadOutlined />}>
                    {t('export', '导出')}
                  </Button>
                </Dropdown>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                >
                  {t('print', '打印')}
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                >
                  {t('share', '分享')}
                </Button>
              </Space>
            )}
            style={{ height: isMobile ? 'auto' : '100%' }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip={t('generatingReport', '正在生成报表...')} />
              </div>
            ) : reportData ? (
              <>
                {/* 统计信息卡片 - 响应式布局 */}
                {reportData.summary && (
                  <StatisticCard.Group style={{ marginBottom: 24 }}>
                    <StatisticCard
                      statistic={{
                        title: t('totalEmployees', '员工总数'),
                        value: reportData.summary.employee_count,
                        suffix: t('people', '人')
                      }}
                    />
                    <StatisticCard
                      statistic={{
                        title: t('totalBasicSalary', '基本工资总额'),
                        value: reportData.summary.total_basic_salary,
                        prefix: '¥',
                        precision: 2
                      }}
                    />
                    <StatisticCard
                      statistic={{
                        title: t('totalAllowance', '津贴总额'),
                        value: reportData.summary.total_allowance,
                        prefix: '¥',
                        precision: 2
                      }}
                    />
                    <StatisticCard
                      statistic={{
                        title: t('totalNetPay', '实发工资总额'),
                        value: reportData.summary.total_net_pay,
                        prefix: '¥',
                        precision: 2
                      }}
                    />
                  </StatisticCard.Group>
                )}

                {/* 移动端操作按钮 */}
                {isMobile && selectedTemplate && reportData && (
                  <Space wrap style={{ marginBottom: 16, width: '100%' }}>
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => setFilterModalVisible(true)}
                      size="small"
                    >
                      {t('filter', '筛选')}
                    </Button>
                    <Dropdown menu={{ items: exportMenuItems }}>
                      <Button icon={<DownloadOutlined />} size="small">
                        {t('export', '导出')}
                      </Button>
                    </Dropdown>
                    <Button
                      icon={<ShareAltOutlined />}
                      onClick={handleShare}
                      size="small"
                    >
                      {t('share', '分享')}
                    </Button>
                  </Space>
                )}

                {/* 数据表格 - 使用 ProTable */}
                <ProTable
                  columns={reportData.columns}
                  dataSource={reportData.data}
                  search={false}
                  pagination={{
                    total: reportData.total,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: !isMobile,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} / ${total}`,
                    size: isMobile ? 'small' : 'default'
                  }}
                  scroll={{ x: 'max-content' }}
                  size={isMobile ? 'small' : 'middle'}
                  rowKey="key"
                  options={{
                    reload: () => selectedTemplate && runReport(selectedTemplate),
                    density: !isMobile,
                    fullScreen: !isMobile,
                    setting: !isMobile
                  }}
                  actionRef={actionRef}
                />
              </>
            ) : (
              <Empty
                description={t('selectReportTemplate', '请从左侧选择一个报表模板')}
                style={{ padding: '100px 0' }}
              />
            )}
          </ProCard>
        </Col>
      </Row>

      {/* 筛选条件对话框 */}
      <Modal
        title={t('setFilterConditions', '设置筛选条件')}
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onOk={() => {
          form.validateFields().then(values => {
            setFilters(values);
            setFilterModalVisible(false);
            if (selectedTemplate) {
              runReport(selectedTemplate);
            }
          });
        }}
        width={isMobile ? '90%' : 600}
      >
        <ProForm
          form={form}
          layout="vertical"
          initialValues={filters}
          submitter={false}
        >
          <ProFormDateRangePicker
            name="dateRange"
            label={t('dateRange', '日期范围')}
            width="100%"
          />
          
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <ProFormSelect
                name="department"
                label={t('department', '部门')}
                placeholder={t('selectDepartment', '选择部门')}
                allowClear
                options={[
                  { label: t('techDept', '技术部'), value: 'tech' },
                  { label: t('marketDept', '市场部'), value: 'market' },
                  { label: t('financeDept', '财务部'), value: 'finance' },
                  { label: t('hrDept', '人事部'), value: 'hr' },
                ]}
              />
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <ProFormText
                name="employee"
                label={t('employee', '员工')}
                placeholder={t('enterEmployeeNameOrCode', '输入员工姓名或编号')}
              />
            </Col>
          </Row>
        </ProForm>
      </Modal>
    </PageLayout>
  );
};

export default ReportViewer;