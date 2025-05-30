/**
 * SQL编辑器组件
 * @description 提供SQL编写、语法高亮、实时验证等功能
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Alert,
  Spin,
  Typography,
  Row,
  Col,
  Tag,
  Table,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { reportViewAPI } from '../../api/reportView';
import type { SqlValidationResponse } from '../../types/reportView';

const { Text, Title } = Typography;

interface SqlEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onValidate?: (result: SqlValidationResponse | null) => void;
  placeholder?: string;
  height?: number;
  readOnly?: boolean;
  showValidation?: boolean;
  schemaName?: string;
}

const SqlEditor: React.FC<SqlEditorProps> = ({
  value = '',
  onChange,
  onValidate,
  placeholder = '请输入SQL查询语句...',
  height = 300,
  readOnly = false,
  showValidation = true,
  schemaName = 'reports',
}) => {
  const { t } = useTranslation(['reportView', 'common']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<SqlValidationResponse | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<any[]>([]);

  // 处理SQL变化
  const handleSqlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    
    // 清除之前的验证结果，因为SQL已经改变
    if (validationResult) {
      setValidationResult(null);
      onValidate?.(null);
    }
  };

  // 验证SQL
  const validateSql = async () => {
    if (!value.trim()) {
      message.warning('请输入SQL语句');
      return;
    }

    try {
      setValidating(true);
      const result = await reportViewAPI.validateSql({
        sql_query: value,
        schema_name: schemaName,
      });

      setValidationResult(result);
      onValidate?.(result);

      if (result.is_valid) {
        message.success('SQL验证通过');
        // 如果验证通过，生成预览列
        if (result.columns) {
          const columns = result.columns.map((col, index) => ({
            key: col.name,
            title: col.name,
            dataIndex: col.name,
            width: 150,
            render: (text: any) => (
              <Text ellipsis={{ tooltip: true }} style={{ maxWidth: 120 }}>
                {text?.toString() || '-'}
              </Text>
            ),
          }));
          setPreviewColumns(columns);
        }
      } else {
        message.error('SQL验证失败');
      }
    } catch (error: any) {
      console.error('SQL validation failed:', error);
      message.error(`验证失败: ${error.message}`);
      setValidationResult({
        is_valid: false,
        error_message: error.message,
      });
    } finally {
      setValidating(false);
    }
  };

  // 格式化SQL
  const formatSql = () => {
    if (!value.trim()) return;

    // 简单的SQL格式化
    const formatted = value
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',\n  ')
      .replace(/\bSELECT\b/gi, 'SELECT\n  ')
      .replace(/\bFROM\b/gi, '\nFROM ')
      .replace(/\bWHERE\b/gi, '\nWHERE ')
      .replace(/\bJOIN\b/gi, '\nJOIN ')
      .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN ')
      .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN ')
      .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN ')
      .replace(/\bORDER BY\b/gi, '\nORDER BY ')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY ')
      .replace(/\bHAVING\b/gi, '\nHAVING ')
      .trim();

    onChange?.(formatted);
  };

  // 插入SQL模板
  const insertTemplate = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + template + value.substring(end);
    
    onChange?.(newValue);
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + template.length, start + template.length);
    }, 0);
  };

  // SQL模板
  const sqlTemplates = [
    {
      name: '基础查询',
      template: 'SELECT * FROM schema.table_name WHERE condition = \'value\'',
    },
    {
      name: '关联查询',
      template: `SELECT 
  a.field1,
  b.field2
FROM schema.table_a a
LEFT JOIN schema.table_b b ON a.id = b.a_id`,
    },
    {
      name: '聚合查询',
      template: `SELECT 
  field1,
  COUNT(*) as count,
  SUM(amount) as total
FROM schema.table_name
GROUP BY field1`,
    },
  ];

  // 渲染验证结果
  const renderValidationResult = () => {
    if (!showValidation || !validationResult) return null;

    return (
      <div style={{ marginTop: 16 }}>
        {validationResult.is_valid ? (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            message="SQL验证通过"
            description={
              <div>
                {validationResult.columns && (
                  <div>
                    <Text>检测到 {validationResult.columns.length} 个字段：</Text>
                    <div style={{ marginTop: 8 }}>
                      {validationResult.columns.map((col, index) => (
                        <Tag key={index} style={{ margin: '2px' }}>
                          {col.name} ({col.type})
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                {validationResult.estimated_rows && (
                  <Text type="secondary">
                    预估行数: {validationResult.estimated_rows}
                  </Text>
                )}
              </div>
            }
          />
        ) : (
          <Alert
            type="error"
            icon={<ExclamationCircleOutlined />}
            message="SQL验证失败"
            description={validationResult.error_message}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>SQL编辑器</Title>
            {validationResult?.is_valid && (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                验证通过
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button size="small" onClick={formatSql}>
              格式化
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              loading={validating}
              onClick={validateSql}
            >
              验证SQL
            </Button>
          </Space>
        }
      >
        {/* SQL模板 */}
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col span={24}>
            <Text type="secondary">快速模板：</Text>
            <Space style={{ marginLeft: 8 }}>
              {sqlTemplates.map((template, index) => (
                <Button
                  key={index}
                  size="small"
                  type="link"
                  onClick={() => insertTemplate(template.template)}
                >
                  {template.name}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>

        {/* SQL编辑区域 */}
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleSqlChange}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{
              width: '100%',
              height: `${height}px`,
              padding: '12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              lineHeight: '1.5',
              resize: 'vertical',
              outline: 'none',
            }}
          />
          {validating && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '20px',
                borderRadius: '6px',
              }}
            >
              <Spin tip="验证中..." />
            </div>
          )}
        </div>

        {/* 验证结果 */}
        {renderValidationResult()}

        {/* 字段预览 */}
        {validationResult?.is_valid && previewColumns.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Title level={5}>字段预览</Title>
            <Table
              columns={previewColumns}
              dataSource={[]}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: '暂无数据，请执行查询查看结果' }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default SqlEditor; 