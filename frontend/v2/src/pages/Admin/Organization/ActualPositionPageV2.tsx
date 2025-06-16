import React, { useState, useRef } from 'react';
import { Space, Typography, App, Tag, Tooltip, Row, Col, Card, Statistic } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BranchesOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StopOutlined,
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  ProTable,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormDatePicker,
  ProFormSwitch,
  ProFormTreeSelect,
  ModalForm,
  PageContainer,
  ProCard,
  ProDescriptions
} from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import dayjs from 'dayjs';

import { 
  getPositions, 
  createPosition, 
  updatePosition, 
  deletePosition 
} from '../../../api/positions';
import { employeeService } from '../../../services/employeeService';
import type { 
  Position, 
  CreatePositionPayload, 
  UpdatePositionPayload 
} from '../../../api/types';
import ActionButton from '../../../components/common/ActionButton';
import { MetricCardGroup, type MetricCardProps } from '../../../components/common/MetricCard';
import OrganizationManagementTemplate from '../../../components/templates/OrganizationManagementTemplate';
import OrganizationTree, { 
  type TreeNodeData, 
  type TreeNodeRenderConfig,
  calculateMaxDepth 
} from '../../../components/common/OrganizationTree';

const { Text, Title } = Typography;

// 实际任职数据类型
interface ActualPosition extends Position {
  id: number;
  code?: string;
  name: string;
  description?: string;
  parent_position_id?: number | null;
  effective_date: string;
  end_date?: string | null;
  is_active: boolean;
  employee_count?: number; // 该职位的员工数量
  children_count?: number; // 子职位数量
  level?: number; // 层级深度
  parent_name?: string; // 父职位名称
}

// 表单数据类型
interface ActualPositionFormValues {
  code?: string;
  name: string;
  description?: string;
  parent_position_id?: number | null;
  effective_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs | null;
  is_active: boolean;
}

// 统计信息类型
interface PositionStats {
  totalPositions: number;
  activePositions: number;
  maxDepth: number;
  totalEmployees: number;
}

