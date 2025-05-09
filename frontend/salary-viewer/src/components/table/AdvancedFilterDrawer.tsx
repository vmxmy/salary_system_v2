import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Button, Space, Divider, DatePicker, InputNumber, Tag, Typography, Card, Modal, Radio, Checkbox, App, Tabs, Empty, AutoComplete } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, PlusCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import {
  fetchFilterPresets,
  createFilterPreset,
  deleteFilterPreset
} from '../../services/tableConfigsApi';

const { Text } = Typography;

// 定义筛选条件类型
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';

// 定义筛选条件接口
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

// 定义条件组接口 - 组内条件使用AND逻辑
export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

// 定义保存的筛选方案接口
export interface FilterPreset {
  id: string;
  name: string;
  groups: FilterGroup[]; // 使用条件组替代单个条件列表
  isServerStored?: boolean; // 是否存储在服务器上
  serverId?: number; // 服务器端ID
  isShared?: boolean; // 是否共享
  isDefault?: boolean; // 是否默认
}

interface AdvancedFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  columns: TableColumnsType<any>;
  onApplyFilter: (groups: FilterGroup[]) => void;
  initialConditions?: FilterCondition[] | FilterGroup[];
  tableId: string; // 添加表格ID，用于区分不同表格的筛选方案
}

// 定义操作符选项类型
interface OperatorOption {
  value: string;
  label: string;
}

// 获取字段类型
const getFieldType = (field: string, columns: TableColumnsType<any>): string => {
  // 使用类型断言安全地访问dataIndex属性
  const column = columns.find(col => {
    const anyCol = col as any;
    const dataIndex = anyCol.dataIndex;
    return dataIndex?.toString() === field;
  });

  if (!column) return 'string';

  // 使用类型断言安全地获取dataIndex
  const anyColumn = column as any;
  const dataIndex = anyColumn.dataIndex?.toString() || '';

  // 根据列的属性判断类型
  if (dataIndex.includes('date') || dataIndex.includes('time')) {
    return 'date';
  }

  if (dataIndex.includes('id') && dataIndex !== 'id_card_number') {
    return 'number';
  }

  // 可以根据实际情况添加更多类型判断逻辑
  return 'string';
};

/**
 * 高级筛选抽屉组件，用于设置复杂的筛选条件
 * 支持条件组，组内条件使用AND逻辑，组之间使用OR逻辑
 */
