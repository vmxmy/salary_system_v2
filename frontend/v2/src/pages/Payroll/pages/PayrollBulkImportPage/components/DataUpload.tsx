import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Upload,
  message,
  Input,
  Tabs,
  Alert,
  Typography,
  Statistic,
  Row,
  Col,
  Divider,
  Tag,
  Space,
  Spin
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  TableOutlined,
  BulbOutlined,
  CalculatorOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningOutlined
} from '@ant-design/icons';
import type { ImportData, InputMethod } from '../types/index';
import { 
  validateFileType, 
  processCSVEncoding, 
  parseTextData, 
  filterEmptyRows, 
  cleanHeaders 
} from '../utils/fileProcessing';
import CalculationStatusModal, { 
  CalculationStatus, 
  type CalculationProgress, 
  type CalculationResult,
  type CurrentEmployee
} from '../../../../../components/CalculationStatusModal';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;
const { TextArea } = Input;

// 🎯 集成计算引擎结果数据结构
interface CalculationEngineResult {
  total_processed: number;
  success_count: number;
  error_count: number;
  calculation_summary: {
    total_employees: number;
    successful_count: number;
    failed_count: number;
  };
  payroll_totals: {
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    total_employer_cost: number;
  };
  social_insurance_breakdown: {
    employee_totals: {
      social_insurance: number;
      housing_fund: number;
      total: number;
    };
    employer_totals: {
      social_insurance: number;
      housing_fund: number;
      total: number;
    };
  };
  cost_analysis: {
    employee_take_home: number;
    employee_social_cost: number;
    employer_salary_cost: number;
    employer_social_cost: number;
    total_cost: number;
    social_cost_ratio: number;
  };
  calculation_metadata: {
    calculation_date: string;
    engine_version: string;
    calculation_order: string;
  };
  payroll_run_updated: boolean;
  errors?: Array<{
    employee_id: number;
    employee_name: string;
    error_message: string;
  }>;
}

