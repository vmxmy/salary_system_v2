import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Spin, Alert, Typography, Card, Empty, Tooltip, Tag, Row, Col, Divider, Table, Space, Tabs } from 'antd';
import { getPayrollEntryById } from '../services/payrollApi';
import type { PayrollEntry, ApiSingleResponse, PayrollItemDetail } from '../types/payrollTypes';
import { useTranslation } from 'react-i18next';
import usePayrollConfigStore from '../../../store/payrollConfigStore';
import { employeeService } from '../../../services/employeeService'; // 引入员工服务
import { employeeManagementApi } from '../../../pages/EmployeeManagement/services/employeeManagementApi';
import EmployeeName from '../../../components/common/EmployeeName';
import dayjs from 'dayjs';
import { getPayrollEntryStatusInfo } from '../utils/payrollUtils';
import { payrollModalApi, type PayrollModalData } from '../services/payrollModalApi';

const { Title, Text } = Typography;

// Helper function to normalize details to PayrollItemDetail[]
const normalizePayrollItemDetails = (
  details: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[] | undefined | null
): PayrollItemDetail[] => {
  if (!details) {
    return [];
  }
  if (Array.isArray(details)) {
    return details;
  }
  // If it's a Record, convert it
  // Assuming the key of the record is the 'name' of the payroll item
  return Object.entries(details).map(([name, itemData]) => ({
    name,
    amount: itemData.amount,
    // currency and description might be part of itemData if it's PayrollItemDetail,
    // or undefined if it's just { amount: number }
    currency: (itemData as PayrollItemDetail).currency,
    description: (itemData as PayrollItemDetail).description,
  }));
};

interface PayrollEntryDetailModalProps {
  entryId: string | null;
  visible: boolean;
  onClose: () => void;
}

