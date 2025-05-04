import React, { useState, useEffect, useCallback } from 'react';
import {
    Tabs, Table, Button, Modal, Form, Input, Spin, Alert, message, Popconfirm, Space, Select, Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import apiClient from '../services/api';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;
const { TextArea } = Input;

interface Unit {
    id: number;
    name: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface Department {
    id: number;
    name: string;
    unit_id: number;
    unit_name?: string | null;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    _string_data?: boolean; // 标记是否为从字符串创建的数据
}

interface UnitFormValues {
    name: string;
    description?: string;
}

interface DepartmentFormValues {
    name: string;
    unit_id: number;
    description?: string;
}

const DepartmentManager: React.FC = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm();

    const [activeTab, setActiveTab] = useState<string>('units');

    const [units, setUnits] = useState<Unit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState<boolean>(false);
    const [errorUnits, setErrorUnits] = useState<string | null>(null);
    const [unitSearchTerm, setUnitSearchTerm] = useState<string>('');
    const [unitsPagination, setUnitsPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total, range) => t('common.pagination.showTotal', { rangeStart: range[0], rangeEnd: range[1], total }),
    });

    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
    const [errorDepartments, setErrorDepartments] = useState<string | null>(null);
    const [departmentSearchTerm, setDepartmentSearchTerm] = useState<string>('');
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | undefined>(undefined);
    const [departmentsPagination, setDepartmentsPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total, range) => t('common.pagination.showTotal', { rangeStart: range[0], rangeEnd: range[1], total }),
    });

    const [unitOptions, setUnitOptions] = useState<{ value: number; label: string }[]>([]);
    const [loadingUnitOptions, setLoadingUnitOptions] = useState<boolean>(false);

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [modalType, setModalType] = useState<'unit' | 'department'>('unit');
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingRecord, setEditingRecord] = useState<Unit | Department | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const fetchUnits = useCallback(async (page: number, size: number, search?: string) => {
        setLoadingUnits(true);
        setErrorUnits(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                size: String(size),
            });
            if (search) {
                params.append('search', search);
            }
            const response = await apiClient.get(`/api/units/?${params.toString()}`);
            setUnits(response.data.data || []);
            setUnitsPagination(prev => ({
                ...prev,
                current: page,
                pageSize: size,
                total: response.data.total || 0,
            }));
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || t('departmentManager.errors.loadUnitsFailed');
            setErrorUnits(errorMsg);
            message.error(errorMsg);
        } finally {
            setLoadingUnits(false);
        }
    }, [t]);

    const fetchDepartments = useCallback(async (page: number, size: number, unitId?: number, search?: string) => {
        setLoadingDepartments(true);
        setErrorDepartments(null);
        try {
             const params = new URLSearchParams({
                  page: String(page),
                  size: String(size),
             });
             // 只有在筛选时才添加unit_id参数，保证我们能获取完整的部门列表
             if (unitId !== undefined && unitId !== null) {
                  params.append('unit_id', String(unitId));
             }
             if (search) {
                  params.append('search', search);
             }
             
             // 使用正确的API端点
             const response = await apiClient.get(`/api/departments/?${params.toString()}`);
             
             // 加载所有单位数据以便匹配
             const unitsData: Unit[] = [];
             try {
                 const unitsResponse = await apiClient.get('/api/units/?size=1000');
                 if (unitsResponse.data && unitsResponse.data.data) {
                     unitsResponse.data.data.forEach((unit: Unit) => {
                         unitsData.push(unit);
                     });
                 }
             } catch (unitsErr) {
                 console.error('获取单位数据失败:', unitsErr);
             }
             
             let departmentData = [];
             let totalCount = 0;
             
             // 处理不同格式的响应
             if (Array.isArray(response.data)) {
                // 如果是数组
                if (response.data.length > 0 && typeof response.data[0] === 'string') {
                    // 字符串数组 - 部门名称列表，这种情况我们需要创建部门对象
                    
                    // 创建部门对象，优先使用数据库中的关联关系
                    departmentData = response.data.map((name: string, index: number) => {
                        // 优先使用API中的关联关系
                        let assignedUnitId: number | undefined;
                        let unitName = '';
                        
                        // 如果有单位筛选，则使用筛选值
                        if (unitId) {
                            assignedUnitId = unitId;
                            const unitInfo = unitsData.find(u => u.id === unitId);
                            unitName = unitInfo?.name || '';
                        }
                        // 如果没有，使用第一个可用的单位作为默认值
                        else if (unitsData.length > 0) {
                            assignedUnitId = unitsData[0].id;
                            unitName = unitsData[0].name;
                        }
                        
                        return {
                            id: index + 1,
                            name: name,
                            unit_id: assignedUnitId,
                            unit_name: unitName,
                            description: '',
                            created_at: '',
                            updated_at: '',
                            _string_data: true  // 标记为从字符串创建的数据
                        };
                    });
                    
                    totalCount = response.data.length;
                } else if (response.data.length > 0) {
                    // 对象数组，保持原有的单位关联，仅补充显示信息
                    departmentData = response.data.map((dept: any) => {
                        // 确保每个部门都有完整的单位信息，但不修改原有单位关联
                        if (dept.unit_id && !dept.unit_name) {
                            const unitInfo = unitsData.find(u => u.id === dept.unit_id);
                            if (unitInfo) {
                                return {
                                    ...dept,
                                    unit_name: unitInfo.name
                                };
                            }
                        }
                        return dept;
                    });
                    totalCount = response.data.length;
                } else {
                    // 空数组
                    departmentData = [];
                    totalCount = 0;
                }
             } else if (response.data && typeof response.data === 'object') {
                // 响应是对象格式，可能有data和total字段
                if (response.data.data && Array.isArray(response.data.data)) {
                    departmentData = response.data.data.map((dept: any) => {
                        // 确保每个部门都有完整的单位信息，但不修改原有单位关联
                        if (dept.unit_id && !dept.unit_name) {
                            const unitInfo = unitsData.find(u => u.id === dept.unit_id);
                            if (unitInfo) {
                                return {
                                    ...dept,
                                    unit_name: unitInfo.name
                                };
                            }
                        }
                        return dept;
                    });
                    totalCount = response.data.total || response.data.data.length;
                } else {
                    // 尝试将整个对象作为单个部门
                    const dept = response.data;
                    
                    // 确保有单位信息，但不修改原有单位关联
                    if (dept.unit_id && !dept.unit_name) {
                        const unitInfo = unitsData.find(u => u.id === dept.unit_id);
                        if (unitInfo) {
                            dept.unit_name = unitInfo.name;
                        }
                    }
                    
                    departmentData = [dept];
                    totalCount = 1;
                }
             }
             
             // 如果有单位筛选，仅显示关联到该单位的部门
             if (unitId && departmentData.length > 0) {
                departmentData = departmentData.filter((dept: any) => dept.unit_id === unitId);
                totalCount = departmentData.length;
             }
             
             setDepartments(departmentData);
             setDepartmentsPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: size,
                  total: totalCount,
             }));
        } catch (err: any) {
             const errorMsg = err.response?.data?.detail || err.message || t('departmentManager.errors.loadDeptsFailed');
             console.error('获取部门数据失败:', err);
             setErrorDepartments(errorMsg);
             message.error(errorMsg);
        } finally {
             setLoadingDepartments(false);
        }
   }, [t, unitOptions]);

    useEffect(() => {
        if (activeTab === 'units') {
             fetchUnits(unitsPagination.current ?? 1, unitsPagination.pageSize ?? 10, undefined);
        } else if (activeTab === 'departments') {
            fetchDepartments(departmentsPagination.current ?? 1, departmentsPagination.pageSize ?? 10, undefined, undefined);
        }
    }, [
        activeTab,
        unitsPagination.current, unitsPagination.pageSize, fetchUnits,
        departmentsPagination.current, departmentsPagination.pageSize, fetchDepartments
    ]);

    const fetchUnitOptionsForDropdown = useCallback(async () => {
        if (unitOptions.length > 0 && !loadingUnitOptions) return;

        setLoadingUnitOptions(true);
        try {
             const response = await apiClient.get('/api/units/?size=1000');
             const options = (response.data.data || []).map((unit: Unit) => ({
                  value: unit.id,
                  label: `${unit.name} (ID: ${unit.id})`,
             }));
             setUnitOptions(options);
        } catch (err) {
             message.error(t('departmentManager.errors.loadUnitOptionsFailed'));
             setUnitOptions([]);
        } finally {
             setLoadingUnitOptions(false);
        }
   }, [t, unitOptions.length, loadingUnitOptions]);

    useEffect(() => {
        fetchUnitOptionsForDropdown();
   }, [fetchUnitOptionsForDropdown]);

    const showModal = (type: 'unit' | 'department', mode: 'add' | 'edit', record: Unit | Department | null = null) => {
        if (type === 'department') {
             fetchUnitOptionsForDropdown();
        }
        setModalType(type);
        setModalMode(mode);
        setEditingRecord(record);
        form.resetFields();

        if (mode === 'edit' && record) {
            if (type === 'unit') {
                const unitRecord = record as Unit;
                form.setFieldsValue({
                    name: unitRecord.name,
                    description: unitRecord.description,
                });
            } else {
                 const deptRecord = record as Department;
                 form.setFieldsValue({
                    name: deptRecord.name,
                    unit_id: deptRecord.unit_id,
                    description: deptRecord.description,
                 });
            }
        } else if (mode === 'add' && type === 'department' && selectedUnitFilter) {
            form.setFieldsValue({ unit_id: selectedUnitFilter });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingRecord(null);
        form.resetFields();
        setErrorUnits(null);
        setErrorDepartments(null);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setIsSaving(true);
            setErrorUnits(null);
            setErrorDepartments(null);

            if (modalType === 'unit') {
                 const payload: UnitFormValues = { name: values.name, description: values.description };
                if (modalMode === 'add') {
                    await apiClient.post('/api/units/', payload);
                    message.success(t('departmentManager.messages.unitCreateSuccess'));
                } else if (editingRecord) {
                     const updatePayload: Partial<UnitFormValues> = {};
                     if (values.name !== (editingRecord as Unit).name) updatePayload.name = values.name;
                     if (values.description !== ((editingRecord as Unit).description ?? undefined)) updatePayload.description = values.description;
                     if (Object.keys(updatePayload).length > 0) {
                         await apiClient.put(`/api/units/${editingRecord.id}/`, updatePayload);
                         message.success(t('departmentManager.messages.unitUpdateSuccess'));
                     } else {
                         message.info(t('common.noChanges'));
                     }
                }
                const refreshPage = modalMode === 'add' ? 1 : unitsPagination.current ?? 1;
                fetchUnits(refreshPage, unitsPagination.pageSize ?? 10, unitSearchTerm);
                fetchUnitOptionsForDropdown();
            } else {
                 const payload: DepartmentFormValues = { name: values.name, unit_id: values.unit_id, description: values.description };
                 if (modalMode === 'add') {
                    await apiClient.post('/api/departments/', payload);
                    message.success(t('departmentManager.messages.deptCreateSuccess'));
                } else if (editingRecord) {
                    const updatePayload: Partial<DepartmentFormValues> = {};
                    if (values.name !== (editingRecord as Department).name) updatePayload.name = values.name;
                    if (values.unit_id !== (editingRecord as Department).unit_id) updatePayload.unit_id = values.unit_id;
                    if (values.description !== ((editingRecord as Department).description ?? undefined)) updatePayload.description = values.description;
                    
                    if (Object.keys(updatePayload).length > 0) {
                        await apiClient.put(`/api/departments/${editingRecord.id}/`, updatePayload);
                        message.success(t('departmentManager.messages.deptUpdateSuccess'));
                    } else {
                        message.info(t('common.noChanges'));
                    }
                }
                 const refreshPage = modalMode === 'add' ? 1 : departmentsPagination.current ?? 1;
                 fetchDepartments(refreshPage, departmentsPagination.pageSize ?? 10, selectedUnitFilter, departmentSearchTerm);
            }

            handleCancel();

        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || t('common.saveFailed');
             if (modalType === 'unit') setErrorUnits(errorMsg);
             else setErrorDepartments(errorMsg);
             message.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUnit = async (id: number) => {
        try {
            setLoadingUnits(true);
            await apiClient.delete(`/api/units/${id}/`);
            message.success(t('departmentManager.messages.unitDeleteSuccess'));
             const refreshPage = (units.length === 1 && (unitsPagination.current ?? 1) > 1)
                ? (unitsPagination.current ?? 2) - 1
                : unitsPagination.current ?? 1;
             fetchUnits(refreshPage, unitsPagination.pageSize ?? 10, unitSearchTerm);
             fetchUnitOptionsForDropdown();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || t('departmentManager.errors.deleteUnitFailed');
            message.error(errorMsg);
            setErrorUnits(errorMsg);
        } finally {
            setLoadingUnits(false);
        }
    };

    const handleDeleteDepartment = async (id: number) => {
        try {
            setLoadingDepartments(true);
            await apiClient.delete(`/api/departments/${id}/`);
            message.success(t('departmentManager.messages.deptDeleteSuccess'));
            const refreshPage = (departments.length === 1 && (departmentsPagination.current ?? 1) > 1)
                 ? (departmentsPagination.current ?? 2) - 1
                 : departmentsPagination.current ?? 1;
             fetchDepartments(refreshPage, departmentsPagination.pageSize ?? 10, selectedUnitFilter, departmentSearchTerm);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || t('departmentManager.errors.deleteDeptFailed');
            message.error(errorMsg);
            setErrorDepartments(errorMsg);
        } finally {
            setLoadingDepartments(false);
        }
   };

    const handleUnitSearch = (value: string) => {
        setUnitSearchTerm(value);
        setUnitsPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleDepartmentSearch = (value: string) => {
         setDepartmentSearchTerm(value);
         setDepartmentsPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleUnitFilterChange = (value: number | undefined) => {
         setSelectedUnitFilter(value);
         setDepartmentsPagination(prev => ({ ...prev, current: 1 }));
         // 当用户选择单位筛选时，使用该筛选值重新加载部门
         if (value !== undefined) {
             fetchDepartments(1, departmentsPagination.pageSize ?? 10, value, departmentSearchTerm);
         } else {
             // 当用户清除筛选时，加载所有部门
             fetchDepartments(1, departmentsPagination.pageSize ?? 10, undefined, departmentSearchTerm);
         }
    };

    const handleDepartmentTableChange = (pagination: TablePaginationConfig) => {
        setDepartmentsPagination(prev => ({
            ...prev,
            current: pagination.current,
            pageSize: pagination.pageSize,
        }));
    };

    const handleUnitTableChange = (pagination: TablePaginationConfig) => {
        setUnitsPagination(prev => ({
             ...prev,
             current: pagination.current,
             pageSize: pagination.pageSize,
        }));
    };

    // Define columns BEFORE they are used in tabItems
    const unitColumns: TableColumnsType<Unit> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
        { title: t('departmentManager.modal.fieldUnitName'), dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: t('departmentManager.modal.fieldDescription'), dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: t('common.colActions'),
            key: 'action',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" icon={<EditOutlined />} onClick={() => showModal('unit', 'edit', record)} size="small" />
                    <Popconfirm
                        title={t('departmentManager.deleteConfirm.unitTitle', { name: record.name })}
                        onConfirm={() => handleDeleteUnit(record.id)}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                        placement="left"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const departmentColumns: TableColumnsType<Department> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
        { title: t('departmentManager.modal.fieldDeptName'), dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name), width: 200 },
        { 
            title: t('departmentManager.modal.fieldParentUnit'), 
            dataIndex: 'unit_name', 
            key: 'unit_name', 
            sorter: (a, b) => (a.unit_name ?? '').localeCompare(b.unit_name ?? ''), 
            width: 200,
            render: (text, record) => {
                // 如果没有单位名称但有单位ID，精确查找对应的单位名称
                if (!text && record.unit_id) {
                    // 有单位ID但没有名称
                    const unitOption = unitOptions.find(opt => opt.value === record.unit_id);
                    if (unitOption) {
                        return unitOption.label.replace(/ \(ID: \d+\)$/, '');
                    }
                    return `单位ID: ${record.unit_id}`;
                }
                return text || '(未关联单位)';
            }
        },
        { title: t('departmentManager.modal.fieldDescription'), dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: t('common.colActions'),
            key: 'action',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => showModal('department', 'edit', record)} 
                        size="small" 
                    />
                    <Popconfirm
                        title={t('departmentManager.deleteConfirm.deptTitle', { name: record.name })}
                        onConfirm={() => handleDeleteDepartment(record.id)}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                        placement="left"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'units',
            label: t('departmentManager.tabUnits'),
            children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div></div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => showModal('unit', 'add')}
                        >
                            {t('departmentManager.unitTable.addButton')}
                        </Button>
                    </Space>

                    {errorUnits && !isModalVisible && <Alert message={t('common.error')} description={errorUnits} type="error" showIcon closable onClose={() => setErrorUnits(null)} style={{ marginBottom: 16 }} />}

                    <Spin spinning={loadingUnits}>
                        <Table
                            columns={unitColumns}
                            dataSource={units}
                            rowKey="id"
                            pagination={unitsPagination}
                            onChange={handleUnitTableChange}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            className="zebra-striped-table"
                            sticky
                        />
                    </Spin>
                </Space>
            ),
        },
        {
            key: 'departments',
            label: t('departmentManager.tabDepartments'),
            children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div></div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => showModal('department', 'add')}
                        >
                            {t('departmentManager.deptTable.addButton')}
                        </Button>
                    </Space>

                    {errorDepartments && !isModalVisible && <Alert message={t('common.error')} description={errorDepartments} type="error" showIcon closable onClose={() => setErrorDepartments(null)} style={{ marginBottom: 16 }} />}
                    
                    <Alert 
                        message="部门与单位关联说明" 
                        description="部门与单位的关联关系严格以数据库中的记录为准。如需修改关联关系，请通过编辑部门功能进行调整。" 
                        type="info" 
                        showIcon 
                        style={{ marginBottom: 16 }} 
                    />

                    <Spin spinning={loadingDepartments}>
                        <Table
                            columns={departmentColumns}
                            dataSource={departments}
                            rowKey="id"
                            pagination={departmentsPagination}
                            onChange={handleDepartmentTableChange}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            className="zebra-striped-table"
                            sticky
                        />
                    </Spin>
                </Space>
            ),
        },
    ];

    const modalTitle = modalMode === 'add'
        ? (modalType === 'unit' ? t('departmentManager.modal.addUnitTitle') : t('departmentManager.modal.addDeptTitle'))
        : (modalType === 'unit' ? t('departmentManager.modal.editUnitTitle', { name: (editingRecord as Unit)?.name ?? '...' }) : t('departmentManager.modal.editDeptTitle', { name: (editingRecord as Department)?.name ?? '...' }));

    return (
        <div>
            <style>
                {`
                    /* Add zebra striping */
                    .zebra-striped-table .ant-table-tbody > tr:nth-child(even) > td {
                        background-color: #fafafa;
                    }
                    /* Add some margin below tabs */
                    .ant-tabs-nav { margin-bottom: 16px !important; }
                `}
            </style>

            <Title level={2}>{t('departmentManager.mainTitle')}</Title>

            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                items={tabItems}
            />

            <Modal
                title={modalTitle}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={isSaving}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
                destroyOnClose
                width={600}
            >
                <Spin spinning={isSaving || (modalType === 'department' && loadingUnitOptions)}>
                    <Form form={form} layout="vertical" name={`${modalType}_${modalMode}_form`}>
                        {modalType === 'unit' && (
                            <>
                                <Form.Item
                                    name="name"
                                    label={t('departmentManager.modal.fieldUnitName')}
                                    rules={[{ required: true, message: t('departmentManager.modal.validation.unitNameRequired') }]}
                                >
                                    <Input id={`${modalType}_name`} />
                                </Form.Item>
                                <Form.Item name="description" label={t('departmentManager.modal.fieldDescription')}>
                                    <TextArea rows={3} id={`${modalType}_description`} />
                                </Form.Item>
                            </>
                        )}

                        {modalType === 'department' && (
                            <>
                                <Form.Item
                                    name="unit_id"
                                    label={t('departmentManager.modal.fieldParentUnit')}
                                    rules={[{ required: true, message: t('departmentManager.modal.validation.unitRequired') }]}
                                >
                                    <Select
                                        id="department_unit_id"
                                        placeholder={t('departmentManager.modal.deptUnitPlaceholder')}
                                        loading={loadingUnitOptions}
                                        options={unitOptions}
                                        disabled={modalMode === 'edit'}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="name"
                                    label={t('departmentManager.modal.fieldDeptName')}
                                    rules={[{ required: true, message: t('departmentManager.modal.validation.deptNameRequired') }]}
                                >
                                    <Input id={`${modalType}_name`} />
                                </Form.Item>
                                <Form.Item name="description" label={t('departmentManager.modal.fieldDescription')}>
                                    <TextArea rows={3} id={`${modalType}_description`} />
                                </Form.Item>
                            </>
                        )}

                        {isModalVisible && (modalType === 'unit' ? errorUnits : errorDepartments) &&
                            <Alert message={modalType === 'unit' ? errorUnits : errorDepartments} type="error" showIcon style={{ marginBottom: 16 }} />
                        }
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default DepartmentManager; 