const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  open,
  onClose,
  columns,
  onApplyFilter,
  initialConditions = [],
  tableId,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [serverPresets, setServerPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveLocation, setSaveLocation] = useState<'local' | 'server'>('local');
  const [isShared, setIsShared] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  // 当前激活的标签页
  const [, setActiveTab] = useState<string>('local');
  const [loadingServer, setLoadingServer] = useState(false);

  // 获取操作符选项
  const getOperatorOptions = (fieldType: string): OperatorOption[] => {
    const numberOperators = [
      { value: 'eq', label: t('advancedFilter.operators.eq') },
      { value: 'neq', label: t('advancedFilter.operators.neq') },
      { value: 'gt', label: t('advancedFilter.operators.gt') },
      { value: 'gte', label: t('advancedFilter.operators.gte') },
      { value: 'lt', label: t('advancedFilter.operators.lt') },
      { value: 'lte', label: t('advancedFilter.operators.lte') },
    ];

    const stringOperators = [
      { value: 'eq', label: t('advancedFilter.operators.eq') },
      { value: 'neq', label: t('advancedFilter.operators.neq') },
      { value: 'contains', label: t('advancedFilter.operators.contains') },
      { value: 'startsWith', label: t('advancedFilter.operators.startsWith') },
      { value: 'endsWith', label: t('advancedFilter.operators.endsWith') },
    ];

    const dateOperators = [
      { value: 'eq', label: t('advancedFilter.operators.eq') },
      { value: 'neq', label: t('advancedFilter.operators.neq') },
      { value: 'gt', label: t('advancedFilter.operators.gt') },
      { value: 'gte', label: t('advancedFilter.operators.gte') },
      { value: 'lt', label: t('advancedFilter.operators.lt') },
      { value: 'lte', label: t('advancedFilter.operators.lte') },
    ];

    switch (fieldType) {
      case 'number':
        return numberOperators;
      case 'date':
        return dateOperators;
      default:
        return stringOperators;
    }
  };

  // 从localStorage加载保存的筛选方案
  useEffect(() => {
    const savedPresets = localStorage.getItem(`tableFilterPresets_${tableId}`);
    if (savedPresets) {
      try {
        const parsedPresets = JSON.parse(savedPresets);

        // 兼容旧版本的筛选方案格式
        const migratedPresets = parsedPresets.map((preset: any) => {
          if (preset.conditions && !preset.groups) {
            // 旧格式转换为新格式
            return {
              ...preset,
              groups: [{ id: generateId(), conditions: preset.conditions }],
            };
          }
          return preset;
        });

        setPresets(migratedPresets);
      } catch (e) {
        console.error('Failed to parse saved filter presets:', e);
      }
    }
  }, [tableId]);

  // 从服务器加载筛选方案
  useEffect(() => {
    const loadServerPresets = async () => {
      if (!open) return; // 只在打开抽屉时加载

      setLoadingServer(true);
      try {
        console.log('Loading filter presets from server for tableId:', tableId);
        const presets = await fetchFilterPresets(tableId);
        console.log('Server returned filter presets:', presets);

        // 将服务器筛选方案转换为前端格式
        const convertedPresets = presets.map(preset => {
          console.log('Processing preset:', preset);

          // 从config_data中提取筛选条件
          let groups: FilterGroup[] = [];

          // 确保config_data存在
          const configData = preset.config_data || {};
          console.log('Preset config_data:', configData);

          // 使用类型断言来处理动态属性
          const anyConfigData = configData as any;

          // 检查是否有groups属性（新格式）
          if (anyConfigData.groups && Array.isArray(anyConfigData.groups)) {
            console.log('Found groups format:', anyConfigData.groups);

            // 确保每个组和条件都有有效的ID
            groups = anyConfigData.groups.map((group: any) => ({
              ...group,
              id: group.id || generateId(),
              conditions: Array.isArray(group.conditions) ? group.conditions.map((condition: any) => ({
                ...condition,
                id: condition.id || generateId(),
                // 确保operator是有效的FilterOperator类型
                operator: (condition.operator as FilterOperator) || 'eq'
              })) : [{
                id: generateId(),
                field: '',
                operator: 'eq' as FilterOperator,
                value: '',
              }]
            }));
          }
          // 检查是否有filters属性（旧格式）
          else if (anyConfigData.filters && Array.isArray(anyConfigData.filters)) {
            console.log('Found filters format:', anyConfigData.filters);

            // 确保每个条件都有有效的ID
            const conditions = anyConfigData.filters.map((condition: any) => ({
              ...condition,
              id: condition.id || generateId(),
              // 确保operator是有效的FilterOperator类型
              operator: (condition.operator as FilterOperator) || 'eq'
            }));

            groups = [{
              id: generateId(),
              conditions: conditions as FilterCondition[]
            }];
          }
          // 如果都没有，创建一个空的条件组
          else {
            console.log('No valid filter format found, creating empty group');
            groups = [{
              id: generateId(),
              conditions: [{
                id: generateId(),
                field: '',
                operator: 'eq' as FilterOperator,
                value: '',
              }]
            }];
          }

          const convertedPreset = {
            id: `server-${preset.id}`,
            name: preset.name,
            groups: groups,
            isServerStored: true,
            serverId: preset.id,
            isShared: preset.is_shared,
            isDefault: preset.is_default
          };

          console.log('Converted preset:', convertedPreset);
          return convertedPreset;
        });

        console.log('All converted presets:', convertedPresets);
        setServerPresets(convertedPresets);
      } catch (error) {
        console.error('Failed to load filter presets from server:', error);
        message.error(t('advancedFilter.serverLoadFailed'));
      } finally {
        setLoadingServer(false);
      }
    };

    loadServerPresets();
  }, [tableId, open, t, message]);

  // 初始化条件组
  useEffect(() => {
    if (initialConditions && initialConditions.length > 0) {
      // 检查initialConditions是FilterCondition[]还是FilterGroup[]
      if ('conditions' in initialConditions[0]) {
        // 是FilterGroup[]
        setGroups(initialConditions as FilterGroup[]);
      } else {
        // 是FilterCondition[]，转换为一个组
        setGroups([{
          id: generateId(),
          conditions: initialConditions as FilterCondition[]
        }]);
      }
    } else if (groups.length === 0) {
      // 添加一个空的条件组
      addGroup();
    }
  }, [initialConditions]);

  // 生成唯一ID
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // 添加条件组
  const addGroup = () => {
    const newGroup: FilterGroup = {
      id: generateId(),
      conditions: [{
        id: generateId(),
        field: '',
        operator: 'eq',
        value: '',
      }]
    };
    setGroups([...groups, newGroup]);
  };

  // 删除条件组
  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  // 添加筛选条件到指定组
  const addCondition = (groupId: string) => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: '',
      operator: 'eq',
      value: '',
    };

    setGroups(groups.map(group =>
      group.id === groupId
        ? { ...group, conditions: [...group.conditions, newCondition] }
        : group
    ));
  };

  // 删除筛选条件
  const removeCondition = (groupId: string, conditionId: string) => {
    setGroups(groups.map(group =>
      group.id === groupId
        ? {
            ...group,
            conditions: group.conditions.length > 1
              ? group.conditions.filter(c => c.id !== conditionId)
              : group.conditions // 如果是组内最后一个条件，不删除
          }
        : group
    ));
  };

  // 更新筛选条件
  const updateCondition = (groupId: string, conditionId: string, field: string, value: any) => {
    setGroups(groups.map(group =>
      group.id === groupId
        ? {
            ...group,
            conditions: group.conditions.map(c =>
              c.id === conditionId ? { ...c, [field]: value } : c
            )
          }
        : group
    ));
  };

  // 应用筛选条件
  const handleApply = () => {
    // 过滤掉空条件，只保留有效的条件组
    const validGroups = groups
      .map(group => ({
        ...group,
        conditions: group.conditions.filter(c => c.field && c.operator)
      }))
      .filter(group => group.conditions.length > 0);

    console.log('Applying filter with valid groups:', validGroups);

    // 确保每个条件都有有效的ID和operator，并规范化字符串值
    const normalizedGroups = validGroups.map(group => ({
      ...group,
      id: group.id || generateId(),
      conditions: group.conditions.map(condition => {
        // 处理字符串值，去除前导和尾随空格
        let normalizedValue = condition.value;
        if (typeof normalizedValue === 'string') {
          normalizedValue = normalizedValue.trim();
        }

        return {
          ...condition,
          id: condition.id || generateId(),
          operator: condition.operator || 'eq',
          value: normalizedValue
        };
      })
    }));

    console.log('Normalized groups for filtering:', normalizedGroups);
    onApplyFilter(normalizedGroups);
    onClose();
  };

  // 清除所有筛选条件
  const handleClear = () => {
    setGroups([{
      id: generateId(),
      conditions: [{
        id: generateId(),
        field: '',
        operator: 'eq',
        value: '',
      }]
    }]);
  };

  // 打开保存对话框
  const openSaveModal = () => {
    setSaveModalVisible(true);
    setPresetName('');
    setIsShared(false);
    setIsDefault(false);
  };

  // 保存筛选方案
  const handleSavePreset = async (saveToServer = false) => {
    if (!presetName.trim()) return;

    // 过滤掉空条件，只保留有效的条件组
    const validGroups = groups
      .map(group => ({
        ...group,
        conditions: group.conditions.filter(c => c.field && c.operator)
      }))
      .filter(group => group.conditions.length > 0);

    if (validGroups.length === 0) return;

    setLoading(true);

    if (saveToServer) {
      // 保存到服务器
      try {
        const serverPreset = await createFilterPreset({
          table_id: tableId,
          name: presetName,
          config_data: {
            groups: validGroups
          },
          is_default: isDefault,
          is_shared: isShared
        });

        if (serverPreset) {
          const newPreset: FilterPreset = {
            id: `server-${serverPreset.id}`,
            name: serverPreset.name,
            groups: validGroups,
            isServerStored: true,
            serverId: serverPreset.id,
            isShared: serverPreset.is_shared,
            isDefault: serverPreset.is_default
          };

          setServerPresets([...serverPresets, newPreset]);
          message.success(t('advancedFilter.serverSaveSuccess'));
        }
      } catch (error) {
        console.error('Failed to save filter preset to server:', error);
        message.error(t('advancedFilter.serverSaveFailed'));
      }
    } else {
      // 保存到本地
      const newPreset: FilterPreset = {
        id: generateId(),
        name: presetName,
        groups: validGroups,
      };

      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      localStorage.setItem(`tableFilterPresets_${tableId}`, JSON.stringify(updatedPresets));
      message.success(t('advancedFilter.localSaveSuccess'));
    }

    setLoading(false);
    setSaveModalVisible(false);
    setPresetName('');
  };

  // 加载筛选方案
  const handleLoadPreset = (presetId: string) => {
    console.log('Loading preset with ID:', presetId);

    // 先从本地筛选方案中查找
    let preset = presets.find(p => p.id === presetId);
    let source = 'local';

    // 如果本地没有找到，则从服务器筛选方案中查找
    if (!preset) {
      preset = serverPresets.find(p => p.id === presetId);
      source = 'server';
    }

    console.log('Found preset:', preset, 'from source:', source);

    if (preset) {
      if (preset.groups && Array.isArray(preset.groups) && preset.groups.length > 0) {
        console.log('Setting groups from preset:', preset.groups);

        // 确保每个组和条件都有有效的ID
        const validatedGroups: FilterGroup[] = preset.groups.map(group => ({
          ...group,
          id: group.id || generateId(),
          conditions: Array.isArray(group.conditions) ? group.conditions.map(condition => ({
            ...condition,
            id: condition.id || generateId(),
            // 确保operator是有效的FilterOperator类型
            operator: (condition.operator as FilterOperator) || 'eq'
          } as FilterCondition)) : [{
            id: generateId(),
            field: '',
            operator: 'eq' as FilterOperator,
            value: '',
          }]
        }));

        setGroups(validatedGroups);
        message.success(t('advancedFilter.presetLoaded', { name: preset.name }));
      } else {
        console.warn('Preset has no valid groups:', preset);
        message.warning(t('advancedFilter.presetInvalid'));

        // 创建一个默认的空组
        setGroups([{
          id: generateId(),
          conditions: [{
            id: generateId(),
            field: '',
            operator: 'eq',
            value: '',
          }]
        }]);
      }
    } else {
      console.error('Preset not found with ID:', presetId);
      message.error(t('advancedFilter.presetNotFound'));
    }
  };

  // 删除筛选方案
  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // 检查是否为服务器端筛选方案
    if (presetId.startsWith('server-')) {
      const serverPreset = serverPresets.find(p => p.id === presetId);
      if (serverPreset && serverPreset.serverId) {
        try {
          const success = await deleteFilterPreset(serverPreset.serverId);
          if (success) {
            const updatedServerPresets = serverPresets.filter(p => p.id !== presetId);
            setServerPresets(updatedServerPresets);
            message.success(t('advancedFilter.deleteServerSuccess'));
          } else {
            message.error(t('advancedFilter.deleteServerFailed'));
          }
        } catch (error) {
          console.error(`Failed to delete server filter preset ${presetId}:`, error);
          message.error(t('advancedFilter.deleteServerFailed'));
        }
      }
    } else {
      // 本地筛选方案
      const updatedPresets = presets.filter(p => p.id !== presetId);
      setPresets(updatedPresets);
      localStorage.setItem(`tableFilterPresets_${tableId}`, JSON.stringify(updatedPresets));
      message.success(t('advancedFilter.deleteLocalSuccess'));
    }
  };

  // 渲染值输入组件
  const renderValueInput = (condition: FilterCondition, groupId: string) => {
    const fieldType = getFieldType(condition.field, columns);

    switch (fieldType) {
      case 'number':
        return (
          <InputNumber
            style={{ width: '100%' }}
            value={condition.value}
            onChange={value => {
              // 确保数字值不包含空格
              if (typeof value === 'string') {
                value = value.trim();
              }
              updateCondition(groupId, condition.id, 'value', value);
            }}
            placeholder={t('advancedFilter.valuePlaceholder')}
          />
        );
      case 'date':
        return (
          <DatePicker
            style={{ width: '100%' }}
            value={condition.value}
            onChange={value => updateCondition(groupId, condition.id, 'value', value)}
            placeholder={t('advancedFilter.selectDate')}
          />
        );
      default:
        return (
          <Input
            value={condition.value}
            onChange={e => {
              // 去除前导和尾随空格
              const trimmedValue = e.target.value.trim();
              updateCondition(groupId, condition.id, 'value', trimmedValue);
            }}
            onBlur={() => {
              // 失去焦点时再次确保没有空格
              if (typeof condition.value === 'string' && condition.value !== condition.value.trim()) {
                updateCondition(groupId, condition.id, 'value', condition.value.trim());
              }
            }}
            placeholder={t('advancedFilter.valuePlaceholder')}
          />
        );
    }
  };

  return (
    <>
      <Drawer
        title={t('advancedFilter.title')}
        placement="right"
        onClose={onClose}
        open={open}
        width={520}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleClear}>{t('advancedFilter.clear')}</Button>
              <Button onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="primary" onClick={handleApply}>{t('common.apply')}</Button>
            </Space>
          </div>
        }
      >
      <Form form={form} layout="vertical">
        {/* 保存的筛选方案 */}
        <Tabs
          defaultActiveKey="local"
          onChange={setActiveTab}
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'local',
              label: t('advancedFilter.localPresets'),
              children: (
                <>
                  {presets.length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      {presets.map(preset => (
                        <Tag
                          key={preset.id}
                          style={{ marginBottom: 8, cursor: 'pointer' }}
                          onClick={() => handleLoadPreset(preset.id)}
                          closable
                          onClose={(e) => handleDeletePreset(preset.id, e)}
                        >
                          {preset.name}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      description={t('advancedFilter.noLocalPresets')}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </>
              ),
            },
            {
              key: 'server',
              label: t('advancedFilter.serverPresets'),
              children: (
                <>
                  {loadingServer ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <LoadingOutlined style={{ fontSize: 24 }} />
                      <p>{t('advancedFilter.loadingServerPresets')}</p>
                    </div>
                  ) : serverPresets.length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      {serverPresets.map(preset => (
                        <Tag
                          key={preset.id}
                          style={{ marginBottom: 8, cursor: 'pointer' }}
                          onClick={() => handleLoadPreset(preset.id)}
                          closable
                          onClose={(e) => handleDeletePreset(preset.id, e)}
                          color={preset.isDefault ? "orange" : (preset.isShared ? "green" : undefined)}
                        >
                          {preset.name}
                          {preset.isDefault && <span> ({t('advancedFilter.default')})</span>}
                          {preset.isShared && <span> ({t('advancedFilter.shared')})</span>}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      description={t('advancedFilter.noServerPresets')}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </>
              ),
            },
          ]}
        />
        <Divider />

        {/* 筛选条件组 */}
        <div style={{ marginBottom: 16 }}>
          <Space style={{ width: '100%' }} align="center" wrap>
            <Text strong>{t('advancedFilter.conditionGroups')}</Text>
            <Text type="secondary">({t('advancedFilter.groupsConnectedByOr')})</Text>
          </Space>
        </div>

        {groups.map((group, groupIndex) => (
          <Card
            key={group.id}
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <Text>{t('advancedFilter.conditionGroup')} {groupIndex + 1}</Text>
                <Text type="secondary">({t('advancedFilter.conditionsConnectedByAnd')})</Text>
              </Space>
            }
            extra={
              groups.length > 1 ? (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeGroup(group.id)}
                />
              ) : null
            }
          >
            {group.conditions.map((condition) => (
              <div key={condition.id} style={{ marginBottom: 16 }}>
                <Space style={{ width: '100%' }} direction="vertical">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <AutoComplete
                      style={{ width: '40%' }}
                      value={condition.field}
                      onChange={value => updateCondition(group.id, condition.id, 'field', value)}
                      placeholder={t('advancedFilter.selectField')}
                      options={columns.map(col => {
                        // 使用类型断言安全地获取dataIndex
                        const anyCol = col as any;
                        const dataIndex = anyCol.dataIndex?.toString() || '';
                        return {
                          value: dataIndex,
                          label: typeof col.title === 'string' ? col.title : dataIndex
                        };
                      })}
                      filterOption={(inputValue, option) => {
                        const value = option?.value?.toString().toLowerCase() || '';
                        const label = option?.label?.toString().toLowerCase() || '';
                        const input = inputValue.toLowerCase();
                        return value.includes(input) || label.includes(input);
                      }}
                    />

                    <AutoComplete
                      style={{ width: '30%' }}
                      value={condition.operator}
                      onChange={value => updateCondition(group.id, condition.id, 'operator', value)}
                      placeholder={t('advancedFilter.selectOperator')}
                      options={getOperatorOptions(getFieldType(condition.field, columns)).map(op => ({
                        value: op.value,
                        label: op.label
                      }))}
                      filterOption={(inputValue, option) => {
                        const value = option?.value?.toString().toLowerCase() || '';
                        const label = option?.label?.toString().toLowerCase() || '';
                        const input = inputValue.toLowerCase();
                        return value.includes(input) || label.includes(input);
                      }}
                    />

                    <div style={{ width: '30%', display: 'flex', gap: 8 }}>
                      {renderValueInput(condition, group.id)}

                      {group.conditions.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeCondition(group.id, condition.id)}
                        />
                      )}
                    </div>
                  </div>
                </Space>
              </div>
            ))}

            <Button
              type="dashed"
              onClick={() => addCondition(group.id)}
              style={{ width: '100%' }}
              icon={<PlusOutlined />}
            >
              {t('advancedFilter.addCondition')}
            </Button>
          </Card>
        ))}

        <Button
          type="primary"
          ghost
          onClick={addGroup}
          style={{ width: '100%', marginBottom: 24 }}
          icon={<PlusCircleOutlined />}
        >
          {t('advancedFilter.addGroup')}
        </Button>

        <Divider />

        {/* 保存筛选方案 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>{t('advancedFilter.savePreset')}</Text>
          <div style={{ marginTop: 8 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={openSaveModal}
            >
              {t('advancedFilter.saveNewPreset')}
            </Button>
          </div>
        </div>
      </Form>
    </Drawer>

    {/* 保存位置选择对话框 */}
    <Modal
      title={t('advancedFilter.savePresetTitle')}
      open={saveModalVisible}
      onCancel={() => setSaveModalVisible(false)}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          value={presetName}
          onChange={e => setPresetName(e.target.value)}
          placeholder={t('advancedFilter.presetNamePlaceholder')}
          style={{ marginBottom: 16 }}
        />

        <Radio.Group
          value={saveLocation}
          onChange={e => setSaveLocation(e.target.value)}
          style={{ marginBottom: 16 }}
        >
          <Radio value="local">{t('advancedFilter.saveLocal')}</Radio>
          <Radio value="server">{t('advancedFilter.saveServer')}</Radio>
        </Radio.Group>

        {saveLocation === 'server' && (
          <div style={{ marginLeft: 24, marginBottom: 16 }}>
            <div>
              <Checkbox
                checked={isShared}
                onChange={(e: { target: { checked: boolean } }) => setIsShared(e.target.checked)}
                style={{ marginRight: 16 }}
              >
                {t('advancedFilter.shareWithOthers')}
              </Checkbox>
            </div>
            <div>
              <Checkbox
                checked={isDefault}
                onChange={(e: { target: { checked: boolean } }) => setIsDefault(e.target.checked)}
              >
                {t('advancedFilter.setAsDefault')}
              </Checkbox>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={() => setSaveModalVisible(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            onClick={() => handleSavePreset(saveLocation === 'server')}
            disabled={!presetName.trim() || loading}
            loading={loading}
          >
            {t('common.save')}
          </Button>
        </Space>
      </div>
    </Modal>
  </>
  );
};

export default AdvancedFilterDrawer;
