import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Tabs,
  Spin,
  Badge
} from 'antd';
import {
  SettingOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import QueryEditorHeader from './QueryEditorHeader';
import SQLEditor from './SQLEditor';
import QueryParametersPanel from './QueryParametersPanel';
import QueryResultsPanel from './QueryResultsPanel';
import QueryHelpPanel from './QueryHelpPanel';
import type {
  CustomQueryEditorProps,
  CustomQuery,
  QueryParameter,
  QueryResult
} from './types';

const { Option } = Select;

// 样式组件
const EditorContainer = styled.div`
  height: calc(100vh - 200px);
  min-height: 600px;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
`;

const EditorContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  gap: 16px;
  min-height: 0;
`;

const LeftPanel = styled(Card)`
  width: 60%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .ant-card-body {
    padding: 0;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
`;

const RightPanel = styled(Card)`
  width: 40%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .ant-card-body {
    padding: 16px;
    flex: 1;
    overflow: auto;
  }
`;

const CustomQueryEditor: React.FC<CustomQueryEditorProps> = ({
  initialQuery,
  dataSources,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation('reportManagement');
  const [form] = Form.useForm();
  const editorRef = useRef<any>(null);
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [sql, setSql] = useState(initialQuery?.sql || '');
  const [parameters, setParameters] = useState<QueryParameter[]>(initialQuery?.parameters || []);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('parameters');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [sqlStats, setSqlStats] = useState({ lines: 1, characters: 0, words: 0 });

  // 初始化表单
  useEffect(() => {
    if (initialQuery) {
      form.setFieldsValue({
        name: initialQuery.name,
        description: initialQuery.description,
        dataSource: initialQuery.dataSource
      });
    }
  }, [initialQuery, form]);

  // 更新SQL统计信息
  useEffect(() => {
    const lines = sql.split('\n').length;
    const characters = sql.length;
    const words = sql.trim() ? sql.trim().split(/\s+/).length : 0;
    setSqlStats({ lines, characters, words });
  }, [sql]);

  // 编辑器挂载处理
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // 监听光标位置变化
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    // 设置SQL语法高亮和自动完成
    monaco.languages.setLanguageConfiguration('sql', {
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });
  };

  // 格式化SQL
  const formatSQL = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  // 执行查询
  const executeQuery = async () => {
    try {
      setExecuting(true);
      setQueryError('');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟查询结果
      const mockResult: QueryResult = {
        columns: ['id', 'name', 'department', 'salary'],
        rows: [
          [1, '张三', 'IT', 8000],
          [2, '李四', 'HR', 6000],
          [3, '王五', 'Finance', 7000]
        ],
        rowCount: 3,
        executionTime: 150
      };
      
      setQueryResult(mockResult);
      setActiveTab('results');
    } catch (error) {
      setQueryError('查询执行失败');
    } finally {
      setExecuting(false);
    }
  };

  // 添加参数
  const addParameter = () => {
    const newParam: QueryParameter = {
      name: '',
      type: 'string',
      defaultValue: '',
      required: false,
      description: ''
    };
    setParameters([...parameters, newParam]);
  };

  // 删除参数
  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  // 更新参数
  const updateParameter = (index: number, field: keyof QueryParameter, value: any) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setParameters(newParameters);
  };

  // 保存查询
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const query: CustomQuery = {
        ...values,
        sql,
        parameters
      };
      
      if (onSave) {
        onSave(query);
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'parameters',
      label: (
        <span>
          <SettingOutlined />
          {t('customQuery.parameters')} ({parameters.length})
        </span>
      ),
      children: (
        <QueryParametersPanel
          parameters={parameters}
          onAdd={addParameter}
          onRemove={removeParameter}
          onUpdate={updateParameter}
        />
      )
    },
    {
      key: 'results',
      label: (
        <span>
          <DatabaseOutlined />
          {t('customQuery.results')}
          {queryResult && (
            <Badge 
              count={queryResult.rowCount} 
              size="small" 
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
      children: (
        <QueryResultsPanel
          queryResult={queryResult}
          queryError={queryError}
          executing={executing}
        />
      )
    },
    {
      key: 'help',
      label: (
        <span>
          <FileTextOutlined />
          {t('customQuery.help')}
        </span>
      ),
      children: <QueryHelpPanel />
    }
  ];

  return (
    <Spin spinning={loading}>
      <EditorContainer>
        {/* 头部工具栏 */}
        <QueryEditorHeader
          sql={sql}
          parameters={parameters}
          executing={executing}
          onFormat={formatSQL}
          onExecute={executeQuery}
          onSave={handleSave}
          onCancel={onCancel}
        />

        {/* 主要内容区域 */}
        <EditorContent>
          {/* 左侧编辑器面板 */}
          <LeftPanel title={t('customQuery.sqlEditor')}>
            {/* 查询基本信息 */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <Form form={form} layout="inline">
                <Form.Item
                  name="name"
                  label={t('customQuery.queryName')}
                  rules={[{ required: true, message: t('customQuery.queryNameRequired') }]}
                >
                  <Input placeholder={t('customQuery.queryNamePlaceholder')} style={{ width: 200 }} />
                </Form.Item>
                <Form.Item
                  name="dataSource"
                  label={t('customQuery.dataSource')}
                  rules={[{ required: true, message: t('customQuery.dataSourceRequired') }]}
                >
                  <Select placeholder={t('customQuery.selectDataSource')} style={{ width: 150 }}>
                    {dataSources.map(ds => (
                      <Option key={ds.value} value={ds.value}>{ds.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="description" label={t('customQuery.description')}>
                  <Input placeholder={t('customQuery.descriptionPlaceholder')} style={{ width: 200 }} />
                </Form.Item>
              </Form>
            </div>

            {/* SQL编辑器 */}
            <SQLEditor
              sql={sql}
              onChange={setSql}
              onMount={handleEditorDidMount}
              cursorPosition={cursorPosition}
              sqlStats={sqlStats}
              executing={executing}
            />
          </LeftPanel>

          {/* 右侧配置和结果面板 */}
          <RightPanel>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={tabItems}
            />
          </RightPanel>
        </EditorContent>
      </EditorContainer>
    </Spin>
  );
};

export default CustomQueryEditor;