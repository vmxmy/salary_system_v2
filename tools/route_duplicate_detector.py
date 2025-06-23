#!/usr/bin/env python3
"""
FastAPI 重复路由检测器

使用AST解析技术检测FastAPI应用中的重复API路由定义。
支持：
- 直接在app上定义的路由 (@app.get, @app.post等)
- APIRouter中定义的路由 (@router.get, @router.post等)  
- include_router时的prefix处理
- 路径参数和查询参数的标准化处理

使用方法：
python route_duplicate_detector.py [项目根目录]

作者: Claude Code
日期: 2025-01-23
"""

import ast
import os
import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional
from collections import defaultdict
import argparse


class RouteInfo:
    """路由信息类"""
    def __init__(self, method: str, path: str, file_path: str, line_number: int, 
                 function_name: str = "", router_name: str = "", prefix: str = ""):
        self.method = method.upper()
        self.path = path
        self.file_path = file_path
        self.line_number = line_number
        self.function_name = function_name
        self.router_name = router_name
        self.prefix = prefix
        self.full_path = self._build_full_path()
    
    def _build_full_path(self) -> str:
        """构建完整路径"""
        full = self.prefix.rstrip('/') + '/' + self.path.lstrip('/')
        # 标准化路径
        full = re.sub(r'/+', '/', full)
        if full != '/' and full.endswith('/'):
            full = full.rstrip('/')
        return full
    
    def __str__(self):
        return f"{self.method} {self.full_path} ({self.file_path}:{self.line_number})"
    
    def __repr__(self):
        return self.__str__()


class RouterInfo:
    """路由器信息类"""
    def __init__(self, name: str, prefix: str = "", file_path: str = ""):
        self.name = name
        self.prefix = prefix
        self.file_path = file_path
        self.routes: List[RouteInfo] = []


