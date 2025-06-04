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
  BankOutlined,
  BranchesOutlined,
  SettingOutlined,
  ApartmentOutlined,
  TeamOutlined
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
  ProFormSwitch,
  StatisticCard
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
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from '../../../api/types';
import { 
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../../../api/departments';

const { Title, Text } = Typography;
const { DirectoryTree } = Tree;

// 扩展的部门数据类型
interface DepartmentTreeNode extends Department {
  employeeCount?: number; // 该部门下的员工数量
  parent_id?: number | null; // 映射到TreeNodeData的parent_id
}

// 表单数据类型
interface DepartmentFormValues {
  code: string;
  name: string;
  description?: string;
  parent_department_id?: number | null;
  effective_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs | null;
  is_active: boolean;
}

// 统计信息类型
interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  maxDepth: number;
  employeeDistribution: Record<number, number>;
}

const DepartmentManagementPageV2: React.FC = () => {
  const { t } = useTranslation(['department', 'common']);
  const { message, modal } = App.useApp();

  // 安全地处理日期格式化的工具函数
  const formatDate = useCallback((date: any): string => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (dayjs.isDayjs(date)) return date.format('YYYY-MM-DD');
    return dayjs(date).format('YYYY-MM-DD');
  }, []);
  
  // 状态管理
  const [flatData, setFlatData] = useState<Department[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DepartmentStats>({
    totalDepartments: 0,
    activeDepartments: 0,
    maxDepth: 0,
    employeeDistribution: {}
  });

  // 表单引用
  const createFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);

  // 构建树形数据结构
  const buildTreeData = useCallback((
    departments: Department[], 
    employeeDistribution: Record<number, number>,
    parentId: number | null = null,
    level: number = 0
  ): DepartmentTreeNode[] => {
    const children = departments
      .filter(dept => dept.parent_department_id === parentId)
      .map(dept => {
        const childNodes = buildTreeData(departments, employeeDistribution, dept.id, level + 1);
        
        // 计算该节点及其子节点的员工总数
        const employeeCount = (employeeDistribution[dept.id] || 0) + 
          childNodes.reduce((sum, child) => sum + (child.employeeCount || 0), 0);

        return {
          ...dept,
          key: dept.id.toString(),
          level,
          employeeCount,
          children: childNodes,
          title: (
            <div className="tree-node-title">
              <Space>
                <Text strong={level === 0}>{dept.name}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({dept.code})
                </Text>
                {employeeCount > 0 && (
                  <Badge 
                    count={employeeCount} 
                    size="small" 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                )}
                {!dept.is_active && (
                  <Tag color="red">停用</Tag>
                )}
              </Space>
            </div>
          )
        };
      });

    return children;
  }, []);

  // 计算统计信息
  const calculateStats = useCallback((departments: Department[]): DepartmentStats => {
    const activeDepartments = departments.filter(dept => dept.is_active).length;
    
    // 计算最大深度
    const getMaxDepth = (deptId: number | null, depth: number = 0): number => {
      const children = departments.filter(dept => dept.parent_department_id === deptId);
      if (children.length === 0) return depth;
      return Math.max(...children.map(child => getMaxDepth(child.id, depth + 1)));
    };
    
    const maxDepth = getMaxDepth(null);
    
    // 模拟员工分布数据（实际应该从API获取）
    const employeeDistribution: Record<number, number> = {};
    departments.forEach(dept => {
      employeeDistribution[dept.id] = Math.floor(Math.random() * 20); // 模拟数据
    });

    return {
      totalDepartments: departments.length,
      activeDepartments,
      maxDepth,
      employeeDistribution
    };
  }, []);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDepartments({
        search: '',
        size: 100,
      });

      const departments = response.data || [];
      const calculatedStats = calculateStats(departments);
      
      setFlatData(departments);
      setStats(calculatedStats);
      
      // 转换为TreeNodeData格式
      const treeNodeData: TreeNodeData[] = departments.map(dept => ({
        ...dept,
        key: dept.id.toString(),
        parent_id: dept.parent_department_id,
        employeeCount: calculatedStats.employeeDistribution[dept.id] || 0
      }));
      setTreeData(treeNodeData);
      
    } catch (error) {
      console.error('获取部门数据失败:', error);
      message.error('获取部门数据失败');
    } finally {
      setLoading(false);
    }
  }, [buildTreeData, calculateStats, message]);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

    // 准备指标卡数据
  const metricsData: MetricCardProps[] = [
    {
      title: '总部门数',
      value: stats.totalDepartments,
      icon: <BankOutlined style={{ color: '#1890ff' }} />,
      status: 'default',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '启用部门',
      value: stats.activeDepartments,
      icon: <BranchesOutlined style={{ color: '#52c41a' }} />,
      status: 'success',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '最大层级',
      value: stats.maxDepth,
      suffix: '级',
      icon: <ApartmentOutlined style={{ color: '#722ed1' }} />,
      status: 'processing',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
    {
      title: '总员工数',
      value: Object.values(stats.employeeDistribution).reduce((sum, count) => sum + count, 0),
      suffix: '人',
      icon: <TeamOutlined style={{ color: '#fa8c16' }} />,
      status: 'warning',
      colSpan: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
    },
  ];

  // 详情列配置
  const detailColumns = [
    {
      title: '部门名称',
      dataIndex: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '部门编码',
      dataIndex: 'code',
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
      title: '员工数量',
      render: () => {
        const employeeCount = selectedDepartment ? (stats.employeeDistribution[selectedDepartment.id] || 0) : 0;
        return (
          <Badge 
            count={employeeCount} 
            showZero 
            style={{ backgroundColor: '#52c41a' }}
          />
        );
      }
    }
  ];

  return (
    <OrganizationManagementTemplate
      metrics={metricsData}
      metricsLoading={loading}
      treeConfig={{
        title: '部门结构',
        icon: <BankOutlined />,
        badge: stats.totalDepartments,
        badgeColor: '#1890ff',
        onAdd: () => setCreateModalVisible(true),
        addButtonText: '新建部门',
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
                const department = flatData.find(d => d.id.toString() === selectedNode.key);
                setSelectedDepartment(department || null);
              }
            }}
            renderConfig={{
              showCode: true,
              showBadge: true,
              badgeKey: 'employeeCount',
              showStatus: true
            }}
            emptyText="暂无部门数据"
          />
        )
      }}
      detailConfig={{
        title: '部门详情',
        icon: <BranchesOutlined />,
        selectedItem: selectedDepartment,
        emptyText: '请选择部门查看详情',
        emptyIcon: <BranchesOutlined />,
        onEdit: () => {
          setEditingDepartment(selectedDepartment);
          setEditModalVisible(true);
        },
        onAddChild: () => setCreateModalVisible(true),
        editButtonText: '编辑',
        addChildButtonText: '添加子部门',
        columns: detailColumns
      }}
    />
  );
};

export default DepartmentManagementPageV2; 