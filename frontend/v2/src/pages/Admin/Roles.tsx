import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnType, Key } from 'antd/lib/table/interface';
import { getRoles } from '../../api/roles'; // 修正导入 getRoles API 函数的路径

// 模拟角色数据类型
interface Role {
  id: number;
  code: string;
  name: string;
}

const RoleListPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [form] = Form.useForm();

  // 模拟从后端加载数据
  useEffect(() => {
    setLoading(true);
    // 模拟 API 调用
    setTimeout(() => {
      const mockRoles: Role[] = [
        { id: 1, code: 'admin', name: '系统管理员' },
        { id: 2, code: 'hr', name: '人力资源' },
        { id: 3, code: 'finance', name: '财务' },
        { id: 4, code: 'manager', name: '部门主管' },
        { id: 5, code: 'employee', name: '普通员工' },
      ];
      setRoles(mockRoles);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: keyof Role) => ({
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

  const columns: ColumnType<Role>[] = [
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
      ...getColumnSearchProps('code'),
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Role) => (
        <Space size="middle">
          <a>编辑</a> {/* TODO: Implement Edit Role */}
          <a>删除</a> {/* TODO: Implement Delete Role */}
          <a>管理权限</a> {/* TODO: Implement Manage Permissions */}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>角色管理</h2>
      <div style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item label="角色代码/名称">
            <Input placeholder="输入角色代码或名称" /> {/* TODO: Implement actual search input */}
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
          新建角色 {/* TODO: Implement Create Role */}
        </Button>
      </div>
      <Table columns={columns} dataSource={roles} loading={loading} rowKey="id" />
    </div>
  );
};

export default RoleListPage;