class FastAPIRouteDetector(ast.NodeVisitor):
    """FastAPI路由检测器"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.routes: List[RouteInfo] = []
        self.routers: Dict[str, RouterInfo] = {}
        self.imports: Dict[str, str] = {}  # 导入映射 {别名: 模块路径}
        self.current_router_name = None
        
        # HTTP方法列表
        self.http_methods = {
            'get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'
        }
    
    def visit_Import(self, node: ast.Import):
        """处理import语句"""
        for alias in node.names:
            name = alias.asname if alias.asname else alias.name
            self.imports[name] = alias.name
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node: ast.ImportFrom):
        """处理from ... import语句"""
        if node.module:
            for alias in node.names:
                name = alias.asname if alias.asname else alias.name
                self.imports[name] = f"{node.module}.{alias.name}"
        self.generic_visit(node)
    
    def visit_Assign(self, node: ast.Assign):
        """处理赋值语句，查找APIRouter定义"""
        if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            var_name = node.targets[0].id
            
            # 检查是否是APIRouter创建
            if isinstance(node.value, ast.Call):
                if self._is_api_router_call(node.value):
                    prefix = self._extract_prefix_from_router_call(node.value)
                    self.routers[var_name] = RouterInfo(var_name, prefix, self.file_path)
        
        self.generic_visit(node)
    
    def visit_FunctionDef(self, node: ast.FunctionDef):
        """处理函数定义，查找路由装饰器"""
        for decorator in node.decorator_list:
            route_info = self._extract_route_from_decorator(decorator, node.name, node.lineno)
            if route_info:
                self.routes.append(route_info)
        
        self.generic_visit(node)
    
    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        """处理异步函数定义，查找路由装饰器"""
        for decorator in node.decorator_list:
            route_info = self._extract_route_from_decorator(decorator, node.name, node.lineno)
            if route_info:
                self.routes.append(route_info)
        
        self.generic_visit(node)
    
    def visit_Expr(self, node: ast.Expr):
        """处理表达式，查找include_router调用"""
        if isinstance(node.value, ast.Call):
            self._check_include_router_call(node.value, node.lineno)
        
        self.generic_visit(node)
    
    def _is_api_router_call(self, call_node: ast.Call) -> bool:
        """检查是否是APIRouter调用"""
        if isinstance(call_node.func, ast.Name):
            return call_node.func.id == 'APIRouter'
        elif isinstance(call_node.func, ast.Attribute):
            return call_node.func.attr == 'APIRouter'
        return False
    
    def _extract_prefix_from_router_call(self, call_node: ast.Call) -> str:
        """从APIRouter调用中提取prefix参数"""
        # 检查关键字参数
        for keyword in call_node.keywords:
            if keyword.arg == 'prefix':
                if isinstance(keyword.value, ast.Constant):
                    return keyword.value.value
                elif hasattr(ast, 'Str') and isinstance(keyword.value, ast.Str):  # Python < 3.8
                    return keyword.value.s
        return ""
    
    def _extract_route_from_decorator(self, decorator: ast.expr, func_name: str, line_no: int) -> Optional[RouteInfo]:
        """从装饰器中提取路由信息"""
        if isinstance(decorator, ast.Call):
            # 处理 @app.get("/path") 或 @router.get("/path") 形式
            if isinstance(decorator.func, ast.Attribute):
                obj_name = None
                method_name = decorator.func.attr
                
                if isinstance(decorator.func.value, ast.Name):
                    obj_name = decorator.func.value.id
                
                if method_name in self.http_methods and obj_name:
                    path = self._extract_path_from_decorator_call(decorator)
                    if path is not None:
                        return RouteInfo(
                            method=method_name,
                            path=path,
                            file_path=self.file_path,
                            line_number=line_no,
                            function_name=func_name,
                            router_name=obj_name
                        )
        elif isinstance(decorator, ast.Attribute):
            # 处理 @app.get 或 @router.get 形式（无参数）
            if isinstance(decorator.value, ast.Name):
                obj_name = decorator.value.id
                method_name = decorator.attr
                
                if method_name in self.http_methods:
                    return RouteInfo(
                        method=method_name,
                        path="/",  # 默认路径
                        file_path=self.file_path,
                        line_number=line_no,
                        function_name=func_name,
                        router_name=obj_name
                    )
        
        return None
    
    def _extract_path_from_decorator_call(self, call_node: ast.Call) -> Optional[str]:
        """从装饰器调用中提取路径参数"""
        # 检查位置参数
        if call_node.args and len(call_node.args) > 0:
            first_arg = call_node.args[0]
            if isinstance(first_arg, ast.Constant):
                return first_arg.value
            elif hasattr(ast, 'Str') and isinstance(first_arg, ast.Str):  # Python < 3.8
                return first_arg.s
        
        # 检查关键字参数
        for keyword in call_node.keywords:
            if keyword.arg == 'path':
                if isinstance(keyword.value, ast.Constant):
                    return keyword.value.value
                elif hasattr(ast, 'Str') and isinstance(keyword.value, ast.Str):  # Python < 3.8
                    return keyword.value.s
        
        return None
    
    def _check_include_router_call(self, call_node: ast.Call, line_no: int):
        """检查include_router调用"""
        if isinstance(call_node.func, ast.Attribute):
            if call_node.func.attr == 'include_router':
                # 提取router和prefix信息
                router_arg = None
                prefix_arg = ""
                
                if call_node.args:
                    router_arg = call_node.args[0]
                
                for keyword in call_node.keywords:
                    if keyword.arg == 'prefix':
                        if isinstance(keyword.value, ast.Constant):
                            prefix_arg = keyword.value.value
                        elif hasattr(ast, 'Str') and isinstance(keyword.value, ast.Str):
                            prefix_arg = keyword.value.s
                
                # 记录include_router信息（可以用于后续分析）
                # 这里可以添加更复杂的逻辑来跟踪router的实际定义


class RouteAnalyzer:
    """路由分析器"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.all_routes: List[RouteInfo] = []
        self.include_router_calls: List[Tuple[str, str, str]] = []  # (router_name, prefix, file_path)
        self.router_definitions: Dict[str, RouterInfo] = {}
    
    def analyze_project(self):
        """分析整个项目"""
        print(f"📁 分析项目目录: {self.project_root}")
        
        python_files = list(self.project_root.rglob("*.py"))
        print(f"📄 找到 {len(python_files)} 个Python文件")
        
        for file_path in python_files:
            if self._should_analyze_file(file_path):
                self._analyze_file(file_path)
        
        self._resolve_router_prefixes()
        self._detect_duplicates()
    
    def _should_analyze_file(self, file_path: Path) -> bool:
        """判断是否应该分析该文件"""
        # 跳过某些目录
        skip_dirs = {
            '__pycache__', '.git', 'node_modules', 'venv', 'env',
            'dist', 'build', '.pytest_cache', 'versions'
        }
        
        # 检查路径中是否包含要跳过的目录
        for part in file_path.parts:
            if part in skip_dirs:
                return False
        
        # 跳过测试文件和迁移文件，但更精确的匹配
        file_name_lower = file_path.name.lower()
        if (file_name_lower.startswith('test_') or 
            file_name_lower.endswith('_test.py') or
            'migration' in file_name_lower or
            file_path.suffix == '.sql'):
            return False
        
        # 扩展分析范围，包含更多可能包含路由的文件
        file_path_str = str(file_path)
        return (
            file_path.name == 'main.py' or 
            '/routers/' in file_path_str or
            '/router/' in file_path_str or
            file_path.name.endswith('_router.py') or
            file_path.name.endswith('_routes.py') or
            'router' in file_path.name.lower() or
            'route' in file_path.name.lower() or
            # 检查v2目录下的Python文件，因为v2目录下可能包含路由定义
            ('/v2/' in file_path_str and file_path.suffix == '.py')
        )
    
    def _analyze_file(self, file_path: Path):
        """分析单个文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 简单检查文件是否包含路由相关内容
            has_router_content = any(term in content for term in [
                '@router.', '@app.', 'APIRouter', 'router = ', 'app.include_router'
            ])
            
            if not has_router_content:
                return
            
            tree = ast.parse(content)
            detector = FastAPIRouteDetector(str(file_path))
            detector.visit(tree)
            
            # 收集路由信息
            self.all_routes.extend(detector.routes)
            
            # 收集router定义
            for router_name, router_info in detector.routers.items():
                full_name = f"{file_path.stem}.{router_name}"
                self.router_definitions[full_name] = router_info
            
            if detector.routes:
                print(f"  ✅ {file_path.relative_to(self.project_root)}: 发现 {len(detector.routes)} 个路由")
            elif has_router_content:
                print(f"  ⚠️  {file_path.relative_to(self.project_root)}: 包含路由内容但未检测到路由定义")
        
        except Exception as e:
            print(f"  ❌ {file_path.relative_to(self.project_root)}: 解析失败 - {e}")
    
    def _resolve_router_prefixes(self):
        """解析include_router调用中的prefix信息"""
        # 这里需要进一步解析main.py中的include_router调用
        main_file = self.project_root / "main.py"
        if main_file.exists():
            self._analyze_main_file(main_file)
    
    def _analyze_main_file(self, main_file: Path):
        """分析main.py文件中的include_router调用"""
        try:
            with open(main_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"  🔍 分析main.py中的路由包含关系...")
            
            # 使用更全面的正则表达式查找导入和include_router调用
            
            # 查找所有导入语句
            # 支持多种导入格式：
            # from webapp.v2.routers.system import router as v2_system_router
            # from .v2.routers import auth_router, user_router
            # import webapp.v2.routers.payroll as payroll_router
            import_patterns = [
                r'from\s+[^\s]+\s+import\s+router\s+as\s+(\w+)',
                r'from\s+[^\s]+\s+import\s+(\w+_router)',
                r'import\s+[^\s]+\s+as\s+(\w+_router)',
            ]
            
            router_imports = set()
            for pattern in import_patterns:
                matches = re.findall(pattern, content)
                router_imports.update(matches)
            
            # 查找include_router调用
            # 支持多种格式：
            # app.include_router(router, prefix="/api")
            # app.include_router(v2_system_router, prefix=settings.API_V2_PREFIX)
            include_patterns = [
                r'app\.include_router\s*\(\s*(\w+).*?prefix\s*=\s*["\']([^"\']*)["\']',
                r'app\.include_router\s*\(\s*(\w+).*?prefix\s*=\s*settings\.([^,\)]+)',
            ]
            
            prefix_map = {}
            
            # 处理直接指定prefix的情况
            for pattern in include_patterns:
                matches = re.findall(pattern, content, re.DOTALL)
                for match in matches:
                    if len(match) == 2:
                        router_var, prefix = match
                        if pattern.endswith(r'settings\.([^,\)]+)'):
                            # 处理settings变量
                            if 'API_V2_PREFIX' in prefix:
                                prefix_map[router_var] = '/v2'
                        else:
                            # 直接指定的prefix
                            prefix_map[router_var] = prefix
            
            print(f"    发现路由导入: {router_imports}")
            print(f"    发现前缀映射: {prefix_map}")
            
            # 更新路由的prefix信息
            updated_count = 0
            for route in self.all_routes:
                old_prefix = route.prefix
                
                if route.router_name == 'router':  # 大多数router文件使用router变量名
                    # 根据文件路径推断router变量名
                    file_path = Path(route.file_path)
                    if 'system' in file_path.name:
                        route.prefix = prefix_map.get('v2_system_router', '/v2')
                    elif 'debug' in file_path.name:
                        route.prefix = prefix_map.get('v2_debug_router', '/v2')
                    elif 'utilities' in file_path.name:
                        route.prefix = prefix_map.get('v2_utilities_router', '/v2')
                    elif 'payroll' in file_path.name:
                        route.prefix = prefix_map.get('v2_payroll_router', '/v2')
                    elif 'hr' in file_path.name or 'employee' in file_path.name:
                        route.prefix = prefix_map.get('v2_hr_router', '/v2')
                    elif 'auth' in file_path.name:
                        route.prefix = prefix_map.get('v2_auth_router', '/v2')
                    elif 'config' in file_path.name:
                        route.prefix = prefix_map.get('v2_config_router', '/v2')
                    elif 'report' in file_path.name:
                        route.prefix = prefix_map.get('v2_reports_router', '/v2')
                    else:
                        # 默认使用/v2前缀（如果在v2目录下）
                        if '/v2/' in str(file_path):
                            route.prefix = '/v2'
                        else:
                            route.prefix = ''
                    
                    route.full_path = route._build_full_path()
                    if old_prefix != route.prefix:
                        updated_count += 1
                
                elif route.router_name in prefix_map:
                    route.prefix = prefix_map[route.router_name]
                    route.full_path = route._build_full_path()
                    if old_prefix != route.prefix:
                        updated_count += 1
            
            print(f"    ✅ 更新了 {updated_count} 个路由的前缀信息")
        
        except Exception as e:
            print(f"❌ 分析main.py失败: {e}")
    
    def _detect_duplicates(self):
        """检测重复路由"""
        # 按 (method, full_path) 分组
        route_groups = defaultdict(list)
        
        for route in self.all_routes:
            key = (route.method, route.full_path)
            route_groups[key].append(route)
        
        # 查找重复项
        duplicates = {k: v for k, v in route_groups.items() if len(v) > 1}
        
        if duplicates:
            print("\n❌ 发现重复路由:")
            print("=" * 80)
            
            for (method, path), routes in duplicates.items():
                print(f"\n🔴 重复路由: {method} {path}")
                print("-" * 40)
                for i, route in enumerate(routes, 1):
                    rel_path = Path(route.file_path).relative_to(self.project_root)
                    print(f"  {i}. {rel_path}:{route.line_number} (函数: {route.function_name})")
                    if route.router_name:
                        print(f"     路由器: {route.router_name}, 前缀: '{route.prefix}'")
        else:
            print("\n✅ 未发现重复路由!")
        
        # 生成统计报告
        self._generate_report(route_groups, duplicates)
    
    def _generate_report(self, route_groups: Dict, duplicates: Dict):
        """生成分析报告"""
        print("\n📊 路由统计报告:")
        print("=" * 80)
        
        # 基本统计
        total_routes = len(self.all_routes)
        unique_routes = len(route_groups)
        duplicate_count = len(duplicates)
        
        print(f"总路由数量: {total_routes}")
        print(f"唯一路由数量: {unique_routes}")
        print(f"重复路由组数: {duplicate_count}")
        
        # 按HTTP方法统计
        method_stats = defaultdict(int)
        for route in self.all_routes:
            method_stats[route.method] += 1
        
        print(f"\n按HTTP方法统计:")
        for method in sorted(method_stats.keys()):
            print(f"  {method}: {method_stats[method]}")
        
        # 按文件统计
        file_stats = defaultdict(int)
        for route in self.all_routes:
            rel_path = str(Path(route.file_path).relative_to(self.project_root))
            file_stats[rel_path] += 1
        
        print(f"\n按文件统计 (前10个):")
        sorted_files = sorted(file_stats.items(), key=lambda x: x[1], reverse=True)
        for file_path, count in sorted_files[:10]:
            print(f"  {file_path}: {count}")
        
        # 路径前缀统计
        prefix_stats = defaultdict(int)
        for route in self.all_routes:
            # 提取路径的第一部分作为前缀
            parts = route.full_path.strip('/').split('/')
            if parts and parts[0]:
                prefix_stats[f"/{parts[0]}"] += 1
            else:
                prefix_stats["/"] += 1
        
        print(f"\n按路径前缀统计:")
        sorted_prefixes = sorted(prefix_stats.items(), key=lambda x: x[1], reverse=True)
        for prefix, count in sorted_prefixes:
            print(f"  {prefix}: {count}")
        
        # 保存详细报告到文件
        self._save_detailed_report(route_groups, duplicates)
    
    def _save_detailed_report(self, route_groups: Dict, duplicates: Dict):
        """保存详细报告到文件"""
        report_file = self.project_root / "route_analysis_report.txt"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("FastAPI 路由重复检测报告\n")
            f.write("=" * 50 + "\n")
            f.write(f"生成时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"项目路径: {self.project_root}\n\n")
            
            if duplicates:
                f.write("重复路由详情:\n")
                f.write("-" * 30 + "\n")
                
                for (method, path), routes in duplicates.items():
                    f.write(f"\n重复路由: {method} {path}\n")
                    for i, route in enumerate(routes, 1):
                        rel_path = Path(route.file_path).relative_to(self.project_root)
                        f.write(f"  {i}. {rel_path}:{route.line_number} (函数: {route.function_name})\n")
                        if route.router_name:
                            f.write(f"     路由器: {route.router_name}, 前缀: '{route.prefix}'\n")
            
            f.write("\n\n所有路由列表:\n")
            f.write("-" * 30 + "\n")
            
            sorted_routes = sorted(self.all_routes, key=lambda x: (x.method, x.full_path))
            for route in sorted_routes:
                rel_path = Path(route.file_path).relative_to(self.project_root)
                f.write(f"{route.method:6} {route.full_path:40} {rel_path}:{route.line_number}\n")
        
        print(f"\n📄 详细报告已保存到: {report_file}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="FastAPI 重复路由检测器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  python route_duplicate_detector.py                    # 检测当前目录
  python route_duplicate_detector.py /path/to/project   # 检测指定项目
  python route_duplicate_detector.py ../webapp          # 检测webapp目录
        """
    )
    
    parser.add_argument(
        'project_path',
        nargs='?',
        default='.',
        help='项目根目录路径 (默认: 当前目录)'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='显示详细输出'
    )
    
    args = parser.parse_args()
    
    project_path = Path(args.project_path).resolve()
    
    if not project_path.exists():
        print(f"❌ 错误: 路径不存在 - {project_path}")
        sys.exit(1)
    
    if not project_path.is_dir():
        print(f"❌ 错误: 不是目录 - {project_path}")
        sys.exit(1)
    
    print("🔍 FastAPI 重复路由检测器")
    print("=" * 50)
    
    analyzer = RouteAnalyzer(str(project_path))
    analyzer.analyze_project()
    
    print("\n✨ 分析完成!")


if __name__ == "__main__":
    main()