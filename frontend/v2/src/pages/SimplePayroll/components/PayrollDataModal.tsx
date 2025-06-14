import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, message, Button, Space, Input, Card, Collapse, Switch, Tag, Select, InputNumber, Divider } from 'antd';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { ReloadOutlined, DownloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, FilterOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { payrollViewsApi, type ComprehensivePayrollDataView } from '../../Payroll/services/payrollViewsApi';
import PayrollEntryDetailModal from '../../Payroll/components/PayrollEntryDetailModal';
import PayrollEntryFormModal from '../../Payroll/components/PayrollEntryFormModal';
import { getPayrollEntries, getPayrollEntryById } from '../../Payroll/services/payrollApi';
import type { PayrollEntry } from '../../Payroll/types/payrollTypes';
import TableActionButton from '../../../components/common/TableActionButton';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';

const { Panel } = Collapse;
const { Option } = Select;

// 筛选配置接口
interface ColumnFilterConfig {
  hideJsonbColumns: boolean;
  hideZeroColumns: boolean;
  hideEmptyColumns: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  minValueThreshold: number;
  maxValueThreshold: number;
  showOnlyNumericColumns: boolean;
}

// 默认筛选配置
const defaultFilterConfig: ColumnFilterConfig = {
  hideJsonbColumns: true,
  hideZeroColumns: true,
  hideEmptyColumns: true,
  includePatterns: [],
  excludePatterns: ['*id', '*时间', '*日期'],
  minValueThreshold: 0,
  maxValueThreshold: Infinity,
  showOnlyNumericColumns: false,
};

// 工资数据类型定义 - 使用核心视图API返回的类型
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number; // 用于表格的key
}

interface PayrollDataModalProps {
  visible: boolean;
  onClose: () => void;
  periodId: number;
  periodName?: string;
}

