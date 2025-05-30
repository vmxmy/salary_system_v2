import React from 'react';
import { Form, Input, Select, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MonacoEditor from '@monaco-editor/react';
import type { SQLEditorProps } from './types';

const { Option } = Select;

const EditorWrapper = styled.div`
  flex: 1;
  min-height: 300px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  
  .monaco-editor {
    width: 100% !important;
    height: 100% !important;
  }
  
  .monaco-editor .view-lines {
    line-height: 1.5 !important;
  }
  
  .monaco-editor-background {
    background: #ffffff !important;
  }
  
  .monaco-editor .margin {
    background: #f8f9fa !important;
  }
`;

const StatusBar = styled.div`
  padding: 8px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
`;

const SQLEditor: React.FC<SQLEditorProps> = ({
  sql,
  onChange,
  onMount,
  cursorPosition,
  sqlStats,
  executing
}) => {
  const { t } = useTranslation('reportManagement');

  return (
    <>
      <EditorWrapper>
        <MonacoEditor
          height="100%"
          width="100%"
          language="sql"
          theme="vs"
          value={sql}
          onChange={(value: string | undefined) => onChange(value || '')}
          onMount={onMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: 'selection',
            smoothScrolling: true,
            contextmenu: true,
            mouseWheelZoom: true,
            quickSuggestions: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always'
          }}
        />
      </EditorWrapper>

      <StatusBar>
        <Space size={16}>
          <span>行 {cursorPosition.line}, 列 {cursorPosition.column}</span>
          <span>{sqlStats.lines} 行</span>
          <span>{sqlStats.characters} 字符</span>
          <span>{sqlStats.words} 单词</span>
        </Space>
        <Space size={16}>
          <span>SQL</span>
          {executing && (
            <span style={{ color: '#1890ff' }}>
              <ClockCircleOutlined /> 执行中...
            </span>
          )}
        </Space>
      </StatusBar>
    </>
  );
};

export default SQLEditor; 