import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnType, Key } from 'antd/lib/table/interface';
import { getUsers } from '../../api/users'; // 修正导入 getUsers API 函数的路径
import type { User as ApiUser, Role as ApiRole, ApiResponse } from '../../api/types'; // 导入 API 层定义的 User 类型

// 页面内部使用的用户数据类型
interface PageUser {
  id: number;
  username: string;
  employeeName?: string; // 假设可能从 employee_id 关联得到，或 API 直接提供
  roles: string[]; // 角色名称字符串数组
  status: string; // '激活' | '禁用' 等
  // createdAt: string; // Temporarily remove as it's not in ApiUser type
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<PageUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationState>({ 
    current: 1, 
    pageSize: 10, 
    total: 0 
  });
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [form] = Form.useForm();

  const fetchUsers = async (page: number = pagination.current, pageSize: number = pagination.pageSize) => {
    setLoading(true);
    try {
      const apiResponse: ApiResponse<ApiUser[]> = await getUsers({ page, size: pageSize });

      if (apiResponse && Array.isArray(apiResponse.data)) {
        const pageUsers: PageUser[] = apiResponse.data.map((apiUser: ApiUser) => ({
          id: Number(apiUser.id), 
          username: apiUser.username,
          employeeName: apiUser.employee_id ? `EmpID-${apiUser.employee_id}` : 'N/A', 
          roles: apiUser.roles ? apiUser.roles.map((role: ApiRole) => role.name || 'UnknownRole') : [],
          status: apiUser.is_active ? '激活' : '禁用',
          // createdAt: (apiUser as any).created_at || new Date().toISOString(), // Temporarily removed
        }));
        setUsers(pageUsers);
        if (apiResponse.meta) {
          setPagination({
            current: apiResponse.meta.page || 1,
            pageSize: apiResponse.meta.size || 10,
            total: apiResponse.meta.total || 0,
          });
        }
      } else {
        console.error('getUsers response data is not an array or response is invalid:', apiResponse);
        setUsers([]);
        setPagination(prev => ({ ...prev, total: 0, current: 1 }));
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setUsers([]);
      setPagination(prev => ({ ...prev, total: 0, current: 1 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Initial fetch

  const handleTableChange = (paginationConfig: any, filters: any, sorter: any) => {
    fetchUsers(paginationConfig.current, paginationConfig.pageSize);
  };

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: keyof PageUser) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`搜索 ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        // setTimeout(() => searchInput.select(), 100);
      }
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        // <Highlighter
        //   highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
        //   searchWords={[searchText]}
        //   autoEscape
        //   textToHighlight={text ? text.toString() : ''}
        // />
        text // 暂时不使用 Highlighter
      ) : (
        text
      ),
  });

  const columns: ColumnType<PageUser>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      ...getColumnSearchProps('username'),
    },
    {
      title: '关联员工',
      dataIndex: 'employeeName',
      key: 'employeeName',
      ...getColumnSearchProps('employeeName'),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => roles.join(', '),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '激活', value: '激活' },
        { text: '禁用', value: '禁用' },
      ],
      onFilter: (value: boolean | Key, record: PageUser) => String(record.status) === String(value),
    },
    // {
    //   title: '创建时间',
    //   dataIndex: 'createdAt',
    //   key: 'createdAt',
    // }, // Temporarily removed
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PageUser) => (
        <Space size="middle">
          <a>编辑</a> {/* TODO: Implement Edit User */}
          <a>删除</a> {/* TODO: Implement Delete User */}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>用户管理</h2>
      <div style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item label="用户名">
            <Input placeholder="输入用户名" />
          </Form.Item>
          <Form.Item label="状态">
            {/* TODO: Implement actual status select with options from backend lookup values */}
            <Input placeholder="选择状态" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
          <Form.Item>
            <Button>重置</Button>
          </Form.Item>
        </Form>
        <Button type="primary" style={{ marginTop: 16 }}>
          新建用户 {/* TODO: Implement Create User Modal/Page */}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default UserListPage;