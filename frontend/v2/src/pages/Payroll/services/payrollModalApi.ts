import apiClient from '../../../api/apiClient';

// 薪资模态框数据接口
export interface PayrollModalData {
  薪资条目id: number;
  基础信息: {
    员工编号?: string;
    员工姓名?: string;
    部门名称?: string;
    职位名称?: string;
    人员类别?: string;
    编制?: string;
    薪资期间名称?: string;
    期间开始日期?: string;
    期间结束日期?: string;
  };
  汇总信息: {
    应发合计: string;
    扣除合计: string;
    实发合计: string;
  };
  应发明细: {
    // 标准应发明细字段
    基本工资?: string;
    岗位工资?: string;
    绩效工资?: string;
    补助?: string;
    信访岗位津贴?: string;
    基础绩效?: string;
    津贴?: string;
    职务技术等级工资?: string;
    级别岗位级别工资?: string;
    九三年工改保留补贴?: string;
    独生子女父母奖励金?: string;
    公务员规范性津贴补贴?: string;
    公务交通补贴?: string;
    基础绩效奖?: string;
    薪级工资?: string;
    见习试用期工资?: string;
    月基础绩效?: string;
    月奖励绩效?: string;
    岗位职务补贴?: string;
    信访工作人员岗位津贴?: string;
    乡镇工作补贴?: string;
    补扣社保?: string;
    一次性补扣发?: string;
    绩效奖金补扣发?: string;
    奖励绩效补扣发?: string;
    // 其他应发项目
    其他应发项目: Record<string, string>;
  };
  扣除明细: {
    个人扣缴项目: {
      养老保险个人应缴费额?: string;
      医疗保险个人应缴费额?: string;
      失业保险个人应缴费额?: string;
      职业年金个人应缴费额?: string;
      住房公积金个人应缴费额?: string;
      个人所得税?: string;
      其他个人扣缴: Record<string, string>;
    };
    单位扣缴项目: {
      养老保险单位应缴费额?: string;
      医疗保险单位应缴总额?: string;
      医疗保险单位应缴费额?: string;
      大病医疗单位应缴费额?: string;
      失业保险单位应缴费额?: string;
      工伤保险单位应缴费额?: string;
      职业年金单位应缴费额?: string;
      住房公积金单位应缴费额?: string;
      其他单位扣缴: Record<string, string>;
    };
  };
  计算参数: {
    社保缴费基数?: string;
    住房公积金缴费基数?: string;
    养老保险个人费率?: string;
    医疗保险个人费率?: string;
    住房公积金个人费率?: string;
    其他计算参数: Record<string, string>;
  };
}

/**
 * 获取薪资模态框数据
 * @param payrollEntryId 薪资条目ID
 * @returns 薪资模态框数据
 */
export const getPayrollModalData = async (payrollEntryId: number): Promise<PayrollModalData> => {
  const response = await apiClient.get(`/reports/payroll-modal/data/${payrollEntryId}`);
  return response.data;
};

export const payrollModalApi = {
  getPayrollModalData,
}; 