const PayrollEntryDetailModal: React.FC<PayrollEntryDetailModalProps> = ({ entryId, visible, onClose }) => {
  const { t } = useTranslation(['common', 'payroll']);
  const [entryDetails, setEntryDetails] = useState<PayrollEntry | null>(null);
  const [modalData, setModalData] = useState<PayrollModalData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<{ firstName?: string; lastName?: string; displayName?: string } | null>(null);
  const [loadingEmployeeInfo, setLoadingEmployeeInfo] = useState<boolean>(false);
  const [componentDefinitionsLoaded, setComponentDefinitionsLoaded] = useState<boolean>(false);

  const payrollConfig = usePayrollConfigStore();

  // 当模态框打开时，先加载薪资字段定义，然后再加载薪资条目详情
  useEffect(() => {
    if (visible) {
      setComponentDefinitionsLoaded(false);
      
      // 检查是否已经有组件定义
      if (payrollConfig.componentDefinitions.length > 0) {
        setComponentDefinitionsLoaded(true);
        return;
      }
      
      // 加载组件定义
      const loadComponentDefinitions = async () => {
        try {
          await payrollConfig.fetchComponentDefinitions();
          setComponentDefinitionsLoaded(true);
        } catch (err) {
          setComponentDefinitionsLoaded(true); // 即使失败也设置为true，避免无限等待
        }
      };
      
      loadComponentDefinitions();
    }
  }, [visible]);

  // 根据组件代码获取中文名称
  const getComponentDisplayName = (code: string): string => {
    const definition = payrollConfig.componentDefinitions.find(def => def.code === code);
    if (definition) {
      return definition.name;
    }
    return code; // 如果找不到定义，返回原始代码
  };

  // 获取员工详细信息
  const fetchEmployeeInfo = async (employeeId: number) => {
    if (!employeeId) return;
    
    setLoadingEmployeeInfo(true);
    
    try {
      const employee = await employeeManagementApi.getEmployeeById(String(employeeId));
      if (employee) {
        const info = {
          firstName: employee.first_name,
          lastName: employee.last_name,
          // 中文姓名格式：姓在前，名在后
          displayName: `${employee.last_name || ''}${employee.first_name || ''}`
        };
        setEmployeeInfo(info);
      } else {
        setEmployeeInfo(null);
      }
    } catch (err) {
      setEmployeeInfo(null);
    } finally {
      setLoadingEmployeeInfo(false);
    }
  };

  // 获取薪资条目详情 - 使用新的模态框API
  const fetchEntryDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // 使用新的模态框API获取结构化数据
      const modalResponse = await payrollModalApi.getPayrollModalData(Number(id));
      setModalData(modalResponse);
      
      // 仍然获取原始数据用于兼容性
      const response = await getPayrollEntryById(Number(id));
      setEntryDetails(response.data);
      
      // 如果没有员工姓名，获取员工详细信息
      if (!response.data.employee_name && response.data.employee_id) {
        fetchEmployeeInfo(response.data.employee_id);
      }
    } catch (err: any) {
      setError(err.message || t('payroll:entry_detail_modal.error_fetch_details'));
      setEntryDetails(null);
      setModalData(null);
    }
    setLoading(false);
  };

  // 当组件定义加载完成且有entryId时，获取薪资条目详情
  useEffect(() => {
    if (visible && entryId && componentDefinitionsLoaded) {
      fetchEntryDetails(entryId);
    }
  }, [visible, entryId, componentDefinitionsLoaded]);

  // 当模态框关闭时，清空数据
  useEffect(() => {
    if (!visible) {
      setEntryDetails(null);
      setModalData(null);
      setError(null);
      setEmployeeInfo(null);
    }
  }, [visible]);

  const renderDetailsCard = (title: string, detailsSource: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[] | undefined | null) => {
    const normalizedDetails = normalizePayrollItemDetails(detailsSource); // Use the helper

    if (normalizedDetails.length === 0) { // Check length of normalized array
      return (
        <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common:table.empty_data')} />
        </Card>
      );
    }
    return (
      <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
        {normalizedDetails.map((item, index) => {
          const definition = payrollConfig.componentDefinitions.find(def => def.code === item.name);
          const displayName = definition ? (
            <Tooltip title={`Code: ${item.name} | Type: ${definition.type} | Data Type: ${definition.data_type}`}>
              {definition.name}
            </Tooltip>
          ) : item.name;

          return (
            <Descriptions key={index} bordered column={1} size="small" style={{ marginBottom: 10 }}>
              <Descriptions.Item label={t('payroll:entries_table.modal.component_name')}>{displayName}</Descriptions.Item>
              <Descriptions.Item label={t('payroll:entries_table.modal.amount')}>
                {(() => {
                  const numValue = parseFloat(String(item.amount));
                  return !isNaN(numValue) ? numValue.toFixed(2) : '0.00';
                })()}
              </Descriptions.Item>
              {item.description && <Descriptions.Item label={t('payroll:entries_table.modal.notes')}>{item.description}</Descriptions.Item>}
            </Descriptions>
          );
        })}
      </Card>
    );
  };

  // 格式化金额显示
  const formatAmount = (amount: any) => {
    const numValue = Number(amount);
    return `¥${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`;
  };

  // 获取员工姓名
  const getEmployeeName = (entry: PayrollEntry) => {
    if (entry.employee) {
      return `${entry.employee.last_name || ''}${entry.employee.first_name || ''}`.trim();
    }
    return entry.employee_first_name && entry.employee_last_name 
      ? `${entry.employee_last_name}${entry.employee_first_name}`.trim()
      : t('payroll:auto_text_e69caa');
  };

  // 获取部门名称
  const getDepartmentName = (entry: PayrollEntry) => {
    return entry.employee?.departmentName || t('payroll:auto_text_e69caa');
  };

  // 获取人员类别名称
  const getPersonnelCategoryName = (entry: PayrollEntry) => {
    return entry.employee?.personnelCategoryName || t('payroll:auto_text_e69caa');
  };

  // 收入项表格列配置
  const earningsColumns = [
    {
      title: t('payroll:entry_detail_modal.earnings_table.component_name'),
      dataIndex: 'component_name',
      key: 'component_name',
    },
    {
      title: t('payroll:entry_detail_modal.earnings_table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => formatAmount(amount),
      align: 'right' as const,
    },
    {
      title: t('payroll:entry_detail_modal.earnings_table.description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
  ];

  // 扣缴项表格列配置
  const deductionsColumns = [
    {
      title: t('payroll:entry_detail_modal.deductions_table.component_name'),
      dataIndex: 'component_name',
      key: 'component_name',
    },
    {
      title: t('payroll:entry_detail_modal.deductions_table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => formatAmount(amount),
      align: 'right' as const,
    },
    {
      title: t('payroll:entry_detail_modal.deductions_table.description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
  ];

  return (
    <Modal
      title={t('payroll:entry_detail_modal.title')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {(loading || !componentDefinitionsLoaded) && (
        <Spin tip={!componentDefinitionsLoaded ? t('payroll:auto___e6ada3'): t('payroll:entry_detail_modal.loading')} style={{ display: 'block', marginTop: '50px' }}>
          <div style={{ padding: 50 }} />
        </Spin>
      )}

      {error && (
        <Alert 
          message={t('payroll:entry_detail_modal.error_prefix') + error} 
          type="error" 
          showIcon 
          style={{ marginBottom: '20px' }} 
        />
      )}

      {!loading && !error && modalData && (
        <div>
          {/* 基本信息 */}
          <Card title="基础信息" style={{ marginBottom: 16 }}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label="员工编号">
                {modalData.基础信息.员工编号 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="员工姓名">
                {modalData.基础信息.员工姓名 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="部门名称">
                {modalData.基础信息.部门名称 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="职位名称">
                {modalData.基础信息.职位名称 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="人员类别">
                {modalData.基础信息.人员类别 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="编制">
                {modalData.基础信息.编制 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="薪资期间">
                {modalData.基础信息.薪资期间名称 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期间开始日期">
                {modalData.基础信息.期间开始日期 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期间结束日期">
                {modalData.基础信息.期间结束日期 || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 员工详细信息 */}
          {modalData.员工详细信息 && (
            <Card title="员工详细信息" style={{ marginBottom: 16 }}>
              <Tabs 
                defaultActiveKey="contact" 
                size="small"
                items={[
                  {
                    key: 'contact',
                    label: '联系信息',
                    children: (
                      <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="手机号码">
                          {modalData.员工详细信息.联系信息?.电话 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="电子邮箱">
                          {modalData.员工详细信息.联系信息?.邮箱 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="家庭地址">
                          {modalData.员工详细信息.联系信息?.家庭住址 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="紧急联系人">
                          {modalData.员工详细信息.联系信息?.紧急联系人 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="紧急联系人电话">
                          {modalData.员工详细信息.联系信息?.紧急联系电话 || '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    )
                  },
                  {
                    key: 'personal',
                    label: '个人信息',
                    children: (
                      <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="身份证号">
                          {modalData.员工详细信息.个人信息?.身份证号 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="性别">
                          {modalData.员工详细信息.个人信息?.性别 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="出生日期">
                          {modalData.员工详细信息.个人信息?.出生日期 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="民族">
                          {modalData.员工详细信息.个人信息?.民族 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="政治面貌">
                          {modalData.员工详细信息.个人信息?.政治面貌 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="婚姻状况">
                          {modalData.员工详细信息.个人信息?.婚姻状况 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="学历">
                          {modalData.员工详细信息.个人信息?.学历 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="专业">
                          {modalData.员工详细信息.个人信息?.学历 || '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    )
                  },
                  {
                    key: 'work',
                    label: '工作信息',
                    children: (
                      <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="入职日期">
                          {modalData.员工详细信息.工作信息?.入职日期 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="工作状态">
                          {modalData.员工详细信息.工作信息?.员工状态 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="合同类型">
                          {modalData.员工详细信息.工作信息?.合同类型 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="合同开始日期">
                          {modalData.员工详细信息.工作信息?.合同开始日期 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="合同结束日期">
                          {modalData.员工详细信息.工作信息?.合同结束日期 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="试用期结束日期">
                          {modalData.员工详细信息.工作信息?.试用期结束日期 || '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    )
                  },
                  {
                    key: 'insurance',
                    label: '社保公积金',
                    children: (
                      <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="社保账号">
                          {modalData.员工详细信息.社保公积金信息?.社保账号 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="公积金账号">
                          {modalData.员工详细信息.社保公积金信息?.公积金账号 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="社保缴费基数">
                          {modalData.员工详细信息.社保公积金信息?.社保缴费基数 ? `¥${parseFloat(modalData.员工详细信息.社保公积金信息.社保缴费基数).toFixed(2)}` : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="公积金缴费基数">
                          {modalData.员工详细信息.社保公积金信息?.公积金缴费基数 ? `¥${parseFloat(modalData.员工详细信息.社保公积金信息.公积金缴费基数).toFixed(2)}` : '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    )
                  },
                  {
                    key: 'bank',
                    label: '银行账号',
                    children: (
                      <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="银行名称">
                          {modalData.员工详细信息.银行账号信息?.银行名称 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="银行账号">
                          {modalData.员工详细信息.银行账号信息?.银行账号 || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="开户行">
                          {modalData.员工详细信息.银行账号信息?.开户行 || '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    )
                  }
                ]}
              />
            </Card>
          )}

          {/* 薪资汇总 */}
          <Card title="薪资汇总" style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
                  <Text type="secondary">应发合计</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginTop: '8px' }}>
                    ¥{parseFloat(modalData.汇总信息.应发合计).toFixed(2)}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff2e8', borderRadius: '6px' }}>
                  <Text type="secondary">扣除合计</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16', marginTop: '8px' }}>
                    ¥{parseFloat(modalData.汇总信息.扣除合计).toFixed(2)}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
                  <Text type="secondary">实发合计</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginTop: '8px' }}>
                    ¥{parseFloat(modalData.汇总信息.实发合计).toFixed(2)}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 应发明细 */}
          <Card title="应发明细" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>标准应发项目</Title>
              <Descriptions bordered column={2} size="small">
                {Object.entries(modalData.应发明细 || {}).filter(([key]) => key !== '其他应发项目').map(([key, value]) => (
                  value && parseFloat(value as string) > 0 && (
                    <Descriptions.Item key={key} label={key}>
                      ¥{parseFloat(value as string).toFixed(2)}
                    </Descriptions.Item>
                  )
                ))}
              </Descriptions>
            </div>
            
            {Object.keys(modalData.应发明细?.其他应发项目 || {}).length > 0 && (
              <div>
                <Title level={5}>其他应发项目</Title>
                <Descriptions bordered column={2} size="small">
                  {Object.entries(modalData.应发明细?.其他应发项目 || {}).map(([key, value]) => (
                    parseFloat(value) > 0 && (
                      <Descriptions.Item key={key} label={key}>
                        ¥{parseFloat(value).toFixed(2)}
                      </Descriptions.Item>
                    )
                  ))}
                </Descriptions>
              </div>
            )}
          </Card>

          {/* 扣除明细 */}
          <Card title="扣除明细" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>个人扣缴项目</Title>
              <Descriptions bordered column={2} size="small">
                {Object.entries(modalData.扣除明细?.个人扣缴项目 || {}).filter(([key]) => key !== '其他个人扣缴').map(([key, value]) => (
                  value && parseFloat(value as string) > 0 && (
                    <Descriptions.Item key={key} label={key}>
                      ¥{parseFloat(value as string).toFixed(2)}
                    </Descriptions.Item>
                  )
                ))}
                {Object.entries(modalData.扣除明细?.个人扣缴项目?.其他个人扣缴 || {}).map(([key, value]) => (
                  parseFloat(value) > 0 && (
                    <Descriptions.Item key={key} label={key}>
                      ¥{parseFloat(value).toFixed(2)}
                    </Descriptions.Item>
                  )
                ))}
              </Descriptions>
            </div>
            
            <div>
              <Title level={5}>单位扣缴项目</Title>
              <Descriptions bordered column={2} size="small">
                {Object.entries(modalData.扣除明细?.单位扣缴项目 || {}).filter(([key]) => key !== '其他单位扣缴').map(([key, value]) => (
                  value && parseFloat(value as string) > 0 && (
                    <Descriptions.Item key={key} label={key}>
                      ¥{parseFloat(value as string).toFixed(2)}
                    </Descriptions.Item>
                  )
                ))}
                {Object.entries(modalData.扣除明细?.单位扣缴项目?.其他单位扣缴 || {}).map(([key, value]) => (
                  parseFloat(value) > 0 && (
                    <Descriptions.Item key={key} label={key}>
                      ¥{parseFloat(value).toFixed(2)}
                    </Descriptions.Item>
                  )
                ))}
              </Descriptions>
            </div>
          </Card>

          {/* 计算参数 */}
          <Card title="计算参数" style={{ marginBottom: 16 }}>
            <Descriptions bordered column={2} size="small">
              {Object.entries(modalData.计算参数 || {}).filter(([key]) => key !== '其他计算参数').map(([key, value]) => (
                value && parseFloat(value as string) > 0 && (
                  <Descriptions.Item key={key} label={key}>
                    {key.includes('费率') ? `${(parseFloat(value as string) * 100).toFixed(2)}%` : `¥${parseFloat(value as string).toFixed(2)}`}
                  </Descriptions.Item>
                )
              ))}
              {Object.entries(modalData.计算参数?.其他计算参数 || {}).map(([key, value]) => (
                parseFloat(value) > 0 && (
                  <Descriptions.Item key={key} label={key}>
                    {key.includes('费率') ? `${(parseFloat(value) * 100).toFixed(2)}%` : `¥${parseFloat(value).toFixed(2)}`}
                  </Descriptions.Item>
                )
              ))}
            </Descriptions>
          </Card>


        </div>
      )}

      {!loading && !error && !modalData && (
        <Alert 
          message="薪资数据未找到" 
          type="warning" 
          showIcon 
        />
      )}
    </Modal>
  );
};

export default PayrollEntryDetailModal;