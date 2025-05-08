import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Divider, DatePicker, InputNumber, Tag, Typography, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

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
}

interface AdvancedFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  columns: TableColumnsType<any>;
  onApplyFilter: (groups: FilterGroup[]) => void;
  initialConditions?: FilterCondition[] | FilterGroup[];
}

// 定义操作符选项类型
interface OperatorOption {
  value: string;
  label: string;
}

// 获取字段类型
const getFieldType = (field: string, columns: TableColumnsType<any>): string => {
  const column = columns.find(col => col.dataIndex === field);
  if (!column) return 'string';

  // 根据列的属性判断类型
  if (column.dataIndex?.toString().includes('date') || column.dataIndex?.toString().includes('time')) {
    return 'date';
  }

  if (column.dataIndex?.toString().includes('id') && column.dataIndex?.toString() !== 'id_card_number') {
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
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');

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
    const savedPresets = localStorage.getItem('tableFilterPresets');
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
  }, []);

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

    onApplyFilter(validGroups);
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

  // 保存筛选方案
  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    // 过滤掉空条件，只保留有效的条件组
    const validGroups = groups
      .map(group => ({
        ...group,
        conditions: group.conditions.filter(c => c.field && c.operator)
      }))
      .filter(group => group.conditions.length > 0);

    if (validGroups.length === 0) return;

    const newPreset: FilterPreset = {
      id: generateId(),
      name: presetName,
      groups: validGroups,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('tableFilterPresets', JSON.stringify(updatedPresets));
    setPresetName('');
  };

  // 加载筛选方案
  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && preset.groups) {
      setGroups(preset.groups);
    }
  };

  // 删除筛选方案
  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem('tableFilterPresets', JSON.stringify(updatedPresets));
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
            onChange={value => updateCondition(groupId, condition.id, 'value', value)}
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
            onChange={e => updateCondition(groupId, condition.id, 'value', e.target.value)}
            placeholder={t('advancedFilter.valuePlaceholder')}
          />
        );
    }
  };

  return (
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
        {presets.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{t('advancedFilter.savedPresets')}</Text>
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
            </div>
            <Divider />
          </>
        )}

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
            {group.conditions.map((condition, condIndex) => (
              <div key={condition.id} style={{ marginBottom: 16 }}>
                <Space style={{ width: '100%' }} direction="vertical">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Select
                      style={{ width: '40%' }}
                      value={condition.field}
                      onChange={value => updateCondition(group.id, condition.id, 'field', value)}
                      placeholder={t('advancedFilter.selectField')}
                    >
                      {columns.map(col => (
                        <Option key={col.dataIndex?.toString()} value={col.dataIndex?.toString() || ''}>
                          {typeof col.title === 'string' ? col.title : col.dataIndex?.toString()}
                        </Option>
                      ))}
                    </Select>

                    <Select
                      style={{ width: '30%' }}
                      value={condition.operator}
                      onChange={value => updateCondition(group.id, condition.id, 'operator', value)}
                      placeholder={t('advancedFilter.selectOperator')}
                    >
                      {getOperatorOptions(getFieldType(condition.field, columns)).map(op => (
                        <Option key={op.value} value={op.value}>{op.label}</Option>
                      ))}
                    </Select>

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
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder={t('advancedFilter.presetNamePlaceholder')}
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export default AdvancedFilterDrawer;
