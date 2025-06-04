import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Row, 
  Col, 
  Space, 
  Typography, 
  Tag, 
  Badge, 
  Tooltip, 
  Divider, 
  App,
  Tree
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  TeamOutlined,
  BranchesOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { 
  PageContainer, 
  ProCard, 
  ProDescriptions,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormTreeSelect,
  ProFormDatePicker,
  ProFormSwitch
} from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import ActionButton from '../../../components/common/ActionButton';
import { MetricCardGroup, type MetricCardProps } from '../../../components/common/MetricCard';
import OrganizationManagementTemplate from '../../../components/templates/OrganizationManagementTemplate';
import OrganizationTree, { 
  type TreeNodeData, 
  type TreeNodeRenderConfig,
  calculateMaxDepth 
} from '../../../components/common/OrganizationTree';
import type { PersonnelCategory, CreatePersonnelCategoryPayload, UpdatePersonnelCategoryPayload } from '../../../api/types';
import { 
  getPersonnelCategories,
  createPersonnelCategory,
  updatePersonnelCategory,
  deletePersonnelCategory,
  getPersonnelCategoryEmployeeStats,
  type PersonnelCategoryStats
} from '../../../api/personnelCategories';
import { employeeService } from '../../../services/employeeService';

const { Title, Text } = Typography;
const { DirectoryTree } = Tree;

// 扩展的人员身份数据类型
interface PersonnelCategoryTreeNode extends PersonnelCategory {
  key: string;
  title: React.ReactNode;
  children?: PersonnelCategoryTreeNode[];
  employeeCount?: number; // 该分类下的员工数量
  level?: number; // 层级深度
}

// 表单数据类型
interface PersonnelCategoryFormValues {
  code: string;
  name: string;
  description?: string;
  parent_category_id?: number | null;
  effective_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs | null;
  is_active: boolean;
}

// 统计信息类型
interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  maxDepth: number;
  employeeDistribution: Record<number, number>;
}

