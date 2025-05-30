// 调试多数据源查询问题
// 使用curl测试后端API，查看返回的数据结构

console.log("测试多数据源查询API...");

// 测试参数
const requestData = {
  dataSources: ["4", "5"],
  joins: [{
    left_data_source_id: "4",
    left_field_name: "department_id",
    join_type: "left",
    right_data_source_id: "5",
    right_field_name: "id"
  }],
  fields: ["4.employee_code", "4.first_name", "5.name"],
  pageSize: 5,
  offset: 0
};

console.log("请求参数：");
console.log(JSON.stringify(requestData, null, 2));

// 使用下面的curl命令测试：
console.log("\n使用以下curl命令测试：");
console.log(`curl -X POST http://127.0.0.1:8080/v2/reports/data-sources/preview-multi \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '${JSON.stringify(requestData)}'`);

console.log("\n重点检查返回数据的字段名格式！"); 