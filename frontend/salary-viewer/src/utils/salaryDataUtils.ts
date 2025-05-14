import { SalaryRecord } from '../components/SalaryDataViewer/SalaryContext';
import { SalaryFieldDefinition } from '../services/api';

/**
 * 获取字段的所有唯一值
 * @param data 数据源
 * @param fieldName 字段名
 * @returns 唯一值集合
 */
export const getFieldUniqueValues = (data: SalaryRecord[], fieldName: string): Set<string> => {
    const values = new Set<string>();
    data.forEach(record => {
        const value = record[fieldName];
        if (value !== undefined && value !== null && value !== '') {
            values.add(String(value));
        }
    });
    return values;
};

/**
 * 获取所有字段的唯一值映射
 * @param data 数据源
 * @returns 字段唯一值映射
 */
export const getAllFieldValueMaps = (data: SalaryRecord[]): Map<string, Set<string>> => {
    const fieldValueMap = new Map<string, Set<string>>();
    
    if (data.length === 0) return fieldValueMap;
    
    // 获取第一条记录的所有字段
    const firstRecord = data[0];
    const fieldNames = Object.keys(firstRecord);
    
    // 为每个字段创建唯一值集合
    fieldNames.forEach(fieldName => {
        fieldValueMap.set(fieldName, getFieldUniqueValues(data, fieldName));
    });
    
    return fieldValueMap;
};

/**
 * 根据字段定义生成表格列配置
 * @param fieldDefinitions 字段定义
 * @returns 表格列配置
 */
export const generateColumnsFromFieldDefinitions = (
    fieldDefinitions: SalaryFieldDefinition[]
): any[] => {
    return fieldDefinitions.map(field => ({
        key: field.key,
        dataIndex: field.dataIndex,
        title: field.title,
        visible: true,
        fixed: field.fixed,
        width: field.width,
        align: field.align,
    }));
};

/**
 * 计算薪资统计数据
 * @param data 薪资数据
 * @returns 统计数据
 */
export const calculateSalaryStats = (data: SalaryRecord[]) => {
    if (data.length === 0) {
        return {
            totalCount: 0,
            totalNetPay: 0,
            averageNetPay: 0,
            minNetPay: 0,
            maxNetPay: 0,
        };
    }

    let totalNetPay = 0;
    let minNetPay = Number.MAX_VALUE;
    let maxNetPay = Number.MIN_VALUE;

    data.forEach(record => {
        const netPay = record.calc_net_pay || 0;
        totalNetPay += netPay;
        
        if (netPay < minNetPay) {
            minNetPay = netPay;
        }
        
        if (netPay > maxNetPay) {
            maxNetPay = netPay;
        }
    });

    return {
        totalCount: data.length,
        totalNetPay,
        averageNetPay: totalNetPay / data.length,
        minNetPay,
        maxNetPay,
    };
};

/**
 * 按编制类型分组统计薪资数据
 * @param data 薪资数据
 * @returns 分组统计数据
 */
export const groupSalaryDataByType = (data: SalaryRecord[]) => {
    const groups: Record<string, {
        count: number;
        totalNetPay: number;
        records: SalaryRecord[];
    }> = {};

    data.forEach(record => {
        const type = record.sal_employee_type_key || '未知';
        const netPay = record.calc_net_pay || 0;

        if (!groups[type]) {
            groups[type] = {
                count: 0,
                totalNetPay: 0,
                records: [],
            };
        }

        groups[type].count += 1;
        groups[type].totalNetPay += netPay;
        groups[type].records.push(record);
    });

    return groups;
};

/**
 * 按月份分组统计薪资数据
 * @param data 薪资数据
 * @returns 分组统计数据
 */
export const groupSalaryDataByMonth = (data: SalaryRecord[]) => {
    const groups: Record<string, {
        count: number;
        totalNetPay: number;
        records: SalaryRecord[];
    }> = {};

    data.forEach(record => {
        const month = record.pay_period_identifier || '未知';
        const netPay = record.calc_net_pay || 0;

        if (!groups[month]) {
            groups[month] = {
                count: 0,
                totalNetPay: 0,
                records: [],
            };
        }

        groups[month].count += 1;
        groups[month].totalNetPay += netPay;
        groups[month].records.push(record);
    });

    return groups;
};

/**
 * 格式化金额为人民币格式
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * 格式化百分比
 * @param value 值
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export const formatPercent = (value: number, decimals: number = 2): string => {
    return `${(value * 100).toFixed(decimals)}%`;
};
