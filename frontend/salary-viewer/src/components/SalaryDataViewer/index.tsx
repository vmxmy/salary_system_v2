import React, { useEffect, Fragment } from 'react';
import { Space, Alert, App } from 'antd';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { SalaryProvider, useSalaryContext } from './SalaryContext';
import SalaryTable from './SalaryTable';
import SalaryFilters from './SalaryFilters';
import TableToolbar from '../table/TableToolbar';
import ColumnSettingsDrawer from '../table/ColumnSettingsDrawer';
import AdvancedFilterDrawer from '../table/AdvancedFilterDrawer';
import TableLayoutManager from '../table/TableLayoutManager';
import ExportTableModal from '../table/ExportTableModal';
import TourGuide from '../common/TourGuide';
import { SALARY_DATA_VIEWER_TOUR } from '../../tours';

/**
 * 薪资数据查看器内容组件
 */
const SalaryDataViewerContent: React.FC = () => {
    const {
        data,
        filteredData,
        loading,
        error,
        fieldDefinitions,
        columnConfigs,
        advancedFilters,
        columnSettingsVisible,
        advancedFilterVisible,
        tableLayoutVisible,
        exportModalVisible,
        exportFormat,
        isColumnDraggable,
        tourVisible,
        currentLayoutId,
        currentLayoutName,
        setColumnSettingsVisible,
        setAdvancedFilterVisible,
        setTableLayoutVisible,
        setExportModalVisible,
        setExportFormat,
        setColumnConfigs,
        setAdvancedFilters,
        setCurrentLayoutId,
        setCurrentLayoutName,
        toggleColumnDraggable,
        generateExportFileName,
        setTourVisible,
    } = useSalaryContext();

    const { t } = useTranslation();
    const { message } = App.useApp();

    // 注意：数据获取逻辑已移至SalaryContext中，不再需要在此处获取数据

    // 添加斑马条纹样式
    const zebraStripedStyle = `
        .zebra-striped-table .ant-table-tbody > tr:nth-child(even) > td {
            background-color: #fafafa;
        }
    `;

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 添加斑马条纹样式 */}
            <style>{zebraStripedStyle}</style>

            {/* 错误提示 */}
            {error && (
                <Alert
                    message={t('dataViewer.errors.title')}
                    description={error}
                    type="error"
                    showIcon
                    closable
                />
            )}

            {/* 统一的表格控制区块 */}
            <div style={{
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fafafa',
                marginBottom: '16px'
            }}>
                {/* 上部分：筛选表单 */}
                <SalaryFilters />

                {/* 工具栏 */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <TableToolbar
                            onColumnSettingsClick={() => setColumnSettingsVisible(true)}
                            onAdvancedFilterClick={() => setAdvancedFilterVisible(true)}
                            onSaveLayoutClick={() => setTableLayoutVisible(true)}
                            onExportClick={(format) => {
                                console.log('Export format selected:', format);
                                setExportFormat(format || 'excel');
                                setExportModalVisible(true);
                            }}
                            onRefreshClick={() => {
                                // 从SalaryContext中获取fetchData函数
                                const salaryContext = useSalaryContext();
                                // 使用当前的筛选条件刷新数据
                                salaryContext.fetchData && salaryContext.fetchData(salaryContext.tableFilters, salaryContext.advancedFilters);
                                message.success(t('dataViewer.refreshSuccess'));
                            }}
                            onToggleColumnDraggable={toggleColumnDraggable}
                            isColumnDraggable={isColumnDraggable}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            {/* 表格组件 */}
            <SalaryTable />

            {/* 列设置抽屉 */}
            <ColumnSettingsDrawer
                open={columnSettingsVisible}
                onClose={() => setColumnSettingsVisible(false)}
                columns={fieldDefinitions.map(field => ({
                    key: field.key,
                    title: field.title,
                    dataIndex: field.dataIndex,
                    fixed: field.fixed,
                    width: field.width,
                }))}
                onColumnsChange={(newColumns) => {
                    setColumnConfigs(newColumns);
                }}
                currentColumnConfigs={columnConfigs}
            />

            {/* 高级筛选抽屉 */}
            <AdvancedFilterDrawer
                open={advancedFilterVisible}
                onClose={() => setAdvancedFilterVisible(false)}
                columns={fieldDefinitions.map(field => ({
                    key: field.key,
                    title: field.title,
                    dataIndex: field.dataIndex,
                }))}
                onApplyFilter={(filters) => {
                    setAdvancedFilters(filters);
                    setAdvancedFilterVisible(false);
                }}
                initialConditions={advancedFilters}
                tableId="salaryTable"
            />

            {/* 表格布局管理器 */}
            <TableLayoutManager
                open={tableLayoutVisible}
                onClose={() => setTableLayoutVisible(false)}
                onSaveLayout={(name) => {
                    // 创建一个新的布局对象
                    const newLayout = {
                        id: `local-${Date.now()}`,
                        name: name,
                        columns: columnConfigs,
                        filters: advancedFilters,
                        createdAt: new Date().toISOString(),
                        isServerStored: false
                    };

                    // 使用模板字符串直接构建消息，避免翻译占位符问题
                    const successMsg = t('tableLayout.saveSuccess').replace('{name}', name);
                    message.success(successMsg);
                }}
                onLoadLayout={(layout) => {
                    console.log('Loading layout:', layout);

                    // 设置列配置
                    setColumnConfigs(layout.columns);

                    // 设置高级筛选条件（如果有）
                    if (layout.filters && layout.filters.length > 0) {
                        setAdvancedFilters(layout.filters);
                    }

                    // 保存当前加载的布局ID和名称
                    setCurrentLayoutId(layout.id);
                    setCurrentLayoutName(layout.name);

                    // 使用模板字符串直接构建消息，避免翻译占位符问题
                    const successMsg = t('tableLayout.loadSuccess').replace('{name}', layout.name);
                    message.success(successMsg);
                }}
                onUpdateLayout={(layout) => {
                    console.log('Updated layout:', layout);
                    // 更新布局后，保存列配置和布局名称
                    setCurrentLayoutName(layout.name);
                    // 使用模板字符串直接构建消息，避免翻译占位符问题
                    const successMsg = t('tableLayout.updateSuccess').replace('{name}', layout.name);
                    message.success(successMsg);
                }}
                tableId="salaryTable"
                currentColumns={columnConfigs}
                currentFilters={advancedFilters}
                currentLayoutId={currentLayoutId}
            />

            {/* 导出表格模态框 */}
            <ExportTableModal
                open={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                columns={columnConfigs}
                data={advancedFilters.length > 0 ? filteredData : data}
                fileName={generateExportFileName()}
                defaultFormat={exportFormat}
            />

            {/* 添加引导组件 */}
            <TourGuide
                tourId={SALARY_DATA_VIEWER_TOUR.id}
                steps={SALARY_DATA_VIEWER_TOUR.steps}
                autoStart={true}
                forceShow={tourVisible}
                onFinish={() => setTourVisible(false)}
            />
        </Space>
    );
};

/**
 * 薪资数据查看器主组件
 * 包装了 SalaryProvider 上下文提供者
 */
const SalaryDataViewer: React.FC = () => {
    return (
        <SalaryProvider>
            <SalaryDataViewerContent />
        </SalaryProvider>
    );
};

export default SalaryDataViewer;
