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
  Input,
  Dropdown,
  Menu,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownOutlined,
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
  placeholder,
  height = 300,
  readOnly = false,
  showValidation = true,
  schemaName = 'reports',
}) => {
  const { t } = useTranslation(['reportView', 'common', 'components']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<SqlValidationResponse | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<any[]>([]);

  const finalPlaceholder = placeholder || t('components:sql_editor.placeholder');

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
      message.warning(t('components:auto_sql_e8afb7'));
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
        message.success(t('components:auto_sql_53514c'));
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
        message.error(t('components:auto_sql_53514c'));
      }
    } catch (error: any) {
      message.error(t('components:auto__error_message__e9aa8c'));
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
      name: t('components:sql_editor.template_basic'),
      template: 'SELECT * FROM schema.table_name WHERE condition = \'value\'',
    },
    {
      name: t('components:sql_editor.template_join'),
      template: `SELECT 
  a.field1,
  b.field2
FROM schema.table_a a
LEFT JOIN schema.table_b b ON a.id = b.a_id`,
    },
    {
      name: t('components:sql_editor.template_aggregate'),
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
            message={t('components:sql_editor.validation_success')}
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
            message={t('components:sql_editor.validation_failed')}
            description={<Text type="danger">{validationResult.error_message}</Text>}
          />
        )}
      </div>
    );
  };

  return (
    <Card size="small" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Title level={5} style={{ margin: 0 }}>{t('components:sql_editor.title')}</Title>
        </Col>
        <Col>
          <Space>
            <Dropdown
              menu={{
                items: sqlTemplates.map((templateItem, index) => ({
                  key: String(index),
                  label: (
                    <a onClick={() => insertTemplate(templateItem.template)}>{templateItem.name}</a>
                  ),
                }))
              }}
              trigger={['click']}
            >
              <Button>
                {t('components:sql_editor.insert_template')}
                <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={validateSql}
              loading={validating}
            >
              {t('components:sql_editor.validate_and_preview')}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={formatSql}
            >
              {t('components:sql_editor.format_sql')}
            </Button>
          </Space>
        </Col>
      </Row>
      <Input.TextArea
        ref={textareaRef}
        value={value}
        onChange={handleSqlChange}
        placeholder={finalPlaceholder}
        autoSize={{ minRows: Math.min(height / 20, 3), maxRows: Math.min(height / 20, 20) }}
        style={{ marginTop: 16, fontFamily: 'monospace' }}
        readOnly={readOnly}
      />
      {renderValidationResult()}
      {validationResult?.is_valid && previewColumns.length > 0 && (
        <Card title={t('components:sql_editor.preview_data')} size="small" style={{ marginTop: 16 }}>
          <Table
            columns={previewColumns}
            dataSource={previewData}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </Card>
      )}
    </Card>
  );
};

export default SqlEditor; 