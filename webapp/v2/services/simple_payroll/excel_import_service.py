"""
Excel导入服务模块
处理工资数据的Excel文件导入、解析、验证和转换
"""

import pandas as pd
import io
from typing import List, Dict, Any, Tuple, Optional
from decimal import Decimal
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ExcelImportService:
    """Excel导入服务"""
    
    def __init__(self):
        # 定义标准的列映射
        self.column_mapping = {
            # 中文列名 -> 标准字段名
            '员工编号': 'employee_code',
            '员工姓名': 'employee_name', 
            '姓名': 'employee_name',
            '部门': 'department',
            '基本工资': 'basic_salary',
            '岗位工资': 'position_salary',
            '加班费': 'overtime_pay',
            '奖金': 'bonus',
            '津贴': 'allowances',
            '补贴': 'allowances',
            '应发合计': 'gross_pay',
            '应发合计': 'gross_pay',
            '社保个人': 'social_security_personal',
            '公积金个人': 'housing_fund_personal',
            '个人所得税': 'personal_income_tax',
            '其他扣除': 'other_deductions',
            '扣除合计': 'total_deductions',
            '实发合计': 'net_pay',
            '实发合计': 'net_pay',
            
            # 英文列名支持
            'employee_code': 'employee_code',
            'employee_name': 'employee_name',
            'department': 'department',
            'basic_salary': 'basic_salary',
            'position_salary': 'position_salary',
            'overtime_pay': 'overtime_pay',
            'bonus': 'bonus',
            'allowances': 'allowances',
            'gross_pay': 'gross_pay',
            'social_security_personal': 'social_security_personal',
            'housing_fund_personal': 'housing_fund_personal',
            'personal_income_tax': 'personal_income_tax',
            'other_deductions': 'other_deductions',
            'total_deductions': 'total_deductions',
            'net_pay': 'net_pay'
        }
        
        # 必填字段
        self.required_fields = ['employee_code', 'employee_name', 'gross_pay', 'net_pay']
        
        # 数值字段
        self.numeric_fields = [
            'basic_salary', 'position_salary', 'overtime_pay', 'bonus', 'allowances',
            'gross_pay', 'social_security_personal', 'housing_fund_personal',
            'personal_income_tax', 'other_deductions', 'total_deductions', 'net_pay'
        ]
    
    def parse_excel_file(self, file_content: bytes, filename: str) -> Tuple[bool, List[Dict[str, Any]], List[str]]:
        """
        解析Excel文件
        
        Returns:
            (success, data, errors)
        """
        try:
            # 读取Excel文件
            if filename.endswith('.xlsx'):
                df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
            elif filename.endswith('.xls'):
                df = pd.read_excel(io.BytesIO(file_content), engine='xlrd')
            else:
                return False, [], ["不支持的文件格式，请使用.xlsx或.xls格式"]
            
            # 检查是否为空文件
            if df.empty:
                return False, [], ["Excel文件为空或没有数据"]
            
            # 标准化列名
            df = self._normalize_columns(df)
            
            # 验证必要列是否存在
            missing_columns = self._check_required_columns(df)
            if missing_columns:
                return False, [], [f"缺少必要的列: {', '.join(missing_columns)}"]
            
            # 转换数据类型
            df = self._convert_data_types(df)
            
            # 转换为字典列表
            data = df.to_dict('records')
            
            # 清理数据（移除空行、处理NaN等）
            data = self._clean_data(data)
            
            if not data:
                return False, [], ["处理后没有有效的数据行"]
            
            logger.info(f"成功解析Excel文件 {filename}，共 {len(data)} 行数据")
            return True, data, []
            
        except Exception as e:
            logger.error(f"解析Excel文件失败: {e}", exc_info=True)
            return False, [], [f"文件解析失败: {str(e)}"]
    
    def validate_data(self, data: List[Dict[str, Any]]) -> Tuple[bool, List[str], List[str]]:
        """
        验证导入数据
        
        Returns:
            (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        for index, row in enumerate(data, start=1):
            row_errors, row_warnings = self._validate_row(row, index)
            errors.extend(row_errors)
            warnings.extend(row_warnings)
        
        # 检查重复的员工编号
        employee_codes = [row.get('employee_code') for row in data if row.get('employee_code')]
        duplicate_codes = [code for code in set(employee_codes) if employee_codes.count(code) > 1]
        if duplicate_codes:
            errors.append(f"发现重复的员工编号: {', '.join(duplicate_codes)}")
        
        is_valid = len(errors) == 0
        
        logger.info(f"数据验证完成: 有效={is_valid}, 错误={len(errors)}, 警告={len(warnings)}")
        return is_valid, errors, warnings
    
    def convert_to_payroll_entries(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        将导入数据转换为工资条目格式
        """
        payroll_entries = []
        
        for row in data:
            try:
                # 构建收入明细
                earnings_details = {}
                if row.get('basic_salary'):
                    earnings_details['basic_salary'] = float(row['basic_salary'])
                if row.get('position_salary'):
                    earnings_details['position_salary'] = float(row['position_salary'])
                if row.get('overtime_pay'):
                    earnings_details['overtime_pay'] = float(row['overtime_pay'])
                if row.get('bonus'):
                    earnings_details['bonus'] = float(row['bonus'])
                if row.get('allowances'):
                    earnings_details['allowances'] = float(row['allowances'])
                
                # 构建扣除明细
                deductions_details = {}
                if row.get('social_security_personal'):
                    deductions_details['social_security_personal'] = float(row['social_security_personal'])
                if row.get('housing_fund_personal'):
                    deductions_details['housing_fund_personal'] = float(row['housing_fund_personal'])
                if row.get('personal_income_tax'):
                    deductions_details['personal_income_tax'] = float(row['personal_income_tax'])
                if row.get('other_deductions'):
                    deductions_details['other_deductions'] = float(row['other_deductions'])
                
                # 构建工资条目
                entry = {
                    'employee_code': str(row['employee_code']).strip(),
                    'employee_name': str(row['employee_name']).strip(),
                    'department': str(row.get('department', '')).strip(),
                    'gross_pay': Decimal(str(row['gross_pay'])),
                    'net_pay': Decimal(str(row['net_pay'])),
                    'earnings_details': earnings_details,
                    'deductions_details': deductions_details,
                    'calculation_inputs': {
                        'import_source': 'excel',
                        'import_time': datetime.now().isoformat()
                    }
                }
                
                payroll_entries.append(entry)
                
            except Exception as e:
                logger.error(f"转换行数据失败: {row}, 错误: {e}")
                continue
        
        logger.info(f"成功转换 {len(payroll_entries)} 条工资记录")
        return payroll_entries
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """标准化列名"""
        # 去除列名的前后空格
        df.columns = df.columns.str.strip()
        
        # 映射到标准字段名
        new_columns = {}
        for col in df.columns:
            if col in self.column_mapping:
                new_columns[col] = self.column_mapping[col]
            else:
                # 尝试模糊匹配
                for cn_name, en_name in self.column_mapping.items():
                    if cn_name in col or col in cn_name:
                        new_columns[col] = en_name
                        break
                else:
                    # 保持原列名，转为小写并替换空格
                    new_columns[col] = col.lower().replace(' ', '_')
        
        df = df.rename(columns=new_columns)
        return df
    
    def _check_required_columns(self, df: pd.DataFrame) -> List[str]:
        """检查必要列是否存在"""
        missing_columns = []
        for field in self.required_fields:
            if field not in df.columns:
                # 查找对应的中文名
                cn_names = [cn for cn, en in self.column_mapping.items() if en == field]
                cn_name = cn_names[0] if cn_names else field
                missing_columns.append(cn_name)
        return missing_columns
    
    def _convert_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """转换数据类型"""
        for col in df.columns:
            if col in self.numeric_fields:
                # 转换数值字段
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            elif col in ['employee_code', 'employee_name', 'department']:
                # 转换文本字段
                df[col] = df[col].astype(str).fillna('')
        
        return df
    
    def _clean_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """清理数据"""
        cleaned_data = []
        
        for row in data:
            # 跳过员工编号或姓名为空的行
            if not row.get('employee_code') or not row.get('employee_name'):
                continue
            
            # 跳过员工编号为NaN或空字符串的行
            employee_code = str(row['employee_code']).strip()
            if employee_code in ['nan', 'NaN', '', 'None']:
                continue
                
            # 跳过员工姓名为空的行
            employee_name = str(row['employee_name']).strip()
            if employee_name in ['nan', 'NaN', '', 'None']:
                continue
            
            # 处理数值字段的NaN
            for field in self.numeric_fields:
                if field in row:
                    value = row[field]
                    if pd.isna(value) or str(value).lower() in ['nan', 'none', '']:
                        row[field] = 0
            
            cleaned_data.append(row)
        
        return cleaned_data
    
    def _validate_row(self, row: Dict[str, Any], row_index: int) -> Tuple[List[str], List[str]]:
        """验证单行数据"""
        errors = []
        warnings = []
        
        # 检查必填字段
        for field in self.required_fields:
            if not row.get(field):
                field_cn = self._get_chinese_name(field)
                errors.append(f"第{row_index}行：{field_cn}不能为空")
        
        # 检查员工编号格式
        employee_code = str(row.get('employee_code', '')).strip()
        if employee_code and (len(employee_code) < 2 or len(employee_code) > 20):
            errors.append(f"第{row_index}行：员工编号长度应在2-20字符之间")
        
        # 检查数值字段
        for field in self.numeric_fields:
            if field in row:
                value = row[field]
                try:
                    numeric_value = float(value) if value is not None else 0
                    if numeric_value < 0:
                        field_cn = self._get_chinese_name(field)
                        errors.append(f"第{row_index}行：{field_cn}不能为负数")
                except (ValueError, TypeError):
                    field_cn = self._get_chinese_name(field)
                    errors.append(f"第{row_index}行：{field_cn}必须是数字")
        
        # 逻辑验证
        try:
            gross_pay = float(row.get('gross_pay', 0))
            net_pay = float(row.get('net_pay', 0))
            
            if gross_pay > 0 and net_pay > gross_pay:
                warnings.append(f"第{row_index}行：实发合计大于应发合计，请检查")
            
            if gross_pay > 0 and net_pay <= 0:
                warnings.append(f"第{row_index}行：应发合计大于0但实发合计为0，请检查")
                
            # 检查基本计算逻辑
            basic_salary = float(row.get('basic_salary', 0))
            if basic_salary > gross_pay:
                warnings.append(f"第{row_index}行：基本工资大于应发合计，请检查")
                
        except (ValueError, TypeError):
            pass  # 数值转换错误在上面已经处理了
        
        return errors, warnings
    
    def _get_chinese_name(self, field_name: str) -> str:
        """获取字段的中文名称"""
        reverse_mapping = {v: k for k, v in self.column_mapping.items() if isinstance(k, str) and len(k) > 1}
        return reverse_mapping.get(field_name, field_name)
    
    def generate_template(self) -> pd.DataFrame:
        """生成导入模板"""
        template_data = {
            '员工编号': ['EMP001', 'EMP002'],
            '员工姓名': ['张三', '李四'],
            '部门': ['技术部', '销售部'],
            '基本工资': [8000, 6000],
            '岗位工资': [2000, 1500],
            '加班费': [500, 300],
            '奖金': [1000, 2000],
            '津贴': [300, 200],
            '应发合计': [11800, 10000],
            '社保个人': [800, 600],
            '公积金个人': [480, 360],
            '个人所得税': [200, 150],
            '其他扣除': [100, 50],
            '实发合计': [10220, 8840]
        }
        
        df = pd.DataFrame(template_data)
        return df 