interface DataUploadProps {
  loading: boolean;
  onDataParsed: (data: ImportData) => void;
  onLoadingChange: (loading: boolean) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({
  loading,
  onDataParsed,
  onLoadingChange
}) => {
  const [inputMethod, setInputMethod] = useState<InputMethod>('upload');
  const [textInput, setTextInput] = useState('');
  
  // 🎯 计算引擎运行结果状态（旧版本，保持兼容）
  const [calculationResult, setCalculationResult] = useState<CalculationEngineResult | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(false);

  // 🎯 新的计算状态Modal相关状态
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState<CalculationProgress | null>(null);
  const [calculationFinalResult, setCalculationFinalResult] = useState<CalculationResult | null>(null);

  // 🎯 获取最新的计算引擎运行结果
  const fetchLatestCalculationResult = useCallback(async () => {
    setCalculationLoading(true);
    try {
      // 🔍 尝试获取真实的计算引擎运行结果
      // 这里可以调用API获取最近一次的计算引擎运行结果
      // 例如：const response = await simplePayrollApi.getLatestCalculationResult();
      
      // 💡 为了演示效果，暂时使用模拟数据
      // 在真实环境中，应该替换为实际的API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 🎯 模拟计算引擎运行结果数据
      const mockResult: CalculationEngineResult = {
        total_processed: 125,
        success_count: 123,
        error_count: 2,
        calculation_summary: {
          total_employees: 125,
          successful_count: 123,
          failed_count: 2
        },
        payroll_totals: {
          total_gross_pay: 1248500.00,
          total_deductions: 387650.00,
          total_net_pay: 860850.00,
          total_employer_cost: 1485320.00
        },
        social_insurance_breakdown: {
          employee_totals: {
            social_insurance: 124850.00,
            housing_fund: 149820.00,
            total: 274670.00
          },
          employer_totals: {
            social_insurance: 186740.00,
            housing_fund: 149820.00,
            total: 336560.00
          }
        },
        cost_analysis: {
          employee_take_home: 860850.00,
          employee_social_cost: 274670.00,
          employer_salary_cost: 1248500.00,
          employer_social_cost: 336560.00,
          total_cost: 1485320.00,
          social_cost_ratio: 22.5
        },
        calculation_metadata: {
          calculation_date: new Date().toISOString(),
          engine_version: 'integrated_v2.0_correct_order',
          calculation_order: '先计算五险一金，再汇总各项金额'
        },
        payroll_run_updated: true,
        errors: [
          {
            employee_id: 101,
            employee_name: '张三',
            error_message: '缺少社保基数配置'
          },
          {
            employee_id: 102,
            employee_name: '李四',
            error_message: '五险一金费率配置不匹配'
          }
        ]
      };
      
      setCalculationResult(mockResult);
      console.log('📊 [计算引擎结果] 获取成功:', mockResult);
      
    } catch (error) {
      console.error('❌ [计算引擎结果] 获取失败:', error);
      message.error('获取计算引擎运行结果失败');
    } finally {
      setCalculationLoading(false);
    }
  }, []);

  // 🎯 组件加载时获取最新的计算引擎结果
  useEffect(() => {
    fetchLatestCalculationResult();
  }, [fetchLatestCalculationResult]);

  // 🎯 模拟开始计算引擎
  const startCalculationEngine = useCallback(() => {
    setShowCalculationModal(true);
    setCalculationFinalResult(null);
    
    // 模拟计算过程
    const employees = [
      { id: 1, name: '张三', department: '技术部', position: '高级工程师' },
      { id: 2, name: '李四', department: '销售部', position: '销售经理' },
      { id: 3, name: '王五', department: '人事部', position: 'HR专员' },
      { id: 4, name: '赵六', department: '财务部', position: '会计' },
      { id: 5, name: '钱七', department: '技术部', position: '开发工程师' }
    ];
    
    let currentIndex = 0;
    const totalEmployees = employees.length;
    
    // 开始计算
    setCalculationProgress({
      total: totalEmployees,
      processed: 0,
      current_employee: null,
      status: CalculationStatus.PREPARING,
      stage: '准备数据',
      start_time: new Date().toISOString()
    });
    
    // 模拟计算进度
    const progressInterval = setInterval(() => {
      setCalculationProgress(prev => {
        if (!prev) return null;
        
        if (currentIndex >= totalEmployees) {
          clearInterval(progressInterval);
          
          // 计算完成，显示结果
          const mockResult: CalculationResult = {
            success_count: totalEmployees - 1,
            error_count: 1,
            total_processed: totalEmployees,
            payroll_totals: {
              total_gross_pay: 248500.00,
              total_deductions: 77530.00,
              total_net_pay: 170970.00,
              total_employer_cost: 297040.00
            },
            social_insurance_breakdown: {
              employee_totals: {
                social_insurance: 24850.00,
                housing_fund: 29820.00,
                total: 54670.00
              },
              employer_totals: {
                social_insurance: 37260.00,
                housing_fund: 29820.00,
                total: 67080.00
              }
            },
            cost_analysis: {
              social_cost_ratio: 22.5
            },
            errors: [
              {
                employee_id: 3,
                employee_name: '王五',
                error_message: '缺少社保基数配置'
              }
            ],
            duration: 15
          };
          
          setCalculationFinalResult(mockResult);
          setCalculationProgress(prev => prev ? {
            ...prev,
            status: CalculationStatus.COMPLETED,
            processed: totalEmployees,
            current_employee: null
          } : null);
          
          return prev;
        }
        
        const stages = ['准备数据', '基础薪资计算', '五险一金计算', '汇总统计'];
        const stageIndex = Math.floor((currentIndex / totalEmployees) * stages.length);
        
        currentIndex++;
        
        return {
          ...prev,
          processed: currentIndex,
          current_employee: currentIndex <= totalEmployees ? employees[currentIndex - 1] : null,
          status: CalculationStatus.CALCULATING,
          stage: stages[Math.min(stageIndex, stages.length - 1)],
          estimated_remaining_time: (totalEmployees - currentIndex) * 3
        };
      });
    }, 2000); // 每2秒处理一个员工
  }, []);

  // 🎯 关闭计算状态Modal
  const handleCloseCalculationModal = useCallback(() => {
    setShowCalculationModal(false);
    setCalculationProgress(null);
    setCalculationFinalResult(null);
  }, []);

  // 🎯 重试计算
  const handleRetryCalculation = useCallback(() => {
    startCalculationEngine();
  }, [startCalculationEngine]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    onLoadingChange(true);
    try {
      console.log('📂 开始解析Excel文件:', file.name);
      
      // 验证文件类型
      if (!validateFileType(file)) {
        throw new Error('不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件');
      }
      
      // 动态导入xlsx库
      const XLSX = await import('xlsx');
      
      let workbook;
      
      // 根据文件类型处理不同的编码
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        // CSV文件需要特殊处理编码
        const csvText = await processCSVEncoding(file);
        
        // 如果检测到编码问题，给用户友好提示
        if (csvText.includes('�') || /[À-ÿ]{2,}/.test(csvText)) {
          message.warning({
            content: (
              <div>
                <div>检测到CSV文件编码问题，可能显示乱码</div>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  建议解决方案：
                  <br />• 用Excel打开CSV文件，另存为"UTF-8 CSV"格式
                  <br />• 或使用记事本打开，选择"另存为" → 编码选择"UTF-8"
                </div>
              </div>
            ),
            duration: 6
          });
        }
        
        // 使用XLSX解析CSV文本
        workbook = XLSX.read(csvText, { 
          type: 'string',
          raw: true // 保持原始数据格式
        });
      } else {
        // Excel文件正常处理
        const arrayBuffer = await file.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      }
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Excel文件中没有找到工作表');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // 将工作表转换为JSON数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // 使用数组格式而不是对象格式
        defval: '', // 空单元格默认值
        raw: false // 不保留原始值，转换为字符串
      });
      
