#!/bin/bash

# 手动调整功能API测试脚本
# 用于验证API端点是否正确返回手动调整数据

# 配置
BASE_URL="http://localhost:8080"
ENTRY_ID="3540"  # 请替换为实际的条目ID

echo "🔍 手动调整功能API测试"
echo "======================================="

# 1. 首先获取认证token
echo "1️⃣ 获取认证token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取token"
  echo "登录响应: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功，token: ${TOKEN:0:20}..."

# 2. 获取工资条目详情
echo ""
echo "2️⃣ 获取工资条目 $ENTRY_ID 的详情..."
ENTRY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v2/payroll-entries/$ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "API响应:"
echo $ENTRY_RESPONSE | jq '.'

# 3. 检查扣除详情中的住房公积金
echo ""
echo "3️⃣ 检查住房公积金字段..."
HOUSING_FUND_DATA=$(echo $ENTRY_RESPONSE | jq '.data.deductions_details.HOUSING_FUND_PERSONAL')

if [ "$HOUSING_FUND_DATA" = "null" ]; then
  echo "❌ 住房公积金字段不存在"
else
  echo "✅ 住房公积金字段数据:"
  echo $HOUSING_FUND_DATA | jq '.'
  
  # 检查is_manual字段
  IS_MANUAL=$(echo $HOUSING_FUND_DATA | jq '.is_manual')
  echo ""
  echo "🔍 is_manual 字段值: $IS_MANUAL (类型: $(echo $HOUSING_FUND_DATA | jq -r 'type'))"
  
  if [ "$IS_MANUAL" = "true" ]; then
    echo "✅ is_manual 字段正确为 true"
  elif [ "$IS_MANUAL" = "false" ]; then
    echo "❌ is_manual 字段为 false"
  else
    echo "❌ is_manual 字段缺失或值异常"
  fi
fi

# 4. 测试手动调整API（如果需要的话）
read -p "是否要测试手动调整API？(y/n): " TEST_MANUAL
if [ "$TEST_MANUAL" = "y" ]; then
  echo ""
  echo "4️⃣ 测试手动调整API..."
  
  CURRENT_AMOUNT=$(echo $HOUSING_FUND_DATA | jq -r '.amount // 1000')
  echo "当前金额: $CURRENT_AMOUNT"
  
  MANUAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/simple-payroll/manual-adjustment/$ENTRY_ID?component_code=HOUSING_FUND_PERSONAL&amount=$CURRENT_AMOUNT&reason=API测试" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  echo "手动调整API响应:"
  echo $MANUAL_RESPONSE | jq '.'
  
  # 5. 再次获取数据验证
  echo ""
  echo "5️⃣ 手动调整后再次获取数据..."
  
  sleep 1  # 等待1秒确保数据已保存
  
  ENTRY_RESPONSE_AFTER=$(curl -s -X GET "$BASE_URL/api/v2/payroll-entries/$ENTRY_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  HOUSING_FUND_DATA_AFTER=$(echo $ENTRY_RESPONSE_AFTER | jq '.data.deductions_details.HOUSING_FUND_PERSONAL')
  echo "手动调整后的住房公积金数据:"
  echo $HOUSING_FUND_DATA_AFTER | jq '.'
  
  IS_MANUAL_AFTER=$(echo $HOUSING_FUND_DATA_AFTER | jq '.is_manual')
  echo ""
  echo "🔍 调整后 is_manual 字段值: $IS_MANUAL_AFTER"
  
  if [ "$IS_MANUAL_AFTER" = "true" ]; then
    echo "✅ 手动调整成功，is_manual 正确为 true"
  else
    echo "❌ 手动调整失败，is_manual 不为 true"
  fi
fi

echo ""
echo "🏁 测试完成"