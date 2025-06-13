import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ProColumns } from '@ant-design/pro-components';
import { stringSorter, numberSorter, dateSorter } from './TableUtils';
import TableActionButton from './TableActionButton';
import StandardListPageTemplate from './StandardListPageTemplate';
import { Space } from 'antd';

// 示例数据类型
interface ExampleItem {
  id: string;
  name: string;
  code: string;
  status: string;
  createTime: string;
  // 其他字段...
}

// 示例权限hook（需要根据实际情况实现）
const useExamplePermissions = () => ({
  canViewList: true,
  canViewDetail: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canExport: true,
});

// 示例查找数据hook（需要根据实际情况实现）
const useExampleLookupMaps = () => ({
  lookupMaps: {
    statusMap: new Map([
      ['active', '活跃'],
      ['inactive', '非活跃'],
    ]),
  },
  loadingLookups: false,
  errorLookups: null,
});

// 示例服务（需要根据实际情况实现）
const exampleService = {
  getItems: async () => {
    // 模拟API调用
    return {
      data: [
        { id: '1', name: 'Example 1', code: 'EX001', status: 'active', createTime: '2024-01-01' },
        { id: '2', name: 'Example 2', code: 'EX002', status: 'inactive', createTime: '2024-01-02' },
      ],
    };
  },
  deleteItem: async (id: string) => {
    // 模拟删除API调用
  },
};

// 表格列配置生成函数
const generateExampleTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof ExampleItem) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (item: ExampleItem) => void,
  onDelete: (id: string) => void,
  onViewDetails: (id: string) => void
): ProColumns<ExampleItem>[] => {
  return [
    {
      title: t('components:auto_text_e5908d'),
      dataIndex: 'name',
      key: 'name',
      sorter: stringSorter<ExampleItem>('name'),
      ...getColumnSearch('name'),
    },
    {
      title: t('components:auto_text_e7bc96'),
      dataIndex: 'code',
      key: 'code',
      sorter: stringSorter<ExampleItem>('code'),
      ...getColumnSearch('code'),
    },
    {
      title: t('components:auto_text_e78ab6'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => lookupMaps?.statusMap?.get(status) || status,
      filters: lookupMaps?.statusMap ? Array.from(lookupMaps.statusMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('components:auto_text_e5889b'),
      dataIndex: 'createTime',
      key: 'createTime',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '',
      sorter: dateSorter<ExampleItem>('createTime'),
    },
    {
      title: t('components:auto_text_e6938d'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: string, record: ExampleItem) => (
        <Space size="small">
          {permissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(record.id)} 
              tooltipTitle={t('components:auto_text_e69fa5')} 
            />
          )}
          {permissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle={t('components:auto_text_e7bc96')} 
            />
          )}
          {permissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(record.id)} 
              tooltipTitle={t('components:auto_text_e588a0')} 
            />
          )}
        </Space>
      ),
    },
  ];
};

// 示例页面组件
const ExampleListPage: React.FC = () => {
  const navigate = useNavigate();
  const permissions = useExamplePermissions();
  const { lookupMaps, loadingLookups, errorLookups } = useExampleLookupMaps();
  const { t } = useTranslation(['example', 'common', 'components']);

  const [dataSource, setDataSource] = useState<ExampleItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // 数据获取函数
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await exampleService.getItems();
      if (response && response.data) {
        setDataSource(response.data);
      } else {
        setDataSource([]);
      }
    } catch (error) {
      setDataSource([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // 删除项目函数
  const deleteItem = useCallback(async (id: string) => {
    await exampleService.deleteItem(id);
  }, []);

  // 事件处理函数
  const handleAddClick = () => {
    navigate('/example/new');
  };

  const handleEditClick = (item: ExampleItem) => {
    navigate(`/example/${item.id}/edit`, { state: { itemData: item } });
  };

  const handleViewDetailsClick = (id: string) => {
    navigate(`/example/${id}`);
  };

  return (
    <StandardListPageTemplate<ExampleItem>
      translationNamespaces={['example', 'common']}
      pageTitleKey="example:list_page.title"
      addButtonTextKey="example:list_page.add_button"
      dataSource={dataSource}
      loadingData={loadingData}
      permissions={permissions}
      lookupMaps={lookupMaps}
      loadingLookups={loadingLookups}
      errorLookups={errorLookups}
      fetchData={fetchData}
      deleteItem={deleteItem}
      onAddClick={handleAddClick}
      onEditClick={handleEditClick}
      onViewDetailsClick={handleViewDetailsClick}
      generateTableColumns={generateExampleTableColumns}
      deleteConfirmConfig={{
        titleKey: 'example:delete_confirm.title',
        contentKey: 'example:delete_confirm.content',
        okTextKey: 'example:delete_confirm.ok_text',
        cancelTextKey: 'example:delete_confirm.cancel_text',
        successMessageKey: 'example:message.delete_success',
        errorMessageKey: 'example:message.delete_failed',
      }}
      batchDeleteConfig={{
        enabled: true,
        buttonText: t('common:batch_delete'),
        confirmTitle: t('common:confirm_delete'),
        confirmContent: t('common:confirm_delete_content'),
        confirmOkText: t('common:delete'),
        confirmCancelText: t('common:cancel'),
        successMessage: t('common:delete_success'),
        errorMessage: t('common:delete_failed'),
        noSelectionMessage: t('common:no_selection'),
        onBatchDelete: async (keys: React.Key[]) => {
          await Promise.all(keys.map(key => exampleService.deleteItem(String(key))));
          fetchData();
        },
      }}
      exportConfig={{
        filenamePrefix: t('common:export.filename_default'),
        sheetName: t('common:export.sheetName_default'),
        buttonText: t('common:button.export_excel'),
        successMessage: t('common:export.success_message'),
      }}
      lookupErrorMessageKey="example:message.load_aux_data_failed"
      lookupLoadingMessageKey="example:message.loading_lookups"
      lookupDataErrorMessageKey="example:message.lookup_data_error"
      rowKey="id"
    />
  );
};

export default ExampleListPage; 