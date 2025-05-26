// 测试CSV解析
const csvLine = "2,1003,一般员工3,专员,10.31.59.1081:32773,0,0,0,0,0,补扣社保,4462.5,0,0,4462.5,0,0,1828.08,6290.58,9.22,-1837.3";

console.log("原始CSV数据:");
console.log(csvLine);
console.log("\n使用split(',')解析结果:");
const values = csvLine.split(',');
values.forEach((value, index) => {
    console.log(`列${index}: "${value}"`);
});

console.log("\n数据列数:", values.length);

// 预期的列映射
const expectedColumns = [
    "序号", "员工编号", "人员类别", "职位", "部门", 
    "基本工资", "岗位津贴", "计算工作小时", "保密费", "其他",
    "备注", "养老保险", "医疗保险", "失业保险", "公积金",
    "个人所得税", "应发合计", "扣发合计", "实发合计", "补扣社保", "实发合计2"
];

console.log("\n列映射（假设21列）:");
expectedColumns.forEach((col, index) => {
    console.log(`${col}: "${values[index] || '未定义'}"`);
}); 