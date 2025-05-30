import React from 'react';
import { Space, Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { QueryHelpPanelProps } from './types';

const { Text, Paragraph } = Typography;

const QueryHelpPanel: React.FC<QueryHelpPanelProps> = () => {
  const { t } = useTranslation('reportManagement');

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title="SQL 语法示例" size="small">
        <Paragraph>
          <Text code>SELECT * FROM employees WHERE department = 'IT'</Text>
        </Paragraph>
        <Paragraph>
          <Text code>SELECT name, salary FROM employees WHERE salary &gt; 5000</Text>
        </Paragraph>
      </Card>

      <Card title="参数使用" size="small">
        <Paragraph>
          在SQL中使用参数: <Text code>WHERE department = @department</Text>
        </Paragraph>
        <Paragraph>
          参数格式: <Text code>@参数名</Text>
        </Paragraph>
      </Card>

      <Card title="支持的数据类型" size="small">
        <ul>
          <li><Text strong>字符串:</Text> 文本数据</li>
          <li><Text strong>数字:</Text> 整数或小数</li>
          <li><Text strong>日期:</Text> 日期时间格式</li>
          <li><Text strong>布尔:</Text> true/false值</li>
        </ul>
      </Card>
    </Space>
  );
};

export default QueryHelpPanel; 