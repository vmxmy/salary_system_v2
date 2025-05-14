import React from 'react';
import { Form, DatePicker, Input, Button, Space, Tag } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSalaryContext } from './SalaryContext';

/**
 * 薪资数据筛选组件
 */
const SalaryFilters: React.FC = () => {
    const { t } = useTranslation();
    const {
        form,
        advancedFilters,
        handlePayPeriodChange,
        handleNameSearch,
        resetFilters,
    } = useSalaryContext();

    return (
        <div style={{ marginBottom: '16px', borderBottom: '1px dashed #e8e8e8', paddingBottom: '16px' }}>
            <Form
                form={form}
                layout="inline"
            >
                <Space wrap size="middle">
                    <Form.Item
                        label={t('dataViewer.filters.payPeriodLabel')}
                        style={{ margin: 0 }}
                        htmlFor="pay_period_filter"
                        name="pay_period"
                    >
                        <DatePicker
                            id="pay_period_filter"
                            picker="month"
                            format="YYYY-MM"
                            style={{ width: 140 }}
                            placeholder={t('dataViewer.filters.payPeriodPlaceholder')}
                            onChange={handlePayPeriodChange}
                        />
                    </Form.Item>
                    <Form.Item
                        label={t('dataViewer.filters.employeeNameLabel')}
                        style={{ margin: 0 }}
                        htmlFor="employee_name_filter"
                        name="employee_name"
                    >
                        <Input
                            id="employee_name_filter"
                            placeholder={t('dataViewer.filters.employeeNamePlaceholder')}
                            style={{ width: 140 }}
                            onPressEnter={handleNameSearch}
                        />
                    </Form.Item>
                    <Form.Item style={{ margin: 0 }}>
                        <Button type="primary" onClick={handleNameSearch}>
                            {t('dataViewer.filters.search')}
                        </Button>
                    </Form.Item>
                    <Form.Item style={{ margin: 0 }}>
                        <Button icon={<ClearOutlined />} onClick={resetFilters}>
                            {t('dataViewer.filters.reset')}
                        </Button>
                    </Form.Item>
                </Space>
            </Form>

            {/* 显示高级筛选条件标签 */}
            {advancedFilters.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    <Space size={[0, 8]} wrap>
                        {advancedFilters.map((group, groupIndex) => (
                            <Tag key={`group-${groupIndex}`} color="blue">
                                {group.conditions.map((condition, condIndex) => (
                                    <span key={`cond-${groupIndex}-${condIndex}`}>
                                        {condIndex > 0 ? ' 且 ' : ''}
                                        {condition.field} {getOperatorText(condition.operator)} {condition.value}
                                    </span>
                                ))}
                                {groupIndex < advancedFilters.length - 1 ? ' 或 ' : ''}
                            </Tag>
                        ))}
                    </Space>
                </div>
            )}
        </div>
    );
};

/**
 * 获取操作符的中文文本
 * @param operator 操作符
 * @returns 中文文本
 */
function getOperatorText(operator: string): string {
    switch (operator) {
        case 'eq':
            return '等于';
        case 'neq':
            return '不等于';
        case 'gt':
            return '大于';
        case 'gte':
            return '大于等于';
        case 'lt':
            return '小于';
        case 'lte':
            return '小于等于';
        case 'contains':
            return '包含';
        case 'startswith':
            return '开头是';
        case 'endswith':
            return '结尾是';
        default:
            return operator;
    }
}

export default SalaryFilters;
