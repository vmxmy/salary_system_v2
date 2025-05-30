import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Button, Space, Spin, App, Tabs, Switch, Modal, Layout, Form, Input, Select, List, Typography } from 'antd';
import { SaveOutlined, EyeOutlined, ExportOutlined, LinkOutlined, SettingOutlined, DatabaseOutlined, ExclamationCircleOutlined, FolderOpenOutlined, CopyOutlined } from '@ant-design/icons';
import { DndContext, type DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragOverEvent, type Active } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import DataSourcePanel from './DataSourcePanel';
import DataSourceJoinPanel from './DataSourceJoinPanel';
import FieldMappingPanel from './FieldMappingPanel';
import ReportPreview from './ReportPreview';
import FieldDragOverlay from './FieldDragOverlay';
import type { DataSource, FieldItem, ReportField, ReportConfig, DataSourceJoin, ReportTemplateListItem, ReportTemplate, ReportTemplateCreatePayload, ReportDesignerConfig, ReportTemplateUpdatePayload } from './types';
import { reportDesignerService } from './services';

const DesignerContainer = styled.div`
  height: calc(100vh - 120px);
  min-height: 600px;
  background: #f5f7fa;
  padding: 16px;
  overflow: hidden;
`;

const DesignerContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LeftPanel = styled(Card)`
  height: auto;
  flex-shrink: 0;
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
  
  .ant-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    .ant-tabs-content-holder {
      flex: 1;
      overflow: hidden;
      min-height: 250px;
      max-height: 350px;
      
      .ant-tabs-tabpane {
        height: 100%;
        overflow-y: auto;
        padding: 0;
      }
    }
  }
`;

const RightPanel = styled(Card)`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .ant-card-body {
    padding: 0;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
`;

const HeaderActions = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const { Content } = Layout;
const { Title } = Typography;

interface ReportDesignerProps {
  templateId?: number;
  onSave?: (config: ReportConfig) => void;
  onCancel?: () => void;
}