const PersonnelCategoriesPageV2: React.FC = () => {
  const { t } = useTranslation(['personnelCategory', 'common']);
  const { message, modal } = App.useApp();

  // 安全地处理日期格式化的工具函数
  const formatDate = useCallback((date: any): string => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (dayjs.isDayjs(date)) return date.format('YYYY-MM-DD');
    return dayjs(date).format('YYYY-MM-DD');
  }, []);
  
  // 状态管理
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [flatData, setFlatData] = useState<PersonnelCategory[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PersonnelCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<PersonnelCategory | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CategoryStats>({
    totalCategories: 0,
    activeCategories: 0,
    maxDepth: 0,
    employeeDistribution: {}
  });

  // 表单引用
  const createFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);

  // 构建树形数据结构 - 移除对 stats 的依赖，改为接收参数
  const buildTreeData = useCallback((
    categories: PersonnelCategory[], 
    employeeDistribution: Record<number, number>,
    parentId: number | null = null,
    level: number = 0
  ): PersonnelCategoryTreeNode[] => {
    const children = categories
      .filter(cat => cat.parent_category_id === parentId)
      .map(cat => {
        const childNodes = buildTreeData(categories, employeeDistribution, cat.id, level + 1);
        
        // 计算该节点及其子节点的员工总数
        const employeeCount = (employeeDistribution[cat.id] || 0) + 
          childNodes.reduce((sum, child) => sum + (child.employeeCount || 0), 0);

        return {
          ...cat,
          key: cat.id.toString(),
          level,
          employeeCount,
          children: childNodes,
          title: (
            <div className="tree-node-title">
              <Space>
                <Text strong={level === 0}>{cat.name}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({cat.code})
                </Text>
                {employeeCount > 0 && (
                  <Badge 
                    count={employeeCount} 
                    size="small" 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                )}
                {!cat.is_active && (
                  <Tag color="red">停用</Tag>
                )}
              </Space>
            </div>
          )
        };
      });

    return children;
  }, []);

  // 计算统计信息 - 使用真实的员工分布数据
  const calculateStats = useCallback((categories: PersonnelCategory[], employeeStats: PersonnelCategoryStats[]): CategoryStats => {
    const activeCategories = categories.filter(cat => cat.is_active).length;
    
    // 计算最大深度
    const getMaxDepth = (catId: number | null, depth: number = 0): number => {
      const children = categories.filter(cat => cat.parent_category_id === catId);
      if (children.length === 0) return depth;
      return Math.max(...children.map(child => getMaxDepth(child.id, depth + 1)));
    };
    
    const maxDepth = getMaxDepth(null);
    
    // 使用真实的员工分布数据
    const employeeDistribution: Record<number, number> = {};
    employeeStats.forEach(stat => {
      employeeDistribution[stat.category_id] = stat.employee_count;
    });

    return {
      totalCategories: categories.length,
      activeCategories,
      maxDepth,
      employeeDistribution
    };
  }, []);

  // 获取数据 - 使用真实的API数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行获取分类数据和员工统计数据
      const [categoriesResponse, employeeStatsResponse] = await Promise.all([
        getPersonnelCategories({
          search: '',
          size: 100,
        }),
        getPersonnelCategoryEmployeeStats()
      ]);

      const categories = categoriesResponse.data || [];
      const employeeStats = employeeStatsResponse.data || [];
      
      setFlatData(categories);
      
      const calculatedStats = calculateStats(categories, employeeStats);
      setStats(calculatedStats);
      
      // 转换为TreeNodeData格式
      const treeNodeData: TreeNodeData[] = categories.map(cat => ({
        ...cat,
        key: cat.id.toString(),
        parent_id: cat.parent_category_id,
        employeeCount: calculatedStats.employeeDistribution[cat.id] || 0
      }));
      setTreeData(treeNodeData);
      
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error(t('message.fetch_list_failed'));
    } finally {
      setLoading(false);
    }
  }, [t, message, buildTreeData, calculateStats]);

  // 只在组件挂载时获取数据
  useEffect(() => {
    fetchData();
  }, []); // 移除 fetchData 依赖，避免无限循环

  // 提供一个刷新函数供其他操作调用
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 树节点选择处理 - 已移除，使用OrganizationTree的onSelect

  // 创建子分类
  const handleCreateChild = (parentCategory: PersonnelCategory | { id: number }) => {
    setEditingCategory(null);
    setCreateModalVisible(true);
    // 如果有父分类，预设父分类ID
    if (parentCategory.id !== 0) {
      setTimeout(() => {
        createFormRef.current?.setFieldsValue({
          parent_category_id: parentCategory.id,
          is_active: true,
          effective_date: dayjs()
        });
      }, 100);
    }
  };

  // 编辑分类
  const handleEdit = (category: PersonnelCategory) => {
    setEditingCategory(category);
    setEditModalVisible(true);
  };

  // 删除分类
  const handleDelete = (category: PersonnelCategory) => {
    modal.confirm({
      title: t('message.confirm_delete'),
      content: `确定要删除人员身份"${category.name}"吗？`,
      onOk: async () => {
        try {
          await deletePersonnelCategory(category.id);
          message.success(t('message.delete_success'));
          refreshData();
        } catch (error) {
          message.error(t('message.delete_failed'));
        }
      },
    });
  };

  // 创建分类
  const handleCreate = async (values: PersonnelCategoryFormValues) => {
    try {
      const payload: CreatePersonnelCategoryPayload = {
        code: values.code,
        name: values.name,
        description: values.description || null,
        parent_category_id: values.parent_category_id || null,
        effective_date: formatDate(values.effective_date),
        end_date: values.end_date ? formatDate(values.end_date) : null,
        is_active: values.is_active
      };
      
      await createPersonnelCategory(payload);
      message.success('创建人员身份成功');
      setCreateModalVisible(false);
      refreshData();
    } catch (error: any) {
      console.error('创建失败:', error);
      message.error(`创建失败：${error.message}`);
    }
  };

  // 更新分类
  const handleUpdate = async (values: PersonnelCategoryFormValues) => {
    if (!editingCategory) return;
    
    try {
      const payload: UpdatePersonnelCategoryPayload = {
        code: values.code,
        name: values.name,
        description: values.description || null,
        parent_category_id: values.parent_category_id || null,
        effective_date: formatDate(values.effective_date),
        end_date: values.end_date ? formatDate(values.end_date) : null,
        is_active: values.is_active
      };
      
      await updatePersonnelCategory(editingCategory.id, payload);
      message.success('更新人员身份成功');
      setEditModalVisible(false);
      setEditingCategory(null);
      refreshData();
    } catch (error: any) {
      console.error('更新失败:', error);
      message.error(`更新失败：${error.message}`);
    }
  };

  // 准备指标卡数据
  const metricsData: MetricCardProps[] = [
    {
      title: '总分类数',
      value: stats.totalCategories,
      icon: <TeamOutlined style={{ color: '#1890ff' }} />,
      status: 'default',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '启用分类',
      value: stats.activeCategories,
      icon: <BranchesOutlined style={{ color: '#52c41a' }} />,
      status: 'success',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '最大层级',
      value: stats.maxDepth,
      suffix: '级',
      icon: <SettingOutlined style={{ color: '#fa8c16' }} />,
      status: 'processing',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '关联员工',
      value: Object.values(stats.employeeDistribution).reduce((sum, count) => sum + count, 0),
      suffix: '人',
      icon: <TeamOutlined style={{ color: '#722ed1' }} />,
      status: 'warning',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
  ];

  // 详情列配置
  const detailColumns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '分类代码',
      dataIndex: 'code',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (text: string) => text || '-'
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      render: (text: any) => formatDate(text)
    },
    {
      title: '失效日期',
      dataIndex: 'end_date',
      render: (text: any) => text ? formatDate(text) : '-'
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '层级深度',
      render: () => selectedCategory?.parent_category_id ? '子分类' : '根分类'
    },
    {
      title: '关联员工',
      render: () => (
        <Badge 
          count={selectedCategory ? (stats.employeeDistribution[selectedCategory.id] || 0) : 0} 
          showZero 
          style={{ backgroundColor: '#52c41a' }}
        />
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 左侧：统计卡片 */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.totalCategories}</div>
                  <div style={{ color: '#666' }}>总分类数</div>
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <BranchesOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.activeCategories}</div>
                  <div style={{ color: '#666' }}>启用分类</div>
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <SettingOutlined style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.maxDepth}</div>
                  <div style={{ color: '#666' }}>最大层级</div>
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <div style={{ textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {Object.values(stats.employeeDistribution).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <div style={{ color: '#666' }}>关联员工</div>
                </div>
              </ProCard>
            </Col>
          </Row>
        </Col>

        {/* 主要内容区域 */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            {/* 左侧：树形结构 */}
            <Col span={12}>
              <ProCard 
                title="人员身份分类树"
                extra={
                  <Space>
                    <ActionButton
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleCreateChild({ id: 0 } as PersonnelCategoryTreeNode)}
                    >
                      新建
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
                      const category = flatData.find(c => c.id.toString() === selectedNode.key);
                      setSelectedCategory(category || null);
                    }
                  }}
                  renderConfig={{
                    showCode: true,
                    showBadge: true,
                    badgeKey: 'employeeCount',
                    showStatus: true
                  }}
                  emptyText="暂无人员身份数据"
                />
              </ProCard>
            </Col>

            {/* 右侧：详情面板 */}
            <Col span={12}>
              <ProCard 
                title={selectedCategory ? "分类详情" : "选择一个分类查看详情"}
                style={{ minHeight: 600 }}
              >
                {selectedCategory ? (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* 基本信息 */}
                    <ProDescriptions
                      title="基本信息"
                      column={1}
                      bordered
                      size="small"
                    >
                      <ProDescriptions.Item label="分类名称">
                        <Space>
                          <Text strong>{selectedCategory.name}</Text>
                          {!selectedCategory.is_active && (
                            <Tag color="red">已停用</Tag>
                          )}
                        </Space>
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="分类代码">
                        <Text code>{selectedCategory.code}</Text>
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="描述">
                        {selectedCategory.description || '-'}
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="生效日期">
                        {dayjs(selectedCategory.effective_date).format('YYYY-MM-DD')}
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="失效日期">
                        {selectedCategory.end_date 
                          ? dayjs(selectedCategory.end_date).format('YYYY-MM-DD')
                          : '-'
                        }
                      </ProDescriptions.Item>
                    </ProDescriptions>

                    {/* 层级信息 */}
                    <ProDescriptions
                      title="层级信息"
                      column={1}
                      bordered
                      size="small"
                    >
                      <ProDescriptions.Item label="层级深度">
                        {selectedCategory.parent_category_id ? '子分类' : '根分类'}
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="父级分类">
                        {selectedCategory.parent_category_id ? (
                          (() => {
                            const parent = flatData.find(cat => cat.id === selectedCategory.parent_category_id);
                            return parent ? `${parent.name} (${parent.code})` : '-';
                          })()
                        ) : '根分类'}
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="子分类数量">
                        {flatData.filter(cat => cat.parent_category_id === selectedCategory.id).length} 个
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
                        <Badge 
                          count={stats.employeeDistribution[selectedCategory.id] || 0} 
                          style={{ backgroundColor: '#52c41a' }}
                        />
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="状态">
                        <Tag color={selectedCategory.is_active ? 'green' : 'red'}>
                          {selectedCategory.is_active ? '启用' : '停用'}
                        </Tag>
                      </ProDescriptions.Item>
                    </ProDescriptions>

                    {/* 操作按钮 */}
                    <Divider />
                    <Space>
                      <ActionButton
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(selectedCategory)}
                      >
                        编辑分类
                      </ActionButton>
                      <ActionButton
                        icon={<PlusOutlined />}
                        onClick={() => handleCreateChild(selectedCategory)}
                      >
                        新建子分类
                      </ActionButton>
                      <ActionButton
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(selectedCategory)}
                      >
                        删除分类
                      </ActionButton>
                    </Space>
                  </Space>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 0',
                    color: '#999'
                  }}>
                    <TeamOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>请在左侧选择一个人员身份分类</div>
                    <div style={{ fontSize: '12px', marginTop: 8 }}>
                      点击分类节点查看详细信息
                    </div>
                  </div>
                )}
              </ProCard>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* 创建表单 */}
      <ModalForm<PersonnelCategoryFormValues>
        title="新建人员身份"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        formRef={createFormRef}
        modalProps={{
          destroyOnHidden: true,
        }}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <ProFormText
          name="code"
          label="身份代码"
          placeholder="请输入身份代码"
          rules={[{ required: true, message: '请输入身份代码' }]}
        />
        <ProFormText
          name="name"
          label="身份名称"
          placeholder="请输入身份名称"
          rules={[{ required: true, message: '请输入身份名称' }]}
        />
        <ProFormTreeSelect
          name="parent_category_id"
          label="上级分类"
          placeholder="请选择上级分类（可选）"
          allowClear
          fieldProps={{
            treeData: [
              { title: '无上级分类', value: undefined, key: 'root' },
              ...flatData.map(cat => ({
                title: `${cat.name} (${cat.code})`,
                value: cat.id,
                key: cat.id
              }))
            ]
          }}
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入描述信息"
          fieldProps={{ rows: 3 }}
        />
        <ProFormDatePicker
          name="effective_date"
          label="生效日期"
          rules={[{ required: true, message: '请选择生效日期' }]}
          initialValue={dayjs()}
        />
        <ProFormDatePicker
          name="end_date"
          label="失效日期"
          placeholder="请选择失效日期（可选）"
        />
        <ProFormSwitch
          name="is_active"
          label="启用状态"
          initialValue={true}
        />
      </ModalForm>

      {/* 编辑表单 */}
      <ModalForm<PersonnelCategoryFormValues>
        title="编辑人员身份"
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        formRef={editFormRef}
        initialValues={editingCategory ? {
          code: editingCategory.code,
          name: editingCategory.name,
          description: editingCategory.description,
          parent_category_id: editingCategory.parent_category_id,
          effective_date: dayjs(editingCategory.effective_date),
          end_date: editingCategory.end_date ? dayjs(editingCategory.end_date) : null,
          is_active: editingCategory.is_active,
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
          label="身份代码"
          placeholder="请输入身份代码"
          rules={[{ required: true, message: '请输入身份代码' }]}
        />
        <ProFormText
          name="name"
          label="身份名称"
          placeholder="请输入身份名称"
          rules={[{ required: true, message: '请输入身份名称' }]}
        />
        <ProFormTreeSelect
          name="parent_category_id"
          label="上级分类"
          placeholder="请选择上级分类（可选）"
          allowClear
          fieldProps={{
            treeData: [
              { title: '无上级分类', value: undefined, key: 'root' },
              ...flatData.filter(cat => cat.id !== editingCategory?.id).map(cat => ({
                title: `${cat.name} (${cat.code})`,
                value: cat.id,
                key: cat.id
              }))
            ]
          }}
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入描述信息"
          fieldProps={{ rows: 3 }}
        />
        <ProFormDatePicker
          name="effective_date"
          label="生效日期"
          rules={[{ required: true, message: '请选择生效日期' }]}
        />
        <ProFormDatePicker
          name="end_date"
          label="失效日期"
          placeholder="请选择失效日期（可选）"
        />
        <ProFormSwitch
          name="is_active"
          label="启用状态"
        />
      </ModalForm>

      {/* 自定义样式 */}
      <style>{`
        .tree-node-title:hover .tree-node-actions {
          opacity: 1 !important;
        }
        .ant-tree-node-content-wrapper:hover .tree-node-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default PersonnelCategoriesPageV2; 