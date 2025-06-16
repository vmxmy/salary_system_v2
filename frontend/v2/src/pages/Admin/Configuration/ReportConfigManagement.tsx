import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Typography, Row, Col, Input, Form, Select, message, Table, Button, Space, Modal, Tooltip, Popconfirm, Switch, Descriptions, Spin, Tag, Divider, InputNumber, Alert, Collapse, List } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, DatabaseOutlined, TableOutlined, AppstoreOutlined, ExportOutlined, EyeOutlined, InfoCircleOutlined, SettingOutlined, HolderOutlined, CloseOutlined, FileAddOutlined, SelectOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pinyin from 'pinyin';
import { reportConfigApi } from '../../../api/reportConfigApi';
import styles from '../../../styles/reportConfig.module.css';
import type { ReportTypeDefinition, DataSource, DataSourceField, FilterCondition, FilterGroup, FilterOperator, ReportFilterConfig } from '../../../types/reportConfig';
import type { ColumnsType } from 'antd/es/table';
import DataSources from '../DataSources';
import ReportPresetManagement from './ReportPresetManagement';
import BatchReportsManagement from './BatchReportsManagement';

const { Title } = Typography;
const { Search } = Input;
const { TextArea } = Input;
const { Panel } = Collapse;

// 可排序的字段项组件
interface SortableFieldItemProps {
  field: DataSourceField;
  onRemove: (fieldId: number) => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({ field, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.sortableFieldItem}
      {...attributes}
    >
      <div className={styles.sortableFieldItem}>
        <HolderOutlined 
          {...listeners}
          className={`${styles.marginRight8} ${styles.colorTextDisabled}`}
          style={{ cursor: 'grab' }}
        />
        <div className={styles.sortableFieldItemContent}>
          <div className={styles.sortableFieldItemTitle}>
            {field.display_name_zh || field.field_alias || field.field_name}
          </div>
          <div className={styles.sortableFieldItemSubtitle}>
            {field.field_name} ({field.data_type})
          </div>
        </div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={() => onRemove(field.id)}
          className={`${styles.linkButton} ${styles.colorDanger}`}
        />
      </div>
    </div>
  );
};

// 筛选操作符选项
const FILTER_OPERATORS: { value: FilterOperator; label: string; valueType: 'single' | 'multiple' | 'range' | 'none' }[] = [
    { value: 'equals', label: '等于', valueType: 'single' },
    { value: 'not_equals', label: '不等于', valueType: 'single' },
    { value: 'contains', label: '包含', valueType: 'single' },
    { value: 'not_contains', label: '不包含', valueType: 'single' },
    { value: 'starts_with', label: '开始于', valueType: 'single' },
    { value: 'ends_with', label: '结束于', valueType: 'single' },
    { value: 'greater_than', label: '大于', valueType: 'single' },
    { value: 'greater_than_or_equal', label: '大于等于', valueType: 'single' },
    { value: 'less_than', label: '小于', valueType: 'single' },
    { value: 'less_than_or_equal', label: '小于等于', valueType: 'single' },
    { value: 'between', label: '介于', valueType: 'range' },
    { value: 'not_between', label: '不介于', valueType: 'range' },
    { value: 'in', label: '在列表中', valueType: 'multiple' },
    { value: 'not_in', label: '不在列表中', valueType: 'multiple' },
    { value: 'is_null', label: '为空', valueType: 'none' },
    { value: 'is_not_null', label: '不为空', valueType: 'none' },
    { value: 'date_range', label: '日期范围', valueType: 'range' },
    { value: 'date_equals', label: '日期等于', valueType: 'single' },
    { value: 'date_before', label: '日期早于', valueType: 'single' },
    { value: 'date_after', label: '日期晚于', valueType: 'single' },
];

