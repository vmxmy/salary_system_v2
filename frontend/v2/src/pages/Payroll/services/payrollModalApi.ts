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
  员工详细信息: {
    联系信息: {
      电话?: string;
      邮箱?: string;
      家庭住址?: string;
      紧急联系人?: string;
      紧急联系电话?: string;
    };
    个人信息: {
      身份证号?: string;
      出生日期?: string;
      性别?: string;
      民族?: string;
      民族详情?: string;
      婚姻状况?: string;
      学历?: string;
      专业?: string;
      政治面貌?: string;
    };
    工作信息: {
      入职日期?: string;
      首次工作日期?: string;
      现职位开始日期?: string;
      中断服务年限?: string;
      员工状态?: string;
      工作状态?: string;
      用工类型?: string;
      合同类型?: string;
      合同开始日期?: string;
      合同结束日期?: string;
      试用期结束日期?: string;
      薪级?: string;
      薪档?: string;
      职位等级?: string;
    };
    社保公积金信息: {
      社保客户号?: string;
      社保账号?: string;
      住房公积金客户号?: string;
      公积金账号?: string;
      社保缴费基数?: string;
      公积金缴费基数?: string;
    };
    银行账号信息: {
      开户银行?: string;
      银行名称?: string;
      开户行?: string;
      账户持有人?: string;
      银行账号?: string;
      开户支行?: string;
      银行代码?: string;
      账户类型?: string;
    };
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