const ReportDesigner: React.FC<ReportDesignerProps> = ({
  templateId,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation('reportManagement');
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [reportFields, setReportFields] = useState<ReportField[]>([]);
  const [draggedField, setDraggedField] = useState<FieldItem | null>(null);
  
  // 新增：多数据源支持状态
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [dataSourceJoins, setDataSourceJoins] = useState<DataSourceJoin[]>([]);
  const [activeTab, setActiveTab] = useState('datasource');
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    title: '',
    description: '',
    dataSource: '',
    fields: [],
    // 新增多数据源配置
    dataSources: [],
    joins: []
  });

  const [activeDragItem, setActiveDragItem] = useState<FieldItem | ReportField | null>(null);
  const [activeDragType, setActiveDragType] = useState<'field' | 'column' | null>(null);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // New state for template loading and saving
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [isLoadModalVisible, setIsLoadModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [saveModalMode, setSaveModalMode] = useState<'save' | 'saveAs'>('saveAs');
  const [templatesForLoading, setTemplatesForLoading] = useState<ReportTemplateListItem[]>([]);
  const [saveFormInitialValues, setSaveFormInitialValues] = useState<{
    name: string;
    description?: string;
    is_public?: boolean;
    category?: string;
  }>({ name: '' });
  
  const [saveForm] = Form.useForm();

  // 同步reportConfig中的joins到dataSourceJoins状态
  useEffect(() => {
    if (reportConfig.joins && reportConfig.joins.length > 0 && dataSourceJoins.length === 0) {
      console.log('📌 Syncing joins from reportConfig to dataSourceJoins:', reportConfig.joins);
      setDataSourceJoins(reportConfig.joins);
    }
  }, [reportConfig.joins]);

  // 加载数据源
  useEffect(() => {
    loadDataSources();
  }, []);

  // 加载模板数据（如果是编辑模式）
  useEffect(() => {
    if (templateId && !initialLoadComplete) {
      (async () => {
        try {
          setLoading(true);
          const template = await reportDesignerService.getReportTemplate(templateId);
          const configFromTemplate = template.template_config;
          const newReportConfigState: ReportConfig = {
            id: template.id,
            title: configFromTemplate.reportTitle || template.name,
            description: configFromTemplate.reportDescription || template.description,
            dataSource: configFromTemplate.mainDataSourceId || (configFromTemplate.selectedDataSourceIds.length > 0 ? configFromTemplate.selectedDataSourceIds[0] : ''),
            dataSources: configFromTemplate.selectedDataSourceIds,
            joins: configFromTemplate.joins,
            fields: configFromTemplate.fields,
            multiSelectMode: configFromTemplate.multiSelectMode,
          };
          resetDesignerState(newReportConfigState);
          setCurrentTemplateId(template.id);
          setInitialLoadComplete(true);
          message.success(`模板 '${template.name}' 已加载`);
        } catch (error) {
          message.error('自动加载初始模板失败');
          setInitialLoadComplete(true);
        }
        setLoading(false);
      })();
    } else if (!templateId) {
      setInitialLoadComplete(true);
    }
  }, [templateId, initialLoadComplete, message]);

  // 调试：跟踪JOIN状态变化
  useEffect(() => {
    console.log('🔍 dataSourceJoins state changed:', dataSourceJoins);
    console.log('📊 Current state - multiSelectMode:', multiSelectMode, 'dataSources:', selectedDataSources);
  }, [dataSourceJoins, multiSelectMode, selectedDataSources]);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const sources = await reportDesignerService.getDataSources();
      setDataSources(sources);
    } catch (error) {
      message.error(t('loadDataSourcesError'));
    } finally {
      setLoading(false);
    }
  };

  // 处理拖拽开始
  const handleDragStart = (event: any) => {
    const { active } = event;
    const field = active.data.current?.field;
    if (field) {
      setDraggedField(field);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDraggedField(null);
      return;
    }

    const field = active.data.current?.field as FieldItem;
    
    if (over.id === 'report-preview') {
      // 添加新字段到报表
      const newField: ReportField = {
        id: `field_${Date.now()}`,
        field_name: field.field_name,
        field_alias: field.field_alias || field.field_name,
        data_source: multiSelectMode ? (field.source_data_source_id || selectedDataSource) : selectedDataSource,
        field_type: field.field_type,
        display_order: reportFields.length,
        is_visible: true,
        is_sortable: true,
        is_filterable: true,
        width: 120,
        formatting_config: {},
        qualified_field_name: field.qualified_name,
        source_data_source_id: field.source_data_source_id,
      };
      
      setReportFields([...reportFields, newField]);
      message.success(t('fieldAdded'));
    }
    
    setDraggedField(null);
  };

  // 处理字段添加（点击模式）
  const handleFieldAdd = (field: FieldItem) => {
    // 检查字段是否已添加（使用完全限定名）
    const fieldKey = field.qualified_name || field.field_name;
    const exists = reportFields.some(f => 
      (f.qualified_field_name || f.field_name) === fieldKey
    );
    
    if (exists) {
      message.warning(t('fieldAlreadyAdded'));
      return;
    }

    // 添加新字段到报表
    const newField: ReportField = {
      id: `field_${Date.now()}`,
      field_name: field.field_name,
      field_alias: field.field_alias || field.field_name,
      data_source: multiSelectMode ? (field.source_data_source_id || selectedDataSource) : selectedDataSource,
      field_type: field.field_type,
      display_order: reportFields.length,
      is_visible: true,
      is_sortable: true,
      is_filterable: true,
      width: 120,
      formatting_config: {},
      // 新增多数据源字段
      qualified_field_name: field.qualified_name,
      source_data_source_id: field.source_data_source_id,
      is_related_display: false
    };
    
    setReportFields([...reportFields, newField]);
    message.success(t('fieldAdded'));
  };

  // 获取已添加的字段名列表（支持多数据源）
  const addedFieldNames = reportFields.map(f => f.qualified_field_name || f.field_name);

  // 处理字段更新
  const handleFieldUpdate = (updatedField: ReportField) => {
    setReportFields(fields =>
      fields.map(field =>
        field.id === updatedField.id ? updatedField : field
      )
    );
  };

  // 处理字段删除
  const handleFieldDelete = (fieldId: string) => {
    setReportFields(fields => fields.filter(field => field.id !== fieldId));
    message.success(t('fieldDeleted'));
  };

  // 处理字段排序
  const handleFieldReorder = (newFields: ReportField[]) => {
    setReportFields(newFields);
  };

  // 处理预览
  const handlePreview = () => {
    // 实现预览逻辑
    message.info(t('previewMode'));
  };

  // 处理导出
  const handleExport = () => {
    // 实现导出逻辑
    message.info(t('exportFunction'));
  };

  // 处理多数据源模式切换
  const handleMultiSelectModeChange = (enabled: boolean) => {
    // 如果有已选择的字段，询问用户是否保留
    if (reportFields.length > 0) {
      Modal.confirm({
        title: enabled ? '切换到多数据源模式' : '切换到单数据源模式',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>检测到您已添加了 {reportFields.length} 个字段。</p>
            <p>切换模式后，您希望：</p>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li><strong>保留字段</strong>：尝试将现有字段适配到新模式</li>
              <li><strong>重置字段</strong>：清空所有字段，重新开始配置</li>
            </ul>
          </div>
        ),
        okText: '保留字段',
        cancelText: '重置字段',
        onOk: () => {
          // 保留字段，切换模式
          switchModeWithFieldPreservation(enabled);
        },
        onCancel: () => {
          // 重置字段，切换模式
          switchModeWithFieldReset(enabled);
        }
      });
    } else {
      // 没有字段，直接切换
      switchModeWithFieldReset(enabled);
    }
  };

  // 切换模式并保留字段
  const switchModeWithFieldPreservation = (enabled: boolean) => {
    setMultiSelectMode(enabled);
    
    if (enabled) {
      // 切换到多选模式时，将当前选中的数据源加入多选列表
      if (selectedDataSource) {
        setSelectedDataSources([selectedDataSource]);
        
        // 尝试适配现有字段到多数据源模式
        const adaptedFields = reportFields.map(field => ({
          ...field,
          source_data_source_id: field.source_data_source_id || selectedDataSource,
          qualified_field_name: field.qualified_field_name || `${selectedDataSource}.${field.field_name}`
        }));
        
        setReportFields(adaptedFields);
        message.success(`已切换到多数据源模式，保留了 ${adaptedFields.length} 个字段`);
      }
      setActiveTab('datasource');
    } else {
      // 切换到单选模式时，过滤出主数据源的字段
      const mainDataSource = selectedDataSources.length > 0 ? selectedDataSources[0] : '';
      const filteredFields = reportFields.filter(field => 
        field.source_data_source_id === mainDataSource || 
        field.data_source === mainDataSource
      );
      
      setReportFields(filteredFields);
      setSelectedDataSources([]);
      setDataSourceJoins([]);
      
      if (selectedDataSources.length > 0) {
        setSelectedDataSource(selectedDataSources[0]);
      }
      
      if (filteredFields.length !== reportFields.length) {
        message.warning(`已切换到单数据源模式，保留了 ${filteredFields.length} 个字段（${reportFields.length - filteredFields.length} 个字段因不属于主数据源而被移除）`);
      } else {
        message.success(`已切换到单数据源模式，保留了 ${filteredFields.length} 个字段`);
      }
    }
  };

  // 切换模式并重置字段
  const switchModeWithFieldReset = (enabled: boolean) => {
    setMultiSelectMode(enabled);
    setReportFields([]); // 清空所有字段
    
    if (enabled) {
      // 切换到多选模式时，将当前选中的数据源加入多选列表
      if (selectedDataSource) {
        setSelectedDataSources([selectedDataSource]);
      }
      setActiveTab('datasource');
      message.success('已切换到多数据源模式，所有字段已重置');
    } else {
      // 切换到单选模式时，清空多选状态
      setSelectedDataSources([]);
      setDataSourceJoins([]); // 只在切换到单表模式时清空JOIN
      if (selectedDataSources.length > 0) {
        setSelectedDataSource(selectedDataSources[0]);
      }
      message.success('已切换到单数据源模式，所有字段已重置');
    }
  };

  // 处理多数据源选择变化
  const handleDataSourcesChange = (dataSourceIds: string[]) => {
    const previousDataSources = selectedDataSources;
    
    // 检查是否有字段需要处理
    if (reportFields.length > 0 && dataSourceIds.length !== previousDataSources.length) {
      // 如果是减少数据源
      if (dataSourceIds.length < previousDataSources.length) {
        const removedDataSources = previousDataSources.filter(id => !dataSourceIds.includes(id));
        const affectedFields = reportFields.filter(field => 
          removedDataSources.includes(field.source_data_source_id || field.data_source)
        );
        
        if (affectedFields.length > 0) {
          Modal.confirm({
            title: '数据源变更确认',
            icon: <ExclamationCircleOutlined />,
            content: (
              <div>
                <p>移除数据源将影响 {affectedFields.length} 个已添加的字段：</p>
                <ul style={{ maxHeight: '120px', overflow: 'auto', margin: '8px 0', paddingLeft: '20px' }}>
                  {affectedFields.map(field => (
                    <li key={field.id}>{field.field_alias || field.field_name}</li>
                  ))}
                </ul>
                <p>是否继续移除这些数据源？</p>
              </div>
            ),
            okText: '确认移除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => {
              // 移除受影响的字段
              const remainingFields = reportFields.filter(field => 
                !removedDataSources.includes(field.source_data_source_id || field.data_source)
              );
              setReportFields(remainingFields);
              setSelectedDataSources(dataSourceIds);
              updateReportConfig(dataSourceIds, dataSourceJoins); // 保持现有的JOIN配置
              message.warning(`已移除 ${affectedFields.length} 个字段`);
            }
          });
          return; // 等待用户确认
        }
      }
    }
    
    // 直接更新数据源
    setSelectedDataSources(dataSourceIds);
    updateReportConfig(dataSourceIds, dataSourceJoins); // 保持现有的JOIN配置

    // 如果只选择了一个数据源，同步到单选状态
    if (dataSourceIds.length === 1) {
      setSelectedDataSource(dataSourceIds[0]);
    }
  };

  // 更新报表配置的辅助函数
  const updateReportConfig = (dataSourceIds: string[], joins: DataSourceJoin[]) => {
    setReportConfig(prev => ({
      ...prev,
      dataSources: dataSourceIds,
      dataSource: dataSourceIds[0] || '', // 主数据源为第一个
      joins
    }));
  };

  // 处理数据源关联配置变化
  const handleJoinsChange = (joins: DataSourceJoin[]) => {
    console.log('🔗 handleJoinsChange called with joins:', joins);
    setDataSourceJoins(joins);
    updateReportConfig(selectedDataSources, joins);
    console.log('✅ dataSourceJoins state updated:', joins);
  };

  // 处理字段映射配置变化
  const handleFieldsChange = (fields: ReportField[]) => {
    setReportFields(fields);
    setReportConfig(prev => ({
      ...prev,
      fields
    }));
  };

  // Function to reset designer to initial state (e.g., after loading a template or creating new)
  const resetDesignerState = (newConfig?: Partial<ReportConfig>) => {
    setReportConfig(prevConfig => ({
      ...prevConfig, // keep pagination or other general settings
      id: newConfig?.id,
      title: newConfig?.title || '未命名报表',
      description: newConfig?.description || '',
      dataSource: newConfig?.dataSource || '',
      fields: newConfig?.fields || [],
      dataSources: newConfig?.dataSources || [],
      joins: newConfig?.joins || [],
      multiSelectMode: newConfig?.multiSelectMode || false,
      filters: newConfig?.filters || [],
      sorting: newConfig?.sorting || [],
      // grouping and pagination can be reset or kept based on requirements
    }));

    // Explicitly set other relevant states based on the loaded config
    setMultiSelectMode(newConfig?.multiSelectMode || false);
    setSelectedDataSources(newConfig?.dataSources || []);
    setSelectedDataSource(newConfig?.dataSource || ( (newConfig?.dataSources && newConfig.dataSources.length > 0) ? newConfig.dataSources[0] : '' ) );
    setDataSourceJoins(newConfig?.joins || []);
    setReportFields(newConfig?.fields || []); // This drives the addedFieldNames and preview

    // If switching to multi-select mode and there are selected data sources, ensure the correct tab is active.
    // Or if there are joins, switch to the joins tab.
    if ((newConfig?.multiSelectMode && newConfig?.dataSources && newConfig.dataSources.length > 1) || 
        (newConfig?.joins && newConfig.joins.length > 0)) {
      setActiveTab('joins'); 
    } else {
      setActiveTab('datasource');
    }
  };

  // --- Handlers for Load Modal ---
  const handleOpenLoadModal = async () => {
    try {
      const templates = await reportDesignerService.listReportTemplates();
      setTemplatesForLoading(templates);
      setIsLoadModalVisible(true);
    } catch (error) {
      message.error('加载报表模板列表失败');
    }
  };

  const handleLoadTemplate = async (templateId: number) => {
    try {
      const template = await reportDesignerService.getReportTemplate(templateId);
      const configFromTemplate = template.template_config;

      // Adapt ReportDesignerConfig to ReportConfig for the main state
      const newReportConfigState: ReportConfig = {
        id: template.id, // Store template ID
        title: configFromTemplate.reportTitle || template.name,
        description: configFromTemplate.reportDescription || template.description,
        dataSource: configFromTemplate.mainDataSourceId || (configFromTemplate.selectedDataSourceIds.length > 0 ? configFromTemplate.selectedDataSourceIds[0] : ''),
        dataSources: configFromTemplate.selectedDataSourceIds,
        joins: configFromTemplate.joins,
        fields: configFromTemplate.fields,
        multiSelectMode: configFromTemplate.multiSelectMode,
        // filters, sorting, grouping, pagination can be loaded if stored in template_config
        // For now, they are reset or kept from previous state based on resetDesignerState logic
      };
      
      resetDesignerState(newReportConfigState); // Reset or update designer with loaded config
      setCurrentTemplateId(template.id);
      setIsLoadModalVisible(false);
      message.success(`报表 '${template.name}' 加载成功`);
    } catch (error) {
      message.error('加载报表模板失败');
    }
  };

  // --- Handlers for Save Modal ---
  const handleOpenSaveModal = (mode: 'save' | 'saveAs') => {
    setSaveModalMode(mode);
    if (mode === 'save' && currentTemplateId && reportConfig.id === currentTemplateId) {
      // If saving an existing, loaded template, prefill form
      const currentLoadedTemplate = templatesForLoading.find(t => t.id === currentTemplateId);
      setSaveFormInitialValues({
        name: reportConfig.title, // or currentLoadedTemplate?.name
        description: reportConfig.description, // or currentLoadedTemplate?.description
        is_public: currentLoadedTemplate?.is_public || false,
        category: currentLoadedTemplate?.category || undefined,
      });
    } else {
      // For 'Save As' or new template, use current report title or default
      setSaveFormInitialValues({
        name: reportConfig.title || '未命名报表',
        description: reportConfig.description || '',
        is_public: false,
      });
    }
    saveForm.resetFields(); // Reset form fields to apply initialValues
    setIsSaveModalVisible(true);
  };

  const handleSaveTemplate = async (values: {
    name: string;
    description?: string;
    category?: string;
    is_public?: boolean;
  }) => {
    const designerConfig: ReportDesignerConfig = {
      reportTitle: reportConfig.title, // Use current title from designer
      reportDescription: reportConfig.description, // Use current description
      selectedDataSourceIds: reportConfig.dataSources || [],
      mainDataSourceId: reportConfig.dataSource, // This should be the first one in selectedDataSourceIds or explicitly set
      joins: dataSourceJoins, // Use the state for joins
      fields: reportConfig.fields,
      multiSelectMode: reportConfig.multiSelectMode || false,
      version: 1,
    };

    const payload: ReportTemplateCreatePayload | ReportTemplateUpdatePayload = {
      name: values.name,
      title: values.name, // Typically name and title are the same for the template resource
      description: values.description,
      category: values.category,
      is_public: values.is_public,
      template_config: designerConfig,
      data_source_id: designerConfig.mainDataSourceId ? parseInt(designerConfig.mainDataSourceId, 10) : undefined,
      is_active: true,
    };

    try {
      let savedTemplate: ReportTemplate;
      if (saveModalMode === 'saveAs' || !currentTemplateId) {
        savedTemplate = await reportDesignerService.createReportTemplate(payload as ReportTemplateCreatePayload);
        message.success(`报表 '${savedTemplate.name}' 已另存为!`);
      } else {
        savedTemplate = await reportDesignerService.updateReportTemplate(currentTemplateId, payload as ReportTemplateUpdatePayload);
        message.success(`报表 '${savedTemplate.name}' 更新成功!`);
      }
      setCurrentTemplateId(savedTemplate.id);
      // Update reportConfig.id and title to reflect saved state
      setReportConfig(prev => ({ ...prev, id: savedTemplate.id, title: savedTemplate.name }));
      setIsSaveModalVisible(false);
    } catch (error) {
      message.error('保存报表模板失败');
    }
  };

  const HeaderContent = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>报表设计器</Title>
      <Space>
        <Button icon={<FolderOpenOutlined />} onClick={handleOpenLoadModal}>加载</Button>
        <Button icon={<SaveOutlined />} onClick={() => handleOpenSaveModal('save')} disabled={!reportConfig.dataSource && reportConfig.fields.length === 0}>保存</Button>
        <Button icon={<CopyOutlined />} onClick={() => handleOpenSaveModal('saveAs')} disabled={!reportConfig.dataSource && reportConfig.fields.length === 0}>另存为</Button>
        {/* Add other buttons like New, Export, etc. if needed */}
      </Space>
    </div>
  );

  return (
    <Spin spinning={loading}>
      <DesignerContainer>
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <DesignerContent>
            {/* 左侧数据源面板 */}
            <LeftPanel>
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0 }}>{t('dataSource')}</h4>
                  <Space>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {t('multiDataSource')}
                    </span>
                    <Switch
                      size="small"
                      checked={multiSelectMode}
                      onChange={handleMultiSelectModeChange}
                    />
                  </Space>
                </Space>
              </div>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="small"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                items={[
                  {
                    key: 'datasource',
                    label: (
                      <Space>
                        <DatabaseOutlined />
                        {t('dataSourceSelection')}
                      </Space>
                    ),
                    children: (
                      <DataSourcePanel
                        dataSources={dataSources}
                        selectedDataSource={selectedDataSource}
                        onDataSourceSelect={setSelectedDataSource}
                        addedFields={addedFieldNames}
                        onFieldAdd={handleFieldAdd}
                        // 多数据源支持
                        selectedDataSources={selectedDataSources}
                        onDataSourcesChange={handleDataSourcesChange}
                        multiSelectMode={multiSelectMode}
                      />
                    )
                  },
                  ...(multiSelectMode && selectedDataSources.length > 1 ? [
                    {
                      key: 'joins',
                      label: (
                        <Space>
                          <LinkOutlined />
                          {t('dataSourceJoins')}
                          {dataSourceJoins.length > 0 && (
                            <span style={{ 
                              background: '#52c41a', 
                              color: 'white', 
                              borderRadius: '50%', 
                              width: '16px', 
                              height: '16px', 
                              fontSize: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {dataSourceJoins.length}
                            </span>
                          )}
                        </Space>
                      ),
                      children: (
                        <DataSourceJoinPanel
                          dataSources={dataSources}
                          selectedDataSources={selectedDataSources}
                          joins={dataSourceJoins}
                          onJoinsChange={handleJoinsChange}
                        />
                      )
                    }
                  ] : []),
                  ...(reportFields.length > 0 ? [
                    {
                      key: 'mapping',
                      label: (
                        <Space>
                          <SettingOutlined />
                          {t('fieldMapping')}
                          {reportFields.filter(f => f.is_related_display).length > 0 && (
                            <span style={{ 
                              background: '#1890ff', 
                              color: 'white', 
                              borderRadius: '50%', 
                              width: '16px', 
                              height: '16px', 
                              fontSize: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {reportFields.filter(f => f.is_related_display).length}
                            </span>
                          )}
                        </Space>
                      ),
                      children: (
                        <FieldMappingPanel
                          dataSources={dataSources}
                          selectedFields={reportFields}
                          joins={dataSourceJoins}
                          onFieldsChange={handleFieldsChange}
                          multiSelectMode={multiSelectMode}
                          selectedDataSources={selectedDataSources}
                        />
                      )
                    }
                  ] : [])
                ]}
              />
            </LeftPanel>

            {/* 右侧报表预览面板 */}
            <RightPanel>
              <HeaderActions>
                {HeaderContent}
              </HeaderActions>
              
              <ReportPreview
                fields={reportFields}
                dataSource={multiSelectMode ? selectedDataSources[0] || '' : selectedDataSource}
                onFieldUpdate={handleFieldUpdate}
                onFieldDelete={handleFieldDelete}
                onFieldReorder={handleFieldReorder}
                // 新增多数据源支持
                dataSources={multiSelectMode ? selectedDataSources : [selectedDataSource].filter(Boolean)}
                joins={dataSourceJoins}
                multiSelectMode={multiSelectMode}
              />
            </RightPanel>
          </DesignerContent>

          <DragOverlay>
            {draggedField && <FieldDragOverlay field={draggedField} />}
          </DragOverlay>
        </DndContext>
      </DesignerContainer>

      {/* Load Template Modal */}
      <Modal
        title="加载报表模板"
        open={isLoadModalVisible}
        onCancel={() => setIsLoadModalVisible(false)}
        footer={null} // Or custom footer if needed
        width={600}
      >
        <List
          loading={templatesForLoading.length === 0} // Simple loading state
          itemLayout="horizontal"
          dataSource={templatesForLoading}
          renderItem={(item) => (
            <List.Item
              actions={[<Button type="primary" onClick={() => handleLoadTemplate(item.id)}>加载</Button>]}
            >
              <List.Item.Meta
                title={<a onClick={() => handleLoadTemplate(item.id)}>{item.name}</a>}
                description={`分类: ${item.category || '无'} | 更新于: ${new Date(item.updated_at).toLocaleString()}`}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Save Template Modal */}
      <Modal
        title={saveModalMode === 'save' ? '保存报表模板' : '报表另存为'}
        open={isSaveModalVisible}
        onCancel={() => setIsSaveModalVisible(false)}
        onOk={() => saveForm.submit()} // Trigger form submission
        okText="保存"
        cancelText="取消"
        destroyOnClose // Destroy form state when modal is closed
      >
        <Form
          form={saveForm}
          layout="vertical"
          onFinish={handleSaveTemplate}
          initialValues={saveFormInitialValues}
        >
          <Form.Item
            name="name"
            label="报表名称"
            rules={[{ required: true, message: '请输入报表名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
          >
            <Input /> 
          </Form.Item>
          <Form.Item
            name="is_public"
            label="是否公开"
          >
            <Select placeholder="请选择是否公开" options={[{label: '是', value: true}, {label: '否', value: false}]} />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default ReportDesigner; 