const ReportTypes: React.FC = () => {
    const { t } = useTranslation('reportManagement');
    const [form] = Form.useForm();
    const [reportTypes, setReportTypes] = useState<ReportTypeDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingType, setEditingType] = useState<ReportTypeDefinition | null>(null);
    const [searchText, setSearchText] = useState('');
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [availableFields, setAvailableFields] = useState<DataSourceField[]>([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewRecord, setPreviewRecord] = useState<ReportTypeDefinition | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewActiveTab, setPreviewActiveTab] = useState('basic');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [previewDataLoading, setPreviewDataLoading] = useState(false);
    const [previewDataTotal, setPreviewDataTotal] = useState(0);
    const [previewFiltersApplied, setPreviewFiltersApplied] = useState(true);
    const [activeTab, setActiveTab] = useState('basic');
    const [formLoading, setFormLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
    const [filterConfig, setFilterConfig] = useState<ReportFilterConfig>({
        enabled: false,
        default_filters: {
            logic_operator: 'AND',
            conditions: []
        },
        user_configurable_filters: []
    });
    const [selectedFields, setSelectedFields] = useState<DataSourceField[]>([]);
    const [fieldSelectorMode, setFieldSelectorMode] = useState<'select' | 'sort'>('select');
    const [customFieldModalVisible, setCustomFieldModalVisible] = useState(false);
    const [customFieldForm] = Form.useForm();
    const [scanLoading, setScanLoading] = useState(false);

    // 拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadReportTypes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await reportConfigApi.getReportTypes({ search: searchText });
            setReportTypes(data);
        } catch (error) { message.error(t('report_type.load_error')); }
        setLoading(false);
    }, [searchText, t]);

    // 🚀 性能优化：获取数据源列表，添加缓存
    useEffect(() => {
        const fetchDataSources = async () => {
            try {
                setLoading(true);
                // 关闭动态扫描以提升性能
                const sources = await reportConfigApi.getDataSources({ 
                    include_dynamic: false,
                    limit: 100  // 限制返回数量
                });
                setDataSources(sources);
            } catch (error) {
                console.error('获取数据源失败:', error);
                message.error('获取数据源失败');
            } finally {
                setLoading(false);
            }
        };

        fetchDataSources();
    }, []);

    const handleScanDynamicSources = async () => {
        setScanLoading(true);
        try {
            const dynamicSources = await reportConfigApi.scanDynamicDataSources({
                schema_name: 'reports',
                view_pattern: 'v_monthly_%'
            });
            
            message.success(`扫描到 ${dynamicSources.length} 个月度报表视图`);
            
            // 重新获取数据源列表以包含扫描到的动态数据源
            const sources = await reportConfigApi.getDataSources({ 
                include_dynamic: true,  // 这里开启动态扫描以显示新的结果
                limit: 100
            });
            setDataSources(sources);
        } catch (error: any) {
            message.error(`扫描失败: ${error.response?.data?.detail || error.message}`);
        } finally {
            setScanLoading(false);
        }
    };

    // 💡 中文转拼音并生成编码
    const generateCodeFromName = (name: string): string => {
        if (!name || !name.trim()) return '';
        
        // 过滤掉非中文字符，只处理中文
        const chineseText = name.replace(/[^\u4e00-\u9fa5]/g, '');
        if (!chineseText) return '';
        
        try {
            // 使用 pinyin 库转换为拼音，设置为小写并去掉音调
            const pinyinArray = pinyin(chineseText, {
                style: pinyin.STYLE_NORMAL, // 不带音调
                heteronym: false, // 不显示多音字的所有读音
                segment: true // 启用分词
            });
            
            // 将拼音数组转换为字符串，用下划线连接
            const pinyinStr = pinyinArray
                .map(item => Array.isArray(item) ? item[0] : item) // 取第一个读音
                .join('_')
                .toLowerCase()
                .replace(/[^a-z_]/g, ''); // 只保留字母和下划线
            
            return pinyinStr;
        } catch (error) {
            console.error('拼音转换失败:', error);
            return '';
        }
    };

    // 处理报表名称变化，自动填充编码
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        
        // 只在新建模式下自动填充编码（编辑模式不自动覆盖）
        if (!editingType) {
            const currentCode = form.getFieldValue('code');
            
            // 如果编码字段为空或者是之前自动生成的，则自动更新
            if (!currentCode || currentCode.length === 0) {
                const generatedCode = generateCodeFromName(name);
                if (generatedCode) {
                    form.setFieldValue('code', generatedCode);
                }
            }
        }
    };

    useEffect(() => { loadReportTypes(); }, [loadReportTypes]);

    const handleDataSourceChange = async (dataSourceId: number) => {
        // 🔧 重要修复：确保表单中的data_source_id字段被正确设置
        form.setFieldsValue({ data_source_id: dataSourceId });
        
        if (dataSourceId) {
            try {
                const fields = await reportConfigApi.getDataSourceFields(dataSourceId);
                setAvailableFields(fields);
                
                // 验证现有筛选条件的字段是否仍然有效
                const validFieldNames = fields.map(f => f.field_name);
                const updatedFilterConditions = filterConditions.map(condition => {
                    if (condition.field_name && !validFieldNames.includes(condition.field_name)) {
                        // 字段不再有效，清空字段选择
                        return {
                            ...condition,
                            field_name: '',
                            field_display_name: '',
                            operator: 'equals' as FilterOperator,
                            value: ''
                        };
                    }
                    return condition;
                });
                
                // 如果有筛选条件被修改，更新状态
                if (JSON.stringify(updatedFilterConditions) !== JSON.stringify(filterConditions)) {
                    setFilterConditions(updatedFilterConditions);
                    message.warning('数据源变更后，部分筛选条件的字段已失效，请重新配置');
                }
                
            } catch (error) { 
                message.error(t('report_type.load_fields_error')); 
                setAvailableFields([]);
            }
        } else { 
            setAvailableFields([]);
            // 清空字段选择时，也清空筛选条件
            if (filterConditions.length > 0) {
                setFilterConditions([]);
                setFilterConfig(prev => ({
                    ...prev,
                    default_filters: { logic_operator: 'AND', conditions: [] }
                }));
            }
        }
        
        // 只在新建时清空字段选择，编辑时保持原有选择
        if (!editingType) {
            form.setFieldsValue({ fields: [] });
        }
    };
    
    const handleSave = async () => {
        try {
            setFormLoading(true);
            const values = await form.validateFields();
            
            // 处理字段数据
            const payload = {
                ...values,
                fields: Array.isArray(values.fields) ? values.fields.join(',') : values.fields,
                // 处理权限和角色
                required_permissions: values.required_permissions ? 
                    values.required_permissions.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
                allowed_roles: values.allowed_roles ? 
                    values.allowed_roles.split(',').map((r: string) => r.trim()).filter(Boolean) : [],
                            // 处理JSON配置
            template_config: values.template_config ? 
                JSON.parse(values.template_config) : null,
            default_config: (() => {
                let config = values.default_config ? JSON.parse(values.default_config) : {};
                
                // 添加筛选条件配置
                const updatedFilterConfig: ReportFilterConfig = {
                    ...filterConfig,
                    enabled: values.filter_enabled || false,
                    default_filters: {
                        logic_operator: 'AND',
                        conditions: filterConditions.filter(c => c.field_name && c.operator)
                    }
                };
                
                config.filter_config = updatedFilterConfig;
                return config;
            })(),
            validation_rules: values.validation_rules ? 
                JSON.parse(values.validation_rules) : null,
            };

            if (editingType) {
                await reportConfigApi.updateReportType(editingType.id, payload);
                message.success('报表类型更新成功');
            } else {
                await reportConfigApi.createReportType(payload);
                message.success('报表类型创建成功');
            }
            
            setModalVisible(false); 
            form.resetFields(); 
            setActiveTab('basic');
            loadReportTypes();
        } catch (errorInfo: any) { 
            console.log('Failed:', errorInfo);
            if (errorInfo.errorFields) {
                message.error('请检查表单填写是否正确');
            } else {
                message.error('保存失败，请重试');
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async (record: ReportTypeDefinition) => {
        setEditingType(record);
        setModalVisible(true);
        setActiveTab('basic');
        setEditLoading(true);
        
        try {
            // 获取完整的报表类型详情
            const detailData = await reportConfigApi.getReportType(record.id);
            
            const fieldIds = typeof detailData.fields === 'string' ? 
                detailData.fields.split(',').map(Number) : detailData.fields;
            
            // 处理筛选条件配置
            let filterConfigData: ReportFilterConfig = {
                enabled: false,
                default_filters: { logic_operator: 'AND', conditions: [] },
                user_configurable_filters: []
            };
            
            // 从 default_config 中提取筛选配置
            if (detailData.default_config) {
                if (typeof detailData.default_config === 'string') {
                    try {
                        const parsedConfig = JSON.parse(detailData.default_config);
                        if (parsedConfig.filter_config) {
                            filterConfigData = parsedConfig.filter_config;
                        }
                    } catch (e) {
                        console.warn('解析 default_config 失败:', e);
                    }
                } else if (detailData.default_config.filter_config) {
                    filterConfigData = detailData.default_config.filter_config;
                }
            }
            
            // 设置筛选条件状态
            setFilterConfig(filterConfigData);
            setFilterConditions(filterConfigData.default_filters.conditions.map((condition, index) => ({
                ...condition,
                id: condition.id || `condition_${index}`
            })));
            
            // 准备表单数据
            const formValues = {
                // 基本信息
                code: detailData.code,
                name: detailData.name,
                description: detailData.description || '',
                category: detailData.category || '',
                sort_order: detailData.sort_order || 0,
                is_active: detailData.is_active,
                is_system: detailData.is_system,
                
                // 数据源配置
                data_source_id: detailData.data_source_id,
                fields: fieldIds,
                
                // 生成器配置
                generator_class: detailData.generator_class || '',
                generator_module: detailData.generator_module || '',
                
                // 权限配置
                required_permissions: detailData.required_permissions?.join(', ') || '',
                allowed_roles: detailData.allowed_roles?.join(', ') || '',
                
                // JSON 配置
                template_config: detailData.template_config ? 
                    JSON.stringify(detailData.template_config, null, 2) : '',
                default_config: detailData.default_config ? 
                    JSON.stringify(detailData.default_config, null, 2) : '',
                validation_rules: detailData.validation_rules ? 
                    JSON.stringify(detailData.validation_rules, null, 2) : '',
                
                // 筛选条件配置
                filter_enabled: filterConfigData.enabled,
            };
            
            // 设置表单值
            form.setFieldsValue(formValues);
            
            // 如果有数据源，加载字段信息
            if (detailData.data_source_id) {
                try {
                    const fields = await reportConfigApi.getDataSourceFields(detailData.data_source_id);
                    setAvailableFields(fields);
                    
                    // 根据表单字段值更新选中字段列表（保持顺序）
                    if (fieldIds && fieldIds.length > 0) {
                        const orderedFields = fieldIds
                            .map(id => fields.find(f => f.id === id))
                            .filter(Boolean) as DataSourceField[];
                        setSelectedFields(orderedFields);
                    }
                    
                    // 验证筛选条件中的字段是否有效
                    if (filterConfigData.default_filters.conditions.length > 0) {
                        const validFieldNames = fields.map(f => f.field_name);
                        const invalidConditions = filterConfigData.default_filters.conditions.filter(
                            condition => condition.field_name && !validFieldNames.includes(condition.field_name)
                        );
                        
                        if (invalidConditions.length > 0) {
                            message.warning(`发现 ${invalidConditions.length} 个筛选条件的字段已失效，请检查配置`);
                        }
                    }
                } catch (error) {
                    console.error('加载数据源字段失败:', error);
                    message.error('加载数据源字段失败');
                    setAvailableFields([]);
                }
            }
            
        } catch (error) {
            console.error('加载报表类型详情失败:', error);
            message.error('加载报表类型详情失败');
            
            // 降级处理：使用列表中的数据
            const fieldIds = typeof record.fields === 'string' ? 
                record.fields.split(',').map(Number) : record.fields;
            
            const formValues = {
                ...record,
                fields: fieldIds,
                required_permissions: record.required_permissions?.join(', ') || '',
                allowed_roles: record.allowed_roles?.join(', ') || '',
                template_config: record.template_config ? 
                    JSON.stringify(record.template_config, null, 2) : '',
                default_config: record.default_config ? 
                    JSON.stringify(record.default_config, null, 2) : '',
                validation_rules: record.validation_rules ? 
                    JSON.stringify(record.validation_rules, null, 2) : '',
                filter_enabled: false,
            };
            
            form.setFieldsValue(formValues);
            if (record.data_source_id) {
                try {
                    const fields = await reportConfigApi.getDataSourceFields(record.data_source_id);
                    setAvailableFields(fields);
                } catch (error) {
                    console.error('降级处理中加载字段失败:', error);
                    setAvailableFields([]);
                }
            }
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            console.log('🗑️ 准备删除报表类型 ID:', id);
            await reportConfigApi.deleteReportType(id);
            message.success(t('report_type.delete_success') || '删除成功');
            loadReportTypes();
        } catch (error: any) {
            console.error('❌ 删除报表类型失败:', error);
            const errorMsg = error.response?.data?.detail || error.message || '删除失败';
            
            if (error.response?.status === 404) {
                message.error(`报表类型不存在 (ID: ${id})，可能已被删除或不存在`);
            } else if (error.response?.status === 403) {
                message.error('系统内置报表类型无法删除');
            } else {
                message.error(`删除失败: ${errorMsg}`);
            }
        }
    };

    const loadPreviewData = async (typeId: number, applyFilters: boolean = true) => {
        setPreviewDataLoading(true);
        try {
            // 构建预览参数
            const previewParams: any = { 
                skip: 0, 
                limit: 100 
            };

            // 如果需要应用筛选条件，从预览记录中提取筛选配置
            if (applyFilters && previewRecord) {
                const filterConfig = (previewRecord as any).default_config?.filter_config;
                if (filterConfig?.enabled && filterConfig.default_filters?.conditions?.length > 0) {
                    // 将筛选条件转换为API参数
                    const filters = convertFiltersToApiParams(filterConfig.default_filters.conditions);
                    Object.assign(previewParams, filters);
                }
            }

            const previewResult = await reportConfigApi.getReportTypePreview(typeId, previewParams);
            setPreviewData(previewResult.items || []);
            setPreviewDataTotal(previewResult.total || 0);
            setPreviewFiltersApplied(applyFilters);
        } catch (error) {
            console.error('获取报表数据预览失败:', error);
            message.error('获取报表数据预览失败');
            setPreviewData([]);
            setPreviewDataTotal(0);
            setPreviewFiltersApplied(false);
        } finally {
            setPreviewDataLoading(false);
        }
    };

    // 将筛选条件转换为API参数
    const convertFiltersToApiParams = (conditions: FilterCondition[]) => {
        // 过滤掉无效的筛选条件
        const validConditions = conditions.filter(condition => 
            condition.field_name && 
            condition.operator && 
            condition.value !== undefined && 
            condition.value !== null && 
            condition.value !== ''
        );
        
        if (validConditions.length === 0) {
            return {};
        }
        
        // 构建筛选条件对象
        const filtersObject = {
            logic_operator: 'AND',
            conditions: validConditions.map(condition => ({
                field_name: condition.field_name,
                operator: condition.operator,
                value: condition.value,
                value_type: condition.value_type || 'static'
            }))
        };
        
        // 返回包含 filters 参数的对象
        return {
            filters: JSON.stringify(filtersObject)
        };
    };

    const handlePreview = async (record: ReportTypeDefinition) => {
        setPreviewRecord(record);
        setPreviewVisible(true);
        setPreviewActiveTab('basic');
        setPreviewLoading(true);
        try {
            const detailData = await reportConfigApi.getReportType(record.id);
            setPreviewRecord(detailData);
            
            if (detailData.data_source_id) {
                try {
                    const availableFieldsData = await reportConfigApi.getReportTypeAvailableFields(record.id);
                    setPreviewRecord((prev: any) => ({
                        ...prev,
                        fields: availableFieldsData.fields,
                        fieldConfig: {
                            configured_fields: availableFieldsData.configured_fields,
                            total_available_fields: availableFieldsData.total_available_fields,
                            total_selected_fields: availableFieldsData.total_selected_fields,
                            data_source_id: availableFieldsData.data_source_id
                        }
                    }));
                } catch (fieldsError) {
                    console.warn('获取报表类型可用字段失败，尝试获取字段定义:', fieldsError);
                    try {
                        const fieldsData = await reportConfigApi.getReportFields(record.id);
                        setPreviewRecord((prev: any) => ({
                            ...prev,
                            fields: fieldsData
                        }));
                    } catch (fallbackError) {
                        console.error('获取字段定义也失败:', fallbackError);
                    }
                }
            } else {
                try {
                    const fieldsData = await reportConfigApi.getReportFields(record.id);
                    setPreviewRecord((prev: any) => ({
                        ...prev,
                        fields: fieldsData
                    }));
                } catch (fieldsError) {
                    console.warn('未配置数据源且无字段定义:', fieldsError);
                }
            }
        } catch (error) {
            console.error('获取报表详情失败:', error);
            message.error('获取报表详情失败');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handlePreviewTabChange = (key: string) => {
        setPreviewActiveTab(key);
        if (key === 'data' && previewRecord && previewData.length === 0) {
            // 默认应用筛选条件加载数据
            loadPreviewData(previewRecord.id, true);
        }
    };

    // 筛选条件管理函数
    const addFilterCondition = () => {
        const newCondition: FilterCondition = {
            id: Date.now().toString(),
            field_name: '',
            operator: 'equals',
            value: '',
            value_type: 'static',
            is_required: false,
            is_visible: true
        };
        setFilterConditions([...filterConditions, newCondition]);
    };

    const updateFilterCondition = (id: string, updates: Partial<FilterCondition>) => {
        setFilterConditions(prev => 
            prev.map(condition => 
                condition.id === id ? { ...condition, ...updates } : condition
            )
        );
    };

    const removeFilterCondition = (id: string) => {
        setFilterConditions(prev => prev.filter(condition => condition.id !== id));
    };

    const getFilterableFields = () => {
        return availableFields.filter(field => field.is_filterable);
    };

    const getOperatorsByFieldType = (dataType: string) => {
        if (dataType.includes('date') || dataType.includes('timestamp')) {
            return FILTER_OPERATORS.filter(op => 
                op.value.startsWith('date_') || 
                ['equals', 'not_equals', 'is_null', 'is_not_null'].includes(op.value)
            );
        }
        if (dataType.includes('numeric') || dataType.includes('integer') || dataType.includes('decimal')) {
            return FILTER_OPERATORS.filter(op => 
                !op.value.startsWith('date_') && 
                !['contains', 'not_contains', 'starts_with', 'ends_with'].includes(op.value)
            );
        }
        // 文本类型
        return FILTER_OPERATORS.filter(op => !op.value.startsWith('date_'));
    };

    // 强制刷新字段数据
    const refreshFields = async () => {
        const dataSourceId = form.getFieldValue('data_source_id');
        if (dataSourceId) {
            try {
                const fields = await reportConfigApi.getDataSourceFields(dataSourceId);
                setAvailableFields(fields);
                message.success(`已刷新字段数据，共加载 ${fields.length} 个字段`);
            } catch (error) {
                message.error('刷新字段数据失败');
            }
        } else {
            message.warning('请先选择数据源');
        }
    };

    // 字段排序处理
    const handleFieldDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setSelectedFields((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                
                // 同步更新表单字段值
                const fieldIds = newItems.map(field => field.id);
                form.setFieldsValue({ fields: fieldIds });
                
                return newItems;
            });
        }
    };

    // 添加字段到选中列表
    const addFieldToSelected = (fieldId: number) => {
        const field = availableFields.find(f => f.id === fieldId);
        if (field && !selectedFields.find(f => f.id === fieldId)) {
            const newSelectedFields = [...selectedFields, field];
            setSelectedFields(newSelectedFields);
            
            // 同步更新表单字段值
            const fieldIds = newSelectedFields.map(f => f.id);
            form.setFieldsValue({ fields: fieldIds });
        }
    };

    // 从选中列表移除字段
    const removeFieldFromSelected = (fieldId: number) => {
        const newSelectedFields = selectedFields.filter(f => f.id !== fieldId);
        setSelectedFields(newSelectedFields);
        
        // 同步更新表单字段值
        const fieldIds = newSelectedFields.map(f => f.id);
        form.setFieldsValue({ fields: fieldIds });
    };

    // 根据表单字段值更新选中字段列表
    const updateSelectedFieldsFromForm = (fieldIds: number[]) => {
        if (fieldIds && fieldIds.length > 0) {
            const orderedFields = fieldIds
                .map(id => availableFields.find(f => f.id === id))
                .filter(Boolean) as DataSourceField[];
            setSelectedFields(orderedFields);
        } else {
            setSelectedFields([]);
        }
    };

    // 添加所有字段到选中列表
    const addAllFieldsToSelected = () => {
        // 过滤出未选择的字段
        const unselectedFields = availableFields.filter(
            field => !selectedFields.find(selected => selected.id === field.id)
        );
        
        if (unselectedFields.length === 0) {
            message.info('所有字段已经选择，无需添加');
            return;
        }
        
        // 将所有未选择的字段添加到选中列表
        const newSelectedFields = [...selectedFields, ...unselectedFields];
        setSelectedFields(newSelectedFields);
        
        // 同步更新表单字段值
        const fieldIds = newSelectedFields.map(f => f.id);
        form.setFieldsValue({ fields: fieldIds });
        
        message.success(`已添加 ${unselectedFields.length} 个字段，总计 ${newSelectedFields.length} 个字段`);
    };

    // 添加自定义空字段
    const handleAddCustomField = async (values: any) => {
        try {
            // 创建一个临时的自定义字段对象
            const customField: DataSourceField = {
                id: Date.now(), // 使用时间戳作为临时ID
                data_source_id: 0, // 自定义字段不属于任何数据源
                field_name: values.field_name,
                field_alias: values.field_alias || values.field_name,
                field_type: values.field_type || 'TEXT',
                data_type: values.data_type || 'STRING',
                display_name_zh: values.display_name,
                display_name_en: values.display_name,
                description: values.description || '自定义空字段',
                is_visible: true,
                is_sortable: values.is_sortable !== false,
                is_filterable: values.is_filterable !== false,
                is_nullable: true,
                is_primary_key: false,
                display_order: selectedFields.length + 1
            };

            // 添加到选中字段列表
            const newSelectedFields = [...selectedFields, customField];
            setSelectedFields(newSelectedFields);
            
            // 更新表单中的字段ID列表
            const fieldIds = newSelectedFields.map(f => f.id);
            form.setFieldsValue({ fields: fieldIds });

            // 关闭模态框并重置表单
            setCustomFieldModalVisible(false);
            customFieldForm.resetFields();
            message.success('自定义字段添加成功');
        } catch (error: any) {
            message.error(`添加自定义字段失败: ${error.message}`);
        }
    };
    
    const columns: ColumnsType<ReportTypeDefinition> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
        { title: t('report_type.column.name'), dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: t('report_type.column.category'), dataIndex: 'category', key: 'category' },
        { title: t('report_type.column.data_source'), dataIndex: 'data_source_name', key: 'data_source_name' },
        { title: t('common:status.enabled'), dataIndex: 'is_active', key: 'is_active', render: (val) => <Switch checked={val} disabled /> },
        {
            title: t('common:column.actions'),
            key: 'action',
            width: 120,
            fixed: 'right' as const,
            render: (_, record, index) => (
                <Space size="small">
                    <Tooltip title={t('common:button.preview', '预览详情')}>
                        <Button 
                            type="link" 
                            icon={<EyeOutlined />} 
                            onClick={() => handlePreview(record)} 
                            size="small"
                            className={styles.roundButtonSmall}
                        />
                    </Tooltip>
                    <Tooltip title={t('common:button.edit')}>
                        <Button 
                            type="link" 
                            icon={<EditOutlined />} 
                            onClick={() => handleEdit(record)} 
                            size="small"
                            className={styles.roundButtonSmall}
                        />
                    </Tooltip>
                    {!record.is_system ? (
                        <Popconfirm title={t('report_type.delete_confirm_title')} onConfirm={() => handleDelete(record.id)}>
                            <Tooltip title={t('common:button.delete')}>
                                <Button 
                                    type="link" 
                                    icon={<DeleteOutlined />} 
                                    danger 
                                    size="small"
                                    className={styles.roundButtonSmall}
                                />
                            </Tooltip>
                        </Popconfirm>
                    ) : (
                        <Tooltip title="系统内置报表类型无法删除">
                            <Button 
                                type="link" 
                                icon={<DeleteOutlined />} 
                                disabled 
                                size="small"
                                className={styles.roundButtonSmall}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                    <div className={styles.cardTitleLeft}>
                        <Title level={4} className={styles.cardTitleText}>
                            <TableOutlined /> 报表类型管理
                        </Title>
                    </div>
                    <div className={styles.cardTitleRight}>
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={() => loadReportTypes()}
                            loading={loading}
                            className={styles.secondaryButton}
                        >
                            {t('common:button.refresh')}
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => { 
                                setEditingType(null); 
                                form.resetFields(); 
                                setAvailableFields([]); 
                                setSelectedFields([]);
                                setFieldSelectorMode('select');
                                setFilterConditions([]);
                                setFilterConfig({
                                    enabled: false,
                                    default_filters: { logic_operator: 'AND', conditions: [] },
                                    user_configurable_filters: []
                                });
                                setModalVisible(true); 
                            }}
                            className={styles.primaryButton}
                        >
                            {t('report_type.new_button')}
                        </Button>
                    </div>
                </div>
            </div>
            <Divider />
            <div className={styles.searchContainer}>
                <Search 
                    placeholder={t('report_type.search_placeholder')} 
                    onSearch={setSearchText} 
                    className={styles.width300}
                    allowClear 
                />
            </div>
            <Table 
                columns={columns} 
                dataSource={reportTypes} 
                rowKey="id" 
                loading={loading}
                scroll={{ x: 1000 }}
                pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    responsive: true,
                }}
            />
            <Modal 
                title={editingType ? '编辑报表类型' : '新建报表类型'} 
                open={modalVisible} 
                onCancel={() => { 
                    setModalVisible(false); 
                    form.resetFields(); 
                    setActiveTab('basic');
                    setSelectedFields([]);
                    setFieldSelectorMode('select');
                    setFilterConditions([]);
                    setFilterConfig({
                        enabled: false,
                        default_filters: { logic_operator: 'AND', conditions: [] },
                        user_configurable_filters: []
                    });
                }} 
                footer={null}
                width={800}
                destroyOnClose
            >
                <Spin spinning={editLoading} tip="正在加载配置信息...">
                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <Tabs.TabPane tab={<span><InfoCircleOutlined />基本信息</span>} key="basic">
                        <Form form={form} layout="vertical" name="reportTypeForm" initialValues={{ is_active: true, sort_order: 0 }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="code" label="报表编码" rules={[{ required: true, message: '请输入报表编码' }]}>
                                        <Input placeholder="例如: salary_summary" disabled={editingType?.is_system} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="name" label="报表名称" rules={[{ required: true, message: '请输入报表名称' }]}>
                                        <Input 
                                            placeholder="例如: 薪资汇总表" 
                                            onChange={handleNameChange}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="category" label="报表分类">
                                        <Select placeholder="选择或输入分类" allowClear showSearch>
                                            <Select.Option value="payroll">薪资报表</Select.Option>
                                            <Select.Option value="hr">人事报表</Select.Option>
                                            <Select.Option value="attendance">考勤报表</Select.Option>
                                            <Select.Option value="finance">财务报表</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="sort_order" label="排序顺序">
                                        <InputNumber min={0} placeholder="0" className={styles.widthFull} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="description" label="报表描述">
                                <TextArea rows={3} placeholder="请输入报表的详细描述" />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="is_active" label="是否启用" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="is_system" label="系统内置" valuePropName="checked">
                                        <Switch disabled={editingType?.is_system} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item className={styles.formItemRightAlign}>
                                <Space>
                                    <Button 
                                        onClick={() => setModalVisible(false)} 
                                        className={styles.secondaryButton}
                                    >
                                        取消
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        onClick={handleSave} 
                                        loading={formLoading}
                                        className={styles.primaryButton}
                                    >
                                        {editingType ? '更新' : '创建'}
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Tabs.TabPane>

                    <Tabs.TabPane tab={<span><DatabaseOutlined />数据源配置</span>} key="datasource">
                        <Alert 
                            message="数据源配置" 
                            description="选择报表的数据源和字段，这将决定报表可以显示哪些数据。" 
                            type="info" 
                            showIcon 
                            style={{ marginBottom: 16 }}
                        />
                        <Form form={form} layout="vertical">
                            <Form.Item name="data_source_id" label="数据源" rules={[{ required: true, message: '请选择数据源' }]}>
                                <Input.Group compact>
                                    <Select 
                                        showSearch 
                                        placeholder="请选择数据源" 
                                        onChange={handleDataSourceChange}
                                        style={{ width: 'calc(100% - 150px)' }}
                                        options={dataSources.map(ds => ({ 
                                            value: ds.id, 
                                            label: `${ds.name} (${ds.table_name || ds.view_name})` 
                                        }))} 
                                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} 
                                    />
                                    <Button 
                                        type="dashed" 
                                        icon={<ReloadOutlined />}
                                        style={{ width: 150 }}
                                        onClick={handleScanDynamicSources}
                                        loading={scanLoading}
                                    >
                                        扫描月度视图
                                    </Button>
                                </Input.Group>
                            </Form.Item>
                            
                            <Form.Item name="fields" label="可用字段">
                                <div className={styles.actionBar}>
                                    <Space wrap>
                                        <Button 
                                            type={fieldSelectorMode === 'select' ? 'primary' : 'default'}
                                            size="small"
                                            onClick={() => setFieldSelectorMode('select')}
                                            className={styles.roundButtonSmall}
                                        >
                                            选择字段
                                        </Button>
                                        <Button 
                                            icon={<SelectOutlined />}
                                            size="small"
                                            onClick={addAllFieldsToSelected}
                                            disabled={availableFields.length === 0 || fieldSelectorMode !== 'select'}
                                            className={styles.roundButtonSmall}
                                            title={availableFields.length === 0 ? '请先选择数据源' : '添加所有可用字段'}
                                        >
                                            添加所有字段
                                        </Button>
                                        <Button 
                                            type={fieldSelectorMode === 'sort' ? 'primary' : 'default'}
                                            size="small"
                                            onClick={() => setFieldSelectorMode('sort')}
                                            disabled={selectedFields.length === 0}
                                            className={styles.roundButtonSmall}
                                        >
                                            调整顺序
                                        </Button>
                                        <Button 
                                            icon={<FileAddOutlined />}
                                            size="small"
                                            onClick={() => setCustomFieldModalVisible(true)}
                                            className={styles.roundButtonSmall}
                                        >
                                            添加空字段
                                        </Button>
                                    </Space>
                                    <span className={styles.fontWeight500} style={{ color: '#666', fontSize: 12 }}>
                                        已选择 {selectedFields.length} 个字段
                                        {availableFields.length > 0 && (
                                            <span style={{ marginLeft: 8 }}>
                                                / 共 {availableFields.length} 个可用字段
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {fieldSelectorMode === 'select' ? (
                                    <div>
                                        <Select 
                                            placeholder="选择要添加的字段" 
                                            style={{ width: '100%', marginBottom: 16 }}
                                            showSearch
                                            value={undefined}
                                            onChange={(value: number) => {
                                                if (value) {
                                                    addFieldToSelected(value);
                                                }
                                            }}
                                            filterOption={(input, option) => 
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={availableFields
                                                .filter(f => !selectedFields.find(sf => sf.id === f.id))
                                                .map(f => ({ 
                                                    value: f.id, 
                                                    label: `${f.display_name_zh || f.field_alias || f.field_name} (${f.data_type})` 
                                                }))} 
                                        />
                                        
                                        {selectedFields.length > 0 && (
                                            <div className={styles.fieldSelector}>
                                                <div className={styles.fieldSelectorTitle}>已选择的字段：</div>
                                                <Space wrap>
                                                    {selectedFields.map((field, index) => (
                                                        <Tag 
                                                            key={field.id}
                                                            closable
                                                            onClose={() => removeFieldFromSelected(field.id)}
                                                        >
                                                            {index + 1}. {field.display_name_zh || field.field_alias || field.field_name}
                                                        </Tag>
                                                    ))}
                                                </Space>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.fieldSelector} style={{ minHeight: 200 }}>
                                        <div className={styles.fieldSelectorTitle}>
                                            拖拽调整字段顺序：
                                        </div>
                                        
                                        {selectedFields.length > 0 ? (
                                            <DndContext 
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleFieldDragEnd}
                                            >
                                                <SortableContext 
                                                    items={selectedFields.map(f => f.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {selectedFields.map((field) => (
                                                        <SortableFieldItem
                                                            key={field.id}
                                                            field={field}
                                                            onRemove={removeFieldFromSelected}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        ) : (
                                            <div className={styles.fieldSelectorEmpty}>
                                                请先在"选择字段"模式下添加字段
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Form.Item>
                            
                            {availableFields.length > 0 && (
                                <Alert 
                                    message={`共找到 ${availableFields.length} 个可用字段`}
                                    type="success" 
                                    showIcon 
                                />
                            )}
                        </Form>
                    </Tabs.TabPane>

                    <Tabs.TabPane tab={<span><SettingOutlined />筛选条件</span>} key="filters">
                        <Alert 
                            message="筛选条件配置" 
                            description="为报表类型配置默认的筛选条件，可以限制报表显示的数据范围。" 
                            type="info" 
                            showIcon 
                            style={{ marginBottom: 16 }}
                        />
                        
                        <Form form={form} layout="vertical">
                            <Form.Item name="filter_enabled" label="启用筛选" valuePropName="checked">
                                <Switch 
                                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, enabled: checked }))}
                                />
                            </Form.Item>
                            
                            {filterConfig.enabled && (
                                <div>
                                    <div className={styles.actionBar}>
                                        <h4 style={{ margin: 0 }}>默认筛选条件</h4>
                                        <Space wrap>
                                            <Button 
                                                icon={<ReloadOutlined />} 
                                                onClick={refreshFields}
                                                size="small"
                                                title="刷新字段数据"
                                                className={styles.roundButtonSmall}
                                            >
                                                刷新字段
                                            </Button>
                                            <Button 
                                                type="dashed" 
                                                icon={<PlusOutlined />} 
                                                onClick={addFilterCondition}
                                                disabled={getFilterableFields().length === 0}
                                                size="small"
                                                className={styles.roundButtonSmall}
                                            >
                                                添加条件
                                            </Button>
                                        </Space>
                                    </div>
                                    
                                    {getFilterableFields().length === 0 && (
                                        <Alert 
                                            message="无可用的筛选字段" 
                                            description={
                                                availableFields.length === 0 
                                                    ? "请先在「数据源配置」标签页中选择数据源，系统将自动加载可用字段。" 
                                                    : `当前数据源共有 ${availableFields.length} 个字段，但没有标记为「可筛选」的字段。请联系管理员配置字段的筛选属性。`
                                            }
                                            type="warning" 
                                            showIcon 
                                            style={{ marginBottom: 16 }}
                                        />
                                    )}
                                    
                                    {/* 调试信息 - 开发时可见 */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#f0f0f0', fontSize: 12 }}>
                                            <div>调试信息:</div>
                                            <div>- 总字段数: {availableFields.length}</div>
                                            <div>- 可筛选字段数: {getFilterableFields().length}</div>
                                            <div>- 编辑状态: {editingType ? '编辑中' : '新建中'}</div>
                                            <div>- 数据源ID: {form.getFieldValue('data_source_id') || '未选择'}</div>
                                        </div>
                                    )}
                                    
                                    {filterConditions.map((condition, index) => (
                                        <div key={condition.id} className={styles.filterCondition}>
                                            <div className={styles.filterConditionHeader}>
                                                <span className={styles.filterConditionTitle}>条件 {index + 1}</span>
                                                <Button 
                                                    type="text" 
                                                    danger 
                                                    icon={<DeleteOutlined />} 
                                                    onClick={() => removeFilterCondition(condition.id!)}
                                                    size="small"
                                                    className={styles.roundButtonSmall}
                                                />
                                            </div>
                                            
                                            <Row gutter={16}>
                                                <Col span={8}>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <label>字段</label>
                                                    </div>
                                                    <Select
                                                        value={condition.field_name}
                                                        onChange={(value) => {
                                                            const field = getFilterableFields().find(f => f.field_name === value);
                                                            updateFilterCondition(condition.id!, {
                                                                field_name: value,
                                                                field_display_name: field?.display_name_zh || field?.field_alias || field?.field_name
                                                            });
                                                        }}
                                                        placeholder="选择字段"
                                                        style={{ width: '100%' }}
                                                        showSearch
                                                        filterOption={(input, option) => 
                                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                        }
                                                        options={getFilterableFields().map(field => ({
                                                            value: field.field_name,
                                                            label: `${field.display_name_zh || field.field_alias || field.field_name} (${field.data_type})`
                                                        }))}
                                                    />
                                                </Col>
                                                
                                                <Col span={6}>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <label>操作符</label>
                                                    </div>
                                                    <Select
                                                        value={condition.operator}
                                                        onChange={(value) => updateFilterCondition(condition.id!, { operator: value })}
                                                        placeholder="选择操作符"
                                                        style={{ width: '100%' }}
                                                        options={(() => {
                                                            const field = getFilterableFields().find(f => f.field_name === condition.field_name);
                                                            return field ? getOperatorsByFieldType(field.data_type).map(op => ({
                                                                value: op.value,
                                                                label: op.label
                                                            })) : FILTER_OPERATORS.map(op => ({
                                                                value: op.value,
                                                                label: op.label
                                                            }));
                                                        })()}
                                                    />
                                                </Col>
                                                
                                                <Col span={6}>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <label>筛选值</label>
                                                    </div>
                                                    {(() => {
                                                        const operator = FILTER_OPERATORS.find(op => op.value === condition.operator);
                                                        if (operator?.valueType === 'none') {
                                                            return <Input disabled placeholder="无需设置值" />;
                                                        }
                                                        if (operator?.valueType === 'multiple') {
                                                            return (
                                                                <Select
                                                                    mode="tags"
                                                                    value={Array.isArray(condition.value) ? condition.value : []}
                                                                    onChange={(value) => updateFilterCondition(condition.id!, { value })}
                                                                    placeholder="输入多个值"
                                                                    style={{ width: '100%' }}
                                                                />
                                                            );
                                                        }
                                                        if (operator?.valueType === 'range') {
                                                            return (
                                                                <Input.Group compact>
                                                                    <Input
                                                                        style={{ width: '45%' }}
                                                                        placeholder="最小值"
                                                                        value={condition.value?.[0] || ''}
                                                                        onChange={(e) => {
                                                                            const newValue = [e.target.value, condition.value?.[1] || ''];
                                                                            updateFilterCondition(condition.id!, { value: newValue });
                                                                        }}
                                                                    />
                                                                    <Input
                                                                        style={{ width: '10%', textAlign: 'center', pointerEvents: 'none' }}
                                                                        placeholder="~"
                                                                        disabled
                                                                    />
                                                                    <Input
                                                                        style={{ width: '45%' }}
                                                                        placeholder="最大值"
                                                                        value={condition.value?.[1] || ''}
                                                                        onChange={(e) => {
                                                                            const newValue = [condition.value?.[0] || '', e.target.value];
                                                                            updateFilterCondition(condition.id!, { value: newValue });
                                                                        }}
                                                                    />
                                                                </Input.Group>
                                                            );
                                                        }
                                                        return (
                                                            <Input
                                                                value={condition.value}
                                                                onChange={(e) => updateFilterCondition(condition.id!, { value: e.target.value })}
                                                                placeholder="输入筛选值"
                                                            />
                                                        );
                                                    })()}
                                                </Col>
                                                
                                                <Col span={4}>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <label>选项</label>
                                                    </div>
                                                    <Space direction="vertical" size="small">
                                                        <Switch
                                                            size="small"
                                                            checked={condition.is_required}
                                                            onChange={(checked) => updateFilterCondition(condition.id!, { is_required: checked })}
                                                        />
                                                        <span style={{ fontSize: 12 }}>必填</span>
                                                        <Switch
                                                            size="small"
                                                            checked={condition.is_visible}
                                                            onChange={(checked) => updateFilterCondition(condition.id!, { is_visible: checked })}
                                                        />
                                                        <span style={{ fontSize: 12 }}>可见</span>
                    </Space>
                </Col>
            </Row>
                                            
                                            <Row style={{ marginTop: 12 }}>
                                                <Col span={24}>
                                                    <Input
                                                        value={condition.description}
                                                        onChange={(e) => updateFilterCondition(condition.id!, { description: e.target.value })}
                                                        placeholder="条件描述（可选）"
                                                        size="small"
                                                    />
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                                    
                                    {filterConditions.length > 0 && (
                                        <Alert
                                            message={`已配置 ${filterConditions.length} 个筛选条件`}
                                            description="这些条件将作为报表的默认筛选条件，用户可以在生成报表时看到这些筛选选项。"
                                            type="success"
                                            showIcon
                                        />
                                    )}
                                </div>
                            )}
                        </Form>
                    </Tabs.TabPane>

                    <Tabs.TabPane tab={<span><SettingOutlined />高级配置</span>} key="advanced">
                        <Collapse defaultActiveKey={['generator', 'permissions']}>
                            <Panel header="生成器配置" key="generator">
                                <Form form={form} layout="vertical">
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="generator_class" label="生成器类名">
                                                <Input placeholder="例如: SalarySummaryGenerator" />
                    </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="generator_module" label="生成器模块">
                                                <Input placeholder="例如: services.report_generators" />
                    </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            </Panel>

                            <Panel header="权限配置" key="permissions">
                                <Form form={form} layout="vertical">
                                    <Form.Item name="required_permissions" label="所需权限">
                                        <TextArea 
                                            rows={2} 
                                            placeholder="用逗号分隔，例如: report:view, salary:view" 
                                        />
                    </Form.Item>
                                    
                                    <Form.Item name="allowed_roles" label="允许的角色">
                                        <TextArea 
                                            rows={2} 
                                            placeholder="用逗号分隔，例如: admin, hr_manager" 
                                        />
                    </Form.Item>
                                </Form>
                            </Panel>

                            <Panel header="配置信息" key="config">
                                <Form form={form} layout="vertical">
                                    <Form.Item name="template_config" label="模板配置 (JSON)">
                                        <TextArea
                                            rows={4}
                                            placeholder='{"format": "xlsx", "template": "default"}'
                                        />
                                    </Form.Item>

                                    <Form.Item name="default_config" label="默认配置 (JSON)">
                                        <TextArea
                                            rows={4}
                                            placeholder='{"include_summary": true, "group_by": "department"}'
                                        />
                                    </Form.Item>

                                    <Form.Item name="validation_rules" label="验证规则 (JSON)">
                                        <TextArea
                                            rows={4}
                                            placeholder='{"required_fields": ["employee_id", "salary"]}'
                                        />
                    </Form.Item>
                </Form>
                            </Panel>
                        </Collapse>
                    </Tabs.TabPane>
                </Tabs>
                </Spin>
            </Modal>

            <Modal
                title={`报表类型预览 - ${previewRecord?.name || ''}`}
                open={previewVisible}
                onCancel={() => {
                    setPreviewVisible(false);
                    setPreviewRecord(null);
                    setPreviewData([]);
                    setPreviewDataTotal(0);
                    setPreviewActiveTab('basic');
                    setPreviewFiltersApplied(true);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setPreviewVisible(false);
                        setPreviewRecord(null);
                        setPreviewData([]);
                        setPreviewDataTotal(0);
                        setPreviewActiveTab('basic');
                        setPreviewFiltersApplied(true);
                    }}>
                        关闭
                    </Button>
                ]}
                width={1200}
            >
                <Spin spinning={previewLoading}>
                    {previewRecord && (
                        <Tabs activeKey={previewActiveTab} onChange={handlePreviewTabChange}>
                            <Tabs.TabPane tab={<span><InfoCircleOutlined />基本信息</span>} key="basic">
                                <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                                    <Descriptions.Item label="报表代码">{previewRecord.code}</Descriptions.Item>
                                    <Descriptions.Item label="报表名称">{previewRecord.name}</Descriptions.Item>
                                    <Descriptions.Item label="类别">{previewRecord.category || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="状态">
                                        <Tag color={previewRecord.is_active ? 'green' : 'red'}>
                                            {previewRecord.is_active ? '启用' : '禁用'}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="系统内置">
                                        <Tag color={previewRecord.is_system ? 'orange' : 'default'}>
                                            {previewRecord.is_system ? '系统' : '自定义'}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="排序顺序">{previewRecord.sort_order}</Descriptions.Item>
                                    <Descriptions.Item label="描述" span={2}>
                                        {previewRecord.description || '-'}
                                    </Descriptions.Item>
                                    {previewRecord.generator_class && (
                                        <Descriptions.Item label="生成器类名">{previewRecord.generator_class}</Descriptions.Item>
                                    )}
                                    {previewRecord.generator_module && (
                                        <Descriptions.Item label="生成器模块">{previewRecord.generator_module}</Descriptions.Item>
                                    )}
                                    {previewRecord.data_source_name && (
                                        <Descriptions.Item label="数据源" span={2}>
                                            {previewRecord.data_source_name}
                                        </Descriptions.Item>
                                    )}
                                    {previewRecord.usage_count !== undefined && (
                                        <Descriptions.Item label="使用次数">{previewRecord.usage_count}</Descriptions.Item>
                                    )}
                                    {previewRecord.last_used_at && (
                                        <Descriptions.Item label="最后使用时间">
                                            {new Date(previewRecord.last_used_at).toLocaleString()}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>

                                {(previewRecord.default_config || previewRecord.template_config) && (
                                    <div style={{ marginTop: 16 }}>
                                        <h4 style={{ marginBottom: 8 }}>配置信息</h4>
                                        <pre style={{ 
                                            background: '#f5f5f5', 
                                            padding: 12, 
                                            borderRadius: 4,
                                            overflow: 'auto',
                                            maxHeight: 200
                                        }}>
                                            {JSON.stringify(
                                                previewRecord.default_config || previewRecord.template_config, 
                                                null, 
                                                2
                                            )}
                                        </pre>
                                    </div>
                                )}

                                {previewRecord.required_permissions && previewRecord.required_permissions.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <h4 style={{ marginBottom: 8 }}>所需权限</h4>
                                        <Space wrap>
                                            {previewRecord.required_permissions.map(p => <Tag key={p}>{p}</Tag>)}
                                        </Space>
                                    </div>
                                )}

                                {previewRecord.allowed_roles && previewRecord.allowed_roles.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <h4 style={{ marginBottom: 8 }}>允许的角色</h4>
                                        <Space wrap>
                                            {previewRecord.allowed_roles.map(r => <Tag key={r}>{r}</Tag>)}
                                        </Space>
                                    </div>
                                )}
                            </Tabs.TabPane>

                            <Tabs.TabPane tab={<span><TableOutlined />字段配置</span>} key="fields">
                                {previewRecord.fields && Array.isArray(previewRecord.fields) && previewRecord.fields.length > 0 ? (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <h4 style={{ margin: 0 }}>报表字段配置</h4>
                                            {(previewRecord as any).fieldConfig && (
                                                <div>
                                                    <Tag color="blue">
                                                        已配置 {(previewRecord as any).fieldConfig.total_selected_fields} / {(previewRecord as any).fieldConfig.total_available_fields} 个字段
                                                    </Tag>
                                                </div>
                                            )}
                                        </div>
                                        <Table
                                            dataSource={previewRecord.fields}
                                            rowKey="id"
                                            size="small"
                                            pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true }}
                                            scroll={{ y: 400 }}
                                            columns={[
                                                {
                                                    title: '字段名',
                                                    dataIndex: 'field_name',
                                                    key: 'field_name',
                                                    width: 150,
                                                    fixed: 'left',
                                                },
                                                {
                                                    title: '显示名称',
                                                    dataIndex: 'display_name',
                                                    key: 'display_name',
                                                    width: 150,
                                                },
                                                {
                                                    title: '字段类型',
                                                    dataIndex: 'field_type',
                                                    key: 'field_type',
                                                    width: 100,
                                                },
                                                {
                                                    title: '数据类型',
                                                    dataIndex: 'data_type',
                                                    key: 'data_type',
                                                    width: 100,
                                                },
                                                {
                                                    title: '是否可见',
                                                    dataIndex: 'is_visible',
                                                    key: 'is_visible',
                                                    width: 80,
                                                    render: (value) => (
                                                        <Tag color={value ? 'green' : 'default'}>
                                                            {value ? '是' : '否'}
                                                        </Tag>
                                                    ),
                                                },
                                                {
                                                    title: '是否必填',
                                                    dataIndex: 'is_required',
                                                    key: 'is_required',
                                                    width: 80,
                                                    render: (value) => (
                                                        <Tag color={value ? 'orange' : 'default'}>
                                                            {value ? '是' : '否'}
                                                        </Tag>
                                                    ),
                                                },
                                                {
                                                    title: '排序',
                                                    dataIndex: 'display_order',
                                                    key: 'display_order',
                                                    width: 60,
                                                },
                                                {
                                                    title: '分组',
                                                    dataIndex: 'group_name',
                                                    key: 'group_name',
                                                    width: 100,
                                                },
                                                {
                                                    title: '描述',
                                                    dataIndex: 'description',
                                                    key: 'description',
                                                    ellipsis: true,
                                                },
                                            ]}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <p>暂无字段配置信息</p>
                                    </div>
                                )}
                            </Tabs.TabPane>

                            <Tabs.TabPane tab={<span><SettingOutlined />筛选条件</span>} key="filters">
                                {previewRecord && (previewRecord as any).default_config?.filter_config ? (
                                    <div>
                                        <Descriptions bordered column={1} style={{ marginBottom: 16 }}>
                                            <Descriptions.Item label="筛选状态">
                                                <Tag color={(previewRecord as any).default_config.filter_config.enabled ? 'green' : 'default'}>
                                                    {(previewRecord as any).default_config.filter_config.enabled ? '已启用' : '未启用'}
                                                </Tag>
                                            </Descriptions.Item>
                                        </Descriptions>
                                        
                                        {(previewRecord as any).default_config.filter_config.enabled && 
                                         (previewRecord as any).default_config.filter_config.default_filters?.conditions?.length > 0 && (
                                            <div>
                                                <h4 style={{ marginBottom: 16 }}>默认筛选条件</h4>
                                                <Table
                                                    dataSource={(previewRecord as any).default_config.filter_config.default_filters.conditions}
                                                    rowKey={(record, index) => index || 0}
                                                    size="small"
                                                    pagination={false}
                                                    columns={[
                                                        {
                                                            title: '字段',
                                                            dataIndex: 'field_name',
                                                            key: 'field_name',
                                                            width: 150,
                                                        },
                                                        {
                                                            title: '显示名称',
                                                            dataIndex: 'field_display_name',
                                                            key: 'field_display_name',
                                                            width: 150,
                                                        },
                                                        {
                                                            title: '操作符',
                                                            dataIndex: 'operator',
                                                            key: 'operator',
                                                            width: 120,
                                                            render: (operator) => {
                                                                const op = FILTER_OPERATORS.find(o => o.value === operator);
                                                                return op ? op.label : operator;
                                                            }
                                                        },
                                                        {
                                                            title: '筛选值',
                                                            dataIndex: 'value',
                                                            key: 'value',
                                                            render: (value) => {
                                                                if (value === null || value === undefined) {
                                                                    return <span style={{ color: '#999' }}>-</span>;
                                                                }
                                                                if (Array.isArray(value)) {
                                                                    return value.join(', ');
                                                                }
                                                                return String(value);
                                                            }
                                                        },
                                                        {
                                                            title: '必填',
                                                            dataIndex: 'is_required',
                                                            key: 'is_required',
                                                            width: 80,
                                                            render: (value) => (
                                                                <Tag color={value ? 'orange' : 'default'}>
                                                                    {value ? '是' : '否'}
                                                                </Tag>
                                                            ),
                                                        },
                                                        {
                                                            title: '可见',
                                                            dataIndex: 'is_visible',
                                                            key: 'is_visible',
                                                            width: 80,
                                                            render: (value) => (
                                                                <Tag color={value ? 'green' : 'default'}>
                                                                    {value ? '是' : '否'}
                                                                </Tag>
                                                            ),
                                                        },
                                                        {
                                                            title: '描述',
                                                            dataIndex: 'description',
                                                            key: 'description',
                                                            ellipsis: true,
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                        
                                        {(previewRecord as any).default_config.filter_config.enabled && 
                                         (!(previewRecord as any).default_config.filter_config.default_filters?.conditions?.length) && (
                                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                                <p>已启用筛选但未配置筛选条件</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <p>未配置筛选条件</p>
                                    </div>
                                )}
                            </Tabs.TabPane>

                            <Tabs.TabPane tab={<span><DatabaseOutlined />数据预览</span>} key="data">
                                <div className={styles.actionBar}>
                                    <Space wrap>
                                        <Button 
                                            icon={<ReloadOutlined />} 
                                            onClick={() => loadPreviewData(previewRecord.id, true)}
                                            loading={previewDataLoading}
                                            size="small"
                                            className={styles.roundButtonSmall}
                                        >
                                            应用筛选刷新
                                        </Button>
                                        <Button 
                                            onClick={() => loadPreviewData(previewRecord.id, false)}
                                            loading={previewDataLoading}
                                            size="small"
                                            className={styles.roundButtonSmall}
                                        >
                                            查看原始数据
                                        </Button>
                                    </Space>
                                    <Space wrap>
                                        {previewDataTotal > 0 && (
                                            <Tag color="blue">共 {previewDataTotal} 条记录</Tag>
                                        )}
                                        <Tag color={previewFiltersApplied ? 'green' : 'orange'}>
                                            {previewFiltersApplied ? '已应用筛选' : '原始数据'}
                                        </Tag>
                                    </Space>
                                </div>
                                
                                {/* 显示应用的筛选条件 */}
                                {previewFiltersApplied && previewRecord && (previewRecord as any).default_config?.filter_config?.enabled && 
                                 (previewRecord as any).default_config.filter_config.default_filters?.conditions?.length > 0 && (
                                    <Alert
                                        message="已应用筛选条件"
                                        description={
                                            <div>
                                                <div style={{ marginBottom: 8 }}>以下筛选条件已应用到数据预览：</div>
                                                {(previewRecord as any).default_config.filter_config.default_filters.conditions
                                                    .filter((condition: FilterCondition) => condition.field_name && condition.operator)
                                                    .map((condition: FilterCondition, index: number) => {
                                                        const operator = FILTER_OPERATORS.find(op => op.value === condition.operator);
                                                        let valueDisplay = '';
                                                        if (condition.value !== undefined && condition.value !== null && condition.value !== '') {
                                                            if (Array.isArray(condition.value)) {
                                                                valueDisplay = condition.value.join(', ');
                                                            } else {
                                                                valueDisplay = String(condition.value);
                                                            }
                                                        }
                                                        return (
                                                            <Tag key={index} style={{ marginBottom: 4 }}>
                                                                {condition.field_display_name || condition.field_name} {operator?.label || condition.operator} {valueDisplay}
                                                            </Tag>
                                                        );
                                                    })}
                                            </div>
                                        }
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                )}
                                
                                {!previewFiltersApplied && previewRecord && (previewRecord as any).default_config?.filter_config?.enabled && 
                                 (previewRecord as any).default_config.filter_config.default_filters?.conditions?.length > 0 && (
                                    <Alert
                                        message="未应用筛选条件"
                                        description="当前显示的是原始数据，未应用报表类型配置的筛选条件。点击「应用筛选刷新」查看筛选后的数据。"
                                        type="warning"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                )}
                                
                                <Spin spinning={previewDataLoading}>
                                    {previewData.length > 0 ? (
                                        <Table
                                            dataSource={previewData}
                                            rowKey={(record, index) => index || 0}
                                            size="small"
                                            pagination={{ 
                                                pageSize: 20, 
                                                showSizeChanger: true, 
                                                showQuickJumper: true,
                                                total: previewDataTotal,
                                                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                                            }}
                                            scroll={{ x: 'max-content', y: 400 }}
                                                                                         columns={
                                                 (() => {
                                                     // 如果有字段配置，只显示配置的字段
                                                     const fieldsArray = (previewRecord as any).fields;
                                                     if (fieldsArray && Array.isArray(fieldsArray) && fieldsArray.length > 0) {
                                                         // 检查是否是 DataSourceField 类型的数组
                                                         const firstField = fieldsArray[0];
                                                         if (firstField && typeof firstField === 'object' && 'field_name' in firstField) {
                                                             return fieldsArray
                                                                 .filter((field: any) => field.is_visible !== false) // 只显示可见字段
                                                                 .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)) // 按显示顺序排序
                                                                 .map((field: any, index: number) => ({
                                                                     title: field.display_name_zh || field.field_alias || field.field_name,
                                                                     dataIndex: field.field_name,
                                                                     key: field.field_name,
                                                                     width: 150,
                                                                     ellipsis: true,
                                                                     fixed: index < 2 ? 'left' : undefined,
                                                                     render: (value: any) => {
                                                                         if (value === null || value === undefined) {
                                                                             return <span style={{ color: '#999' }}>-</span>;
                                                                         }
                                                                         if (typeof value === 'object') {
                                                                             return <span style={{ color: '#666' }}>{JSON.stringify(value)}</span>;
                                                                         }
                                                                         // 根据字段类型格式化显示
                                                                         if (field.data_type === 'numeric' || field.data_type === 'decimal') {
                                                                             const num = parseFloat(value);
                                                                             return isNaN(num) ? String(value) : num.toFixed(2);
                                                                         }
                                                                         if (field.data_type === 'date' || field.data_type === 'timestamp') {
                                                                             try {
                                                                                 return new Date(value).toLocaleDateString();
                                                                             } catch {
                                                                                 return String(value);
                                                                             }
                                                                         }
                                                                         return String(value);
                                                                     }
                                                                 }));
                                                         }
                                                     }
                                                     
                                                     // 如果没有字段配置，显示所有字段
                                                     if (previewData.length > 0) {
                                                         return Object.keys(previewData[0]).map((key, index) => ({
                                                             title: key,
                                                             dataIndex: key,
                                                             key: key,
                                                             width: 150,
                                                             ellipsis: true,
                                                             fixed: index < 2 ? 'left' : undefined,
                                                             render: (value: any) => {
                                                                 if (value === null || value === undefined) {
                                                                     return <span style={{ color: '#999' }}>-</span>;
                                                                 }
                                                                 if (typeof value === 'object') {
                                                                     return <span style={{ color: '#666' }}>{JSON.stringify(value)}</span>;
                                                                 }
                                                                 return String(value);
                                                             }
                                                         }));
                                                     }
                                                     
                                                     return [];
                                                 })()
                                             }
                                        />
                                    ) : (
                                        <div className={styles.previewEmpty}>
                                            <p>暂无数据或数据源未配置</p>
                                            {previewRecord.data_source_id ? (
                                                <p className={styles.previewEmptyText}>请检查数据源是否包含数据</p>
                                            ) : (
                                                <p className={styles.previewEmptyText}>请先配置数据源</p>
                                            )}
                                        </div>
                                    )}
                                </Spin>
                            </Tabs.TabPane>
                        </Tabs>
                    )}
                </Spin>
            </Modal>

            {/* 自定义字段模态框 */}
            <Modal
                title="添加自定义空字段"
                open={customFieldModalVisible}
                onCancel={() => {
                    setCustomFieldModalVisible(false);
                    customFieldForm.resetFields();
                }}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Alert
                    message="自定义空字段说明"
                    description="自定义空字段不依赖任何数据源，将在报表中显示为空值或默认值。适用于手动填写、计算字段或预留字段等场景。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                
                <Form
                    form={customFieldForm}
                    layout="vertical"
                    onFinish={handleAddCustomField}
                    initialValues={{
                        field_type: 'TEXT',
                        data_type: 'STRING',
                        is_sortable: true,
                        is_filterable: true
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="field_name"
                                label="字段名"
                                rules={[
                                    { required: true, message: '请输入字段名' },
                                    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '字段名只能包含字母、数字和下划线，且以字母或下划线开头' }
                                ]}
                            >
                                <Input placeholder="例如: custom_field" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="display_name"
                                label="显示名称"
                                rules={[{ required: true, message: '请输入显示名称' }]}
                            >
                                <Input placeholder="例如: 自定义字段" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="field_alias" label="字段别名">
                        <Input placeholder="可选，用于数据库查询" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="field_type" label="字段类型" rules={[{ required: true, message: '请选择字段类型' }]}>
                                <Select placeholder="选择字段类型">
                                    <Select.Option value="TEXT">文本</Select.Option>
                                    <Select.Option value="NUMBER">数字</Select.Option>
                                    <Select.Option value="DATE">日期</Select.Option>
                                    <Select.Option value="DATETIME">日期时间</Select.Option>
                                    <Select.Option value="BOOLEAN">布尔值</Select.Option>
                                    <Select.Option value="CURRENCY">货币</Select.Option>
                                    <Select.Option value="PERCENTAGE">百分比</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="data_type" label="数据类型" rules={[{ required: true, message: '请选择数据类型' }]}>
                                <Select placeholder="选择数据类型">
                                    <Select.Option value="STRING">字符串</Select.Option>
                                    <Select.Option value="INTEGER">整数</Select.Option>
                                    <Select.Option value="DECIMAL">小数</Select.Option>
                                    <Select.Option value="DATE">日期</Select.Option>
                                    <Select.Option value="DATETIME">日期时间</Select.Option>
                                    <Select.Option value="BOOLEAN">布尔值</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="字段描述">
                        <TextArea rows={2} placeholder="请输入字段描述" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="is_sortable" label="可排序" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_filterable" label="可筛选" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => {
                                setCustomFieldModalVisible(false);
                                customFieldForm.resetFields();
                            }}>
                                取消
                            </Button>
                            <Button type="primary" htmlType="submit">
                                添加字段
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};


const ReportConfigManagement: React.FC = () => {
    const { t } = useTranslation(['reportManagement', 'pageTitle']);
    const [activeTab, setActiveTab] = useState('data-sources');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && tab !== activeTab) setActiveTab(tab);
    }, [location.search, activeTab]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        navigate(`${location.pathname}?tab=${key}`, { replace: true });
    };

    const items = [
        { label: <span><DatabaseOutlined /> {t('data_source.tab_title')}</span>, key: 'data-sources', children: <DataSources /> },
        { label: <span><TableOutlined /> {t('report_type.tab_title')}</span>, key: 'types', children: <ReportTypes /> },
        { label: <span><AppstoreOutlined /> {t('report_preset.tab_title')}</span>, key: 'presets', children: <ReportPresetManagement /> },
        { label: <span><ExportOutlined /> {t('batch_report.tab_title')}</span>, key: 'batch-reports', children: <BatchReportsManagement /> },
    ];

    return (
        <div className={styles.pageContainer}>
            <Card>
                <div className={styles.marginBottom16}>
                    <Title level={4} className={styles.cardTitle}>
                        {t('pageTitle:report_config_management')}
                    </Title>
                </div>
                <Tabs 
                    defaultActiveKey="data-sources" 
                    activeKey={activeTab} 
                    items={items} 
                    onChange={handleTabChange} 
                    size="large" 
                />
            </Card>
        </div>
    );
};

export default ReportConfigManagement; 