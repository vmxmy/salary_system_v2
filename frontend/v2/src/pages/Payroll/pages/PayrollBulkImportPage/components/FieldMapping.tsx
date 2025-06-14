import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Tag, Typography, Alert, Button, Tooltip } from 'antd';
import * as fuzzball from 'fuzzball';
// import * as nodejieba from 'nodejieba';
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

  /**
   * 计算两个中文文本的 Jaccard 相似度
   * @param text1 文本1
   * @param text2 文本2
   * @returns 相似度分数 (0-100)
   */
  const calculateChineseSimilarity = (text1: string, text2: string): number => {
    if (!text1 || !text2) return 0;

    // 使用 fuzzball 的 token_set_ratio 算法，它对中文分词和乱序有很好的效果
    // 它会标记出共同的词元，并基于此计算相似度
    return fuzzball.token_set_ratio(text1, text2, { process: (s: string) => s.toLowerCase() });
  };

  const autoMapFields = () => {
    const newMapping: Record<string, string> = {};
    const newConfidence: Record<string, number> = {};

    headers.forEach(header => {
      let bestMatch: { key: string; score: number } | null = null;
      
      systemFields.forEach(field => {
        const score = calculateChineseSimilarity(header, field.name);
        if (score > (bestMatch?.score ?? 0)) {
          bestMatch = { key: field.key, score: score };
        }
      });
      
      if (bestMatch && bestMatch.score > 50) { // 设置一个匹配阈值
        newMapping[header] = bestMatch.key;
        newConfidence[header] = bestMatch.score;
      }
    });
    setMapping(newMapping);
    setConfidence(newConfidence);
  };

  useEffect(() => {
    onMappingComplete(mapping);
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