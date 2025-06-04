import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Row, Col, Space, Typography, App, Tag, Tooltip, Divider } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StopOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  ProCard,
  ProDescriptions,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSwitch
} from '@ant-design/pro-components';
import dayjs from 'dayjs';

import { lookupService } from '../../../services/lookupService';
import { employeeService } from '../../../services/employeeService';
import type { LookupItem } from '../../../pages/HRManagement/types';
import ActionButton from '../../../components/common/ActionButton';
import OrganizationTree, { 
  type TreeNodeData, 
  type TreeNodeRenderConfig 
} from '../../../components/common/OrganizationTree';

const { Text, Title } = Typography;

// 职务级别数据类型
interface JobPositionLevel extends LookupItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  employee_count?: number; // 使用该级别的员工数量
}

// 表单数据类型
interface JobPositionLevelFormValues {
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

// 统计信息类型
interface LevelStats {
  totalLevels: number;
  activeLevels: number;
  totalEmployees: number;
  maxSortOrder: number;
}

const JobPositionLevelPageV2: React.FC = () => {
  const { t } = useTranslation(['organization', 'common']);
  const { message, modal } = App.useApp();
  
  // 状态管理
  const [editingLevel, setEditingLevel] = useState<JobPositionLevel | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<JobPositionLevel | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [levels, setLevels] = useState<JobPositionLevel[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LevelStats>({
    totalLevels: 0,
    activeLevels: 0,
    totalEmployees: 0,
    maxSortOrder: 0
  });

  // 简化的数据获取逻辑
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [levelsResponse, totalEmployeesResponse] = await Promise.all([
        lookupService.getJobPositionLevelsLookup(),
        employeeService.getEmployees({}) // 获取所有员工的总数
      ]);

      const levelsData = levelsResponse && Array.isArray(levelsResponse) ? levelsResponse : [];
      const totalEmployees = totalEmployeesResponse.meta?.total || 0;
      
      // 处理基础数据
      const levelsWithBasicData = levelsData.map((level: any) => ({
        ...level,
        id: level.id || level.value,
        code: String(level.code || level.value || ''),
        name: String(level.name || level.label || ''),
        description: String(level.description || ''),
        sort_order: Number(level.sort_order || 0),
        is_active: level.is_active !== false,
        employee_count: 0 // 初始设为0
      }));
      
      setLevels(levelsWithBasicData);
      
      // 转换为树形数据（职务级别是扁平结构，按排序显示），employeeCount暂时为0，稍后异步更新
      const treeNodeData: TreeNodeData[] = levelsWithBasicData
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(level => ({
          ...level,
          key: level.id.toString(),
          parent_id: null, // 职务级别是扁平结构
          employeeCount: 0 // 初始设为0，稍后由 fetchEmployeeCounts 更新
        }));
      setTreeData(treeNodeData);
      
      // 计算统计信息，totalEmployees 使用全局总数
      const calculatedStats: LevelStats = {
        totalLevels: levelsWithBasicData.length,
        activeLevels: levelsWithBasicData.filter(level => level.is_active).length,
        totalEmployees: totalEmployees, // 使用获取到的全局总员工数
        maxSortOrder: levelsWithBasicData.length > 0 ? Math.max(...levelsWithBasicData.map(level => level.sort_order)) : 0
      };
      setStats(calculatedStats);

      // 异步获取每个职务级别的员工数量
      if (levelsWithBasicData.length > 0) {
        fetchEmployeeCounts(levelsWithBasicData);
      }

    } catch (error) {
      console.error('获取职务级别数据失败:', error);
      message.error('获取职务级别数据失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  // 异步获取每个职务级别的员工数量
  const fetchEmployeeCounts = useCallback(async (levelsList: JobPositionLevel[]) => {
    try {
      const levelsWithActualEmployeeCount = await Promise.all(
        levelsList.map(async (level) => {
          try {
            const employeeResponse = await employeeService.getEmployees({
              job_position_level_lookup_value_id: level.id,
              page: 1,
              size: 1 // 只需要获取总数
            });
            const actualEmployeeCount = employeeResponse.meta?.total || 0;
            console.log(`💡 职务级别: ${level.name} (ID: ${level.id}), 实际关联员工数量: ${actualEmployeeCount}`);
            
            return {
              ...level,
              employee_count: actualEmployeeCount
            };
          } catch (error) {
            console.warn(`⚠️ 获取职务级别 ${level.name} 的实际员工数量失败:`, error);
            return {
              ...level,
              employee_count: 0
            };
          }
        })
      );
      
      setLevels(levelsWithActualEmployeeCount);
      
      // 更新树形数据以反映准确的员工数量
      const updatedTreeData: TreeNodeData[] = levelsWithActualEmployeeCount
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(level => ({
          ...level,
          key: level.id.toString(),
          parent_id: null,
          employeeCount: level.employee_count || 0 // 使用实际获取的员工数
        }));
      setTreeData(updatedTreeData);

    } catch (error) {
      console.error('❌ 获取单个职务级别员工数量失败:', error);
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 刷新数据
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 创建职务级别
  const handleCreate = async (values: JobPositionLevelFormValues) => {
    try {
      const lookupTypeId = await lookupService.getLookupTypeIdByCode('JOB_POSITION_LEVEL');
      if (!lookupTypeId) {
        throw new Error('无法获取职务级别类型ID');
      }
      
      await lookupService.createLookupValue({
        lookup_type_id: lookupTypeId,
        code: values.code,
        name: values.name,
        label: values.name,
        value: values.code,
        description: values.description,
        sort_order: values.sort_order,
        is_active: values.is_active
      });
      
      message.success('创建职务级别成功');
      setCreateModalVisible(false);
      refreshData();
    } catch (error: any) {
      message.error(`创建失败：${error.message}`);
    }
  };

  // 更新职务级别
  const handleUpdate = async (values: JobPositionLevelFormValues) => {
    if (!editingLevel) return;
    
    try {
      await lookupService.updateLookupValue(editingLevel.id, {
        code: values.code,
        name: values.name,
        label: values.name,
        value: values.code,
        description: values.description,
        sort_order: values.sort_order,
        is_active: values.is_active
      });
      
      message.success('更新职务级别成功');
      setEditModalVisible(false);
      setEditingLevel(null);
      refreshData();
    } catch (error: any) {
      message.error(`更新失败：${error.message}`);
    }
  };

  // 删除职务级别
  const handleDelete = useCallback((record: JobPositionLevel) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除职务级别"${record.name}"吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await lookupService.deleteLookupValue(record.id);
          message.success('删除成功');
          refreshData();
        } catch (error: any) {
          message.error(`删除失败：${error.message}`);
        }
      },
    });
  }, [modal, message, refreshData]);

  // 编辑级别
  const handleEdit = (level: JobPositionLevel) => {
    setEditingLevel(level);
    setEditModalVisible(true);
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 统计卡片 */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <SortAscendingOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.totalLevels}</div>
                  <div style={{ color: '#666' }}>总级别数</div>
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.activeLevels}</div>
                  <div style={{ color: '#666' }}>启用级别</div>
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.totalEmployees}</div>
                  <div style={{ color: '#666' }}>关联员工</div>
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <SettingOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.maxSortOrder}</div>
                  <div style={{ color: '#666' }}>最大排序</div>
                </div>
              </ProCard>
            </Col>
          </Row>
        </Col>

        {/* 主要内容区域 */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            {/* 左侧：级别列表 */}
            <Col span={12}>
              <ProCard 
                title="职务级别列表"
                extra={
                  <Space>
                    <ActionButton
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                    >
                      新建级别
                    </ActionButton>
                  </Space>
                }
                loading={loading}
                style={{ minHeight: 600 }}
              >
                <OrganizationTree
                  data={treeData}
                  loading={loading}
                  selectedKeys={selectedKeys}
                  onSelect={(keys, info) => {
                    setSelectedKeys(keys);
                    if (info.selectedNodes && info.selectedNodes.length > 0) {
                      const selectedNode = info.selectedNodes[0];
                      const level = levels.find(l => l.id.toString() === selectedNode.key);
                      setSelectedLevel(level || null);
                    }
                  }}
                                     renderConfig={{
                     showCode: true,
                     showBadge: true,
                     badgeKey: 'employeeCount',
                     showStatus: true
                   }}
                  emptyText="暂无职务级别数据"
                />
              </ProCard>
            </Col>

            {/* 右侧：详情面板 */}
            <Col span={12}>
              <ProCard 
                title={selectedLevel ? "级别详情" : "选择一个职务级别查看详情"}
                style={{ minHeight: 600 }}
              >
                {selectedLevel ? (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* 基本信息 */}
                    <ProDescriptions
                      title="基本信息"
                      column={1}
                      bordered
                      size="small"
                    >
                      <ProDescriptions.Item label="级别名称">
                        <Space>
                          <Text strong>{selectedLevel.name}</Text>
                          {!selectedLevel.is_active && (
                            <Tag color="red">已停用</Tag>
                          )}
                        </Space>
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="级别代码">
                        <Text code>{selectedLevel.code}</Text>
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="描述">
                        {selectedLevel.description || '-'}
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="排序">
                        <Space>
                          <SortAscendingOutlined style={{ color: '#1890ff' }} />
                          <Text>{selectedLevel.sort_order}</Text>
                        </Space>
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="状态">
                        <Tag 
                          color={selectedLevel.is_active ? 'green' : 'red'}
                          icon={selectedLevel.is_active ? <CheckCircleOutlined /> : <StopOutlined />}
                        >
                          {selectedLevel.is_active ? '启用' : '停用'}
                        </Tag>
                      </ProDescriptions.Item>
                    </ProDescriptions>

                    {/* 统计信息 */}
                    <ProDescriptions
                      title="统计信息"
                      column={1}
                      bordered
                      size="small"
                    >
                      <ProDescriptions.Item label="关联员工数">
                        <Tag color="blue" icon={<TeamOutlined />}>
                          {selectedLevel.employee_count || 0} 人
                        </Tag>
                      </ProDescriptions.Item>
                    </ProDescriptions>

                    {/* 操作按钮 */}
                    <Divider />
                    <Space>
                      <ActionButton
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(selectedLevel)}
                      >
                        编辑级别
                      </ActionButton>
                      <ActionButton
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(selectedLevel)}
                      >
                        删除级别
                      </ActionButton>
                    </Space>
                  </Space>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 0',
                    color: '#999'
                  }}>
                    <SortAscendingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>请在左侧选择一个职务级别</div>
                    <div style={{ fontSize: '12px', marginTop: 8 }}>
                      点击级别节点查看详细信息
                    </div>
                  </div>
                )}
              </ProCard>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* 创建表单 */}
      <ModalForm<JobPositionLevelFormValues>
        title="新建职务级别"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        modalProps={{
          destroyOnHidden: true,
        }}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <ProFormText
          name="code"
          label="级别代码"
          placeholder="请输入级别代码"
          rules={[
            { required: true, message: '请输入级别代码' },
            { pattern: /^[A-Z0-9_]+$/, message: '代码只能包含大写字母、数字和下划线' }
          ]}
        />
        <ProFormText
          name="name"
          label="级别名称"
          placeholder="请输入级别名称"
          rules={[{ required: true, message: '请输入级别名称' }]}
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入描述信息"
          fieldProps={{ rows: 3 }}
        />
        <ProFormDigit
          name="sort_order"
          label="排序"
          placeholder="请输入排序数字"
          min={0}
          max={9999}
          initialValue={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormSwitch
          name="is_active"
          label="启用状态"
          initialValue={true}
        />
      </ModalForm>

      {/* 编辑表单 */}
      <ModalForm<JobPositionLevelFormValues>
        title="编辑职务级别"
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        initialValues={editingLevel ? {
          code: editingLevel.code,
          name: editingLevel.name,
          description: editingLevel.description,
          sort_order: editingLevel.sort_order,
          is_active: editingLevel.is_active,
        } : undefined}
        modalProps={{
          destroyOnHidden: true,
        }}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <ProFormText
          name="code"
          label="级别代码"
          placeholder="请输入级别代码"
          rules={[
            { required: true, message: '请输入级别代码' },
            { pattern: /^[A-Z0-9_]+$/, message: '代码只能包含大写字母、数字和下划线' }
          ]}
        />
        <ProFormText
          name="name"
          label="级别名称"
          placeholder="请输入级别名称"
          rules={[{ required: true, message: '请输入级别名称' }]}
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入描述信息"
          fieldProps={{ rows: 3 }}
        />
        <ProFormDigit
          name="sort_order"
          label="排序"
          placeholder="请输入排序数字"
          min={0}
          max={9999}
          fieldProps={{ precision: 0 }}
        />
        <ProFormSwitch
          name="is_active"
          label="启用状态"
        />
      </ModalForm>
    </div>
  );
};

export default JobPositionLevelPageV2; 