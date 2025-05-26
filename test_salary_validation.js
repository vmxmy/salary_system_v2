// 分析薪资数据合规性
const headers = "序号,人员编号,人员姓名,身份证,部门,人员身份,人员职级,工资统发,财政供养,应发工资,实发工资,扣发合计,职务/技术等级工资,级别/岗位级别工资,基础绩效奖,93年工改保留补贴,独生子女父母奖励金,公务员规范性津贴补贴,公务交通补贴,岗位工资,薪级工资,见习试用期工资,月基础绩效,月奖励绩效,岗位职务补贴,信访工作人员岗位津贴,乡镇工作补贴,补扣社保,一次性补扣发,绩效奖金补扣发,奖励绩效补扣发,个人缴养老保险费,个人缴医疗保险费,个人缴职业年金,个人缴失业保险费,个人缴住房公积金,个人所得税".split(',');
const values = "1,00003,汪琳,510103197108310040,,已登记公务员,县处级正职,是,是,29121,22821.20,6290.58,2770,4049,6920,116,,6618,1040,,,,,,,,,9.22,7608,,,1613.76,403.44,806.88,,3303.00,163.50".split(',');

console.log("📊 薪资数据分析");
console.log("================");

// 创建数据映射
const data = {};
headers.forEach((header, index) => {
    data[header] = values[index] || '';
});

// 清理数值
function cleanNumber(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/[^\d.-]/g, ''));
}

// 收入项计算
console.log("\n💰 收入项明细：");
const incomeItems = [
    '职务/技术等级工资', '级别/岗位级别工资', '基础绩效奖', 
    '93年工改保留补贴', '独生子女父母奖励金', '公务员规范性津贴补贴', 
    '公务交通补贴', '岗位工资', '薪级工资', '见习试用期工资',
    '月基础绩效', '月奖励绩效', '岗位职务补贴', '信访工作人员岗位津贴', 
    '乡镇工作补贴'
];

let totalIncome = 0;
incomeItems.forEach(item => {
    const value = cleanNumber(data[item]);
    if (value > 0) {
        console.log(`  ${item}: ${value}`);
        totalIncome += value;
    }
});

// 扣除项计算
console.log("\n💸 扣除项明细：");
const deductionItems = [
    '个人缴养老保险费', '个人缴医疗保险费', '个人缴职业年金',
    '个人缴失业保险费', '个人缴住房公积金', '个人所得税'
];

let totalDeductions = 0;
deductionItems.forEach(item => {
    const value = cleanNumber(data[item]);
    if (value >= 0) {
        console.log(`  ${item}: ${value}`);
        totalDeductions += value;
    }
});

// 补扣项
console.log("\n🔧 补扣项明细：");
const adjustmentItems = [
    '补扣社保', '一次性补扣发', '绩效奖金补扣发', '奖励绩效补扣发'
];

let totalAdjustments = 0;
adjustmentItems.forEach(item => {
    const value = cleanNumber(data[item]);
    if (value > 0) {
        console.log(`  ${item}: ${value}`);
        totalAdjustments += value;
    }
});

// 验证计算
console.log("\n✅ 验证结果：");
console.log(`  应发工资: ${cleanNumber(data['应发工资'])}`);
console.log(`  计算的收入总额: ${totalIncome.toFixed(2)}`);
console.log(`  差额: ${(cleanNumber(data['应发工资']) - totalIncome).toFixed(2)}`);

console.log(`\n  扣发合计: ${cleanNumber(data['扣发合计'])}`);
console.log(`  计算的扣除总额(五险一金+个税): ${totalDeductions.toFixed(2)}`);
console.log(`  差额: ${(cleanNumber(data['扣发合计']) - totalDeductions).toFixed(2)}`);

console.log(`\n  实发工资: ${cleanNumber(data['实发工资'])}`);
console.log(`  计算的实发(应发-扣发-补扣): ${(cleanNumber(data['应发工资']) - totalDeductions - totalAdjustments).toFixed(2)}`);
console.log(`  差额: ${(cleanNumber(data['实发工资']) - (cleanNumber(data['应发工资']) - totalDeductions - totalAdjustments)).toFixed(2)}`);

// 合规性检查
console.log("\n⚠️ 合规性检查：");
const shouldPayCalculated = cleanNumber(data['应发工资']);
const actualPayCalculated = cleanNumber(data['实发工资']);
const deductionsCalculated = cleanNumber(data['扣发合计']);

// 检查计算逻辑
if (Math.abs(shouldPayCalculated - totalIncome) > 0.01) {
    console.log("  ❌ 应发工资与收入项总和不匹配");
} else {
    console.log("  ✅ 应发工资计算正确");
}

if (Math.abs(deductionsCalculated - totalDeductions) > 0.01) {
    console.log("  ❌ 扣发合计与扣除项总和不匹配");
} else {
    console.log("  ✅ 扣发合计计算正确");
}

const expectedNetPay = shouldPayCalculated - totalDeductions - totalAdjustments;
if (Math.abs(actualPayCalculated - expectedNetPay) > 0.01) {
    console.log("  ❌ 实发工资计算可能有误");
    console.log(`     预期: ${expectedNetPay.toFixed(2)}, 实际: ${actualPayCalculated}`);
} else {
    console.log("  ✅ 实发工资计算正确");
} 