const ActualPositionPageV2: React.FC = () => {
  const { t } = useTranslation(['organization', 'common']);
  const { message, modal } = App.useApp();
  
  // 状态管理
  const [editingPosition, setEditingPosition] = useState<ActualPosition | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<ActualPosition | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [flatData, setFlatData] = useState<ActualPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [positionTreeData, setPositionTreeData] = useState<any[]>([]);
  const [stats, setStats] = useState<PositionStats>({
    totalPositions: 0,
    activePositions: 0,
    maxDepth: 0,
    totalEmployees: 0
  });
  
  // 表格引用
  const actionRef = useRef<ActionType>(null);
  
  // 构建树形选择器数据
  const buildTreeSelectData = (positions: ActualPosition[], parentId: number | null = null): any[] => {
    return positions
      .filter(pos => pos.parent_position_id === parentId)
      .map(pos => ({
        title: `${pos.name} (${pos.code || 'N/A'})`,
        value: pos.id,
        key: pos.id,
        children: buildTreeSelectData(positions, pos.id)
      }));
  };

  // 计算统计信息
  const calculateStats = (positions: ActualPosition[]): PositionStats => {
    const activePositions = positions.filter(pos => pos.is_active).length;
    
    // 计算最大深度
    const getMaxDepth = (posId: number | null, depth: number = 0): number => {
      const children = positions.filter(pos => pos.parent_position_id === posId);
      if (children.length === 0) return depth;
      return Math.max(...children.map(child => getMaxDepth(child.id, depth + 1)));
    };
    
    const maxDepth = getMaxDepth(null);
    const totalEmployees = positions.reduce((sum, pos) => sum + (pos.employee_count || 0), 0);

    return {
      totalPositions: positions.length,
      activePositions,
      maxDepth,
      totalEmployees
    };
  };

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getPositions({
        page: 1,
        size: 100,
        search: ''
      });
      
      if (response && response.data) {
        // 获取真实的员工数量和子职位数量
        const positionsWithCounts = await Promise.all(
          response.data.map(async (pos: Position) => {
            let employeeCount = 0;
            try {
              // 查询使用该实际职位的员工数量
              const employeeResponse = await employeeService.getEmployees({
                actual_position_id: pos.id,
                page: 1,
                size: 1 // 只需要获取总数，不需要具体数据
              });
              employeeCount = employeeResponse.meta?.total || 0;
            } catch (error) {
              console.warn(`获取职位 ${pos.name} 的员工数量失败:`, error);
              employeeCount = 0;
            }
            
            const childrenCount = response.data.filter((p: Position) => p.parent_position_id === pos.id).length;
            const parent = response.data.find((p: Position) => p.id === pos.parent_position_id);
            
            return {
              ...pos,
              employee_count: employeeCount,
              children_count: childrenCount,
              parent_name: parent?.name || null
            };
          })
        );
        
        setFlatData(positionsWithCounts);
        
        // 更新统计信息
        const calculatedStats = calculateStats(positionsWithCounts);
        setStats(calculatedStats);
        
        // 转换为TreeNodeData格式
        const treeNodeData: TreeNodeData[] = positionsWithCounts.map(pos => ({
          ...pos,
          key: pos.id.toString(),
          parent_id: pos.parent_position_id,
          employeeCount: pos.employee_count || 0
        }));
        setTreeData(treeNodeData);
        
        // 更新树形选择器数据
        const treeSelectData = buildTreeSelectData(positionsWithCounts);
        setPositionTreeData(treeSelectData);
      }
    } catch (error) {
      message.error('获取职位数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  React.useEffect(() => {
    fetchData();
  }, []);

  // 刷新数据
  const refreshData = () => {
    fetchData();
  };

  // 创建职位
  const handleCreate = async (values: ActualPositionFormValues) => {
    try {
      const payload: CreatePositionPayload = {
        code: values.code || null,
        name: values.name,
        description: values.description || null,
        parent_position_id: values.parent_position_id || null,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        is_active: values.is_active
      };
      
      await createPosition(payload);
      message.success('创建职位成功');
      setCreateModalVisible(false);
      refreshData();
    } catch (error: any) {
      message.error(`创建失败：${error.message}`);
    }
  };

  // 更新职位
  const handleUpdate = async (values: ActualPositionFormValues) => {
    if (!editingPosition) return;
    
    try {
      const payload: UpdatePositionPayload = {
        code: values.code || null,
        name: values.name,
        description: values.description || null,
        parent_position_id: values.parent_position_id || null,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        is_active: values.is_active
      };
      
      await updatePosition(editingPosition.id, payload);
      message.success('更新职位成功');
      setEditModalVisible(false);
      setEditingPosition(null);
      refreshData();
    } catch (error: any) {
      message.error(`更新失败：${error.message}`);
    }
  };

  // 删除职位
  const handleDelete = (record: ActualPosition) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除职位"${record.name}"吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await deletePosition(record.id);
          message.success('删除成功');
          refreshData();
        } catch (error: any) {
          message.error(`删除失败：${error.message}`);
        }
      },
    });
  };

  // 查看详情
  const handleViewDetail = (record: ActualPosition) => {
    setSelectedPosition(record);
    setDetailVisible(true);
  };

  // 表格列定义
  const columns: ProColumns<ActualPosition>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '职位代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      sorter: true,
      render: (text) => text ? <Text code>{text}</Text> : '-',
    },
    {
      title: '职位名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text, record, index) => (
        <Space>
          <Text strong>{text}</Text>
          {!record.is_active && <Tag color="red">停用</Tag>}
        </Space>
      ),
    },
    {
      title: '上级职位',
      dataIndex: 'parent_name',
      key: 'parent_name',
      ellipsis: true,
      hideInSearch: true,
      render: (text) => text || <Text type="secondary">根职位</Text>,
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      sorter: true,
      hideInSearch: true,
      render: (date: any) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '失效日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      hideInSearch: true,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '关联员工',
      dataIndex: 'employee_count',
      key: 'employee_count',
      width: 100,
      sorter: true,
      hideInSearch: true,
      render: (count) => (
        <Tag color="blue" icon={<TeamOutlined />}>
          {count || 0} 人
        </Tag>
      ),
    },
    {
      title: '子职位',
      dataIndex: 'children_count',
      key: 'children_count',
      width: 100,
      hideInSearch: true,
      render: (count) => (
        <Tag color="purple" icon={<BranchesOutlined />}>
          {count || 0} 个
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '停用', status: 'Error' },
      },
      render: (_, record, index) => (
        <Tag 
          color={record.is_active ? 'green' : 'red'}
          icon={record.is_active ? <CheckCircleOutlined /> : <StopOutlined />}
        >
          {record.is_active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      hideInSearch: true,
      render: (_, record, index) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <ActionButton
              size="small"
              type="text"
              icon={<ApartmentOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <ActionButton
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingPosition(record);
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <ActionButton
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 准备指标卡数据
  const metricsData: MetricCardProps[] = [
    {
      title: '总职位数',
      value: stats.totalPositions,
      icon: <ApartmentOutlined style={{ color: '#1890ff' }} />,
      status: 'default',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '启用职位',
      value: stats.activePositions,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      status: 'success',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '最大层级',
      value: stats.maxDepth,
      suffix: '级',
      icon: <BranchesOutlined style={{ color: '#fa8c16' }} />,
      status: 'processing',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '关联员工',
      value: stats.totalEmployees,
      suffix: '人',
      icon: <TeamOutlined style={{ color: '#722ed1' }} />,
      status: 'warning',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
  ];

  // 详情列配置
  const detailColumns = [
    {
      title: '职位名称',
      dataIndex: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '职位代码',
      dataIndex: 'code',
      render: (text: string) => text || '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (text: string) => text || '-'
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '失效日期',
      dataIndex: 'end_date',
      render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD') : '-'
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
      title: '关联员工',
      render: () => (
        <Tag color="blue">
          {selectedPosition ? (selectedPosition.employee_count || 0) : 0} 人
        </Tag>
      )
    }
  ];

  return (
    <div>
      <OrganizationManagementTemplate
        metrics={metricsData}
        metricsLoading={loading}
        treeConfig={{
          title: '职位结构',
          icon: <ApartmentOutlined />,
          badge: stats.totalPositions,
          badgeColor: '#1890ff',
          onAdd: () => setCreateModalVisible(true),
          addButtonText: '新建职位',
          loading: loading,
          children: (
            <OrganizationTree
              data={treeData}
              loading={loading}
              selectedKeys={selectedKeys}
              onSelect={(keys, info) => {
                setSelectedKeys(keys);
                if (info.selectedNodes && info.selectedNodes.length > 0) {
                  const selectedNode = info.selectedNodes[0];
                  const position = flatData.find(p => p.id.toString() === selectedNode.key);
                  setSelectedPosition(position || null);
                }
              }}
              renderConfig={{
                showCode: true,
                showBadge: true,
                badgeKey: 'employeeCount',
                showStatus: true
              }}
              emptyText="暂无职位数据"
            />
          )
        }}
        detailConfig={{
          title: '职位详情',
          icon: <BranchesOutlined />,
          selectedItem: selectedPosition,
          emptyText: '请选择职位查看详情',
          emptyIcon: <ApartmentOutlined />,
          onEdit: () => {
            setEditingPosition(selectedPosition);
            setEditModalVisible(true);
          },
          onDelete: () => selectedPosition && handleDelete(selectedPosition),
          editButtonText: '编辑职位',
          deleteButtonText: '删除职位',
          columns: detailColumns
        }}
      />

      {/* 创建表单 */}
      <ModalForm<ActualPositionFormValues>
        title="新建职位"
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
          label="职位代码"
          placeholder="请输入职位代码"
        />
        <ProFormText
          name="name"
          label="职位名称"
          placeholder="请输入职位名称"
          rules={[{ required: true, message: '请输入职位名称' }]}
        />
        <ProFormTreeSelect
          name="parent_position_id"
          label="上级职位"
          placeholder="请选择上级职位（可选）"
          allowClear
          fieldProps={{
            treeData: [
              { title: '无上级职位', value: undefined, key: 'root' },
              ...positionTreeData
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
      <ModalForm<ActualPositionFormValues>
        title="编辑职位"
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        initialValues={editingPosition ? {
          code: editingPosition.code,
          name: editingPosition.name,
          description: editingPosition.description,
          parent_position_id: editingPosition.parent_position_id,
          effective_date: dayjs(editingPosition.effective_date),
          end_date: editingPosition.end_date ? dayjs(editingPosition.end_date) : null,
          is_active: editingPosition.is_active,
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
          label="职位代码"
          placeholder="请输入职位代码"
        />
        <ProFormText
          name="name"
          label="职位名称"
          placeholder="请输入职位名称"
          rules={[{ required: true, message: '请输入职位名称' }]}
        />
        <ProFormTreeSelect
          name="parent_position_id"
          label="上级职位"
          placeholder="请选择上级职位（可选）"
          allowClear
          fieldProps={{
            treeData: [
              { title: '无上级职位', value: undefined, key: 'root' },
              ...positionTreeData.filter(pos => pos.value !== editingPosition?.id)
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
    </div>
  );
};

export default ActualPositionPageV2; 