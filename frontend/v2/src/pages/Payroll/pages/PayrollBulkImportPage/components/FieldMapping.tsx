import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Tag, Typography, Alert, Button, Tooltip } from 'antd';
import * as fuzzball from 'fuzzball';
import type { RawImportData, ImportModeConfig } from '../types/universal';

const { Text } = Typography;
const { Option } = Select;

// 注入CSS样式
const customStyles = `
  .confidence-medium .ant-select-selector {
    border-color: #FAAD14 !important; /* 微弱的黄色 */
  }
  .confidence-low .ant-select-selector {
    border-color: #FF7A45 !important; /* 微弱的橙色 */
  }
`;

interface FieldMappingProps {
  rawImportData: RawImportData;
  modeConfig: ImportModeConfig;
  onMappingComplete: (mapping: Record<string, string>) => void;
}

const FieldMapping: React.FC<FieldMappingProps> = ({
  rawImportData,
  modeConfig,
  onMappingComplete,
}) => {
  const { headers } = rawImportData;
  const systemFields = [...modeConfig.requiredFields, ...modeConfig.optionalFields];

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});

  const autoMapFields = () => {
    const newMapping: Record<string, string> = {};
    const newConfidence: Record<string, number> = {};
    const systemFieldChoices = systemFields.map(f => f.name);

    headers.forEach(header => {
      const bestMatch = fuzzball.extract(String(header), systemFieldChoices, {
        limit: 1,
        cutoff: 60,
      });

      if (bestMatch.length > 0) {
        const matchedSystemField = systemFields.find(f => f.name === bestMatch[0][0]);
        const score = bestMatch[0][1];
        if (matchedSystemField) {
          newMapping[header] = matchedSystemField.key;
          newConfidence[header] = score;
        }
      }
    });
    setMapping(newMapping);
    setConfidence(newConfidence);
  };

  useEffect(() => {
    const invertedMapping: Record<string, string> = {};
    for (const header in mapping) {
      const systemKey = mapping[header];
      if (systemKey) {
        invertedMapping[systemKey] = header;
      }
    }
    onMappingComplete(invertedMapping);
  }, [mapping, onMappingComplete]);

  const handleMappingChange = (excelHeader: string, systemFieldKey: string | null) => {
    setMapping(prev => ({
      ...prev,
      [excelHeader]: systemFieldKey || '',
    }));
    // 用户手动修改后，清除置信度标识
    setConfidence(prev => {
      const newConf = { ...prev };
      delete newConf[excelHeader];
      return newConf;
    });
  };

  const getConfidenceClass = (header: string): string => {
    const score = confidence[header];
    if (score === undefined) return '';
    if (score < 60) return 'confidence-low';
    if (score < 90) return 'confidence-medium';
    return '';
  };

  const columns = [
    {
      title: 'Excel 列名',
      dataIndex: 'header',
      key: 'header',
      width: 250,
      render: (header: string) => <Text strong>{header}</Text>,
    },
    {
      title: '映射到系统字段',
      dataIndex: 'header',
      key: 'mapping',
      width: 350,
      render: (header: string) => (
        <Tooltip title={confidence[header] ? `自动匹配置信度: ${confidence[header].toFixed(0)}%` : ''}>
          <Select
            allowClear
            showSearch
            value={mapping[header] || null}
            style={{ width: '100%' }}
            placeholder="选择一个系统字段进行映射"
            className={getConfidenceClass(header)}
            onChange={(value) => handleMappingChange(header, value)}
            filterOption={(input, option) =>
              (option?.search ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {systemFields.map(field => (
              <Option key={field.key} value={field.key} search={`${field.name} ${field.key}`}>
                {field.name} ({field.key}) {modeConfig.requiredFields.some(f => f.key === field.key) ? <Tag color="red">必填</Tag> : ''}
              </Option>
            ))}
          </Select>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <style>{customStyles}</style>
      <Card 
        title="字段映射"
        extra={<Button onClick={autoMapFields}>尝试自动映射</Button>}
      >
        <Alert
          message="请为您上传的Excel文件中的每一列，选择一个对应的系统字段进行映射。置信度较低的匹配项会以彩色边框突出显示。"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        <Table
          columns={columns}
          dataSource={headers.map(h => ({ header: h }))}
          rowKey="header"
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </>
  );
};

export default FieldMapping; 