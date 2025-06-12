import React, { useState, useCallback } from 'react';
import { Tabs, Input, Button, Alert, Tag, Tooltip, Space, Row, Col, Progress, Card, message } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, FileTextOutlined, TableOutlined } from '@ant-design/icons';
import { ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
// import type { FieldMappingRule } from '../types';
type FieldMappingRule = any; // 临时类型定义
import responsiveStyles from '../../../../../styles/responsive-import.module.less';
import bulkImportStyles from '../../../../../styles/payroll-bulk-import.module.less';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface ImportInputStepProps {
  data: any[];
  onDataChange: (data: any[]) => void;
  onNext: () => void;
  generateIntelligentMapping: (sourceFields: string[]) => FieldMappingRule[];
  isLoading?: boolean;
}

interface MappingAnalysisResult {
  totalFields: number;
  mappedFields: number;
  ignoredFields: number;
  calculatedFields: number;
  conflictFields: number;
  rules: FieldMappingRule[];
}

const ImportInputStep: React.FC<ImportInputStepProps> = ({
  data,
  onDataChange,
  onNext,
  generateIntelligentMapping,
  isLoading = false
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [tableText, setTableText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [activeTab, setActiveTab] = useState('table');
  const [analysisResult, setAnalysisResult] = useState<MappingAnalysisResult | null>(null);

  // 解析表格数据并进行智能字段分析
  const handleParseTable = useCallback(() => {
    try {
      const lines = tableText.trim().split('\n');
      if (lines.length < 2) {
        message.error('数据格式错误：至少需要表头和一行数据');
        return;
      }

      // 解析表头和数据
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim())
      );

      // 构建数据对象
      const parsedData = rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      // 执行智能字段映射分析
      const mappingRules = generateIntelligentMapping(headers);
      const analysis = analyzeMappingResults(mappingRules);
      
      setAnalysisResult(analysis);
      onDataChange(parsedData);
    } catch (error) {
      console.error('解析表格数据失败:', error);
    }
  }, [tableText, generateIntelligentMapping, onDataChange]);

  // 解析JSON数据
  const handleParseJson = useCallback(() => {
    try {
      const parsedData = JSON.parse(jsonText);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // 获取所有可能的字段名
        const allFields = new Set<string>();
        parsedData.forEach(item => {
          Object.keys(item).forEach(key => allFields.add(key));
        });

        // 执行智能字段映射分析
        const mappingRules = generateIntelligentMapping(Array.from(allFields));
        const analysis = analyzeMappingResults(mappingRules);
        
        setAnalysisResult(analysis);
        onDataChange(parsedData);
      }
    } catch (error) {
      console.error('解析JSON数据失败:', error);
    }
  }, [jsonText, generateIntelligentMapping, onDataChange]);

  // 分析映射结果
  const analyzeMappingResults = (rules: FieldMappingRule[]): MappingAnalysisResult => {
    const result = {
      totalFields: rules.length,
      mappedFields: 0,
      ignoredFields: 0,
      calculatedFields: 0,
      conflictFields: 0,
      rules
    };

    rules.forEach(rule => {
      switch (rule.category) {
        case 'ignore':
          result.ignoredFields++;
          break;
        case 'calculated':
          result.calculatedFields++;
          if (rule.confidence < 0.8) {
            result.conflictFields++;
          }
          break;
        case 'base':
        case 'earning':
        case 'deduction':
          result.mappedFields++;
          if (rule.confidence < 0.7) {
            result.conflictFields++;
          }
          break;
      }
    });

    return result;
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'base': return 'blue';
      case 'earning': return 'green';
      case 'deduction': return 'red';
      case 'calculated': return 'orange';
      case 'ignore': return 'default';
      default: return 'default';
    }
  };

  // 获取分类标签 - 使用国际化
  const getCategoryLabel = (category: string) => {
    return t(`payroll:batch_import.field_categories.${category}`, category);
  };

  // ProTable列定义
  const mappingColumns: ProColumns<FieldMappingRule>[] = [
    {
      title: '源字段',
      dataIndex: 'sourceField',
      key: 'sourceField',
      width: 200,
      ellipsis: true,
      copyable: true,
      className: 'table-col-primary'
    },
    {
      title: '映射结果',
      dataIndex: 'targetField',
      key: 'targetField',
      width: 280,
      className: 'table-col-primary',
      render: (dom: React.ReactNode, entity: FieldMappingRule) => {
        const text = entity.targetField;
        if (text === '__IGNORE_FIELD__') {
          return <Tag color="default">🚫 忽略</Tag>;
        }
        return (
          <Space direction="vertical" size={2}>
            <Tag color={getCategoryColor(entity.category)}>
              {getCategoryLabel(entity.category)}
            </Tag>
            <div className={`hide-xs ${bulkImportStyles.fileInfo}`}>
              {text}
            </div>
          </Space>
        );
      }
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      className: 'table-col-secondary',
      render: (dom: React.ReactNode, entity: FieldMappingRule) => {
        const confidence = entity.confidence;
        const percent = Math.round(confidence * 100);
        const status = confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'normal' : 'exception';
        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              status={status}
              showInfo={false}
            />
            <div className={bulkImportStyles.textAreaLabel}>
              {percent}%
            </div>
          </div>
        );
      }
    },
    {
      title: '映射原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      className: 'table-col-optional hide-md',
      render: (dom: React.ReactNode, entity: FieldMappingRule) => {
        const text = entity.reason;
        return (
          <Tooltip title={text} placement="topLeft">
            <div className={bulkImportStyles.fieldDescription}>
              {text}
            </div>
          </Tooltip>
        );
      }
    }
  ];

  // 渲染右侧智能映射说明区域
  const renderIntelligentMappingGuide = () => (
    <ProCard 
      title={
        <Space>
          <InfoCircleOutlined className={bulkImportStyles.textInfo} />
          <span>智能字段映射说明</span>
        </Space>
      }
              className={`${responsiveStyles.mappingGuideCard} ${bulkImportStyles.mb16}`}
      headerBordered
    >
      <Row gutter={[24, 16]} className={responsiveStyles.mappingGuideContent}>
        {/* 系统功能介绍 */}
        <Col xs={24} md={6} className={responsiveStyles.guideSection}>
          <h4>🎯 系统功能介绍</h4>
          <ul>
            <li>系统会自动识别字段类型和映射关系</li>
            <li>基础字段：员工姓名、工号等基本信息</li>
            <li>收入字段：如应发工资(基本工资、奖金、津贴)</li>
            <li>扣除字段：个人所得税、社保、公积金等</li>
          </ul>
        </Col>

        {/* 字段分类说明 */}
        <Col xs={24} md={6} className={responsiveStyles.guideSection}>
          <h4>🏷️ 字段分类说明</h4>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className={responsiveStyles.categoryItem}>
              <Tag color="blue">基础</Tag>
              <span>员工基本信息字段</span>
            </div>
            <div className={responsiveStyles.categoryItem}>
              <Tag color="green">收入</Tag>
              <span>各项收入与奖金字段</span>
            </div>
            <div className={responsiveStyles.categoryItem}>
              <Tag color="red">扣除</Tag>
              <span>各项扣除与税费字段</span>
            </div>
            <div className={responsiveStyles.categoryItem}>
              <Tag color="orange">计算</Tag>
              <span>系统自动计算的统计字段</span>
            </div>
            <div className={responsiveStyles.categoryItem}>
              <Tag color="default">忽略</Tag>
              <span>不导入的无关字段</span>
            </div>
          </Space>
        </Col>

        {/* 重要提醒 */}
        <Col xs={24} md={6} className={responsiveStyles.guideSection}>
          <h4>⚠️ 重要提醒</h4>
          <Alert
            type="warning"
            showIcon
            message="统计字段建议"
            description="应发工资总额、实发工资等统计字段会被标记为计算字段，建议谨慎导入"
            style={{ marginBottom: 8 }}
          />
          <Alert
            type="info"
            showIcon
            message="扣除项建议"
            description="社保、税收等扣除项通常由系统计算，建议忽略"
          />
        </Col>

        {/* 操作提示 */}
        <Col xs={24} md={6} className={responsiveStyles.guideSection}>
          <h4>💡 操作提示</h4>
          <ol>
            <li>从Excel或其他表格软件复制数据</li>
            <li>确保第一行为列标题</li>
            <li>点击"解析并分析"进行智能映射</li>
            <li>您可以在下一步中调整映射关系</li>
          </ol>
        </Col>
      </Row>
    </ProCard>
  );

  // 渲染数据输入区域 
  const renderDataInput = () => (
    <ProCard className={responsiveStyles.importInputSection}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large" className={responsiveStyles.inputTabs}>
        <TabPane 
          tab={
            <span>
              <TableOutlined />
              <span className="hide-xs"> 表格粘贴输入</span>
            </span>
          } 
          key="table"
        >
          <ProCard 
            title="表格数据输入"
            extra={
              <Button 
                type="primary" 
                onClick={handleParseTable}
                disabled={!tableText.trim() || isLoading}
                loading={isLoading}
                size="small"
              >
                🔍 解析并分析
              </Button>
            }
            headerBordered
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="输入说明"
                description="请从Excel或其他表格软件复制数据，确保第一行为列标题。支持CSV格式。"
                className={responsiveStyles.importHelp}
              />
              <TextArea
                value={tableText}
                onChange={(e) => setTableText(e.target.value)}
                placeholder="列名1,列名2,列名3&#10;数据1,数据2,数据3&#10;数据4,数据5,数据6"
                className={responsiveStyles.inputTextarea}
              />
            </Space>
          </ProCard>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              <span className="hide-xs"> JSON 输入</span>
            </span>
          } 
          key="json"
        >
          <ProCard 
            title="JSON数据输入"
            extra={
              <Button 
                type="primary" 
                onClick={handleParseJson}
                disabled={!jsonText.trim() || isLoading}
                loading={isLoading}
                size="small"
              >
                🔍 解析并分析
              </Button>
            }
            headerBordered
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="JSON格式要求"
                description="请输入标准JSON数组格式，每个对象代表一条记录。"
                className={responsiveStyles.importHelp}
              />
              <TextArea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='[{"字段1": "值1", "字段2": "值2"}, {"字段1": "值3", "字段2": "值4"}]'
                className={responsiveStyles.inputTextarea}
              />
            </Space>
          </ProCard>
        </TabPane>
      </Tabs>
    </ProCard>
  );

  // 渲染映射分析结果
  const renderMappingAnalysis = () => {
    if (!analysisResult) return null;

    const { totalFields, mappedFields, ignoredFields, calculatedFields, conflictFields } = analysisResult;

    return (
      <ProCard 
        title={
          <Space>
            <span>🔍 智能字段映射分析</span>
            <Tag color="blue">共 {totalFields} 个字段</Tag>
          </Space>
        }
        className={responsiveStyles.mappingAnalysis}
        headerBordered
      >
        {/* 统计概览 */}
        <Row gutter={[16, 16]} className={responsiveStyles.statisticsGrid}>
          <Col xs={12} sm={6}>
            <ProCard className={responsiveStyles.statisticCard}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {mappedFields}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>已映射字段</div>
              </div>
            </ProCard>
          </Col>
          <Col xs={12} sm={6}>
            <ProCard className={responsiveStyles.statisticCard}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {calculatedFields}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>计算字段</div>
              </div>
            </ProCard>
          </Col>
          <Col xs={12} sm={6}>
            <ProCard className={responsiveStyles.statisticCard}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d9d9d9' }}>
                  {ignoredFields}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>忽略字段</div>
              </div>
            </ProCard>
          </Col>
          <Col xs={12} sm={6}>
            <ProCard className={responsiveStyles.statisticCard}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: conflictFields > 0 ? '#ff4d4f' : '#52c41a' }}>
                  {conflictFields}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>需要确认</div>
              </div>
            </ProCard>
          </Col>
        </Row>

        {/* 重要提示 */}
        <div className={responsiveStyles.analysisAlerts}>
          {calculatedFields > 0 && (
            <Alert
              type="warning"
              showIcon
              message="检测到计算字段"
              description={
                <div>
                  <p>系统检测到 <strong>{calculatedFields}</strong> 个计算字段（如应发工资、实发工资等）。</p>
                  <p>💡 <strong>建议</strong>：这些字段通常由系统自动计算，导入可能导致数据不一致。</p>
                  <p>🔧 <strong>解决方案</strong>：如需导入，请确保数据准确性，或选择忽略让系统重新计算。</p>
                </div>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {conflictFields > 0 && (
            <Alert
              type="error"
              showIcon
              message="发现映射冲突"
              description={`有 ${conflictFields} 个字段的映射置信度较低，建议人工确认映射关系。`}
              style={{ marginBottom: 16 }}
            />
          )}
        </div>

        {/* 映射规则表格 */}
        <div className={responsiveStyles.dataPreviewTable}>
          <ProTable<FieldMappingRule>
            columns={mappingColumns}
            dataSource={analysisResult.rules}
            rowKey="sourceField"
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条字段映射`,
              simple: window.innerWidth < 768
            }}
            search={false}
            toolBarRender={false}
            options={{
              density: false,
              fullScreen: false,
              reload: false,
              setting: window.innerWidth >= 768
            }}
            scroll={{ x: 600, y: 400 }}
          />
        </div>

        <div className={responsiveStyles.importActions}>
          <div className="action-left"></div>
          <div className="action-right">
            <Button 
              type="primary" 
              size="large"
              onClick={onNext}
              disabled={mappedFields === 0}
            >
              确认映射并继续 ({mappedFields} 个字段已映射)
            </Button>
          </div>
        </div>
      </ProCard>
    );
  };

  return (
    <div className={responsiveStyles.importMainLayout}>
      {/* 页面标题 */}
      <ProCard 
        title="数据输入和智能映射"
        style={{ marginBottom: 16 }}
        headerBordered
      >
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="开始批量导入"
          description="请输入薪资数据，系统将自动进行智能字段映射分析。下方提供了详细的操作说明和字段分类说明。"
        />
      </ProCard>

      {/* 智能映射说明区域 */}
      {renderIntelligentMappingGuide()}

      {/* 数据输入区域 */}
      {renderDataInput()}

      {/* 映射分析结果 */}
      {renderMappingAnalysis()}
    </div>
  );
};

export default ImportInputStep;