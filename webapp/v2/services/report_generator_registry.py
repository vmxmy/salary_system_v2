"""
报表生成器注册表和自动适配服务
自动推断和配置报表类型的生成器类名和模块路径
"""

import inspect
import importlib
from typing import Dict, List, Optional, Tuple, Type
from dataclasses import dataclass

from .report_generators import (
    BaseReportGenerator,
    PayrollSummaryGenerator,
    PayrollDetailGenerator,
    DepartmentSummaryGenerator,
    TaxDeclarationGenerator,
    SocialInsuranceGenerator,
    AttendanceSummaryGenerator,
)


@dataclass
class GeneratorInfo:
    """生成器信息"""
    class_name: str
    module_path: str
    category: str
    description: str
    display_name: str
    suggested_code: str


class ReportGeneratorRegistry:
    """报表生成器注册表"""
    
    def __init__(self):
        self._generators: Dict[str, GeneratorInfo] = {}
        self._initialize_built_in_generators()
    
    def _initialize_built_in_generators(self):
        """初始化内置生成器"""
        built_in_generators = [
            (PayrollSummaryGenerator, "payroll", "薪资汇总表", "按部门汇总的薪资统计报表", "payroll_summary"),
            (PayrollDetailGenerator, "payroll", "薪资明细表", "详细的员工薪资明细表", "payroll_detail"),
            (DepartmentSummaryGenerator, "summary", "部门汇总表", "按部门汇总的统计报表", "department_summary"),
            (TaxDeclarationGenerator, "tax", "个税申报表", "个人所得税申报信息", "tax_declaration"),
            (SocialInsuranceGenerator, "insurance", "社保缴费表", "社会保险缴费信息", "social_insurance"),
            (AttendanceSummaryGenerator, "attendance", "考勤汇总表", "员工考勤汇总信息", "attendance_summary"),
        ]
        
        for generator_class, category, display_name, description, suggested_code in built_in_generators:
            module_path = f"webapp.v2.services.report_generators.{generator_class.__module__.split('.')[-1]}"
            
            generator_info = GeneratorInfo(
                class_name=generator_class.__name__,
                module_path=module_path,
                category=category,
                description=description,
                display_name=display_name,
                suggested_code=suggested_code
            )
            
            self._generators[generator_class.__name__] = generator_info
    
    def get_all_generators(self) -> List[GeneratorInfo]:
        """获取所有可用的生成器"""
        return list(self._generators.values())
    
    def get_generator_by_class_name(self, class_name: str) -> Optional[GeneratorInfo]:
        """根据类名获取生成器信息"""
        return self._generators.get(class_name)
    
    def get_generator_by_category(self, category: str) -> List[GeneratorInfo]:
        """根据分类获取生成器列表"""
        return [info for info in self._generators.values() if info.category == category]
    
    def suggest_generator_by_name(self, report_name: str) -> Optional[GeneratorInfo]:
        """根据报表名称推荐生成器"""
        name_lower = report_name.lower()
        
        # 关键词映射
        keyword_mappings = {
            '薪资': ['payroll'],
            '工资': ['payroll'],
            '明细': ['detail'],
            '汇总': ['summary'],
            '部门': ['department'],
            '个税': ['tax'],
            '申报': ['tax'],
            '社保': ['insurance'],
            '考勤': ['attendance'],
        }
        
        # 分析报表名称中的关键词
        matched_categories = set()
        for keyword, categories in keyword_mappings.items():
            if keyword in report_name:
                matched_categories.update(categories)
        
        # 根据匹配的分类推荐生成器
        if 'payroll' in matched_categories:
            if 'detail' in matched_categories or '明细' in report_name:
                return self.get_generator_by_class_name('PayrollDetailGenerator')
            else:
                return self.get_generator_by_class_name('PayrollSummaryGenerator')
        elif 'department' in matched_categories:
            return self.get_generator_by_class_name('DepartmentSummaryGenerator')
        elif 'tax' in matched_categories:
            return self.get_generator_by_class_name('TaxDeclarationGenerator')
        elif 'insurance' in matched_categories:
            return self.get_generator_by_class_name('SocialInsuranceGenerator')
        elif 'attendance' in matched_categories:
            return self.get_generator_by_class_name('AttendanceSummaryGenerator')
        
        # 如果没有明确匹配，返回通用的汇总生成器
        return self.get_generator_by_class_name('PayrollSummaryGenerator')
    
    def auto_infer_generator(
        self,
        report_name: str,
        report_category: Optional[str] = None,
        data_source_name: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        自动推断生成器类名和模块路径
        
        Args:
            report_name: 报表名称
            report_category: 报表分类
            data_source_name: 数据源名称
            
        Returns:
            (generator_class, generator_module)
        """
        # 🔧 优先根据报表名称的具体特征推断（最精确）
        suggested_generator = self.suggest_generator_by_name(report_name)
        if suggested_generator:
            return suggested_generator.class_name, suggested_generator.module_path
        
        # 根据数据源名称推断
        if data_source_name:
            data_source_lower = data_source_name.lower()
            if 'payroll' in data_source_lower or '薪资' in data_source_lower:
                if 'detail' in data_source_lower or '明细' in data_source_lower:
                    generator_info = self.get_generator_by_class_name('PayrollDetailGenerator')
                else:
                    generator_info = self.get_generator_by_class_name('PayrollSummaryGenerator')
                return generator_info.class_name, generator_info.module_path
        
        # 最后根据分类匹配（最宽泛）
        if report_category:
            category_generators = self.get_generator_by_category(report_category)
            if category_generators:
                generator_info = category_generators[0]
                return generator_info.class_name, generator_info.module_path
        
        # 默认返回薪资汇总生成器
        default_generator = self.get_generator_by_class_name('PayrollSummaryGenerator')
        return default_generator.class_name, default_generator.module_path
    
    def validate_generator(self, generator_class: str, generator_module: str) -> bool:
        """验证生成器是否存在且可用"""
        try:
            module = importlib.import_module(generator_module)
            generator_cls = getattr(module, generator_class)
            
            # 检查是否是BaseReportGenerator的子类
            return (
                inspect.isclass(generator_cls) and
                issubclass(generator_cls, BaseReportGenerator) and
                generator_cls != BaseReportGenerator
            )
        except (ImportError, AttributeError):
            return False
    
    def register_custom_generator(
        self,
        generator_class: Type[BaseReportGenerator],
        category: str,
        description: str,
        display_name: str,
        suggested_code: str
    ):
        """注册自定义生成器"""
        module_path = f"{generator_class.__module__}"
        
        generator_info = GeneratorInfo(
            class_name=generator_class.__name__,
            module_path=module_path,
            category=category,
            description=description,
            display_name=display_name,
            suggested_code=suggested_code
        )
        
        self._generators[generator_class.__name__] = generator_info


# 全局注册表实例
registry = ReportGeneratorRegistry()


def get_registry() -> ReportGeneratorRegistry:
    """获取全局注册表实例"""
    return registry


def auto_infer_generator_config(
    report_name: str,
    report_category: Optional[str] = None,
    data_source_name: Optional[str] = None
) -> Dict[str, str]:
    """
    自动推断生成器配置的便捷函数
    
    Args:
        report_name: 报表名称
        report_category: 报表分类
        data_source_name: 数据源名称
        
    Returns:
        包含generator_class和generator_module的字典
    """
    generator_class, generator_module = registry.auto_infer_generator(
        report_name, report_category, data_source_name
    )
    
    return {
        'generator_class': generator_class,
        'generator_module': generator_module
    }


if __name__ == "__main__":
    # 测试代码
    test_cases = [
        ("薪资明细表", "payroll", None),
        ("部门汇总报表", "summary", None),
        ("个税申报", "tax", None),
        ("员工考勤统计", None, None),
        ("月度薪资汇总", None, "payroll_entries"),
    ]
    
    for name, category, data_source in test_cases:
        result = auto_infer_generator_config(name, category, data_source)
        print(f"报表: {name} -> {result}") 