      console.log('📊 解析的原始数据:', jsonData);
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel文件为空或无法解析');
      }
      
      // 提取表头和数据行
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];
      
      // 过滤掉完全空白的行
      const filteredRows = filterEmptyRows(dataRows);
      
      if (!headers || headers.length === 0) {
        throw new Error('未找到有效的表头信息');
      }
      
      if (filteredRows.length === 0) {
        throw new Error('文件中没有找到有效的数据行');
      }
      
      // 清理表头，移除空白字符
      const cleanedHeaders = cleanHeaders(headers);
      
      const parsedData: ImportData = {
        headers: cleanedHeaders,
        rows: filteredRows,
        totalRecords: filteredRows.length
      };
      
      console.log('✅ Excel解析成功:', {
        fileName: file.name,
        headers: parsedData.headers,
        totalRecords: parsedData.totalRecords,
        sampleRow: parsedData.rows[0]
      });
      
      onDataParsed(parsedData);
      message.success('文件解析成功！');
      
    } catch (error: any) {
      console.error('❌ 文件解析失败:', error);
      message.error(`文件解析失败: ${error.message}`);
    } finally {
      onLoadingChange(false);
    }
  }, [onDataParsed, onLoadingChange]);

  // 处理文本输入
  const handleTextInput = useCallback(() => {
    if (!textInput.trim()) {
      message.warning('请输入数据内容');
      return;
    }

    onLoadingChange(true);
    try {
      const { headers, rows } = parseTextData(textInput);
      const filteredRows = filterEmptyRows(rows);
      
      if (!headers || headers.length === 0) {
        throw new Error('未找到有效的表头信息');
      }
      
      if (filteredRows.length === 0) {
        throw new Error('没有找到有效的数据行');
      }
      
      const data: ImportData = {
        headers,
        rows: filteredRows,
        totalRecords: filteredRows.length
      };
      
      console.log('✅ 文本解析成功:', {
        headers: data.headers,
        totalRecords: data.totalRecords,
        sampleRow: data.rows[0]
      });
      
      onDataParsed(data);
      message.success('数据解析成功！');
      
    } catch (error: any) {
      console.error('❌ 文本解析失败:', error);
      message.error(`数据解析失败: ${error.message}`);
    } finally {
      onLoadingChange(false);
    }
  }, [textInput, onDataParsed, onLoadingChange]);

  // 🎯 渲染计算引擎运行结果信息框
  const renderCalculationEngineResult = () => {
    if (calculationLoading) {
      return (
        <Card 
          title={
            <Space>
              <CalculatorOutlined style={{ color: '#1890ff' }} />
              <span>集成计算引擎运行状态</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin tip="正在获取最新的计算引擎运行结果..." />
          </div>
        </Card>
      );
    }

    if (!calculationResult) {
      return (
        <Card 
          title={
            <Space>
              <CalculatorOutlined style={{ color: '#8c8c8c' }} />
              <span>集成计算引擎运行状态</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Alert
            message="暂无计算引擎运行记录"
            description="当有薪资数据需要处理时，系统会自动运行集成计算引擎进行五险一金计算"
            type="info"
            showIcon
          />
        </Card>
      );
    }

    const isSuccess = calculationResult.success_count > 0;
    const hasErrors = calculationResult.error_count > 0;

    return (
      <Card 
        title={
          <Space>
            <CalculatorOutlined style={{ color: isSuccess ? '#52c41a' : '#f5222d' }} />
            <span>集成计算引擎运行结果</span>
            <Tag color={isSuccess ? 'green' : 'red'}>
              {isSuccess ? '运行成功' : '运行异常'}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="link" 
              size="small" 
              onClick={fetchLatestCalculationResult}
              loading={calculationLoading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              size="small" 
              onClick={startCalculationEngine}
              icon={<CalculatorOutlined />}
            >
              启动计算引擎
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {/* 基础统计 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="处理员工"
              value={calculationResult.total_processed}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              suffix="人"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="成功计算"
              value={calculationResult.success_count}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="人"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="计算失败"
              value={calculationResult.error_count}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: calculationResult.error_count > 0 ? '#f5222d' : '#666' }}
              suffix="人"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="社保成本比例"
              value={calculationResult.cost_analysis.social_cost_ratio}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>

        <Divider />

        {/* 薪资汇总 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            💰 薪资汇总（单位：元）
          </Text>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="应发合计"
                value={calculationResult.payroll_totals.total_gross_pay}
                precision={2}
                valueStyle={{ color: '#52c41a', fontSize: '16px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="扣发合计"
                value={calculationResult.payroll_totals.total_deductions}
                precision={2}
                valueStyle={{ color: '#f5222d', fontSize: '16px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="实发合计"
                value={calculationResult.payroll_totals.total_net_pay}
                precision={2}
                valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="单位总成本"
                value={calculationResult.payroll_totals.total_employer_cost}
                precision={2}
                valueStyle={{ color: '#722ed1', fontSize: '16px' }}
              />
            </Col>
          </Row>
        </div>

        {/* 五险一金明细 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            🏦 五险一金明细（单位：元）
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '6px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>个人承担</Text>
                <div style={{ marginTop: '4px' }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>社保:</span>
                      <span style={{ fontWeight: 'bold' }}>¥{calculationResult.social_insurance_breakdown.employee_totals.social_insurance.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>公积金:</span>
                      <span style={{ fontWeight: 'bold' }}>¥{calculationResult.social_insurance_breakdown.employee_totals.housing_fund.toLocaleString()}</span>
                    </div>
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'bold' }}>合计:</span>
                      <span style={{ fontWeight: 'bold', color: '#52c41a' }}>¥{calculationResult.social_insurance_breakdown.employee_totals.total.toLocaleString()}</span>
                    </div>
                  </Space>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '6px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>单位承担</Text>
                <div style={{ marginTop: '4px' }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>社保:</span>
                      <span style={{ fontWeight: 'bold' }}>¥{calculationResult.social_insurance_breakdown.employer_totals.social_insurance.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>公积金:</span>
                      <span style={{ fontWeight: 'bold' }}>¥{calculationResult.social_insurance_breakdown.employer_totals.housing_fund.toLocaleString()}</span>
                    </div>
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'bold' }}>合计:</span>
                      <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>¥{calculationResult.social_insurance_breakdown.employer_totals.total.toLocaleString()}</span>
                    </div>
                  </Space>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* 计算引擎元数据 */}
        <div style={{ background: '#fafafa', padding: '12px', borderRadius: '6px', marginBottom: hasErrors ? 16 : 0 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            🔧 引擎版本: {calculationResult.calculation_metadata.engine_version} | 
            📅 计算时间: {new Date(calculationResult.calculation_metadata.calculation_date).toLocaleString()} | 
            🔄 计算顺序: {calculationResult.calculation_metadata.calculation_order}
          </Text>
        </div>

        {/* 错误信息 */}
        {hasErrors && calculationResult.errors && (
          <Alert
            type="warning"
            message={`发现 ${calculationResult.error_count} 个计算错误`}
            description={
              <div style={{ marginTop: '8px' }}>
                {calculationResult.errors.slice(0, 3).map((error, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text code>{error.employee_name}(ID:{error.employee_id})</Text>: {error.error_message}
                  </div>
                ))}
                {calculationResult.errors.length > 3 && (
                  <Text type="secondary">... 还有 {calculationResult.errors.length - 3} 个错误</Text>
                )}
              </div>
            }
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    );
  };

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BulbOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3}>准备您的薪资数据</Title>
          <Paragraph type="secondary">
            支持多种数据输入方式，系统将自动识别和处理您的数据
          </Paragraph>
        </div>

      <Tabs activeKey={inputMethod} onChange={(key) => setInputMethod(key as InputMethod)} centered>
        <TabPane 
          tab={
            <span>
              <FileExcelOutlined />
              文件上传
            </span>
          } 
          key="upload"
        >
          <div style={{ padding: '24px 0' }}>
            <Dragger
              name="file"
              multiple={false}
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
              showUploadList={false}
              style={{ padding: 40 }}
              disabled={loading}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 18, marginBottom: 8 }}>
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 14 }}>
                支持 Excel (.xlsx, .xls) 和 CSV 格式文件
              </p>
            </Dragger>
            
            <Alert
              style={{ marginTop: 16 }}
              message="文件格式要求"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>第一行必须是字段标题</li>
                  <li>每行代表一个员工的薪资记录</li>
                  <li>建议包含：姓名、工号、基本工资等字段</li>
                  <li><strong>CSV文件编码：</strong>推荐使用UTF-8编码，避免中文乱码</li>
                  <li><strong>编码转换：</strong>Excel → 另存为 → CSV UTF-8 / 记事本 → 另存为 → UTF-8编码</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TableOutlined />
              表格粘贴
            </span>
          } 
          key="paste"
        >
          <div style={{ padding: '24px 0' }}>
            <TextArea
              rows={10}
              placeholder="请从Excel复制表格数据粘贴到此处..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              style={{ marginBottom: 16 }}
              disabled={loading}
            />
            
            <div style={{ textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleTextInput}
                loading={loading}
                disabled={!textInput.trim()}
              >
                解析数据
              </Button>
            </div>
            
            <Alert
              style={{ marginTop: 16 }}
              message="粘贴说明"
              description="从Excel选中数据区域，复制后直接粘贴到上方文本框，系统会自动识别表格结构"
              type="info"
              showIcon
            />
          </div>
        </TabPane>
      </Tabs>
      </Card>

      {/* 🎯 计算状态Modal - 固定在页面中间显示 */}
      <CalculationStatusModal
        visible={showCalculationModal}
        progress={calculationProgress}
        result={calculationFinalResult}
        onClose={handleCloseCalculationModal}
        onRetry={handleRetryCalculation}
      />
    </div>
  );
};

export default DataUpload; 