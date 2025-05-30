import React from 'react';
import { Button, Space, Typography, Badge, Tag } from 'antd';
import {
  PlayCircleOutlined,
  SaveOutlined,
  FormatPainterOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { QueryEditorHeaderProps } from './types';

const { Title } = Typography;

const EditorHeader = styled.div`
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const QueryEditorHeader: React.FC<QueryEditorHeaderProps> = ({
  sql,
  parameters,
  executing,
  onFormat,
  onExecute,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation('reportManagement');

  return (
    <EditorHeader>
      <div>
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            <CodeOutlined /> {t('customQuery.title')}
          </Title>
          <Badge 
            count={parameters.length} 
            size="small" 
            style={{ backgroundColor: '#52c41a' }}
          >
            <Tag color="blue">{t('customQuery.parameters')}</Tag>
          </Badge>
        </Space>
      </div>
      <Space>
        <Button
          icon={<FormatPainterOutlined />}
          onClick={onFormat}
          disabled={!sql.trim()}
        >
          {t('customQuery.format')}
        </Button>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={onExecute}
          loading={executing}
          disabled={!sql.trim()}
        >
          {t('customQuery.execute')}
        </Button>
        <Button
          icon={<SaveOutlined />}
          onClick={onSave}
          disabled={!sql.trim()}
        >
          {t('customQuery.save')}
        </Button>
        {onCancel && (
          <Button onClick={onCancel}>
            {t('customQuery.cancel')}
          </Button>
        )}
      </Space>
    </EditorHeader>
  );
};

export default QueryEditorHeader; 