export const PayrollDataModal: React.FC<PayrollDataModalProps> = ({
  visible,
  onClose,
  periodId,
  periodName
}) => {
  const { t } = useTranslation(['payroll', 'common', 'employee']);
  const [dataSource, setDataSource] = useState<PayrollData[]>([]);
  const [filteredDataSource, setFilteredDataSource] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(false);
  const actionRef = useRef<ActionType>(null);
  const [dynamicColumns, setDynamicColumns] = useState<ProColumns<PayrollData>[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  
  // 分页状态管理
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 筛选配置状态
  const [filterConfig, setFilterConfig] = useState<ColumnFilterConfig>(defaultFilterConfig);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [allAvailableKeys, setAllAvailableKeys] = useState<string[]>([]);
  
  // 🎯 详情和编辑功能状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [payrollRunId, setPayrollRunId] = useState<number | null>(null);

  // 通配符匹配函数
  const matchesPattern = (text: string, pattern: string): boolean => {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(text);
  };

  // 高级列筛选函数
  const filterColumns = (keys: string[], data: PayrollData[]): string[] => {
    return keys.filter(key => {
      // 1. 检查包含模式
      if (filterConfig.includePatterns.length > 0) {
        const matchesInclude = filterConfig.includePatterns.some(pattern => 
          matchesPattern(key, pattern)
        );
        if (!matchesInclude) return false;
      }

      // 2. 检查排除模式
      if (filterConfig.excludePatterns.length > 0) {
        const matchesExclude = filterConfig.excludePatterns.some(pattern => 
          matchesPattern(key, pattern)
        );
        if (matchesExclude) return false;
      }

      // 3. 过滤 JSONB 列
      if (filterConfig.hideJsonbColumns) {
        if (key.includes('原始')) return false;
        const sampleValue = data[0]?.[key as keyof PayrollData];
        if (sampleValue !== null && typeof sampleValue === 'object' && !Array.isArray(sampleValue)) {
          return false;
        }
      }

      // 4. 过滤全零列
      if (filterConfig.hideZeroColumns) {
        const hasNonZeroValue = data.some(item => {
          const value = item[key as keyof PayrollData];
          return value !== null && 
                 value !== undefined && 
                 value !== 0 && 
                 value !== '' &&
                 value !== '0' &&
                 value !== '0.00';
        });
        if (!hasNonZeroValue) return false;
      }

      // 5. 过滤空列（但保留重要的基础信息字段）
      if (filterConfig.hideEmptyColumns) {
        // 重要的基础信息字段，即使为空也要显示
        const importantFields = ['根人员类别', '编制', '人员类别', '员工编号', '员工姓名', '部门名称', '职位名称'];
        const isImportantField = importantFields.includes(key);
        
        if (!isImportantField) {
          const hasValue = data.some(item => {
            const value = item[key as keyof PayrollData];
            return value !== null && value !== undefined && value !== '';
          });
          if (!hasValue) return false;
        }
      }

      // 6. 只显示数值列
      if (filterConfig.showOnlyNumericColumns) {
        const sampleValue = data[0]?.[key as keyof PayrollData];
        if (typeof sampleValue !== 'number') return false;
      }

      // 7. 数值范围筛选
      if (typeof data[0]?.[key as keyof PayrollData] === 'number') {
        const values = data.map(item => item[key as keyof PayrollData] as number).filter(v => v != null);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        
        if (maxValue < filterConfig.minValueThreshold || minValue > filterConfig.maxValueThreshold) {
          return false;
        }
      }

      return true;
    });
  };

  // 获取工资数据 - 使用新的批量模态框API
  const fetchPayrollData = useCallback(async () => {
    if (!periodId) return;
    
    setLoading(true);
    try {
      // 使用apiClient调用批量模态框API
      const response = await apiClient.get(`/reports/payroll-modal/period/${periodId}?limit=100`);
      const modalDataList = response.data;
      console.log('✅ [PayrollDataModal] 批量模态框API响应:', modalDataList.length);

      // 将模态框数据转换为表格数据格式
      const transformedData: PayrollData[] = modalDataList.map((modalData: any, index: number) => ({
        id: modalData.薪资条目id || index,
        薪资条目id: modalData.薪资条目id,
        员工编号: modalData.基础信息.员工编号,
        员工姓名: modalData.基础信息.员工姓名,
        部门名称: modalData.基础信息.部门名称,
        职位名称: modalData.基础信息.职位名称,
        人员类别: modalData.基础信息.人员类别,
        编制: modalData.基础信息.编制,
        薪资期间名称: modalData.基础信息.薪资期间名称,
        应发合计: modalData.汇总信息.应发合计,
        扣除合计: modalData.汇总信息.扣除合计,
        实发合计: modalData.汇总信息.实发合计,
        // 添加应发明细
        ...modalData.应发明细,
        // 添加扣除明细
        ...modalData.扣除明细.个人扣缴项目,
        ...modalData.扣除明细.单位扣缴项目,
        // 添加计算参数
        ...modalData.计算参数
      }));
      
      console.log('✅ [PayrollDataModal] 数据转换完成:', transformedData.length);
      
      setDataSource(transformedData);
      setFilteredDataSource(transformedData); // 初始时筛选数据等于全部数据

      if (transformedData.length > 0) {
        const firstItem = transformedData[0];
        
        // 存储所有可用的列名供筛选配置使用
        const allKeys = Object.keys(firstItem);
        setAllAvailableKeys(allKeys);
        
        // 使用高级筛选函数过滤列
        const filteredKeys = filterColumns(allKeys, transformedData);
        
        console.log("🔍 [Column Filter] Original columns:", allKeys.length);
        console.log("🔍 [Column Filter] After filtering:", filteredKeys.length);
        console.log("🔍 [Column Filter] Filtered keys:", filteredKeys);
        console.log("🔍 [Column Filter] Current config:", filterConfig);
        
        const generatedColumns = filteredKeys.map(key => {
          const column: ProColumns<PayrollData> = {
            title: t(`comprehensive_payroll_data.columns.${key}`, {
              defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            }),
            dataIndex: key,
            key: key,
            // Handle potential objects or arrays in data
            render: (text: any) => {
              if (text === null || typeof text === 'undefined') {
                return <span style={{ color: '#999' }}>N/A</span>;
              }
              
              if (typeof text === 'object') {
                return (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px' }}>
                    {JSON.stringify(text, null, 2)}
                  </pre>
                );
              }
          
              if (typeof text === 'boolean') {
                return text ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: 'red' }} />;
              }
          
              // For numbers, strings, etc.
              return text.toString();
            },
          };

          const filterableKeys = ['部门名称', '职位名称', '人员类别', '编制'];
          const sampleValue = transformedData.length > 0 ? transformedData[0]?.[key as keyof PayrollData] : undefined;

          // 为非对象、非布尔值类型添加排序功能
          if (sampleValue !== null && sampleValue !== undefined && typeof sampleValue !== 'object' && typeof sampleValue !== 'boolean') {
            column.sorter = (a, b) => {
              const valA = a[key as keyof PayrollData] as any;
              const valB = b[key as keyof PayrollData] as any;
              if (valA === null || valA === undefined) return -1;
              if (valB === null || valB === undefined) return 1;

              if (typeof valA === 'number' && typeof valB === 'number') {
                return valA - valB;
              }
              return String(valA).localeCompare(String(valB));
            };
          }

          // 为指定的类别列添加筛选功能
          if (filterableKeys.includes(key)) {
            const uniqueValues = [...new Set(transformedData.map(item => item[key as keyof PayrollData]))].filter(v => v !== null && v !== undefined && v !== '');
            if (uniqueValues.length > 1) {
              column.filters = uniqueValues.map(value => ({
                text: String(value),
                value: value as string | number,
              }));
              column.onFilter = (value, record) => record[key as keyof PayrollData] === value;
            }
          }

          // 为员工姓名添加文本搜索功能
          if (key === '员工姓名') {
            column.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
              <div style={{ padding: 8 }}>
                <Input
                  placeholder="搜索员工姓名"
                  value={selectedKeys[0]}
                  onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                  onPressEnter={() => confirm()}
                  style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                  <Button
                    type="primary"
                    onClick={() => confirm()}
                    icon={<SearchOutlined />}
                    size="small"
                    style={{ width: 90 }}
                  >
                    搜索
                  </Button>
                  <Button onClick={() => {
                    console.log('🔄 [重置按钮] 点击重置，当前selectedKeys:', selectedKeys);
                    
                    // 1. 清空输入框
                    setSelectedKeys([]);
                    console.log('🔄 [重置按钮] 已清空selectedKeys');
                    
                    // 2. 调用clearFilters（如果存在）
                    if (clearFilters) {
                      clearFilters();
                      console.log('🔄 [重置按钮] 已调用clearFilters');
                    } else {
                      console.warn('⚠️ [重置按钮] clearFilters函数不存在');
                    }
                    
                    // 3. 强制确认以刷新表格
                    confirm();
                    console.log('🔄 [重置按钮] 已调用confirm刷新表格');
                  }} size="small" style={{ width: 90 }}>
                    重置
                  </Button>
                </Space>
              </div>
            );
            column.filterIcon = (filtered: boolean) => (
              <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            );
            column.onFilter = (value, record) => {
              const recordValue = record[key as keyof PayrollData];
              return recordValue ? String(recordValue).toLowerCase().includes(String(value).toLowerCase()) : false;
            };
          }

          return column;
        });

        console.log("Dynamically generated columns:", generatedColumns);
        
        // 添加固定的操作列
        generatedColumns.push({
          title: t('common:table.actions'),
          key: 'action',
          width: 120,
          fixed: 'right',
          render: (_, record) => (
            <Space>
              <TableActionButton
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
                tooltipTitle={t('common:tooltip.view_details')}
                actionType="view"
              />
              <TableActionButton
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                tooltipTitle={t('common:button.edit')}
                actionType="edit"
              />
            </Space>
          ),
        });
        
        setDynamicColumns(generatedColumns);
      }

    } catch (error: any) {
      message.error(`${t('payroll:dataPreview.importButton.error.description')}: ${error.message || t('common:unknown_error')}`);
    } finally {
      setLoading(false);
    }
  }, [periodId, t]);

  // 当模态框显示时获取数据
  useEffect(() => {
    if (visible && periodId) {
      fetchPayrollData();
    }
  }, [visible, periodId, fetchPayrollData]);

  // 当筛选配置改变时重新生成列
  useEffect(() => {
    if (dataSource.length > 0) {
      const allKeys = Object.keys(dataSource[0]);
      const filteredKeys = filterColumns(allKeys, dataSource);
      
      const generatedColumns = filteredKeys.map(key => {
        const column: ProColumns<PayrollData> = {
          title: t(`comprehensive_payroll_data.columns.${key}`, {
            defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          }),
          dataIndex: key,
          key: key,
          render: (text: any) => {
            if (text === null || typeof text === 'undefined') {
              return <span style={{ color: '#999' }}>N/A</span>;
            }
            
            if (typeof text === 'object') {
              return (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px' }}>
                  {JSON.stringify(text, null, 2)}
                </pre>
              );
            }
        
            if (typeof text === 'boolean') {
              return text ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: 'red' }} />;
            }
        
            return text.toString();
          },
        };
        
        const filterableKeys = ['部门名称', '职位名称', '人员类别', '编制'];
        const sampleValue = dataSource.length > 0 ? dataSource[0]?.[key as keyof PayrollData] : undefined;

        // 为非对象、非布尔值类型添加排序功能
        if (sampleValue !== null && sampleValue !== undefined && typeof sampleValue !== 'object' && typeof sampleValue !== 'boolean') {
          column.sorter = (a, b) => {
            const valA = a[key as keyof PayrollData] as any;
            const valB = b[key as keyof PayrollData] as any;
            if (valA === null || valA === undefined) return -1;
            if (valB === null || valB === undefined) return 1;

            if (typeof valA === 'number' && typeof valB === 'number') {
              return valA - valB;
            }
            return String(valA).localeCompare(String(valB));
          };
        }

        // 为指定的类别列添加筛选功能
        if (filterableKeys.includes(key)) {
          const uniqueValues = [...new Set(dataSource.map(item => item[key as keyof PayrollData]))].filter(v => v !== null && v !== undefined && v !== '');
          if (uniqueValues.length > 1) {
            column.filters = uniqueValues.map(value => ({
              text: String(value),
              value: value as string | number,
            }));
            column.onFilter = (value, record) => record[key as keyof PayrollData] === value;
          }
        }

        // 为员工姓名添加文本搜索功能
        if (key === '员工姓名') {
          column.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="搜索员工姓名"
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => confirm()}
                style={{ marginBottom: 8, display: 'block' }}
              />
              <Space>
                <Button
                  type="primary"
                  onClick={() => confirm()}
                  icon={<SearchOutlined />}
                  size="small"
                  style={{ width: 90 }}
                >
                  搜索
                </Button>
                <Button onClick={() => {
                  console.log('🔄 [重置按钮2] 点击重置，当前selectedKeys:', selectedKeys);
                  
                  // 1. 清空输入框
                  setSelectedKeys([]);
                  console.log('🔄 [重置按钮2] 已清空selectedKeys');
                  
                  // 2. 调用clearFilters（如果存在）
                  if (clearFilters) {
                    clearFilters();
                    console.log('🔄 [重置按钮2] 已调用clearFilters');
                  } else {
                    console.warn('⚠️ [重置按钮2] clearFilters函数不存在');
                  }
                  
                  // 3. 强制确认以刷新表格
                  confirm();
                  console.log('🔄 [重置按钮2] 已调用confirm刷新表格');
                }} size="small" style={{ width: 90 }}>
                  重置
                </Button>
              </Space>
            </div>
          );
          column.filterIcon = (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
          );
          column.onFilter = (value, record) => {
            const recordValue = record[key as keyof PayrollData];
            return recordValue ? String(recordValue).toLowerCase().includes(String(value).toLowerCase()) : false;
          };
        }
        
        return column;
      });

      // 添加操作列
      generatedColumns.push({
        title: t('common:table.actions'),
        key: 'action',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <TableActionButton
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              tooltipTitle={t('common:tooltip.view_details')}
              actionType="view"
            />
            <TableActionButton
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              tooltipTitle={t('common:button.edit')}
              actionType="edit"
            />
          </Space>
        ),
      });
      
      setDynamicColumns(generatedColumns);
    }
  }, [filterConfig, dataSource, t]);

  // 🎯 查看详情
  const handleViewDetail = async (record: PayrollData) => {
    console.log('📋 [PayrollDataModal] 查看详情:', record);
    
    // 使用薪资条目ID
    if (record.薪资条目id) {
      setSelectedEntryId(String(record.薪资条目id));
      setDetailModalVisible(true);
    } else {
      message.warning(t('payroll:entry_form.message.update_success_no_data'));
    }
  };

  // 🎯 编辑记录
  const handleEdit = async (record: PayrollData) => {
    console.log('✏️ [PayrollDataModal] 编辑记录:', record);
    
    if (!record.薪资条目id) {
      message.warning(t('payroll:runs_page.form.placeholder.payroll_period'));
      return;
    }

    try {
      // 根据薪资条目ID获取完整的薪资条目数据
      const response = await getPayrollEntryById(record.薪资条目id);
      
      if (response.data) {
        const payrollEntry = response.data;
        setSelectedEntry(payrollEntry);
        setPayrollRunId(payrollEntry.payroll_run_id);
        setEditModalVisible(true);
        console.log('✅ [PayrollDataModal] 获取薪资条目数据成功:', payrollEntry);
      } else {
        message.error(t('payroll:entry_detail_modal.not_found'));
      }
    } catch (error: any) {
      console.error('❌ [PayrollDataModal] 获取薪资条目数据失败:', error);
      message.error(`${t('payroll:entry_form.error_fetch_employee')}: ${error.message || t('common:unknown_error')}`);
    }
  };

  // 🎯 编辑成功回调
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedEntry(null);
    setPayrollRunId(null);
    fetchPayrollData(); // 刷新数据
    message.success(t('payroll:entry_form.message.update_success'));
  };

  // 导出数据为Excel
  const handleExportExcel = () => {
    // 导出当前筛选后的数据
    if (filteredDataSource.length === 0) {
      message.warning(t('payroll:batch_import.result.no_result'));
      return;
    }

    // 动态生成导出数据
    const exportData = filteredDataSource.map((item, index) => {
      const row: { [key: string]: any } = { [t('common:index')]: index + 1 };
      dynamicColumns.forEach(col => {
        // 排除操作列
        if (col.key !== 'action' && col.dataIndex) {
          const dataIndex = col.dataIndex as keyof PayrollData;
          row[col.title as string] = item[dataIndex] ?? '';
        }
      });
      return row;
    });

    // 创建工作表
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // 设置数字列的格式为两位小数
      const numberColumns = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']; // 应发合计到个人所得税的列
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // 为每个数字列的每一行设置数字格式
      for (let row = 1; row <= range.e.r; row++) { // 从第2行开始（跳过表头）
        numberColumns.forEach(col => {
          const cellAddress = col + (row + 1);
          if (ws[cellAddress]) {
            // 设置单元格格式为数字，保留两位小数
            ws[cellAddress].z = '0.00';
            ws[cellAddress].t = 'n'; // 确保是数字类型
          }
        });
      }
      
      // 设置列宽 - 基于标题长度自动设置
      const colWidths = Object.keys(exportData[0]).map(key => ({
        wch: Math.max(key.length, 15) // 最小宽度15
      }));
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('payroll:data_export_sheet_name'));
      
      // 生成文件名
      const fileName = `${t('payroll:data_export_file_name')}_${periodName || t('payroll:current_period')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      message.success(`${t('payroll:export_success_message', { count: filteredDataSource.length, fileName })}`);
    }).catch((error) => {
      message.error(t('payroll:export_failed_message'));
      console.error('Export error:', error);
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchPayrollData();
    message.success(t('common:table.refreshSuccess'));
  };

  // 重置表格筛选
  const handleResetFilters = () => {
    console.log('🔄 [handleResetFilters] 开始重置表格筛选');
    console.log('🔄 [handleResetFilters] 当前dataSource长度:', dataSource.length);
    
    // 强制刷新表格
    if (actionRef.current) {
      actionRef.current.clearSelected?.();
      // 使用 setTimeout 确保状态更新后再刷新
      setTimeout(() => {
        actionRef.current?.reload();
        console.log('🔄 [handleResetFilters] 已调用actionRef.reload刷新表格');
      }, 0);
      console.log('🔄 [handleResetFilters] 已调用actionRef.clearSelected');
    }
  };

  return (
    <Modal
      title={t('payroll:payroll_data_for_period', { periodName: periodName || '' })}
      open={visible}
      onCancel={onClose}
      footer={
        <Button key="close" onClick={onClose}>
          {t('common:button.close')}
        </Button>
      }
      width="95%"
      style={{ top: 20 }}
      destroyOnClose
    >
      {/* 筛选配置面板 */}
      {showFilterPanel && (
        <Card 
          title={
            <Space>
              <SettingOutlined />
              列筛选配置
              <Tag color="blue">{dynamicColumns.length - 1} 列显示</Tag>
              <Tag color="green">{allAvailableKeys.length} 列总计</Tag>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Collapse size="small">
            <Panel header="基础筛选" key="basic">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Switch
                    checked={filterConfig.hideJsonbColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, hideJsonbColumns: checked }))}
                  />
                  <span>隐藏 JSONB 列（原始数据列）</span>
                </Space>
                <Space wrap>
                  <Switch
                    checked={filterConfig.hideZeroColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, hideZeroColumns: checked }))}
                  />
                  <span>隐藏全零列</span>
                </Space>
                <Space wrap>
                  <Switch
                    checked={filterConfig.hideEmptyColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, hideEmptyColumns: checked }))}
                  />
                  <span>隐藏空列</span>
                </Space>
                <Space wrap>
                  <Switch
                    checked={filterConfig.showOnlyNumericColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, showOnlyNumericColumns: checked }))}
                  />
                  <span>只显示数值列</span>
                </Space>
              </Space>
            </Panel>
            
            <Panel header="模式匹配" key="patterns">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <label>包含模式（支持通配符 * 和 ?）：</label>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="例如：*工资*、保险*、*金额"
                    value={filterConfig.includePatterns}
                    onChange={(patterns) => setFilterConfig(prev => ({ ...prev, includePatterns: patterns }))}
                  >
                    <Option value="*工资*">*工资*</Option>
                    <Option value="*保险*">*保险*</Option>
                    <Option value="*金额">*金额</Option>
                    <Option value="*合计">*合计</Option>
                    <Option value="基本*">基本*</Option>
                  </Select>
                </div>
                <div>
                  <label>排除模式（支持通配符 * 和 ?）：</label>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="例如：*id、*时间、*日期"
                    value={filterConfig.excludePatterns}
                    onChange={(patterns) => setFilterConfig(prev => ({ ...prev, excludePatterns: patterns }))}
                  >
                    <Option value="*id">*id</Option>
                    <Option value="*时间">*时间</Option>
                    <Option value="*日期">*日期</Option>
                    <Option value="*编号">*编号</Option>
                    <Option value="原始*">原始*</Option>
                  </Select>
                </div>
              </Space>
            </Panel>
            
            <Panel header="数值范围" key="values">
              <Space wrap>
                <span>最小值阈值：</span>
                <InputNumber
                  value={filterConfig.minValueThreshold}
                  onChange={(value) => setFilterConfig(prev => ({ ...prev, minValueThreshold: value || 0 }))}
                  placeholder="0"
                />
                <span>最大值阈值：</span>
                <InputNumber
                  value={filterConfig.maxValueThreshold === Infinity ? undefined : filterConfig.maxValueThreshold}
                  onChange={(value) => setFilterConfig(prev => ({ ...prev, maxValueThreshold: value || Infinity }))}
                  placeholder="无限制"
                />
              </Space>
            </Panel>
            
            <Panel header="快速预设" key="presets">
              <Space wrap>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig({
                    ...defaultFilterConfig,
                    includePatterns: ['*工资*', '*合计', '*金额'],
                    excludePatterns: ['*id', '*时间', '*日期', '*编号']
                  })}
                >
                  工资相关
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig({
                    ...defaultFilterConfig,
                    includePatterns: ['*保险*', '*公积金*'],
                    excludePatterns: ['*id', '*时间', '*日期']
                  })}
                >
                  保险公积金
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig({
                    ...defaultFilterConfig,
                    showOnlyNumericColumns: true,
                    excludePatterns: ['*id', '*比例', '*费率']
                  })}
                >
                  只看金额
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig(defaultFilterConfig)}
                >
                  重置默认
                </Button>
              </Space>
            </Panel>
          </Collapse>
        </Card>
      )}

      <ProTable<PayrollData>
        actionRef={actionRef}
        columns={dynamicColumns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        search={false}
        headerTitle={false}
        toolbar={{
          actions: [
            <Button 
              key="filter" 
              icon={<FilterOutlined />} 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              type={showFilterPanel ? 'primary' : 'default'}
            >
              列筛选配置
            </Button>,
            <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
              {t('common:button.refresh')}
            </Button>,
            <Button
              key="export"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              disabled={filteredDataSource.length === 0}
            >
              {t('common:button.export_excel')} ({filteredDataSource.length})
            </Button>,
          ]
        }}
        onChange={(pagination, filters, sorter, extra) => {
          // 当表格筛选、排序或分页变化时，记录变化信息
          console.log('🔍 [PayrollDataModal] 表格变化:', {
            pagination,
            filters,
            sorter,
            currentDataSourceLength: extra.currentDataSource?.length,
            action: extra.action
          });
          // 更新筛选后的数据，用于导出和分页计数
          if (extra.currentDataSource) {
            setFilteredDataSource(extra.currentDataSource);
          }
        }}
        columnsState={{
          persistenceKey: 'payroll-data-table',
          persistenceType: 'localStorage',
        }}
        options={{
          reload: handleRefresh,
          density: true,
          fullScreen: true,
          setting: {
            listsHeight: 400,
            draggable: true,
            checkable: true,
          },
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredDataSource.length,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, size) => {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize: size || prev.pageSize,
            }));
          },
        }}
        scroll={{ x: 'max-content' }}
        size="small"
        cardBordered
        tableAlertRender={({ selectedRowKeys, selectedRows }) => (
          selectedRowKeys.length > 0 && (
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 项
              &nbsp;&nbsp;
              <span>
                应发合计: ¥{selectedRows.reduce((sum, row) => sum + (row.应发合计 || 0), 0).toFixed(2)}
                &nbsp;&nbsp;
                实发合计: ¥{selectedRows.reduce((sum, row) => sum + (row.实发合计 || 0), 0).toFixed(2)}
              </span>
            </div>
          )
        )}
        rowSelection={{
          type: 'checkbox',
          // 可以添加批量操作
        }}
      />

      {/* 🎯 详情查看Modal */}
      {detailModalVisible && selectedEntryId && (
        <PayrollEntryDetailModal
          visible={detailModalVisible}
          entryId={selectedEntryId}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedEntryId(null);
          }}
        />
      )}

      {/* 🎯 编辑Modal */}
      {editModalVisible && selectedEntry && (
        <PayrollEntryFormModal
          visible={editModalVisible}
          payrollPeriodId={periodId}
          payrollRunId={payrollRunId}
          entry={selectedEntry}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedEntry(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </Modal>
  );
}; 