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
            const response = await apiClient.get(`/api/units-crud?${params.toString()}`);
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
             if (unitId !== undefined && unitId !== null) {
                  params.append('unit_id', String(unitId));
             }
             if (search) {
                  params.append('search', search);
             }
             const response = await apiClient.get(`/api/departments-crud?${params.toString()}`);
             setDepartments(response.data.data || []);
             setDepartmentsPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: size,
                  total: response.data.total || 0,
             }));
        } catch (err: any) {
             const errorMsg = err.response?.data?.detail || err.message || t('departmentManager.errors.loadDeptsFailed');
             setErrorDepartments(errorMsg);
             message.error(errorMsg);
        } finally {
             setLoadingDepartments(false);
        }
   }, [t]);

    useEffect(() => {
        if (activeTab === 'units') {
             fetchUnits(unitsPagination.current ?? 1, unitsPagination.pageSize ?? 10, unitSearchTerm);
        } else if (activeTab === 'departments') {
            fetchDepartments(departmentsPagination.current ?? 1, departmentsPagination.pageSize ?? 10, selectedUnitFilter, departmentSearchTerm);
        }
    }, [
        activeTab,
        unitsPagination.current, unitsPagination.pageSize, unitSearchTerm, fetchUnits,
        departmentsPagination.current, departmentsPagination.pageSize, selectedUnitFilter, departmentSearchTerm, fetchDepartments
    ]);

    const fetchUnitOptionsForDropdown = useCallback(async () => {
        if (unitOptions.length > 0 && !loadingUnitOptions) return;

        setLoadingUnitOptions(true);
        try {
             const response = await apiClient.get('/api/units-crud?size=1000');
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
                    await apiClient.post('/api/units-crud', payload);
                    message.success(t('departmentManager.messages.unitCreateSuccess'));
                } else if (editingRecord) {
                     const updatePayload: Partial<UnitFormValues> = {};
                     if (values.name !== (editingRecord as Unit).name) updatePayload.name = values.name;
                     if (values.description !== ((editingRecord as Unit).description ?? undefined)) updatePayload.description = values.description;
                     if (Object.keys(updatePayload).length > 0) {
                         await apiClient.put(`/api/units-crud/${editingRecord.id}`, updatePayload);
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
                    await apiClient.post('/api/departments-crud', payload);
                    message.success(t('departmentManager.messages.deptCreateSuccess'));
                } else if (editingRecord) {
                    const updatePayload: Partial<DepartmentFormValues> = {};
                    if (values.name !== (editingRecord as Department).name) updatePayload.name = values.name;
                    if (values.description !== ((editingRecord as Department).description ?? undefined)) updatePayload.description = values.description;
                    if (Object.keys(updatePayload).length > 0) {
                        await apiClient.put(`/api/departments-crud/${editingRecord.id}`, updatePayload);
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
            await apiClient.delete(`/api/units-crud/${id}`);
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
            await apiClient.delete(`/api/departments-crud/${id}`);
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
        { title: t('departmentManager.modal.fieldParentUnit'), dataIndex: 'unit_name', key: 'unit_name', sorter: (a, b) => (a.unit_name ?? '').localeCompare(b.unit_name ?? ''), width: 200 },
        { title: t('departmentManager.modal.fieldDescription'), dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: t('common.colActions'),
            key: 'action',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" icon={<EditOutlined />} onClick={() => showModal('department', 'edit', record)} size="small" />
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
                        <Input.Search
                            aria-label={t('departmentManager.unitTable.searchPlaceholder')}
                            placeholder={t('departmentManager.unitTable.searchPlaceholder')}
                            allowClear
                            onSearch={handleUnitSearch}
                            onChange={(e) => !e.target.value && handleUnitSearch('')}
                            enterButton={<Button icon={<SearchOutlined />} type="primary">{t('common.search')}</Button>}
                            style={{ width: 300 }}
                        />
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
                        <Space wrap>
                            <Select
                                placeholder={t('departmentManager.deptTable.filterUnitPlaceholder')}
                                style={{ width: 200 }}
                                allowClear
                                options={[{ value: undefined, label: t('dataViewer.filters.allOption') }, ...unitOptions]}
                                value={selectedUnitFilter}
                                onChange={handleUnitFilterChange}
                                loading={loadingUnitOptions}
                            />
                            <Input.Search
                                aria-label={t('departmentManager.deptTable.searchPlaceholder')}
                                placeholder={t('departmentManager.deptTable.searchPlaceholder')}
                                allowClear
                                onSearch={handleDepartmentSearch}
                                onChange={(e) => !e.target.value && handleDepartmentSearch('')}
                                enterButton={<Button icon={<SearchOutlined />} type="primary">{t('common.search')}</Button>}
                                style={{ width: 300 }}
                            />
                        </Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => showModal('department', 'add')}
                        >
                            {t('departmentManager.deptTable.addButton')}
                        </Button>
                    </Space>

                    {errorDepartments && !isModalVisible && <Alert message={t('common.error')} description={errorDepartments} type="error" showIcon closable onClose={() => setErrorDepartments(null)} style={{ marginBottom: 16 }} />}

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