# N+1查询问题检查报告

检查时间: 2025-06-08 02:16:37

## ⚠️ 发现 2881 个潜在问题

### 📄 webapp/v2/services/config.py

**行 38** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 175** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 204** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
        result = self.db.execute(query, {'key': key})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 235** - 关系属性访问

```python
            types = self.lookup_types.get_all_types(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 240** - 关系属性访问

```python
            result[type_code] = self.lookup_values.get_by_type_code(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 249** - 关系属性访问

```python
            'components': self.payroll_components.get_components_with_usage(is_active=True),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 250** - 关系属性访问

```python
            'tax_brackets': self.tax_brackets.get_current_brackets(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 251** - 关系属性访问

```python
            'social_security_rates': self.social_security_rates.get_current_rates(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 252** - 关系属性访问

```python
            'parameters': self.system_parameters.get_parameters_by_category('PAYROLL')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
            'parameters': self.system_parameters.get_parameters_by_category(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
            'lookup_types': self.lookup_types.get_all_types(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 272** - 关系属性访问

```python
        existing_types = {t['code'] for t in self.lookup_types.get_all_types(is_active=True)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 282** - 关系属性访问

```python
        components = self.payroll_components.get_components_with_usage(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 290** - 关系属性访问

```python
        tax_brackets = self.tax_brackets.get_current_brackets()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/hr.py

**行 55** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 71** - 关系属性访问

```python
        result = self.db.execute(query)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
        result = self.db.execute(query)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 223** - 关系属性访问

```python
        employee_stats = self.employees.get_employee_statistics()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 226** - 关系属性访问

```python
        departments = self.departments.get_departments_with_stats(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 234** - 关系属性访问

```python
        positions = self.positions.get_positions_with_details(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - 关系属性访问

```python
        categories = self.personnel_categories.get_categories_with_stats(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 261** - 关系属性访问

```python
        dept_distribution = self.departments.get_departments_with_stats(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 264** - 关系属性访问

```python
        category_distribution = self.personnel_categories.get_categories_with_stats(is_active=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 280** - 关系属性访问

```python
        result = self.db.execute(query)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 295** - 关系属性访问

```python
        return self.employees.get_employees_with_details(**filters)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 299** - 关系属性访问

```python
        hierarchy = self.departments.get_department_hierarchy()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 341** - 关系属性访问

```python
        result = self.db.execute(query)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 367** - 关系属性访问

```python
        result = self.db.execute(query)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/payroll.py

**行 208** - 关系属性访问

```python
        data, total = self.view_service.get_paginated_data(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 236** - 关系属性访问

```python
        data, total = self.view_service.get_paginated_data(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 264** - 关系属性访问

```python
        data, total = self.view_service.get_paginated_data(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 307** - 关系属性访问

```python
        data, total = self.view_service.get_paginated_data(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 430** - 关系属性访问

```python
            result = self.db.execute(text(query), params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 438** - 关系属性访问

```python
            count_result = self.db.execute(text(count_query), params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 474** - 关系属性访问

```python
        result = self.db.execute(text(query), {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/base.py

**行 124** - 关系属性访问

```python
        result = self.db.execute(text(query), params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 142** - 关系属性访问

```python
        result = self.db.execute(text(query), params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 缺少joinedload/selectinload

```python
        return self.db.query(self.model_class).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 183** - 关系属性访问

```python
        return self.db.query(self.model_class).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
            self.model_class.id == id
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 194** - 关系属性访问

```python
        query = self.db.query(self.model_class)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 213** - 关系属性访问

```python
        self.db.add(db_obj)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 214** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
        self.db.refresh(db_obj)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 228** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 229** - 关系属性访问

```python
        self.db.refresh(db_obj)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 238** - 关系属性访问

```python
        self.db.delete(db_obj)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 239** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 286** - 关系属性访问

```python
            data, total = self.view_service.get_paginated_data(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 291** - 关系属性访问

```python
            data, total = self.crud_service.get_all(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 301** - 关系属性访问

```python
            data = self.view_service.query_view(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 308** - 关系属性访问

```python
            return self.crud_service.get_by_id(id) ```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/payroll_report_service.py

**行 69** - 关系属性访问

```python
        for template_id, template_info in self._report_templates.items():
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 缺少joinedload/selectinload

```python
            payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 89** - 关系属性访问

```python
            payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 306** - 关系属性访问

```python
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 366** - 关系属性访问

```python
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 446** - 关系属性访问

```python
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 510** - 关系属性访问

```python
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 560** - 缺少joinedload/selectinload

```python
            components = self.db.query(PayrollComponentDefinition).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 560** - 关系属性访问

```python
            components = self.db.query(PayrollComponentDefinition).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/advanced_audit_service.py

**行 14** - 关系属性访问

```python
from webapp.v2.models import PayrollRun, PayrollEntry, Employee, PayrollPeriod
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
                    basic_salary = entry.earnings_details.get("basic_salary", 0)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
                    total_earnings = sum(entry.earnings_details.values())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
                    social_security = entry.deductions_details.get("social_security", 0)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
                personal_tax = entry.deductions_details.get("personal_tax", 0) if entry.deductions_details else 0
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
            current_run = self.db.get(PayrollRun, payroll_run_id)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 413** - 关系属性访问

```python
                personal_tax = entry.deductions_details.get("personal_tax", 0)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 414** - 关系属性访问

```python
                social_security = entry.deductions_details.get("social_security", 0)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 415** - 关系属性访问

```python
                housing_fund = entry.deductions_details.get("housing_fund", 0)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/simple_payroll_service.py

**行 75** - 关系属性访问

```python
            query = self.db.query(PayrollPeriod)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
                    query = query.filter(PayrollPeriod.start_date.isnot(None))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 90** - 关系属性访问

```python
                    query = query.filter(PayrollPeriod.start_date.is_(None))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 缺少joinedload/selectinload

```python
                runs_count = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 105** - 关系属性访问

```python
                runs_count = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 110** - 缺少joinedload/selectinload

```python
                latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 110** - 关系属性访问

```python
                latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 缺少joinedload/selectinload

```python
                    entries_count = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 117** - 关系属性访问

```python
                    entries_count = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
                    frequency_name=period.frequency.name if period.frequency else "未知",
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
                    status_name=period.status_lookup.name if period.status_lookup else status,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 174** - 缺少joinedload/selectinload

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 174** - 关系属性访问

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 182** - 缺少joinedload/selectinload

```python
            query = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 182** - 关系属性访问

```python
            query = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 196** - 缺少joinedload/selectinload

```python
                    status_lookup = self.db.query(LookupValue).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 196** - 关系属性访问

```python
                    status_lookup = self.db.query(LookupValue).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 204** - 缺少joinedload/selectinload

```python
                entries_count = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 204** - 关系属性访问

```python
                entries_count = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 209** - 关系属性访问

```python
                entry_stats = self.db.query(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
            total_periods = self.db.query(PayrollPeriod).count()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
            total_employees = self.db.query(Employee).count()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
            total_departments = self.db.query(Department).count()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 260** - 关系属性访问

```python
            total_runs = self.db.query(PayrollRun).count()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 263** - 关系属性访问

```python
            latest_period = self.db.query(PayrollPeriod).order_by(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 270** - 缺少joinedload/selectinload

```python
                latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 270** - 关系属性访问

```python
                latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 275** - 关系属性访问

```python
                    run_response = self.generation_service._build_payroll_run_response(latest_run)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 281** - 关系属性访问

```python
                        "calculated_at": latest_run.calculated_at.isoformat() if latest_run.calculated_at else None
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 292** - 关系属性访问

```python
                "report_templates_count": len(self.report_service._report_templates),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 303** - 缺少joinedload/selectinload

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 303** - 关系属性访问

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 323** - 缺少joinedload/selectinload

```python
            active_employees_count = self.db.query(Employee).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 323** - 关系属性访问

```python
            active_employees_count = self.db.query(Employee).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 324** - 关系属性访问

```python
                Employee.status_lookup_value_id.isnot(None)  # 假设有效员工有状态
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 335** - 缺少joinedload/selectinload

```python
            existing_runs = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 335** - 关系属性访问

```python
            existing_runs = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 358** - 缺少joinedload/selectinload

```python
            target_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 358** - 关系属性访问

```python
            target_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 366** - 关系属性访问

```python
            periods_with_data = self.db.query(PayrollPeriod).join(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 376** - 缺少joinedload/selectinload

```python
                latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 376** - 关系属性访问

```python
                latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 381** - 关系属性访问

```python
                    run_response = self.generation_service._build_payroll_run_response(latest_run)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 407** - 关系属性访问

```python
                latest_period = self.db.query(PayrollPeriod).order_by(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 422** - 缺少joinedload/selectinload

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 422** - 关系属性访问

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 434** - 缺少joinedload/selectinload

```python
            latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 434** - 关系属性访问

```python
            latest_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 450** - 关系属性访问

```python
                    audit_summary = self.audit_service.get_audit_summary(latest_run.id)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 512** - 关系属性访问

```python
            audit_result = self.enhanced_audit_service.run_comprehensive_audit(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 530** - 关系属性访问

```python
            return self.enhanced_audit_service.get_audit_summary(payroll_run_id)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 545** - 关系属性访问

```python
            return self.enhanced_audit_service.get_audit_anomalies(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 564** - 关系属性访问

```python
            from webapp.v2.models.audit import PayrollAuditAnomaly
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 567** - 缺少joinedload/selectinload

```python
            anomaly = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 567** - 关系属性访问

```python
            anomaly = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 579** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 586** - 关系属性访问

```python
            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 597** - 关系属性访问

```python
            from webapp.v2.models.audit import MonthlyPayrollSnapshot
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 599** - 缺少joinedload/selectinload

```python
            query = self.db.query(MonthlyPayrollSnapshot).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 599** - 关系属性访问

```python
            query = self.db.query(MonthlyPayrollSnapshot).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 620** - 关系属性访问

```python
                    'snapshot_date': snapshot.snapshot_date.isoformat()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/payroll_generation_service.py

**行 34** - 缺少joinedload/selectinload

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 34** - 关系属性访问

```python
            period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 47** - 关系属性访问

```python
            self.db.add(new_run)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 48** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 49** - 关系属性访问

```python
            self.db.refresh(new_run)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 66** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 缺少joinedload/selectinload

```python
            target_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 88** - 关系属性访问

```python
            target_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 98** - 缺少joinedload/selectinload

```python
            source_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 98** - 关系属性访问

```python
            source_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 缺少joinedload/selectinload

```python
            existing_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 108** - 关系属性访问

```python
            existing_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 缺少joinedload/selectinload

```python
            source_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 117** - 关系属性访问

```python
            source_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
            self.db.add(new_run)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 136** - 关系属性访问

```python
            self.db.refresh(new_run)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 缺少joinedload/selectinload

```python
            source_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 141** - 关系属性访问

```python
            source_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 150** - 关系属性访问

```python
                self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 162** - 缺少joinedload/selectinload

```python
                    employee = self.db.query(Employee).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 162** - 关系属性访问

```python
                    employee = self.db.query(Employee).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
                    self.db.add(new_entry)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
                        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 208** - 关系属性访问

```python
            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 219** - 缺少joinedload/selectinload

```python
        source_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 219** - 关系属性访问

```python
        source_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 229** - Python ORM N+1

```python
            emp.id for emp in self.db.query(Employee.id).filter(
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，避免在循环中执行数据库查询

---

**行 229** - Python ORM N+1

```python
            emp.id for emp in self.db.query(Employee.id).filter(
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，避免在循环中执行数据库查询

---

**行 229** - 缺少joinedload/selectinload

```python
            emp.id for emp in self.db.query(Employee.id).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，避免在循环中执行数据库查询

---

**行 229** - 关系属性访问

```python
            emp.id for emp in self.db.query(Employee.id).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，避免在循环中执行数据库查询

---

**行 230** - 关系属性访问

```python
                Employee.status_lookup_value_id.isnot(None)  # 假设有效员工有状态
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 236** - 缺少joinedload/selectinload

```python
        source_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 236** - 关系属性访问

```python
        source_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
            self.db.add(new_entry)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 300** - Python ORM N+1

```python
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == run.payroll_period_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 300** - 缺少joinedload/selectinload

```python
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == run.payroll_period_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 300** - 关系属性访问

```python
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == run.payroll_period_id).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，考虑使用 IN 查询替代多次单条查询

---

**行 305** - Python ORM N+1

```python
        status = self.db.query(LookupValue).filter(LookupValue.id == run.status_lookup_value_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 305** - 缺少joinedload/selectinload

```python
        status = self.db.query(LookupValue).filter(LookupValue.id == run.status_lookup_value_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 305** - 关系属性访问

```python
        status = self.db.query(LookupValue).filter(LookupValue.id == run.status_lookup_value_id).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，考虑使用 IN 查询替代多次单条查询

---

**行 308** - 缺少joinedload/selectinload

```python
        version_number = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 308** - 关系属性访问

```python
        version_number = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 317** - 缺少joinedload/selectinload

```python
        total_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 317** - 关系属性访问

```python
        total_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/batch_adjustment_service.py

**行 12** - 关系属性访问

```python
from webapp.v2.models import PayrollRun, PayrollEntry, Employee
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 13** - 关系属性访问

```python
from webapp.v2.pydantic_models.simple_payroll import (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 47** - 关系属性访问

```python
            payroll_run = self.db.get(PayrollRun, request.payroll_run_id)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
            payroll_run = self.db.get(PayrollRun, request.payroll_run_id)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 120** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 133** - 关系属性访问

```python
            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
                PayrollEntry.employee_code.in_(employee_codes)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 153** - 关系属性访问

```python
        result = self.db.execute(query)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 201** - 关系属性访问

```python
        updated_earnings = entry.earnings_details.copy() if entry.earnings_details else {}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 202** - 关系属性访问

```python
        updated_deductions = entry.deductions_details.copy() if entry.deductions_details else {}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 232** - 关系属性访问

```python
        self.db.add(entry)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 313** - 关系属性访问

```python
            result = self.db.execute(query)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 330** - 关系属性访问

```python
                self.db.execute(update_stmt)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/enhanced_audit_service.py

**行 13** - 关系属性访问

```python
from webapp.v2.models.audit import (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 20** - 关系属性访问

```python
from webapp.v2.models.payroll import PayrollEntry, PayrollRun, PayrollPeriod
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 21** - 关系属性访问

```python
from webapp.v2.models.hr import Employee, Department, Position
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 22** - 关系属性访问

```python
from webapp.v2.pydantic_models.simple_payroll import AuditSummaryResponse, AuditAnomalyResponse
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 缺少joinedload/selectinload

```python
        payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 88** - 关系属性访问

```python
        payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 缺少joinedload/selectinload

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 96** - 关系属性访问

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 103** - 关系属性访问

```python
                Decimal(str(v)) for v in entry.earnings_details.values() 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 107** - 关系属性访问

```python
                Decimal(str(v)) for v in entry.deductions_details.values() 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 121** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 132** - 缺少joinedload/selectinload

```python
        rules = self.db.query(AuditRuleConfiguration).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 132** - 关系属性访问

```python
        rules = self.db.query(AuditRuleConfiguration).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 缺少joinedload/selectinload

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 137** - 关系属性访问

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 254** - 关系属性访问

```python
        tolerance = Decimal(str(rule.rule_parameters.get('tolerance', 0.01)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
                Decimal(str(v)) for v in entry.earnings_details.values() 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 263** - 关系属性访问

```python
                Decimal(str(v)) for v in entry.deductions_details.values() 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 274** - 关系属性访问

```python
                    'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 275** - 关系属性访问

```python
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 289** - 关系属性访问

```python
                    'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 290** - 关系属性访问

```python
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 304** - 关系属性访问

```python
                    'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 305** - 关系属性访问

```python
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 323** - 关系属性访问

```python
        minimum_wage = Decimal(str(rule.rule_parameters.get('minimum_wage', 2320)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 331** - 关系属性访问

```python
                    'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 332** - 关系属性访问

```python
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 350** - 关系属性访问

```python
        tolerance = Decimal(str(rule.rule_parameters.get('tolerance', 1.0)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 351** - 关系属性访问

```python
        basic_deduction = Decimal(str(rule.rule_parameters.get('basic_deduction', 5000)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 358** - 关系属性访问

```python
            tax_deduction = Decimal(str(entry.deductions_details.get('个人所得税', 0)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 369** - 关系属性访问

```python
                        'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 370** - 关系属性访问

```python
                        'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 388** - 关系属性访问

```python
        min_base = Decimal(str(rule.rule_parameters.get('min_base', 3500)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 389** - 关系属性访问

```python
        max_base = Decimal(str(rule.rule_parameters.get('max_base', 28000)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 390** - 关系属性访问

```python
        personal_rate = Decimal(str(rule.rule_parameters.get('personal_rate', 0.105)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 394** - 关系属性访问

```python
            social_security = Decimal(str(entry.deductions_details.get('社会保险费', 0)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 407** - 关系属性访问

```python
                    'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 408** - 关系属性访问

```python
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 426** - 关系属性访问

```python
        variance_threshold = Decimal(str(rule.rule_parameters.get('variance_threshold', 0.3)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 439** - 关系属性访问

```python
                    'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 440** - 关系属性访问

```python
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 458** - 关系属性访问

```python
        min_value = Decimal(str(rule.rule_parameters.get('min_value', 0)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 494** - 关系属性访问

```python
                    'employee_code': entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 495** - 关系属性访问

```python
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 510** - 关系属性访问

```python
            self.db.add(anomaly)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 512** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 528** - 缺少joinedload/selectinload

```python
        self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 528** - 关系属性访问

```python
        self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 537** - 缺少joinedload/selectinload

```python
        existing_summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 537** - 关系属性访问

```python
        existing_summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 557** - 关系属性访问

```python
            self.db.add(summary_record)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 563** - 缺少joinedload/selectinload

```python
        first_entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 563** - 关系属性访问

```python
        first_entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 589** - 关系属性访问

```python
            self.db.add(history)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 591** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 597** - 缺少joinedload/selectinload

```python
        fixable_anomalies = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 597** - 关系属性访问

```python
        fixable_anomalies = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 624** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 629** - 缺少joinedload/selectinload

```python
        entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 629** - 关系属性访问

```python
        entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 641** - 缺少joinedload/selectinload

```python
        entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 641** - 关系属性访问

```python
        entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 655** - 缺少joinedload/selectinload

```python
        entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 655** - 关系属性访问

```python
        entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 670** - 缺少joinedload/selectinload

```python
        payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 670** - 关系属性访问

```python
        payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 678** - 缺少joinedload/selectinload

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 678** - 关系属性访问

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 681** - 关系属性访问

```python
                PayrollEntry.audit_status.in_(['PASSED', 'WARNING'])
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 687** - 缺少joinedload/selectinload

```python
            existing_snapshot = self.db.query(MonthlyPayrollSnapshot).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 687** - 关系属性访问

```python
            existing_snapshot = self.db.query(MonthlyPayrollSnapshot).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 710** - 关系属性访问

```python
                    employee_code=entry.employee.employee_code if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 711** - 关系属性访问

```python
                    employee_name=f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 712** - 关系属性访问

```python
                    department_name=entry.employee.department.name if entry.employee and entry.employee.department else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 713** - 关系属性访问

```python
                    position_name=entry.employee.actual_position.name if entry.employee and entry.employee.actual_position else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 722** - 关系属性访问

```python
                self.db.add(snapshot)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 724** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 729** - 缺少joinedload/selectinload

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 729** - 关系属性访问

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 762** - 关系属性访问

```python
        self.db.add(history)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 763** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 769** - 缺少joinedload/selectinload

```python
        first_entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 769** - 关系属性访问

```python
        first_entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 785** - 关系属性访问

```python
        self.db.add(history)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 786** - 关系属性访问

```python
        self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 791** - 缺少joinedload/selectinload

```python
        summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 791** - 关系属性访问

```python
        summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 810** - 关系属性访问

```python
                'audit_completed_at': summary.audit_completed_at.isoformat() if summary.audit_completed_at else None
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 825** - 缺少joinedload/selectinload

```python
        query = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 825** - 关系属性访问

```python
        query = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 830** - 关系属性访问

```python
            query = query.filter(PayrollAuditAnomaly.anomaly_type.in_(anomaly_types))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 833** - 关系属性访问

```python
            query = query.filter(PayrollAuditAnomaly.severity.in_(severity))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 855** - 关系属性访问

```python
                    'created_at': anomaly.created_at.isoformat()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/payroll_audit_service.py

**行 39** - 缺少joinedload/selectinload

```python
            cached_summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 39** - 关系属性访问

```python
            cached_summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 缺少joinedload/selectinload

```python
            payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 65** - 关系属性访问

```python
            payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 缺少joinedload/selectinload

```python
            existing = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 178** - 关系属性访问

```python
            existing = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
                self.db.add(new_summary)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 222** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 227** - 关系属性访问

```python
            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 245** - 缺少joinedload/selectinload

```python
            self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 245** - 关系属性访问

```python
            self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
                        parts = anomaly.id.split('_')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 284** - 关系属性访问

```python
                self.db.add_all(anomaly_records)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 285** - 关系属性访问

```python
                self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 290** - 关系属性访问

```python
            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 297** - 缺少joinedload/selectinload

```python
        payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 297** - 关系属性访问

```python
        payroll_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 303** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 320** - 缺少joinedload/selectinload

```python
            cached_summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 320** - 关系属性访问

```python
            cached_summary = self.db.query(PayrollRunAuditSummary).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 328** - 缺少joinedload/selectinload

```python
                    saved_anomalies = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 328** - 关系属性访问

```python
                    saved_anomalies = self.db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 404** - 关系属性访问

```python
            from webapp.v2.models.audit import PayrollAuditAnomaly
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 405** - 缺少joinedload/selectinload

```python
            ignored_anomalies = self.db.query(PayrollAuditAnomaly.id).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 405** - 关系属性访问

```python
            ignored_anomalies = self.db.query(PayrollAuditAnomaly.id).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 407** - 关系属性访问

```python
                PayrollAuditAnomaly.payroll_entry_id.in_([entry.id for entry in entries])
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，避免在循环中执行数据库查询

---

**行 416** - 缺少joinedload/selectinload

```python
                employee = self.db.query(Employee).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 416** - 关系属性访问

```python
                employee = self.db.query(Employee).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 458** - 关系属性访问

```python
                            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 467** - 关系属性访问

```python
                    self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 494** - 关系属性访问

```python
            from webapp.v2.models.audit import PayrollAuditAnomaly
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 497** - 缺少joinedload/selectinload

```python
                ignored_anomalies = self.db.query(PayrollAuditAnomaly.id).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 497** - 关系属性访问

```python
                ignored_anomalies = self.db.query(PayrollAuditAnomaly.id).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 499** - 关系属性访问

```python
                    PayrollAuditAnomaly.payroll_entry_id.in_(entry_ids)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 571** - 缺少joinedload/selectinload

```python
            enabled_rules = self.db.query(AuditRuleConfiguration.rule_code).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 571** - 关系属性访问

```python
            enabled_rules = self.db.query(AuditRuleConfiguration.rule_code).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 585** - 缺少joinedload/selectinload

```python
            enabled_rules = self.db.query(AuditRuleConfiguration.rule_code).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 585** - 关系属性访问

```python
            enabled_rules = self.db.query(AuditRuleConfiguration.rule_code).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 593** - 关系属性访问

```python
                self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 612** - 关系属性访问

```python
                basic_salary += entry.earnings_details.get('basic_salary', 0)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 613** - 关系属性访问

```python
                basic_salary += entry.earnings_details.get('position_salary', 0)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 647** - 关系属性访问

```python
                current_tax = Decimal(str(entry.deductions_details.get('personal_income_tax', 0)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 698** - 关系属性访问

```python
                current_amount = Decimal(str(entry.deductions_details.get(item_key, 0)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 823** - 关系属性访问

```python
                for key, value in entry.earnings_details.items():
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 831** - 关系属性访问

```python
                for key, value in entry.deductions_details.items():
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 911** - 缺少joinedload/selectinload

```python
            param = self.db.query(SystemParameter).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 911** - 关系属性访问

```python
            param = self.db.query(SystemParameter).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 928** - 关系属性访问

```python
                self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 956** - 缺少joinedload/selectinload

```python
            previous_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 956** - 关系属性访问

```python
            previous_period = self.db.query(PayrollPeriod).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 958** - 关系属性访问

```python
            ).order_by(PayrollPeriod.id.desc()).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 964** - 缺少joinedload/selectinload

```python
            previous_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 964** - 关系属性访问

```python
            previous_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 966** - 关系属性访问

```python
            ).order_by(PayrollRun.run_date.desc()).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 972** - 缺少joinedload/selectinload

```python
            previous_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 972** - 关系属性访问

```python
            previous_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 984** - 缺少joinedload/selectinload

```python
            current_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 984** - 关系属性访问

```python
            current_run = self.db.query(PayrollRun).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 986** - 关系属性访问

```python
            ).order_by(PayrollRun.run_date.desc()).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 991** - 缺少joinedload/selectinload

```python
            current_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 991** - 关系属性访问

```python
            current_entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1038** - 关系属性访问

```python
            result = self.db.execute(query, {"current_period_id": current_period_id}).fetchall()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/simple_payroll/excel_import_service.py

**行 84** - 关系属性访问

```python
                return False, [], ["不支持的文件格式，请使用.xlsx或.xls格式"]
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 202** - 关系属性访问

```python
        df.columns = df.columns.str.strip()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
                for cn_name, en_name in self.column_mapping.items():
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 228** - 关系属性访问

```python
                cn_names = [cn for cn, en in self.column_mapping.items() if en == field]
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 327** - 关系属性访问

```python
        reverse_mapping = {v: k for k, v in self.column_mapping.items() if isinstance(k, str) and len(k) > 1}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/services/config/lookup_services.py

**行 38** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
        result = self.db.execute(query, params)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/payroll_calculation.py

**行 244** - 关系属性访问

```python
                    val_status_enum_value = result_from_engine.status.value if hasattr(result_from_engine.status, 'value') else str(result_from_engine.status)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 270** - 关系属性访问

```python
                            c_type_val = comp_item.component_type.value if hasattr(comp_item.component_type, 'value') else str(comp_item.component_type)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 600** - 关系属性访问

```python
                period_start=attendance_data_model.period.period_start, # Assuming relation to a period table
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 601** - 关系属性访问

```python
                period_end=attendance_data_model.period.period_end,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 626** - 关系属性访问

```python
                        component_type=EngineDataclassComponentType(rule_model.component_type.value if hasattr(rule_model.component_type, 'value') else rule_model.component_type),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 641** - 关系属性访问

```python
        period_start=payroll_run.payroll_period.start_date,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 642** - 关系属性访问

```python
        period_end=payroll_run.payroll_period.end_date,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/attendance.py

**行 13** - 关系属性访问

```python
from webapp.v2.models.attendance import (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 16** - 关系属性访问

```python
from webapp.v2.pydantic_models.attendance import (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - Python ORM N+1

```python
    period = db.query(AttendancePeriod).filter(AttendancePeriod.id == period_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 77** - 缺少joinedload/selectinload

```python
    period = db.query(AttendancePeriod).filter(AttendancePeriod.id == period_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 95** - Python ORM N+1

```python
    period = db.query(AttendancePeriod).filter(AttendancePeriod.id == period_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 95** - 缺少joinedload/selectinload

```python
    period = db.query(AttendancePeriod).filter(AttendancePeriod.id == period_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 145** - Python ORM N+1

```python
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 145** - 缺少joinedload/selectinload

```python
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 163** - Python ORM N+1

```python
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 163** - 缺少joinedload/selectinload

```python
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 213** - 缺少joinedload/selectinload

```python
    daily_record = db.query(DailyAttendanceRecord).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 233** - 缺少joinedload/selectinload

```python
    daily_record = db.query(DailyAttendanceRecord).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 282** - Python ORM N+1

```python
    rule = db.query(AttendanceRule).filter(AttendanceRule.id == rule_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 282** - 缺少joinedload/selectinload

```python
    rule = db.query(AttendanceRule).filter(AttendanceRule.id == rule_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 300** - Python ORM N+1

```python
    rule = db.query(AttendanceRule).filter(AttendanceRule.id == rule_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 300** - 缺少joinedload/selectinload

```python
    rule = db.query(AttendanceRule).filter(AttendanceRule.id == rule_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/routers/table_config.py

**行 12** - 关系属性访问

```python
from webapp.models.user_table_config import (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 150** - 关系属性访问

```python
                visible_columns = default_config.config_data.get("visible_columns", DEFAULT_VISIBLE_COLUMNS)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 151** - 关系属性访问

```python
                column_order = default_config.config_data.get("column_order", DEFAULT_VISIBLE_COLUMNS)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/positions.py

**行 78** - 缺少joinedload/selectinload

```python
        existing_position = db.query(PositionModel).filter(PositionModel.name == position_data.name).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 91** - 缺少joinedload/selectinload

```python
            existing_code = db.query(PositionModel).filter(PositionModel.code == position_data.code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 194** - Python ORM N+1

```python
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 194** - 缺少joinedload/selectinload

```python
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 229** - Python ORM N+1

```python
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 229** - 缺少joinedload/selectinload

```python
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 242** - 缺少joinedload/selectinload

```python
            existing_position = db.query(PositionModel).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 258** - 缺少joinedload/selectinload

```python
            existing_code = db.query(PositionModel).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 304** - Python ORM N+1

```python
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 304** - 缺少joinedload/selectinload

```python
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 317** - 缺少joinedload/selectinload

```python
        has_employees = db.query(Employee).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 333** - 缺少joinedload/selectinload

```python
        has_job_history = db.query(EmployeeJobHistory).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 348** - 缺少joinedload/selectinload

```python
        has_children = db.query(PositionModel).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/routers/payroll_v2.py

**行 68** - 关系属性访问

```python
        result = payroll_service.periods.get_periods_with_stats(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
        period = payroll_service.periods.get_detail_data(period_id, use_view=True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 168** - 关系属性访问

```python
        result = payroll_service.runs.get_runs_with_summary(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 232** - 关系属性访问

```python
        result = payroll_service.entries.get_detailed_entries(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 288** - 关系属性访问

```python
        result = payroll_service.components.get_components_with_usage(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 345** - 关系属性访问

```python
        summary_service = payroll_service.entries.get_entry_summary_by_department(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 446** - 关系属性访问

```python
        data, total = payroll_service.salary_history.get_employee_salary_history(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 495** - 关系属性访问

```python
        trend_data = payroll_service.salary_history.get_employee_salary_trend(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/simple_payroll.py

**行 15** - 关系属性访问

```python
from ..services.simple_payroll.simple_payroll_service import SimplePayrollService
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 37** - 关系属性访问

```python
from ..services.simple_payroll.batch_adjustment_service import BatchAdjustmentService
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 38** - 关系属性访问

```python
from ..services.simple_payroll.advanced_audit_service import AdvancedAuditService
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 164** - Python ORM N+1

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == version_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 164** - 缺少joinedload/selectinload

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == version_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 177** - 缺少joinedload/selectinload

```python
        status_lookup = db.query(LookupValue).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 183** - 缺少joinedload/selectinload

```python
        period = db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 394** - Python ORM N+1

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 394** - 缺少joinedload/selectinload

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 425** - 缺少joinedload/selectinload

```python
        query = db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == payroll_run_id)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 427** - 关系属性访问

```python
            query = query.filter(PayrollEntry.employee_id.in_(employee_ids))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 482** - Python ORM N+1

```python
                employee = db.query(Employee).filter(Employee.id == entry.employee_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 482** - 缺少joinedload/selectinload

```python
                employee = db.query(Employee).filter(Employee.id == entry.employee_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 674** - 关系属性访问

```python
        from webapp.v2.models.audit import PayrollAuditAnomaly
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 683** - 缺少joinedload/selectinload

```python
                existing = db.query(PayrollAuditAnomaly).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 702** - 关系属性访问

```python
                        from webapp.v2.models.payroll import PayrollEntry
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 703** - Python ORM N+1

```python
                        entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 703** - 缺少joinedload/selectinload

```python
                        entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 712** - 关系属性访问

```python
                                employee_code=entry.employee.employee_code if entry.employee else "N/A",
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 713** - 关系属性访问

```python
                                employee_name=f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else "未知员工",
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 839** - Python ORM N+1

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 839** - 缺少joinedload/selectinload

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 857** - Python ORM N+1

```python
        updated_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 857** - 缺少joinedload/selectinload

```python
        updated_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 860** - 缺少joinedload/selectinload

```python
            status_lookup = db.query(LookupValue).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 950** - Python ORM N+1

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 950** - 缺少joinedload/selectinload

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 1013** - 关系属性访问

```python
                "purpose": f"{payroll_run.payroll_period.name if payroll_run.payroll_period else ''}工资",
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1034** - 关系属性访问

```python
        period_name = payroll_run.payroll_period.name if payroll_run.payroll_period else "工资"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/payroll.py

**行 1108** - 关系属性访问

```python
    from ..routers.config.payroll_component_router import get_payroll_components
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1135** - 关系属性访问

```python
    from ..routers.config.payroll_component_router import get_payroll_component
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1159** - 关系属性访问

```python
    from ..routers.config.payroll_component_router import create_payroll_component
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1183** - 关系属性访问

```python
    from ..routers.config.payroll_component_router import update_payroll_component
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1207** - 关系属性访问

```python
    from ..routers.config.payroll_component_router import delete_payroll_component
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1239** - 关系属性访问

```python
            CalculationLog.id.label("calculation_log_id"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1251** - 关系属性访问

```python
            PayrollRun.status_lookup_value_id.label("run_status")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1265** - 关系属性访问

```python
            filters.append(CalculationLog.component_code.ilike(f"%{component_code}%"))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1293** - 关系属性访问

```python
                "created_at": log.created_at.isoformat() if log.created_at else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1294** - 关系属性访问

```python
                "run_date": log.run_date.isoformat() if log.run_date else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/personnel_categories.py

**行 114** - 关系属性访问

```python
                category_dict = category.__dict__.copy()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 151** - 关系属性访问

```python
                PersonnelCategory.id.label('category_id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/reports.py

**行 951** - 关系属性访问

```python
        filename_prefix = view.name.replace(" ", "_")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 952** - 关系属性访问

```python
        filename = f"{filename_prefix}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 965** - 关系属性访问

```python
                if pd.api.types.is_datetime64_any_dtype(df[col]):
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 974** - 关系属性访问

```python
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1001** - 关系属性访问

```python
        file_size = os.path.getsize(temp_file_path)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config_v2.py

**行 30** - 关系属性访问

```python
        types = service.lookup_types.get_all_types(is_active=is_active)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
        values = service.lookup_values.get_by_type_code(type_code, is_active=is_active)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 116** - 关系属性访问

```python
        components = service.payroll_components.get_components_with_usage(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/employees.py

**行 13** - 关系属性访问

```python
from webapp.v2.database import get_db_v2
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 14** - 关系属性访问

```python
from webapp.v2.crud import hr as v2_hr_crud
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 15** - 关系属性访问

```python
from webapp.v2.pydantic_models.hr import (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 19** - 关系属性访问

```python
from webapp.v2.pydantic_models.common import DataResponse, PaginationResponse, PaginationMeta
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 110** - 关系属性访问

```python
            dept_name = emp_orm.current_department.name if emp_orm.current_department else None
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
            pc_name = emp_orm.personnel_category.name if emp_orm.personnel_category else None
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 112** - 关系属性访问

```python
            actual_pos_name = emp_orm.actual_position.name if emp_orm.actual_position else None
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
            job_position_level_name = emp_orm.job_position_level.name if emp_orm.job_position_level else None
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/calculation_config.py

**行 41** - 关系属性访问

```python
        rule_sets = query.order_by(CalculationRuleSet.created_at.desc()).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 缺少joinedload/selectinload

```python
        rule_set = db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 116** - 关系属性访问

```python
        if request.config_data.get("is_default", False):
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 缺少joinedload/selectinload

```python
            db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 123** - 关系属性访问

```python
            description=request.config_data.get("description"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 124** - 关系属性访问

```python
            version=request.config_data.get("version", "1.0"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 127** - 关系属性访问

```python
            applicable_employee_types=request.config_data.get("applicable_employee_types"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 128** - 关系属性访问

```python
            calculation_order=request.config_data.get("calculation_order", []),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
            default_configs=request.config_data.get("default_configs"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 关系属性访问

```python
            is_default=request.config_data.get("is_default", False),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 165** - 缺少joinedload/selectinload

```python
        rule_set = db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 173** - 关系属性访问

```python
        if request.config_data.get("is_default", False):
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 174** - 缺少joinedload/selectinload

```python
            db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 179** - 关系属性访问

```python
        rule_set.description = request.config_data.get("description")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 180** - 关系属性访问

```python
        rule_set.version = request.config_data.get("version", "1.0")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
        rule_set.applicable_employee_types = request.config_data.get("applicable_employee_types")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
        rule_set.calculation_order = request.config_data.get("calculation_order", [])
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 185** - 关系属性访问

```python
        rule_set.default_configs = request.config_data.get("default_configs")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
        rule_set.is_default = request.config_data.get("is_default", False)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 219** - 缺少joinedload/selectinload

```python
        rule_set = db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 258** - 关系属性访问

```python
        configs = query.order_by(SocialInsuranceConfig.created_at.desc()).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 294** - 缺少joinedload/selectinload

```python
        config = db.query(SocialInsuranceConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 339** - 关系属性访问

```python
            min_base=request.config_data.get("min_base"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 340** - 关系属性访问

```python
            max_base=request.config_data.get("max_base"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 341** - 关系属性访问

```python
            region_code=request.config_data.get("region_code"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 376** - 缺少joinedload/selectinload

```python
        config = db.query(SocialInsuranceConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 388** - 关系属性访问

```python
        config.min_base = request.config_data.get("min_base")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 389** - 关系属性访问

```python
        config.max_base = request.config_data.get("max_base")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 390** - 关系属性访问

```python
        config.region_code = request.config_data.get("region_code")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 423** - 缺少joinedload/selectinload

```python
        config = db.query(SocialInsuranceConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 450** - 缺少joinedload/selectinload

```python
            config = db.query(SocialInsuranceConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 463** - 关系属性访问

```python
            config.min_base = request.config_data.get("min_base")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 464** - 关系属性访问

```python
            config.max_base = request.config_data.get("max_base")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 465** - 关系属性访问

```python
            config.region_code = request.config_data.get("region_code")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 513** - 缺少joinedload/selectinload

```python
        deleted_count = db.query(SocialInsuranceConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 514** - 关系属性访问

```python
            SocialInsuranceConfig.id.in_(config_ids)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 547** - 关系属性访问

```python
        configs = query.order_by(TaxConfig.created_at.desc()).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 582** - 缺少joinedload/selectinload

```python
        config = db.query(TaxConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 625** - 关系属性访问

```python
            calculation_method=request.config_data.get("calculation_method"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 626** - 关系属性访问

```python
            additional_config=request.config_data.get("additional_config"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 627** - 关系属性访问

```python
            region_code=request.config_data.get("region_code"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 662** - 缺少joinedload/selectinload

```python
        config = db.query(TaxConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 673** - 关系属性访问

```python
        config.calculation_method = request.config_data.get("calculation_method")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 674** - 关系属性访问

```python
        config.additional_config = request.config_data.get("additional_config")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 675** - 关系属性访问

```python
        config.region_code = request.config_data.get("region_code")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 708** - 缺少joinedload/selectinload

```python
        config = db.query(TaxConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 735** - 缺少joinedload/selectinload

```python
            config = db.query(TaxConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 747** - 关系属性访问

```python
            config.calculation_method = request.config_data.get("calculation_method")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 748** - 关系属性访问

```python
            config.additional_config = request.config_data.get("additional_config")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 749** - 关系属性访问

```python
            config.region_code = request.config_data.get("region_code")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 796** - 缺少joinedload/selectinload

```python
        deleted_count = db.query(TaxConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 797** - 关系属性访问

```python
            TaxConfig.id.in_(config_ids)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 816** - 缺少joinedload/selectinload

```python
        rule_set = db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 842** - 缺少joinedload/selectinload

```python
        rule_set = db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/routers/views.py

**行 13** - 关系属性访问

```python
from webapp.v2.utils.auth import get_current_user_id
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/hr_v2.py

**行 32** - 关系属性访问

```python
        employees = service.employees.get_employees_with_details(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
        statistics = service.employees.get_employee_statistics()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 107** - 关系属性访问

```python
        departments = service.departments.get_departments_with_stats(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 128** - 关系属性访问

```python
        hierarchy = service.departments.get_department_hierarchy()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 169** - 关系属性访问

```python
        positions = service.positions.get_positions_with_details(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 194** - 关系属性访问

```python
        categories = service.personnel_categories.get_categories_with_stats(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 279** - 关系属性访问

```python
        employee_stats = service.employees.get_employee_statistics()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config/report_definition_router.py

**行 9** - 关系属性访问

```python
from webapp.v2.crud import config as crud
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config/lookup_router.py

**行 9** - 关系属性访问

```python
from webapp.v2.crud import config as crud # Assuming crud functions for lookup are in config.py
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config/tax_bracket_router.py

**行 10** - 关系属性访问

```python
from webapp.v2.crud import config as crud
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config/social_security_rate_router.py

**行 10** - 关系属性访问

```python
from webapp.v2.crud import config as crud
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config/payroll_component_router.py

**行 9** - 关系属性访问

```python
from webapp.v2.crud import config as crud
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config/system_parameter_router.py

**行 9** - 关系属性访问

```python
from webapp.v2.crud import config as crud
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/routers/config/main_config_router.py

**行 11** - 关系属性访问

```python
from webapp.v2.crud import config as crud
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/payroll_calculation.py

**行 37** - 缺少joinedload/selectinload

```python
            payroll_entry_status_type = self.db.query(LookupType).filter(LookupType.code == "PAYROLL_ENTRY_STATUS").first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 37** - 关系属性访问

```python
            payroll_entry_status_type = self.db.query(LookupType).filter(LookupType.code == "PAYROLL_ENTRY_STATUS").first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 43** - 缺少joinedload/selectinload

```python
            calculated_value = self.db.query(LookupValue).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 43** - 关系属性访问

```python
            calculated_value = self.db.query(LookupValue).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 缺少joinedload/selectinload

```python
            error_value = self.db.query(LookupValue).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 52** - 关系属性访问

```python
            error_value = self.db.query(LookupValue).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 缺少joinedload/selectinload

```python
        query = self.db.query(Employee).filter(Employee.is_active == True)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 88** - 关系属性访问

```python
        query = self.db.query(Employee).filter(Employee.is_active == True)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 92** - 关系属性访问

```python
            query = query.filter(Employee.id.in_(employee_ids))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 关系属性访问

```python
            query = query.filter(Employee.department_id.in_(department_ids))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 99** - 缺少joinedload/selectinload

```python
        # existing_entries = self.db.query(PayrollEntry.employee_id).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 99** - 关系属性访问

```python
        # existing_entries = self.db.query(PayrollEntry.employee_id).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
        # query = query.filter(~Employee.id.in_(existing_entries))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 缺少joinedload/selectinload

```python
        return self.db.query(EmployeeSalaryConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 111** - 关系属性访问

```python
        return self.db.query(EmployeeSalaryConfig).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
                    EmployeeSalaryConfig.end_date.is_(None),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 缺少joinedload/selectinload

```python
        return self.db.query(AttendanceRecord).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 131** - 关系属性访问

```python
        return self.db.query(AttendanceRecord).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
                AttendanceRecord.period_id.in_(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 缺少joinedload/selectinload

```python
                    self.db.query(AttendancePeriod.id).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 135** - 关系属性访问

```python
                    self.db.query(AttendancePeriod.id).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
                            AttendancePeriod.period_start <= payroll_run.payroll_period.end_date,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
                            AttendancePeriod.period_end >= payroll_run.payroll_period.start_date
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 缺少joinedload/selectinload

```python
        rule_set = self.db.query(CalculationRuleSet).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 148** - 关系属性访问

```python
        rule_set = self.db.query(CalculationRuleSet).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 154** - 关系属性访问

```python
                    CalculationRuleSet.end_date.is_(None),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 164** - 缺少joinedload/selectinload

```python
        return self.db.query(CalculationRule).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 164** - 关系属性访问

```python
        return self.db.query(CalculationRule).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 210** - 缺少joinedload/selectinload

```python
            existing_entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 210** - 关系属性访问

```python
            existing_entry = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 234** - 关系属性访问

```python
                self.db.add(updated_entry)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - Python ORM N+1

```python
                #payroll_run_obj = self.db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 242** - 缺少joinedload/selectinload

```python
                #payroll_run_obj = self.db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 242** - 关系属性访问

```python
                #payroll_run_obj = self.db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，考虑使用 IN 查询替代多次单条查询

---

**行 250** - 关系属性访问

```python
                self.db.add(new_entry)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 254** - 关系属性访问

```python
            self.db.commit()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
            self.db.rollback()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 268** - 缺少joinedload/selectinload

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 268** - 关系属性访问

```python
        entries = self.db.query(PayrollEntry).filter(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 299** - Python ORM N+1

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 299** - 缺少joinedload/selectinload

```python
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 418** - 关系属性访问

```python
            "status": result.status.value if hasattr(result.status, 'value') else str(result.status),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 432** - 关系属性访问

```python
                    "component_type": comp.component_type.value if hasattr(comp.component_type, 'value') else str(comp.component_type)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 452** - 关系属性访问

```python
        self.db.add(log)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 464** - 关系属性访问

```python
        raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable for calculation_inputs") ```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/config.py

**行 50** - 关系属性访问

```python
            (LookupType.code.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
            (LookupType.name.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
            (LookupType.description.ilike(search_term))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - Python ORM N+1

```python
    return db.query(LookupType).filter(LookupType.id == lookup_type_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 75** - 缺少joinedload/selectinload

```python
    return db.query(LookupType).filter(LookupType.id == lookup_type_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 89** - 缺少joinedload/selectinload

```python
    return db.query(LookupType).filter(LookupType.code == code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 207** - 关系属性访问

```python
            (LookupValue.code.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 208** - 关系属性访问

```python
            (LookupValue.name.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 209** - 关系属性访问

```python
            (LookupValue.description.ilike(search_term))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 233** - Python ORM N+1

```python
    return db.query(LookupValue).filter(LookupValue.id == lookup_value_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 233** - 缺少joinedload/selectinload

```python
    return db.query(LookupValue).filter(LookupValue.id == lookup_value_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 248** - 缺少joinedload/selectinload

```python
    return db.query(LookupValue).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 373** - 关系属性访问

```python
            (SystemParameter.key.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 374** - 关系属性访问

```python
            (SystemParameter.value.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 375** - 关系属性访问

```python
            (SystemParameter.description.ilike(search_term))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 399** - 缺少joinedload/selectinload

```python
    return db.query(SystemParameter).filter(SystemParameter.key == param_key).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 413** - Python ORM N+1

```python
    return db.query(SystemParameter).filter(SystemParameter.id == param_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 413** - 缺少joinedload/selectinload

```python
    return db.query(SystemParameter).filter(SystemParameter.id == param_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 529** - 关系属性访问

```python
                PayrollComponentDefinition.code.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 530** - 关系属性访问

```python
                PayrollComponentDefinition.name.ilike(search_term)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 539** - 关系属性访问

```python
    if sort_by in PayrollComponentDefinition.__table__.columns:
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 570** - Python ORM N+1

```python
    return db.query(PayrollComponentDefinition).filter(PayrollComponentDefinition.id == component_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 570** - 缺少joinedload/selectinload

```python
    return db.query(PayrollComponentDefinition).filter(PayrollComponentDefinition.id == component_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 574** - 缺少joinedload/selectinload

```python
    return db.query(PayrollComponentDefinition).filter(PayrollComponentDefinition.code == code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 615** - Python ORM N+1

```python
    db_component = db.query(PayrollComponentDefinition).filter(PayrollComponentDefinition.id == component_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 615** - 缺少joinedload/selectinload

```python
    db_component = db.query(PayrollComponentDefinition).filter(PayrollComponentDefinition.id == component_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 678** - 关系属性访问

```python
            ((TaxBracket.end_date >= effective_date) | (TaxBracket.end_date.is_(None)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 685** - 关系属性访问

```python
            (TaxBracket.region_code.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 686** - 关系属性访问

```python
            (TaxBracket.tax_type.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 687** - 关系属性访问

```python
            (TaxBracket.description.ilike(search_term))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 711** - Python ORM N+1

```python
    return db.query(TaxBracket).filter(TaxBracket.id == bracket_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 711** - 缺少joinedload/selectinload

```python
    return db.query(TaxBracket).filter(TaxBracket.id == bracket_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 819** - 关系属性访问

```python
            ((SocialSecurityRate.end_date >= effective_date) | (SocialSecurityRate.end_date.is_(None)))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 826** - 关系属性访问

```python
            (SocialSecurityRate.region_code.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 827** - 关系属性访问

```python
            (SocialSecurityRate.contribution_type.ilike(search_term)) |
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 828** - 关系属性访问

```python
            (SocialSecurityRate.participant_type.ilike(search_term))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 852** - Python ORM N+1

```python
    return db.query(SocialSecurityRate).filter(SocialSecurityRate.id == rate_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 852** - 缺少joinedload/selectinload

```python
    return db.query(SocialSecurityRate).filter(SocialSecurityRate.id == rate_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/security.py

**行 58** - 关系属性访问

```python
        query = query.filter(User.username.ilike(search_term))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 66** - 关系属性访问

```python
        total_query_for_count = total_query_for_count.filter(User.username.ilike(f"%{search}%"))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，避免在循环中执行数据库查询

---

**行 147** - 缺少joinedload/selectinload

```python
        found_employee = db.query(Employee).filter(Employee.id_number == user.employee_id_card).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 160** - 缺少joinedload/selectinload

```python
        existing_link = db.query(User).filter(User.employee_id == found_employee.id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 188** - 缺少joinedload/selectinload

```python
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 188** - 关系属性访问

```python
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 247** - 关系属性访问

```python
    employee_fields_provided = user.model_fields_set.intersection({'employee_first_name', 'employee_last_name', 'employee_id_card'})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 265** - 缺少joinedload/selectinload

```python
            found_employee = db.query(Employee).filter(Employee.id_number == employee_id_card).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 275** - 缺少joinedload/selectinload

```python
            existing_link = db.query(User).filter(User.employee_id == found_employee.id, User.id != user_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 294** - 缺少joinedload/selectinload

```python
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 294** - 关系属性访问

```python
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 348** - 缺少joinedload/selectinload

```python
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 348** - 关系属性访问

```python
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 385** - 关系属性访问

```python
                Role.code.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 386** - 关系属性访问

```python
                Role.name.ilike(search_term)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 441** - 缺少joinedload/selectinload

```python
    existing_name = db.query(Role).filter(func.lower(Role.name) == func.lower(role.name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 455** - 缺少joinedload/selectinload

```python
            permissions = db.query(Permission).filter(Permission.id.in_(role.permission_ids)).all()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 455** - 关系属性访问

```python
            permissions = db.query(Permission).filter(Permission.id.in_(role.permission_ids)).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 491** - 关系属性访问

```python
    if role.name is not None and role.name.lower() != db_role.name.lower():
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 492** - 缺少joinedload/selectinload

```python
        existing_name = db.query(Role).filter(func.lower(Role.name) == func.lower(role.name), Role.id != role_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 502** - 缺少joinedload/selectinload

```python
            permissions = db.query(Permission).filter(Permission.id.in_(role.permission_ids)).all()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 502** - 关系属性访问

```python
            permissions = db.query(Permission).filter(Permission.id.in_(role.permission_ids)).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 561** - 关系属性访问

```python
                Permission.code.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 562** - 关系属性访问

```python
                Permission.description.ilike(search_term)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 585** - Python ORM N+1

```python
    return db.query(Permission).filter(Permission.id == permission_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 585** - 缺少joinedload/selectinload

```python
    return db.query(Permission).filter(Permission.id == permission_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 599** - 缺少joinedload/selectinload

```python
    return db.query(Permission).filter(Permission.code == code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/hr_crud.py

**行 200** - 缺少joinedload/selectinload

```python
                    similar_depts = db.query(DepartmentModel).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 201** - 关系属性访问

```python
                        func.lower(DepartmentModel.name).like(f"%{emp_in.department_name.lower()}%")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 227** - 缺少joinedload/selectinload

```python
                    similar_positions = db.query(PositionModel).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 228** - 关系属性访问

```python
                        func.lower(PositionModel.name).like(f"%{emp_in.position_name.lower()}%")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 254** - 缺少joinedload/selectinload

```python
                    similar_categories = db.query(PersonnelCategoryModel).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 255** - 关系属性访问

```python
                        func.lower(PersonnelCategoryModel.name).like(f"%{emp_in.personnel_category_name.lower()}%")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 333** - 关系属性访问

```python
                record_result.errors.extend(current_record_errors)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 400** - 缺少joinedload/selectinload

```python
                        primary_bank_account = db.query(EmployeeBankAccount).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 421** - 缺少joinedload/selectinload

```python
                        db.query(EmployeeAppraisal).filter(EmployeeAppraisal.employee_id == db_employee_to_process.id).delete(synchronize_session=False)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 455** - 关系属性访问

```python
                #    The original: if current_record_errors: record_result.errors.extend(current_record_errors) will handle it later.
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 460** - 关系属性访问

```python
                 record_result.errors.extend(list(set(current_record_errors))) # Use set to avoid duplicate error messages if any
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/email_crud.py

**行 10** - 关系属性访问

```python
from sqlalchemy.dialects.postgresql import JSONB
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 34** - 缺少joinedload/selectinload

```python
            db.query(models.EmailServerConfig).filter(models.EmailServerConfig.is_default == True).update({"is_default": False})
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 34** - 关系属性访问

```python
            db.query(models.EmailServerConfig).filter(models.EmailServerConfig.is_default == True).update({"is_default": False})
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - Python ORM N+1

```python
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.id == config_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 70** - 缺少joinedload/selectinload

```python
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.id == config_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 70** - 关系属性访问

```python
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.id == config_id).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，考虑使用 IN 查询替代多次单条查询

---

**行 74** - 缺少joinedload/selectinload

```python
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.server_name == server_name).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 74** - 关系属性访问

```python
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.server_name == server_name).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
    configs = query.order_by(models.EmailServerConfig.server_name).offset(skip).limit(limit).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 110** - 缺少joinedload/selectinload

```python
            db.query(models.EmailServerConfig).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 111** - 关系属性访问

```python
                models.EmailServerConfig.id != config_id,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 112** - 关系属性访问

```python
                models.EmailServerConfig.is_default == True
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 267** - 缺少joinedload/selectinload

```python
        return db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 267** - 关系属性访问

```python
        return db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 281** - 缺少joinedload/selectinload

```python
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 281** - 关系属性访问

```python
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 309** - 缺少joinedload/selectinload

```python
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).with_for_update().first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，避免在循环中执行数据库查询

---

**行 309** - 关系属性访问

```python
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).with_for_update().first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载，避免在循环中执行数据库查询

---

**行 337** - 关系属性访问

```python
        #     query = query.filter(models.EmailSendingTask.requested_by_user_id == requested_by_user_id)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 340** - 关系属性访问

```python
        tasks = query.order_by(models.EmailSendingTask.started_at.desc()).offset(skip).limit(limit).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 358** - 缺少joinedload/selectinload

```python
        all_logs = db.query(models.EmailLog).all()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 364** - 缺少joinedload/selectinload

```python
        query = db.query(models.EmailLog).filter(models.EmailLog.task_uuid == task_uuid)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 364** - 关系属性访问

```python
        query = db.query(models.EmailLog).filter(models.EmailLog.task_uuid == task_uuid)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 368** - 关系属性访问

```python
        logs = query.order_by(models.EmailLog.sent_at.desc()).offset(skip).limit(limit).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/hr/position_crud.py

**行 44** - 缺少joinedload/selectinload

```python
    return db.query(PositionModel).filter(func.lower(PositionModel.name) == func.lower(name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 60** - Python ORM N+1

```python
#     db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 60** - 缺少joinedload/selectinload

```python
#     db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 72** - Python ORM N+1

```python
#     db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 72** - 缺少joinedload/selectinload

```python
#     db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 76** - 缺少joinedload/selectinload

```python
#     # job_history_count = db.query(EmployeeJobHistory).filter(EmployeeJobHistory.position_id == position_id).count()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/hr/employee_update.py

**行 178** - 缺少joinedload/selectinload

```python
    existing_history = db.query(EmployeeJobHistory).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 221** - 缺少joinedload/selectinload

```python
        db.query(EmployeeAppraisal).filter(EmployeeAppraisal.employee_id == employee_id).delete(synchronize_session=False)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/hr/employee_create.py

**行 216** - 缺少joinedload/selectinload

```python
            existing_history = db.query(EmployeeJobHistory).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/hr/department_crud.py

**行 51** - 关系属性访问

```python
                Department.code.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
                Department.name.ilike(search_term)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - Python ORM N+1

```python
    return db.query(Department).filter(Department.id == department_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 77** - 缺少joinedload/selectinload

```python
    return db.query(Department).filter(Department.id == department_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 91** - 缺少joinedload/selectinload

```python
    return db.query(Department).filter(Department.code == code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 168** - 缺少joinedload/selectinload

```python
    job_history_count = db.query(EmployeeJobHistory).filter(EmployeeJobHistory.department_id == department_id).count()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 173** - 缺少joinedload/selectinload

```python
    child_department_count = db.query(Department).filter(Department.parent_department_id == department_id).count()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 185** - 缺少joinedload/selectinload

```python
    return db.query(Department).filter(func.lower(Department.name) == func.lower(name)).first()```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/hr/employee_operations.py

**行 50** - 缺少joinedload/selectinload

```python
    return db.query(DepartmentModel).filter(func.lower(DepartmentModel.name) == func.lower(name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 53** - 缺少joinedload/selectinload

```python
    return db.query(PositionModel).filter(func.lower(PositionModel.name) == func.lower(name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 56** - 缺少joinedload/selectinload

```python
    return db.query(PersonnelCategoryModel).filter(func.lower(PersonnelCategoryModel.name) == func.lower(name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 82** - 关系属性访问

```python
            Employee.employee_code.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
            Employee.first_name.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 84** - 关系属性访问

```python
            Employee.last_name.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
            Employee.id_number.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
            Employee.email.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 87** - 关系属性访问

```python
            Employee.phone_number.ilike(search_term)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 154** - 缺少joinedload/selectinload

```python
    return db.query(Employee).filter(Employee.employee_code == employee_code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 160** - 缺少joinedload/selectinload

```python
    return db.query(Employee).filter(Employee.id_number == id_number).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 166** - 缺少joinedload/selectinload

```python
    return db.query(Employee).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 280** - 缺少joinedload/selectinload

```python
            existing_history = db.query(EmployeeJobHistory).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 386** - 缺少joinedload/selectinload

```python
        primary_account = db.query(EmployeeBankAccount).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 409** - 缺少joinedload/selectinload

```python
            previous_job_history = db.query(EmployeeJobHistory).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 412** - 关系属性访问

```python
            ).order_by(EmployeeJobHistory.effective_date.desc()).first()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 418** - 缺少joinedload/selectinload

```python
            existing_history_for_date = db.query(EmployeeJobHistory).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，避免在循环中执行数据库查询

---

**行 452** - Python ORM N+1

```python
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 452** - 缺少joinedload/selectinload

```python
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/hr/utils.py

**行 15** - 缺少joinedload/selectinload

```python
    return db.query(PositionModel).filter(func.lower(PositionModel.name) == func.lower(name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 19** - 缺少joinedload/selectinload

```python
    return db.query(DepartmentModel).filter(func.lower(DepartmentModel.name) == func.lower(name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 23** - 缺少joinedload/selectinload

```python
    return db.query(PersonnelCategoryModel).filter(func.lower(PersonnelCategoryModel.name) == func.lower(name)).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/hr/personnel_category_crud.py

**行 52** - 关系属性访问

```python
                PersonnelCategory.code.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
                PersonnelCategory.name.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 54** - 关系属性访问

```python
                PersonnelCategory.description.ilike(search_term)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 79** - Python ORM N+1

```python
    return db.query(PersonnelCategory).filter(PersonnelCategory.id == personnel_category_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 79** - 缺少joinedload/selectinload

```python
    return db.query(PersonnelCategory).filter(PersonnelCategory.id == personnel_category_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 93** - 缺少joinedload/selectinload

```python
    return db.query(PersonnelCategory).filter(PersonnelCategory.code == code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 170** - 缺少joinedload/selectinload

```python
    job_history_count = db.query(EmployeeJobHistory).filter(EmployeeJobHistory.personnel_category_id == personnel_category_id).count()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 175** - 缺少joinedload/selectinload

```python
    child_category_count = db.query(PersonnelCategory).filter(PersonnelCategory.parent_category_id == personnel_category_id).count()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 187** - 缺少joinedload/selectinload

```python
    return db.query(PersonnelCategory).filter(func.lower(PersonnelCategory.name) == func.lower(name)).first()```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/hr/employee.py

**行 60** - 关系属性访问

```python
            Employee.employee_code.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
            Employee.first_name.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 62** - 关系属性访问

```python
            Employee.last_name.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
            Employee.id_number.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
            Employee.email.ilike(search_term),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
            Employee.phone_number.ilike(search_term)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 159** - 缺少joinedload/selectinload

```python
    return db.query(Employee).filter(Employee.employee_code == employee_code).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 173** - 缺少joinedload/selectinload

```python
    return db.query(Employee).filter(Employee.id_number == id_number).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 194** - 缺少joinedload/selectinload

```python
    return db.query(Employee).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 219** - 缺少joinedload/selectinload

```python
        db.query(EmployeeJobHistory).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/payroll/bank_export.py

**行 32** - 关系属性访问

```python
            EmployeeBankAccount.account_number.label("primary_account_number"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 33** - 关系属性访问

```python
            EmployeeBankAccount.bank_name.label("primary_bank_name")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
            primary_bank_account_sq.c.primary_account_number,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 46** - 关系属性访问

```python
            primary_bank_account_sq.c.primary_bank_name
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
            Employee.id == primary_bank_account_sq.c.employee_id
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/payroll/payroll_runs.py

**行 55** - 缺少joinedload/selectinload

```python
        employee_count = db.query(PayrollEntry.employee_id).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 102** - 缺少joinedload/selectinload

```python
        employee_count = db.query(PayrollEntry.employee_id).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 184** - Python ORM N+1

```python
    db_payroll_run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 184** - 缺少joinedload/selectinload

```python
    db_payroll_run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 218** - 缺少joinedload/selectinload

```python
    db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == run_id).delete(synchronize_session=False)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 222** - 缺少joinedload/selectinload

```python
    db.query(CalculationLog).filter(CalculationLog.payroll_run_id == run_id).delete(synchronize_session=False)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/payroll/payroll_entries.py

**行 102** - 关系属性访问

```python
                Department.name.ilike(f"%{department_name}%")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
                PersonnelCategory.name.ilike(f"%{personnel_category_name}%")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 118** - 关系属性访问

```python
                    Employee.first_name.ilike(f"%{search_term}%"), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
                    Employee.last_name.ilike(f"%{search_term}%"),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 122** - 关系属性访问

```python
                    PayrollEntry.remarks.ilike(f"%{search_term}%")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 159** - 关系属性访问

```python
            query = query.order_by(PayrollEntry.id.desc())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 161** - 关系属性访问

```python
        query = query.order_by(PayrollEntry.id.desc())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 238** - 关系属性访问

```python
            last_name = entry.employee.last_name or ''
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 239** - 关系属性访问

```python
            first_name = entry.employee.first_name or ''
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 262** - Python ORM N+1

```python
    query = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id)
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 262** - 缺少joinedload/selectinload

```python
    query = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id)
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 280** - 关系属性访问

```python
            last_name = entry.employee.last_name or ''
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 281** - 关系属性访问

```python
            first_name = entry.employee.first_name or ''
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 316** - 关系属性访问

```python
            for code, earn_value in entry.earnings_details.items():
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 339** - 关系属性访问

```python
            for code, amount_val in entry.deductions_details.items():
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 374** - 关系属性访问

```python
    ).order_by(PayrollComponentDefinition.display_order.asc())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 379** - 关系属性访问

```python
    ).order_by(PayrollComponentDefinition.display_order.asc())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 382** - 关系属性访问

```python
        PayrollComponentDefinition.type.in_(['EARNING', 'STAT']),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 384** - 关系属性访问

```python
    ).order_by(PayrollComponentDefinition.display_order.asc())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 482** - Python ORM N+1

```python
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 482** - 缺少joinedload/selectinload

```python
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 540** - Python ORM N+1

```python
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 540** - 缺少joinedload/selectinload

```python
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 620** - Python ORM N+1

```python
    entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 620** - 缺少joinedload/selectinload

```python
    entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/payroll/bulk_operations.py

**行 31** - Python ORM N+1

```python
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_period_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 31** - 缺少joinedload/selectinload

```python
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_period_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 110** - 缺少joinedload/selectinload

```python
                existing_entry = db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 172** - Python ORM N+1

```python
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_period_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 172** - 缺少joinedload/selectinload

```python
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_period_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 177** - 缺少joinedload/selectinload

```python
    default_run = db.query(PayrollRun).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 239** - 缺少joinedload/selectinload

```python
            existing_entry = db.query(PayrollEntry).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/payroll/payroll_periods.py

**行 49** - 关系属性访问

```python
        query = query.filter(PayrollPeriod.name.ilike(search_term))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
    query = query.order_by(PayrollPeriod.start_date.desc())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 缺少joinedload/selectinload

```python
    existing = db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 163** - 缺少joinedload/selectinload

```python
        existing = db.query(PayrollPeriod).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 198** - 缺少joinedload/selectinload

```python
    has_runs = db.query(PayrollRun).filter(PayrollRun.payroll_period_id == period_id).first() is not None
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/reports/report_data_source_crud.py

**行 22** - Python ORM N+1

```python
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 22** - 缺少joinedload/selectinload

```python
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 56** - Python ORM N+1

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 56** - 缺少joinedload/selectinload

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 67** - Python ORM N+1

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 67** - 缺少joinedload/selectinload

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 103** - 缺少joinedload/selectinload

```python
            existing_fields = db.query(ReportDataSourceField).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

### 📄 webapp/v2/crud/reports/view_crud.py

**行 31** - Python ORM N+1

```python
        return db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 31** - 缺少joinedload/selectinload

```python
        return db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 36** - 缺少joinedload/selectinload

```python
        return db.query(ReportView).filter(ReportView.view_name == view_name).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 54** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 54** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 63** - 关系属性访问

```python
            old_sql = db_view.sql_query.strip() if db_view.sql_query else ""
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 83** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 103** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 103** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 226** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 226** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/report_data_source_field_crud.py

**行 13** - 缺少joinedload/selectinload

```python
        query = db.query(ReportDataSourceField).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 30** - Python ORM N+1

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 30** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 41** - Python ORM N+1

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 41** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/report_view_crud.py

**行 30** - Python ORM N+1

```python
        return db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 30** - 缺少joinedload/selectinload

```python
        return db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 34** - 缺少joinedload/selectinload

```python
        return db.query(ReportView).filter(ReportView.view_name == view_name).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 50** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 50** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 68** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 68** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 84** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 84** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 112** - Python ORM N+1

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 112** - 缺少joinedload/selectinload

```python
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/execution_crud.py

**行 23** - Python ORM N+1

```python
        return db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 23** - 缺少joinedload/selectinload

```python
        return db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 41** - Python ORM N+1

```python
        db_execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 41** - 缺少joinedload/selectinload

```python
        db_execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/data_source_field_crud.py

**行 18** - 缺少joinedload/selectinload

```python
        return db.query(ReportDataSourceField).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 34** - Python ORM N+1

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 34** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 46** - Python ORM N+1

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 46** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/data_source_field_operations.py

**行 72** - 关系属性访问

```python
                field_type = row.data_type.upper()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/reports/calculated_field_crud.py

**行 26** - Python ORM N+1

```python
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 26** - 缺少joinedload/selectinload

```python
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 40** - Python ORM N+1

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 40** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 52** - Python ORM N+1

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 52** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/data_source_basic_crud.py

**行 23** - Python ORM N+1

```python
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 23** - 缺少joinedload/selectinload

```python
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 61** - Python ORM N+1

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 61** - 缺少joinedload/selectinload

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 73** - Python ORM N+1

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 73** - 缺少joinedload/selectinload

```python
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/_report_view_helpers.py

**行 116** - 关系属性访问

```python
                        where_conditions.append(f"{db.engine.dialect.identifier_preparer.quote_identifier(field)} ILIKE '%%{value}%%'")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 118** - 关系属性访问

```python
                        where_conditions.append(f"{db.engine.dialect.identifier_preparer.quote_identifier(field)} = '{value}'")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 125** - 关系属性访问

```python
                    order_conditions.append(f"{db.engine.dialect.identifier_preparer.quote_identifier(field)} {direction}")
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/reports/_report_data_source_helpers.py

**行 68** - 关系属性访问

```python
            field_type = row.data_type.upper()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
        if connection_test.connection_type.lower() == 'postgresql':
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
            "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=1),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 198** - 关系属性访问

```python
            "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=2),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
            "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=3),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/reports/template_field_crud.py

**行 18** - 缺少joinedload/selectinload

```python
        return db.query(ReportTemplateField).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 34** - Python ORM N+1

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 34** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 46** - Python ORM N+1

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 46** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/data_source_connection.py

**行 22** - 关系属性访问

```python
            if connection_test.connection_type.lower() == 'postgresql':
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/reports/report_template_field_crud.py

**行 13** - 缺少joinedload/selectinload

```python
        query = db.query(ReportTemplateField).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 30** - Python ORM N+1

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 30** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 41** - Python ORM N+1

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 41** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/view_execution_crud.py

**行 32** - 缺少joinedload/selectinload

```python
        return db.query(ReportViewExecution).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 34** - 关系属性访问

```python
        ).order_by(ReportViewExecution.executed_at.desc()).offset(skip).limit(limit).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 41** - Python ORM N+1

```python
        db_execution = db.query(ReportViewExecution).filter(ReportViewExecution.id == execution_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 41** - 缺少joinedload/selectinload

```python
        db_execution = db.query(ReportViewExecution).filter(ReportViewExecution.id == execution_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/report_view_execution_crud.py

**行 27** - 缺少joinedload/selectinload

```python
        query = db.query(ReportViewExecution).filter(
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联

---

**行 31** - 关系属性访问

```python
        executions = query.order_by(ReportViewExecution.executed_at.desc()).offset(skip).limit(limit).all()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 39** - Python ORM N+1

```python
        db_execution = db.query(ReportViewExecution).filter(ReportViewExecution.id == execution_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 39** - 缺少joinedload/selectinload

```python
        db_execution = db.query(ReportViewExecution).filter(ReportViewExecution.id == execution_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/report_calculated_field_crud.py

**行 22** - Python ORM N+1

```python
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 22** - 缺少joinedload/selectinload

```python
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 34** - Python ORM N+1

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 34** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 45** - Python ORM N+1

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 45** - 缺少joinedload/selectinload

```python
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/data_source_statistics.py

**行 88** - 关系属性访问

```python
                "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=1),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 97** - 关系属性访问

```python
                "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=2),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 106** - 关系属性访问

```python
                "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=3),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 webapp/v2/crud/reports/report_execution_crud.py

**行 18** - Python ORM N+1

```python
        return db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 18** - 缺少joinedload/selectinload

```python
        return db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 34** - Python ORM N+1

```python
        db_execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 34** - 缺少joinedload/selectinload

```python
        db_execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/template_crud.py

**行 28** - Python ORM N+1

```python
        return db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 28** - 缺少joinedload/selectinload

```python
        return db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 51** - 关系属性访问

```python
        if template.template_config and template.template_config.fields:
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
            for field_data_from_config in template.template_config.fields:
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
                    "formatting_config": field_data_from_config.formatting_config.dict(exclude_none=True) if field_data_from_config.formatting_config else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 78** - Python ORM N+1

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 78** - 缺少joinedload/selectinload

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 90** - Python ORM N+1

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 90** - 缺少joinedload/selectinload

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 98** - Python ORM N+1

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 98** - 缺少joinedload/selectinload

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 webapp/v2/crud/reports/report_template_crud.py

**行 20** - Python ORM N+1

```python
        return db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 20** - 缺少joinedload/selectinload

```python
        return db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 46** - 关系属性访问

```python
        if template.template_config and template.template_config.fields:
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 47** - 关系属性访问

```python
            for field_data_from_config in template.template_config.fields:
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
                    "formatting_config": field_data_from_config.formatting_config.dict(exclude_none=True) if field_data_from_config.formatting_config else None,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 78** - Python ORM N+1

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 78** - 缺少joinedload/selectinload

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 89** - Python ORM N+1

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 89** - 缺少joinedload/selectinload

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

**行 99** - Python ORM N+1

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 使用 joinedload() 或 selectinload() 预加载关联数据，考虑使用 IN 查询替代多次单条查询

---

**行 99** - 缺少joinedload/selectinload

```python
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
```

💡 **建议**: 添加 .options(joinedload(Model.relation)) 预加载关联，考虑使用 IN 查询替代多次单条查询

---

### 📄 frontend/v2/src/pages/LoginPage.tsx

**行 21** - 关系属性访问

```python
  const authToken = useSelector((state: RootState) => state.auth.authToken);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 22** - 关系属性访问

```python
  const isLoadingUser = useSelector((state: RootState) => state.auth.isLoadingUser);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 23** - 关系属性访问

```python
  const loginError = useSelector((state: RootState) => state.auth.loginError);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
                            onClick={() => window.location.reload()}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/UnauthorizedPage.tsx

**行 11** - 关系属性访问

```python
  const authToken = useSelector((state: RootState) => state.auth.authToken);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/NotFoundPage.tsx

**行 11** - 关系属性访问

```python
  const authToken = useSelector((state: RootState) => state.auth.authToken);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/index.tsx

**行 159** - 关系属性访问

```python
      let currentMonthPeriod = periods.find(p => p.name.includes(targetName));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 170** - 关系属性访问

```python
          currentMonthPeriod = periods.find(p => p.name.includes(altTarget));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 279** - 关系属性访问

```python
      const matchedPeriod = periods.find(p => p.name.includes(targetName));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 286** - 关系属性访问

```python
        if (response.data && response.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 584** - 关系属性访问

```python
                          process.env.NODE_ENV === 'development' && payrollStats.loading ? (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 635** - 关系属性访问

```python
                                    应发: <span style={{ color: '#52c41a' }}>¥{payrollStats.totalGrossPay.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 638** - 关系属性访问

```python
                                    扣发: <span style={{ color: '#ff4d4f' }}>¥{payrollStats.totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/index copy.tsx

**行 217** - 关系属性访问

```python
                    const match = period.name.match(/(\d{4})年(\d{1,2})月/);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 247** - 关系属性访问

```python
                    let matchedPeriod = periods.find(p => p.name.includes(targetName));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 266** - 关系属性访问

```python
                        if (response.data && response.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 309** - 关系属性访问

```python
                      const nameMatch = period.name.match(/(\d{4})年(\d{1,2})月/);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 323** - 关系属性访问

```python
                      const nameMatch = period.name.match(/(\d{4})年(\d{1,2})月/);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/components/BatchAdjustmentModal.tsx

**行 94** - 关系属性访问

```python
      message.error(t('simplePayroll:batchAdjust.errors.fetchComponents'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 106** - 关系属性访问

```python
      message.error(t('simplePayroll:batchAdjust.errors.fetchEmployees'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
      message.warning(t('simplePayroll:batchAdjust.warnings.noRules'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 155** - 关系属性访问

```python
      message.error(error.message || t('simplePayroll:batchAdjust.errors.preview'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 164** - 关系属性访问

```python
      message.warning(t('simplePayroll:batchAdjust.warnings.previewFirst'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
      message.success(t('simplePayroll:batchAdjust.messages.success', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
      message.error(error.message || t('simplePayroll:batchAdjust.errors.execute'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 202** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.columns.component'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 216** - 关系属性访问

```python
          placeholder={t('simplePayroll:batchAdjust.placeholders.selectComponent')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 233** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.columns.operation'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.columns.value'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 276** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.columns.description'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 282** - 关系属性访问

```python
          onChange={(e) => updateAdjustmentRule(record.id, { description: e.target.value })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 283** - 关系属性访问

```python
          placeholder={t('simplePayroll:batchAdjust.placeholders.description')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 308** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.preview.employeeCode'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 314** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.preview.employeeName'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 320** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.preview.component'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 326** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.preview.oldValue'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 333** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.preview.newValue'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 340** - 关系属性访问

```python
      title: t('simplePayroll:batchAdjust.preview.difference'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 371** - 关系属性访问

```python
            message={t('simplePayroll:batchAdjust.info.title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 372** - 关系属性访问

```python
            description={t('simplePayroll:batchAdjust.info.description', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 382** - 关系属性访问

```python
          <Form.Item label={t('simplePayroll:batchAdjust.employeeSelection.title')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 389** - 关系属性访问

```python
                  {t('simplePayroll:batchAdjust.employeeSelection.selectAll')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 395** - 关系属性访问

```python
                  {t('simplePayroll:batchAdjust.employeeSelection.clearAll')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 398** - 关系属性访问

```python
                  {t('simplePayroll:batchAdjust.employeeSelection.selected', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 409** - 关系属性访问

```python
                placeholder={t('simplePayroll:batchAdjust.employeeSelection.placeholder')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 427** - 关系属性访问

```python
          <Divider>{t('simplePayroll:batchAdjust.rules.title')}</Divider>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 437** - 关系属性访问

```python
                {t('simplePayroll:batchAdjust.rules.add')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 439** - 关系属性访问

```python
              <Tooltip title={t('simplePayroll:batchAdjust.rules.help')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 451** - 关系属性访问

```python
                emptyText: t('simplePayroll:batchAdjust.rules.empty')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 459** - 关系属性访问

```python
            label={t('simplePayroll:batchAdjust.description.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 463** - 关系属性访问

```python
              placeholder={t('simplePayroll:batchAdjust.description.placeholder')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 470** - 关系属性访问

```python
              <Divider>{t('simplePayroll:batchAdjust.preview.title')}</Divider>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 472** - 关系属性访问

```python
                message={t('simplePayroll:batchAdjust.preview.summary', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 501** - 关系属性访问

```python
                {t('simplePayroll:batchAdjust.actions.preview')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 509** - 关系属性访问

```python
                {t('simplePayroll:batchAdjust.actions.execute')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/components/ExcelImportModal.tsx

**行 160** - 关系属性访问

```python
        errors.push(t('simplePayroll:excel.validation.missingEmployeeCode', { row: index + 1 }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 163** - 关系属性访问

```python
        errors.push(t('simplePayroll:excel.validation.missingEmployeeName', { row: index + 1 }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 168** - 关系属性访问

```python
        errors.push(t('simplePayroll:excel.validation.negativeBasicSalary', { row: index + 1 }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 174** - 关系属性访问

```python
        warnings.push(t('simplePayroll:excel.validation.grossPayMismatch', { row: index + 1 }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 179** - 关系属性访问

```python
        warnings.push(t('simplePayroll:excel.validation.netPayMismatch', { row: index + 1 }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 252** - 关系属性访问

```python
      title: t('simplePayroll:excel.columns.employeeCode'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
      title: t('simplePayroll:excel.columns.employeeName'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 264** - 关系属性访问

```python
      title: t('simplePayroll:excel.columns.department'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 270** - 关系属性访问

```python
      title: t('simplePayroll:excel.columns.basicSalary'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 277** - 关系属性访问

```python
      title: t('simplePayroll:excel.columns.grossPay'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 284** - 关系属性访问

```python
      title: t('simplePayroll:excel.columns.netPay'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 304** - 关系属性访问

```python
          <Step title={t('simplePayroll:excel.steps.upload')} icon={<CloudUploadOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 305** - 关系属性访问

```python
          <Step title={t('simplePayroll:excel.steps.preview')} icon={<EyeOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 306** - 关系属性访问

```python
          <Step title={t('simplePayroll:excel.steps.validate')} icon={<CheckCircleOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 307** - 关系属性访问

```python
          <Step title={t('simplePayroll:excel.steps.import')} icon={<FileExcelOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 315** - 关系属性访问

```python
              message={t('simplePayroll:excel.uploadTips.title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 318** - 关系属性访问

```python
                  <li>{t('simplePayroll:excel.uploadTips.format')}</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 319** - 关系属性访问

```python
                  <li>{t('simplePayroll:excel.uploadTips.encoding')}</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 320** - 关系属性访问

```python
                  <li>{t('simplePayroll:excel.uploadTips.size')}</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 400** - 关系属性访问

```python
            {validationResult.errors.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 403** - 关系属性访问

```python
                message={t('simplePayroll:excel.validationErrors', { count: validationResult.errors.length })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 406** - 关系属性访问

```python
                    {validationResult.errors.map((error, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 415** - 关系属性访问

```python
            {validationResult.warnings.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 418** - 关系属性访问

```python
                message={t('simplePayroll:excel.validationWarnings', { count: validationResult.warnings.length })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 421** - 关系属性访问

```python
                    {validationResult.warnings.map((warning, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 434** - 关系属性访问

```python
                description={t('simplePayroll:excel.readyToImport', { count: validationResult.data.length })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/components/GenerateReportsCard.tsx

**行 110** - 关系属性访问

```python
            {t('simplePayroll:reports.quickGenerate.salaryTable')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 120** - 关系属性访问

```python
            {t('simplePayroll:reports.quickGenerate.taxDeclaration')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/components/GeneratePayrollCard.tsx

**行 53** - 关系属性访问

```python
      const availablePeriods = response.data.filter(p => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 94** - 关系属性访问

```python
      title: t('simplePayroll:generate.manualCreate.title'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
      content: t('simplePayroll:generate.manualCreate.content'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 195** - 关系属性访问

```python
              {t('simplePayroll:generate.manualCreate.button')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 219** - 关系属性访问

```python
        title={t('simplePayroll:generate.copyModal.title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 236** - 关系属性访问

```python
              label={t('simplePayroll:generate.copyModal.sourcePeriod')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 237** - 关系属性访问

```python
              rules={[{ required: true, message: t('simplePayroll:generate.copyModal.sourcePeriodRequired') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 240** - 关系属性访问

```python
                placeholder={t('simplePayroll:generate.copyModal.sourcePeriodPlaceholder')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 256** - 关系属性访问

```python
                        {t('simplePayroll:generate.copyModal.periodInfo', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 273** - 关系属性访问

```python
              label={t('simplePayroll:generate.copyModal.description')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 277** - 关系属性访问

```python
                placeholder={t('simplePayroll:generate.copyModal.descriptionPlaceholder')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 296** - 关系属性访问

```python
                  {t('simplePayroll:generate.copyModal.confirm')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/components/AuditPayrollCard.tsx

**行 129** - 关系属性访问

```python
        if (response.data.total_anomalies > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
          message.info(`审核完成：发现 ${response.data.total_anomalies} 个异常，其中 ${response.data.error_count} 个错误`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
            {response.data.status_info && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
                  <Tag color="orange">{response.data.status_info.previous_status}</Tag>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 191** - 关系属性访问

```python
                  <Tag color="green">{response.data.status_info.new_status}</Tag>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 193** - 关系属性访问

```python
                {response.data.warning && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 195** - 关系属性访问

```python
                    {response.data.warning}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 206** - 关系属性访问

```python
                    {response.data.total_processed}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 212** - 关系属性访问

```python
                    {response.data.success_count}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 218** - 关系属性访问

```python
                    {response.data.error_count}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 231** - 关系属性访问

```python
                    ¥{response.data.calculation_summary.total_gross_pay.toLocaleString()}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 237** - 关系属性访问

```python
                    ¥{response.data.calculation_summary.total_deductions.toLocaleString()}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 243** - 关系属性访问

```python
                    ¥{response.data.calculation_summary.total_net_pay.toLocaleString()}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 249** - 关系属性访问

```python
            {response.data.errors && response.data.errors.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 260** - 关系属性访问

```python
                  {response.data.errors?.map((error: any, index: number) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 263** - 关系属性访问

```python
                      borderBottom: index < (response.data.errors?.length || 0) - 1 ? '1px solid #ffccc7' : 'none'
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 289** - 关系属性访问

```python
      message.success(`计算引擎执行完成，成功处理 ${response.data.success_count} 条记录`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 314** - 关系属性访问

```python
                <li>总条目数：{response.data.basic_audit.total_entries}</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 315** - 关系属性访问

```python
                <li>异常总数：{response.data.basic_audit.total_anomalies}</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 316** - 关系属性访问

```python
                <li>错误数：{response.data.basic_audit.error_count}</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 317** - 关系属性访问

```python
                <li>警告数：{response.data.basic_audit.warning_count}</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 323** - 关系属性访问

```python
              {response.data.advanced_checks.map((check: any, index: number) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 326** - 关系属性访问

```python
                  {check.results.error && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 327** - 关系属性访问

```python
                    <div style={{ color: '#ff4d4f' }}>错误：{check.results.error}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 329** - 关系属性访问

```python
                  {check.results.summary && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 331** - 关系属性访问

```python
                      <div>检查项目：{check.results.total_checked || check.results.total_analyzed || '未知'}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 332** - 关系属性访问

```python
                      <div>发现问题：{check.results.issues_found || check.results.anomalies_detected || 0}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 335** - 关系属性访问

```python
                  {check.results.message && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 336** - 关系属性访问

```python
                    <div style={{ color: '#faad14' }}>{check.results.message}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 371** - 关系属性访问

```python
          fixed: response.data.fixed_count,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 372** - 关系属性访问

```python
          failed: response.data.failed_count
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 607** - 关系属性访问

```python
        title={t('simplePayroll:audit.detailModal.title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 743** - 关系属性访问

```python
                              const reason = e.target.value;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/components/PayrollWorkflowGuide.tsx

**行 303** - 关系属性访问

```python
            {currentStepConfig.actions.map(action => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 326** - 关系属性访问

```python
                {currentStepConfig.requirements.map((req, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 337** - 关系属性访问

```python
                {currentStepConfig.tips.map((tip, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/components/EnhancedWorkflowGuide.tsx

**行 218** - 关系属性访问

```python
        if (summaryResponse.data && summaryResponse.data.total_entries > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 307** - 关系属性访问

```python
        totalCount: periodsResponse.data.length,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 308** - 关系属性访问

```python
        periods: periodsResponse.data.map(p => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 317** - 关系属性访问

```python
      const availablePeriods = periodsResponse.data.filter(p => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 344** - 关系属性访问

```python
        fallbackPeriods = periodsResponse.data.filter(p => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 438** - 关系属性访问

```python
      if (result && result.data && result.data.total_entries === 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 813** - 关系属性访问

```python
                 const fileContent = response.data.file_format === 'csv' 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 814** - 关系属性访问

```python
                   ? '\ufeff' + response.data.file_content  // 为CSV添加UTF-8 BOM
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 815** - 关系属性访问

```python
                   : response.data.file_content;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 818** - 关系属性访问

```python
                   type: response.data.file_format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 820** - 关系属性访问

```python
                 const url = window.URL.createObjectURL(blob);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 823** - 关系属性访问

```python
                 link.download = response.data.file_name;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 824** - 关系属性访问

```python
                 document.body.appendChild(link);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 826** - 关系属性访问

```python
                 document.body.removeChild(link);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 827** - 关系属性访问

```python
                 window.URL.revokeObjectURL(url);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 829** - 关系属性访问

```python
                 message.success(`银行文件生成成功！共${response.data.total_records}条记录，总金额${response.data.total_amount}元`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 830** - 关系属性访问

```python
                 console.log('✅ 银行文件生成成功:', response.data.summary);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1010** - 关系属性访问

```python
          {currentStepConfig.actions.map(action => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1133** - 关系属性访问

```python
              {currentStepConfig.requirements.map((req, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1144** - 关系属性访问

```python
              {currentStepConfig.tips.map((tip, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/SimplePayroll/services/simplePayrollApi.ts

**行 29** - 关系属性访问

```python
    url: response.config.url,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 32** - 关系属性访问

```python
    dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/bulkImport/EmployeeBulkImportPage.tsx

**行 24** - 关系属性访问

```python
import styles from './EmployeeBulkImportPage.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
      if (textAreaRef.current.resizableTextArea && textAreaRef.current.resizableTextArea.textArea) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
        textAreaRef.current.resizableTextArea.textArea.focus();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
      } else if (typeof textAreaRef.current.focus === 'function') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
        textAreaRef.current.focus();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 101** - 关系属性访问

```python
    setJsonInput(e.target.value);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 142** - 关系属性访问

```python
      message.warning(t('bulk_import.validation.batch_has_errors'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 152** - 关系属性访问

```python
    if (!record.first_name) errors.push(t('bulk_import.validation.first_name_required'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 154** - 关系属性访问

```python
    if (!record.last_name) errors.push(t('bulk_import.validation.last_name_required'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 157** - 关系属性访问

```python
      errors.push(t('bulk_import.validation.id_number_required'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 162** - 关系属性访问

```python
        errors.push(t('bulk_import.validation.id_number_invalid'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 171** - 关系属性访问

```python
        errors.push(t('bulk_import.validation.hire_date_invalid_format'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 181** - 关系属性访问

```python
        errors.push(t('bulk_import.validation.date_of_birth_invalid_format'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
        errors.push(t('bulk_import.validation.first_work_date_invalid_format'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 193** - 关系属性访问

```python
        errors.push(t('bulk_import.validation.entry_date_to_current_organization_invalid_format'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 204** - 关系属性访问

```python
      message.info(t('bulk_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 212** - 关系属性访问

```python
        throw new Error(t('bulk_import.validation.json_not_array'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
        message.info(t('bulk_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 223** - 关系属性访问

```python
      const invalidCount = validatedData.filter(d => d.validationErrors && d.validationErrors.length > 0).length;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 225** - 关系属性访问

```python
        message.warning(t('bulk_import.message.file_parsed_with_errors_summary', { count: validatedData.length, errors: invalidCount }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 227** - 关系属性访问

```python
        message.success(t('bulk_import.message.file_parsed_success', { count: validatedData.length }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 231** - 关系属性访问

```python
      setParseError(error.message || t('bulk_import.validation.json_parse_error'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 239** - 关系属性访问

```python
      message.error(t('bulk_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 243** - 关系属性访问

```python
    const validRecords = parsedData.filter(record => !record.validationErrors || record.validationErrors.length === 0);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 246** - 关系属性访问

```python
      message.error(t('bulk_import.validation.no_valid_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 285** - 关系属性访问

```python
          message.success(t('bulk_import.message.upload_success', { count: success_count }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 287** - 关系属性访问

```python
          message.warning(t('bulk_import.results.partial_success', { success: success_count, error: failed_count }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 289** - 关系属性访问

```python
          message.error(t('bulk_import.results.all_failed_at_server', { count: failed_count }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 291** - 关系属性访问

```python
          message.error(t('bulk_import.message.upload_failed_no_data_returned'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 297** - 关系属性访问

```python
          ...parsedData.filter(r => r.validationErrors && r.validationErrors.length > 0).map(r => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 353** - 关系属性访问

```python
          message.success(t('bulk_import.message.upload_success', { count: employeesToDisplay.length }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 355** - 关系属性访问

```python
          message.warning(t('bulk_import.message.upload_attempted_but_no_valid_records_processed_or_returned'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 357** - 关系属性访问

```python
          message.error(t('bulk_import.message.upload_failed_no_data_returned'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 363** - 关系属性访问

```python
          errors: parsedData.filter(r => r.validationErrors && r.validationErrors.length > 0).map(r => ({record: r, error: r.validationErrors!.join('; ')})),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 392** - 关系属性访问

```python
        if (typeof error.response.data.detail === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 393** - 关系属性访问

```python
          extractedErrorMessage = error.response.data.detail;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 394** - 关系属性访问

```python
          detailedErrorMessage = error.response.data.detail;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 395** - 关系属性访问

```python
        } else if (Array.isArray(error.response.data.detail) && error.response.data.detail.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 397** - 关系属性访问

```python
          extractedErrorMessage = `${t('bulk_import.message.upload_failed_with_errors', { count: error.response.data.detail.length })}`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 399** - 关系属性访问

```python
          detailedErrorMessage = error.response.data.detail
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 402** - 关系属性访问

```python
        } else if (typeof error.response.data.detail === 'object') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 403** - 关系属性访问

```python
          extractedErrorMessage = error.response.data.detail.msg || t('bulk_import.message.upload_failed_with_details');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 404** - 关系属性访问

```python
          detailedErrorMessage = JSON.stringify(error.response.data.detail, null, 2);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 406** - 关系属性访问

```python
          extractedErrorMessage = t('bulk_import.message.upload_failed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 407** - 关系属性访问

```python
          detailedErrorMessage = JSON.stringify(error.response.data.detail);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 414** - 关系属性访问

```python
      message.error(`${t('bulk_import.message.upload_failed_prefix')} ${extractedErrorMessage}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 444** - 关系属性访问

```python
    { title: t('bulk_import.table_header.employee_code'), dataIndex: 'employee_code', key: 'employee_code', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 446** - 关系属性访问

```python
      title: t('bulk_import.table_header.fullname'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 453** - 关系属性访问

```python
    { title: t('bulk_import.table_header.last_name'), dataIndex: 'last_name', key: 'last_name', width: 80 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 454** - 关系属性访问

```python
    { title: t('bulk_import.table_header.first_name'), dataIndex: 'first_name', key: 'first_name', width: 80 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 455** - 关系属性访问

```python
    { title: t('bulk_import.table_header.id_number'), dataIndex: 'id_number', key: 'id_number', width: 180 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 456** - 关系属性访问

```python
    { title: t('bulk_import.table_header.date_of_birth'), dataIndex: 'date_of_birth', key: 'date_of_birth', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 457** - 关系属性访问

```python
    { title: t('bulk_import.table_header.gender_name'), dataIndex: 'gender_lookup_value_name', key: 'gender_lookup_value_name', width: 80, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 458** - 关系属性访问

```python
    { title: t('bulk_import.table_header.ethnicity'), dataIndex: 'ethnicity', key: 'ethnicity', width: 100, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 459** - 关系属性访问

```python
    { title: t('bulk_import.table_header.status_name'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 460** - 关系属性访问

```python
    { title: t('bulk_import.table_header.hire_date'), dataIndex: 'hire_date', key: 'hire_date', width: 120 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 461** - 关系属性访问

```python
    { title: t('bulk_import.table_header.first_work_date'), dataIndex: 'first_work_date', key: 'first_work_date', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 462** - 关系属性访问

```python
    { title: t('bulk_import.table_header.entry_date_to_current_organization'), dataIndex: 'entry_date_to_current_organization', key: 'entry_date_to_current_organization', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 463** - 关系属性访问

```python
    { title: t('bulk_import.table_header.employment_type_name'), dataIndex: 'employment_type_lookup_value_name', key: 'employment_type_lookup_value_name', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 464** - 关系属性访问

```python
    { title: t('bulk_import.table_header.education_level_name'), dataIndex: 'education_level_lookup_value_name', key: 'education_level_lookup_value_name', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 465** - 关系属性访问

```python
    { title: t('bulk_import.table_header.marital_status_name'), dataIndex: 'marital_status_lookup_value_name', key: 'marital_status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 466** - 关系属性访问

```python
    { title: t('bulk_import.table_header.political_status_name'), dataIndex: 'political_status_lookup_value_name', key: 'political_status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 467** - 关系属性访问

```python
    { title: t('bulk_import.table_header.contract_type_name'), dataIndex: 'contract_type_lookup_value_name', key: 'contract_type_lookup_value_name', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 468** - 关系属性访问

```python
    { title: t('bulk_import.table_header.department_name'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 469** - 关系属性访问

```python
    { title: t('bulk_import.table_header.position_name'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 470** - 关系属性访问

```python
    { title: t('bulk_import.table_header.personnel_category_name'), dataIndex: 'personnel_category_name', key: 'personnel_category_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 471** - 关系属性访问

```python
    { title: t('bulk_import.table_header.email'), dataIndex: 'email', key: 'email', width: 180, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 472** - 关系属性访问

```python
    { title: t('bulk_import.table_header.phone_number'), dataIndex: 'phone_number', key: 'phone_number', width: 120, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 473** - 关系属性访问

```python
    { title: t('bulk_import.table_header.bank_name'), dataIndex: 'bank_name', key: 'bank_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 474** - 关系属性访问

```python
    { title: t('bulk_import.table_header.bank_account_number'), dataIndex: 'bank_account_number', key: 'bank_account_number', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 476** - 关系属性访问

```python
      title: t('bulk_import.table_header.validation_errors'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 485** - 关系属性访问

```python
    { title: t('bulk_import.results_table.employee_code'), dataIndex: 'employee_code', key: 'code', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 487** - 关系属性访问

```python
      title: t('bulk_import.results_table.name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 497** - 关系属性访问

```python
          return item.record._fullname || `${item.record.last_name || ''}${item.record.first_name || ''}` || '-';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 504** - 关系属性访问

```python
      title: t('bulk_import.results_table.error_message'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 509** - 关系属性访问

```python
          return item.errors.join('; ');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 521** - 关系属性访问

```python
      label: <span><TableOutlined />{t('bulk_import.tabs.table_conversion')}</span>, // Added t()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 526** - 关系属性访问

```python
      label: <span><FileTextOutlined />{t('bulk_import.tabs.json_import')}</span>, // Added t()
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 530** - 关系属性访问

```python
            <Step title={t('bulk_import.steps.input_data')} icon={<FileTextOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 531** - 关系属性访问

```python
            <Step title={t('bulk_import.steps.preview_data')} icon={<PlaySquareOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 532** - 关系属性访问

```python
            <Step title={t('bulk_import.steps.upload_progress')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 533** - 关系属性访问

```python
            <Step title={t('bulk_import.steps.results')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 549** - 关系属性访问

```python
                label={t('bulk_import.label.json_input')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 550** - 关系属性访问

```python
                help={parseError ? <Text type="danger">{parseError}</Text> : t('bulk_import.help.json_input')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 561** - 关系属性访问

```python
                  placeholder={t('bulk_import.placeholder.paste_json_here')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 573** - 关系属性访问

```python
                {t('bulk_import.button.parse_and_preview')} {/* Corrected: use {} for translation */}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 577** - 关系属性访问

```python
                label={t('bulk_import.label.overwrite_mode')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 580** - 关系属性访问

```python
                help={t('bulk_import.help.overwrite_mode')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 589** - 关系属性访问

```python
            <Card title={t('bulk_import.card_title.preview_data_count_summary', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 596** - 关系属性访问

```python
                  message={t('bulk_import.notes.preview_contains_errors', {count: validationSummary.invalidRecords})}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 604** - 关系属性访问

```python
                  message={t('bulk_import.notes.no_valid_records_to_upload')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 627** - 关系属性访问

```python
                {t('bulk_import.button.upload_validated_records', { count: validationSummary.validRecords })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 633** - 关系属性访问

```python
            <Card title={t('bulk_import.card_title.uploading_data')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 635** - 关系属性访问

```python
                <Text>{t('bulk_import.message.upload_in_progress')}</Text> {/* Corrected: use {} for translation */}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 642** - 关系属性访问

```python
            <Card title={t('bulk_import.card_title.upload_results')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 645** - 关系属性访问

```python
                  message={t('bulk_import.results.all_success', { count: uploadResult.successCount })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 651** - 关系属性访问

```python
                  message={t('bulk_import.results.partial_success', { success: uploadResult.successCount, error: uploadResult.errorCount })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 657** - 关系属性访问

```python
                  message={t('bulk_import.results.all_failed_at_server', { count: uploadResult.errorCount })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 663** - 关系属性访问

```python
                    message={t('bulk_import.results.no_records_processed_at_server')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 669** - 关系属性访问

```python
              {uploadResult.createdEmployees && uploadResult.createdEmployees.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 671** - 关系属性访问

```python
                  <Title level={5} style={{ marginTop: '20px' }}>{t('bulk_import.results_table.title_successfully_imported_records_preview')}</Title> {/* Corrected: use {} for translation */}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 679** - 关系属性访问

```python
                    pagination={{ pageSize: 10, hideOnSinglePage: uploadResult.createdEmployees.length <= 10 }}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 684** - 关系属性访问

```python
              {uploadResult.errors && uploadResult.errors.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 687** - 关系属性访问

```python
                    <Title level={5}>{t('bulk_import.results_table.title_failed_records_at_server')}</Title> {/* Corrected: use {} for translation */}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 692** - 关系属性访问

```python
                      {showDetailedErrors ? t('bulk_import.button.hide_error_details') : t('bulk_import.button.show_error_details')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 698** - 关系属性访问

```python
                      message={t('bulk_import.results.error_summary', { count: uploadResult.errors.length })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 699** - 关系属性访问

```python
                      description={t('bulk_import.results.click_to_view_details')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 704** - 关系属性访问

```python
                          {t('bulk_import.button.view_details')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 728** - 关系属性访问

```python
                {t('bulk_import.button.import_another_file')} {/* Corrected: use {} for translation */}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 751** - 关系属性访问

```python
            {t('bulk_import.button.back_to_employees')} {/* Corrected: use {} for translation */}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/bulkImport/TableTextConverter.tsx

**行 315** - 关系属性访问

```python
    // 处理点格式，如"2023.5.1"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 362** - 关系属性访问

```python
      message.error(t('batch_import.table_converter.missing_required_fields', { fields: missingRequiredFields.map(field => field.label).join(', ') }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 397** - 关系属性访问

```python
            if (mapping.apiField.includes('.')) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 398** - 关系属性访问

```python
              const [category, itemType, property] = mapping.apiField.split('.');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 434** - 关系属性访问

```python
                  case 'tax': itemName = t('components.deductions.personal_income_tax'); break;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 530** - 关系属性访问

```python
          onChange={e => setTableText(e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 614** - 关系属性访问

```python
                  onClick={() => navigator.clipboard.writeText(jsonResult)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx

**行 68** - 关系属性访问

```python
      const label = prefix + item.name.trim(); // Use prefix for indentation
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
      if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
    if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 346** - 关系属性访问

```python
    if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 350** - 关系属性访问

```python
      if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 357** - 关系属性访问

```python
      if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 374** - 关系属性访问

```python
        file.url = file.response.url;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 379** - 关系属性访问

```python
    if (info.file.status === 'done') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 380** - 关系属性访问

```python
      antdMessage.success(t('common:message.upload_success_param', { fileName: info.file.name }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 381** - 关系属性访问

```python
      form.setFieldsValue({ avatar: info.file.response.url });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 382** - 关系属性访问

```python
    } else if (info.file.status === 'error') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 383** - 关系属性访问

```python
      antdMessage.error(t('common:message.upload_failed_param', { fileName: info.file.name }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 417** - 关系属性访问

```python
    return t('common:form.validation.default_required_template', { fieldName: t(fieldNameKey) });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 433** - 关系属性访问

```python
                <Form.Item name="last_name" label={t('employee:detail_page.basic_info_tab.label_last_name')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_last_name') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 438** - 关系属性访问

```python
                <Form.Item name="first_name" label={t('employee:detail_page.basic_info_tab.label_first_name')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_first_name') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 445** - 关系属性访问

```python
                <Form.Item name="employee_code" label={t('employee:detail_page.basic_info_tab.label_employee_id')} rules={[{ required: false, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_id') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 450** - 关系属性访问

```python
                <Form.Item name="gender_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_gender')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_gender') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 451** - 关系属性访问

```python
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.gender')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 459** - 关系属性访问

```python
                <Form.Item name="date_of_birth" label={t('employee:detail_page.basic_info_tab.label_dob')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_dob') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 471** - 关系属性访问

```python
                <Form.Item name="marital_status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_marital_status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 478** - 关系属性访问

```python
                <Form.Item name="education_level_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_education_level')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 479** - 关系属性访问

```python
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.education_level')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 487** - 关系属性访问

```python
                <Form.Item name="political_status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_political_status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 525** - 关系属性访问

```python
                <Form.Item name="department_id" label={t('employee:detail_page.basic_info_tab.label_department')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_department') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 529** - 关系属性访问

```python
                    placeholder={t('employee:list_page.filter_form.placeholder.department')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 539** - 关系属性访问

```python
                <Form.Item name="personnel_category_id" label={t('employee:detail_page.basic_info_tab.label_job_title')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_job_title') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 543** - 关系属性访问

```python
                    placeholder={t('employee:list_page.filter_form.placeholder.job_title')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 556** - 关系属性访问

```python
                <Form.Item name="actual_position_id" label={t('employee:detail_page.basic_info_tab.label_actual_position')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_actual_position') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 558** - 关系属性访问

```python
                    placeholder={t('employee:list_page.filter_form.placeholder.actual_position')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 568** - 关系属性访问

```python
                <Form.Item name="hire_date" label={t('employee:detail_page.basic_info_tab.label_hire_date')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_hire_date') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 575** - 关系属性访问

```python
                <Form.Item name="status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_employee_status')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_status') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 576** - 关系属性访问

```python
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.status')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 582** - 关系属性访问

```python
                <Form.Item name="employment_type_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_employment_type')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 583** - 关系属性访问

```python
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.employment_type')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 609** - 关系属性访问

```python
                <Form.Item name="phone_number" label={t('employee:detail_page.basic_info_tab.label_mobile_phone')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_mobile_phone') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 614** - 关系属性访问

```python
                <Form.Item name="email" label={t('employee:detail_page.basic_info_tab.label_email')} rules={[{ type: 'email', message: t('common:form.validation.email_invalid') }]}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/components/EmployeeFilterForm.tsx

**行 101** - 关系属性访问

```python
          <Form.Item name="name" label={t('list_page.filter_form.label.name')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
            <Input placeholder={t('list_page.filter_form.placeholder.name')} size="small" />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 106** - 关系属性访问

```python
          <Form.Item name="employee_code" label={t('list_page.filter_form.label.employee_code')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 107** - 关系属性访问

```python
            <Input placeholder={t('list_page.filter_form.placeholder.employee_code')} size="small" />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
          <Form.Item name="id_number" label={t('list_page.filter_form.label.id_number')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 112** - 关系属性访问

```python
            <Input placeholder={t('list_page.filter_form.placeholder.id_number')} size="small" />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 116** - 关系属性访问

```python
          <Form.Item name="status_lookup_value_id" label={t('list_page.filter_form.label.status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.status')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
          <Form.Item name="department_id" label={t('list_page.filter_form.label.department')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
              placeholder={t('list_page.filter_form.placeholder.department')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
                treeNode.title.toLowerCase().includes(inputValue.toLowerCase())
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 147** - 关系属性访问

```python
          <Form.Item name="personnel_category_id" label={t('list_page.filter_form.label.personnel_category')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.personnel_category')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
          <Form.Item name="actual_position_id" label={t('list_page.filter_form.label.actual_position')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 159** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.actual_position')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 169** - 关系属性访问

```python
          <Form.Item name="employment_type_lookup_value_id" label={t('list_page.filter_form.label.employment_type')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 170** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.employment_type')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 182** - 关系属性访问

```python
          <Form.Item name="hireDateRange" label={t('list_page.filter_form.label.hire_date_range')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
          <Form.Item name="firstWorkDateRange" label={t('list_page.filter_form.label.first_work_date_range')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 194** - 关系属性访问

```python
          <Form.Item name="gender_lookup_value_id" label={t('list_page.filter_form.label.gender')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 195** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.gender')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 205** - 关系属性访问

```python
          <Form.Item name="marital_status_lookup_value_id" label={t('list_page.filter_form.label.marital_status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 206** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.marital_status')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 216** - 关系属性访问

```python
          <Form.Item name="political_status_lookup_value_id" label={t('list_page.filter_form.label.political_status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 217** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.political_status')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 227** - 关系属性访问

```python
          <Form.Item name="education_level_lookup_value_id" label={t('list_page.filter_form.label.education_level')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 228** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.education_level')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 240** - 关系属性访问

```python
          <Form.Item name="contract_type_lookup_value_id" label={t('list_page.filter_form.label.contract_type')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 241** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.contract_type')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 251** - 关系属性访问

```python
          <Form.Item name="job_position_level_lookup_value_id" label={t('list_page.filter_form.label.job_position_level')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 252** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.job_position_level')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 262** - 关系属性访问

```python
          <Form.Item name="pay_frequency_lookup_value_id" label={t('list_page.filter_form.label.pay_frequency')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 263** - 关系属性访问

```python
            <Select placeholder={t('list_page.filter_form.placeholder.pay_frequency')} allowClear loading={loading} size="small">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/components/EmployeeForm/index.tsx

**行 111** - 关系属性访问

```python
    if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
    if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 252** - 关系属性访问

```python
    if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
            if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 261** - 关系属性访问

```python
            if (process.env.NODE_ENV === 'development') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 282** - 关系属性访问

```python
        file.url = file.response.url; 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 287** - 关系属性访问

```python
    if (info.file.status === 'done') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 288** - 关系属性访问

```python
      antdMessage.success(t('common:message.upload_success_param', { fileName: info.file.name }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 289** - 关系属性访问

```python
      form.setFieldsValue({ avatar: info.file.response.url }); 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 290** - 关系属性访问

```python
    } else if (info.file.status === 'error') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 291** - 关系属性访问

```python
      antdMessage.error(t('common:message.upload_failed_param', { fileName: info.file.name }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 313** - 关系属性访问

```python
    return t('common:form.validation.default_required_template', { fieldName: t(fieldNameKey) });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/components/EmployeeForm/BasicInfoTab.tsx

**行 42** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_last_name')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 43** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_last_name') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_first_name')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_first_name') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_employee_id')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
            rules={[{ required: false, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_id') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_gender')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_gender') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
            <Select placeholder={t('employee:list_page.filter_form.placeholder.gender')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_dob')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 87** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_dob') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 107** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_marital_status')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_education_level')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
            <Select placeholder={t('employee:list_page.filter_form.placeholder.education_level')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_political_status')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/components/EmployeeForm/ContactBankTab.tsx

**行 20** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_mobile_phone')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 21** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_mobile_phone') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 29** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_email')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 30** - 关系属性访问

```python
            rules={[{ type: 'email', message: t('common:form.validation.email_invalid') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/components/EmployeeForm/PositionContractTab.tsx

**行 39** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_department')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 40** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_department') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
              placeholder={t('employee:list_page.filter_form.placeholder.department')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 57** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_job_title')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_job_title') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
              placeholder={t('employee:list_page.filter_form.placeholder.job_title')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 79** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_actual_position')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_actual_position') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
              placeholder={t('employee:list_page.filter_form.placeholder.actual_position')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_hire_date')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_hire_date') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 169** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_employee_status')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 170** - 关系属性访问

```python
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_status') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 172** - 关系属性访问

```python
            <Select placeholder={t('employee:list_page.filter_form.placeholder.status')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 180** - 关系属性访问

```python
            label={t('employee:detail_page.basic_info_tab.label_employment_type')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 182** - 关系属性访问

```python
            <Select placeholder={t('employee:list_page.filter_form.placeholder.employment_type')} loading={loadingLookups} allowClear>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/components/EmployeeForm/utils/transforms.ts

**行 40** - 关系属性访问

```python
      const label = prefix + item.name.trim();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/tableUtils.tsx

**行 160** - 关系属性访问

```python
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 349** - 关系属性访问

```python
      const worksheet = XLSX.utils.json_to_sheet(excelData);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 350** - 关系属性访问

```python
      const workbook = XLSX.utils.book_new();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 351** - 关系属性访问

```python
      XLSX.utils.book_append_sheet(workbook, worksheet, mergedOptions.sheetName);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 371** - 关系属性访问

```python
    const menuItems = mergedOptions.supportedFormats.map(format => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 380** - 关系属性访问

```python
    const shouldUseDropdown = hasExportCallback && mergedOptions.supportedFormats.length > 1;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 381** - 关系属性访问

```python
    const singleFormatServerExport = hasExportCallback && mergedOptions.supportedFormats.length === 1;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 519** - 关系属性访问

```python
  const storageKey = `${mergedOptions.storageKeyPrefix}_${window.location.pathname}`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 528** - 关系属性访问

```python
        return col.dataIndex.join('.');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 535** - 关系属性访问

```python
        return col.title.replace(/\s+/g, '_').toLowerCase();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 663** - 关系属性访问

```python
      window.localStorage.removeItem(storageKey);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/EmployeeListPage.tsx

**行 20** - 关系属性访问

```python
import styles from './EmployeeListPage.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
      title: t('employee:list_page.table.column.full_name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
        if (!record.full_name || !record.full_name.trim()) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 82** - 关系属性访问

```python
      title: t('employee:list_page.table.column.employee_code'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 关系属性访问

```python
      title: t('employee:list_page.table.column.email'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
      title: t('employee:list_page.table.column.phone_number'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 101** - 关系属性访问

```python
      title: t('employee:list_page.table.column.department'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 107** - 关系属性访问

```python
      title: t('employee:list_page.table.column.personnel_category'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
      title: t('employee:list_page.table.column.actual_position'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
      title: t('employee:list_page.table.column.status'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 125** - 关系属性访问

```python
      title: t('employee:list_page.table.column.hire_date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
      title: t('employee:list_page.table.column.action'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 221** - 关系属性访问

```python
        message.error(t('employee:list_page.message.get_employees_failed_empty_response'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 224** - 关系属性访问

```python
      message.error(t('employee:list_page.message.get_employees_failed'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 240** - 关系属性访问

```python
      title: t('employee:list_page.delete_confirm.title'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 241** - 关系属性访问

```python
      content: t('employee:list_page.delete_confirm.content'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - 关系属性访问

```python
      okText: t('employee:list_page.delete_confirm.ok_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 244** - 关系属性访问

```python
      cancelText: t('employee:list_page.delete_confirm.cancel_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 249** - 关系属性访问

```python
          message.success(t('employee:list_page.message.delete_employee_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 252** - 关系属性访问

```python
          message.error(t('employee:list_page.message.delete_employee_failed'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 340** - 关系属性访问

```python
    confirmTitle: t('common:confirm.batch_delete.title'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 341** - 关系属性访问

```python
    confirmContent: t('common:confirm.batch_delete.content', { count: selectedRowKeys.length }),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/JobInfoTab.tsx

**行 23** - 关系属性访问

```python
        <div style={{ height: 200, padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.job_info_tab.loading', 'Loading job information...')}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 29** - 关系属性访问

```python
    return <p>{t('employee:detail_page.job_info_tab.no_data', 'No employee job data available.')}</p>;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 42** - 关系属性访问

```python
      return `${years}${t('employee:detail_page.job_info_tab.seniority_year')}${months}${t('employee:detail_page.job_info_tab.seniority_month')}`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 44** - 关系属性访问

```python
      return `${months}${t('employee:detail_page.job_info_tab.seniority_month')}`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
          {t('employee:detail_page.job_info_tab.reports_to_id_prefix', { id: employee.reports_to_employee_id })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
      title={t('employee:detail_page.job_info_tab.title')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 87** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_department')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 93** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_personnel_category')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 99** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_actual_position')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_work_location')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_hire_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_employment_type')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_seniority')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_probation_end_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
        label={t('employee:detail_page.job_info_tab.label_reports_to')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/ContractInfoTab.tsx

**行 42** - 关系属性访问

```python
      setTotalRecords(result.meta.total || 0);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 43** - 关系属性访问

```python
      setCurrentPage(result.meta.page);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 44** - 关系属性访问

```python
      setPageSize(result.meta.size);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 46** - 关系属性访问

```python
      const errorMessage = err.message || t('employee:detail_page.contracts_tab.message.get_contracts_failed_retry');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
      title: t('common:modal.confirm_delete.title'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
      content: t('employee:detail_page.contracts_tab.delete_confirm.content'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
      okText: t('common:modal.confirm_delete.ok_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
          message.success(t('employee:detail_page.contracts_tab.message.delete_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 94** - 关系属性访问

```python
          const errorMessage = err.message || t('employee:detail_page.contracts_tab.message.delete_failed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
        message.success(t('employee:detail_page.contracts_tab.message.update_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
        message.success(t('employee:detail_page.contracts_tab.message.add_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 关系属性访问

```python
      const errorMessage = err.message || (modalMode === 'edit' ? t('employee:detail_page.contracts_tab.message.update_failed') : t('employee:detail_page.contracts_tab.message.add_failed'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 139** - 关系属性访问

```python
        <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.contracts_tab.loading')}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 160** - 关系属性访问

```python
          {t('employee:detail_page.contracts_tab.button_add_contract')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTable.tsx

**行 33** - 关系属性访问

```python
  const dashText = t('employee:detail_page.common_value.dash', '-');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 37** - 关系属性访问

```python
      title: t('employee:detail_page.job_history_tab.table.column_start_date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
      title: t('employee:detail_page.job_history_tab.table.column_department'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 57** - 关系属性访问

```python
      title: t('employee:detail_page.job_history_tab.table.column_job_title'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
      title: t('employee:detail_page.job_history_tab.table.column_employment_type'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
        ? Object.fromEntries(Array.from(lookupMaps.employmentTypeMap.entries()).map(([id, name]) => [id, { text: name }]))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
      title: t('employee:detail_page.job_history_tab.table.column_salary'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
      render: (_, record) => record.salary ? record.salary.toLocaleString() : naText,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
              tooltipTitle={t('employee:detail_page.job_history_tab.tooltip_edit_history_param', { id: record.id })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 118** - 关系属性访问

```python
              title={t('employee:detail_page.job_history_tab.delete_confirm.content_table')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 126** - 关系属性访问

```python
                tooltipTitle={t('employee:detail_page.job_history_tab.tooltip_delete_history_param', { id: record.id })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 147** - 关系属性访问

```python
      title={t('employee:detail_page.job_history_tab.table_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryModal.tsx

**行 57** - 关系属性访问

```python
        message.error(t('employee:detail_page.job_history_tab.modal.message_load_lookups_failed'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 91** - 关系属性访问

```python
        .catch(() => message.error(t('employee:detail_page.job_history_tab.modal.message_load_job_titles_failed')))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 125** - 关系属性访问

```python
      title={mode === 'add' ? t('employee:detail_page.job_history_tab.modal.title_add') : t('employee:detail_page.job_history_tab.modal.title_edit')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
            label={t('employee:detail_page.job_history_tab.table.column_start_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_effective_date_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 145** - 关系属性访问

```python
            label={t('employee:detail_page.job_history_tab.table.column_department')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 146** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_department_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_department')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 163** - 关系属性访问

```python
            label={t('employee:detail_page.job_history_tab.table.column_job_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 164** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_job_title_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 167** - 关系属性访问

```python
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_job_title')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 181** - 关系属性访问

```python
            label={t('employee:detail_page.job_history_tab.table.column_employment_type')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 182** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_employment_type_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 185** - 关系属性访问

```python
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_employment_type')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 191** - 关系属性访问

```python
          <Form.Item name="salary" label={t('employee:detail_page.job_history_tab.table.column_salary')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 194** - 关系属性访问

```python
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_input_salary')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTab.tsx

**行 52** - 关系属性访问

```python
      setError(t('employee:detail_page.job_history_tab.message.get_history_failed_retry'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
      message.error(err.message || t('employee:detail_page.job_history_tab.message.get_history_failed'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
      title: t('common:modal.confirm_delete.title'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 78** - 关系属性访问

```python
      content: t('employee:detail_page.job_history_tab.delete_confirm.content'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
          message.success(t('employee:detail_page.job_history_tab.message.delete_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
          message.error(error.message || t('employee:detail_page.job_history_tab.message.delete_failed'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
        message.success(t('employee:detail_page.job_history_tab.message.add_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
        message.success(t('employee:detail_page.job_history_tab.message.update_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
            {t('employee:detail_page.job_history_tab.loading_history')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 156** - 关系属性访问

```python
          {t('employee:detail_page.job_history_tab.button_add_history')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/CompensationHistoryTab.tsx

**行 44** - 关系属性访问

```python
      setTotalRecords(result.meta.total || 0);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
      setCurrentPage(result.meta.page);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 46** - 关系属性访问

```python
      setPageSize(result.meta.size);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 48** - 关系属性访问

```python
      setError(err.message || t('employee:detail_page.compensation_tab.message.get_history_failed_retry', 'Failed to fetch compensation history. Please try again.'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
        message.warning(t('employee:detail_page.compensation_tab.message.add_permission_denied', "You don't have permission to add compensation records."));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
      title: t('common:modal.confirm_delete.title', 'Confirm Delete'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 78** - 关系属性访问

```python
      content: t('employee:detail_page.compensation_tab.delete_confirm.content', 'Are you sure you want to delete this compensation record?'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
          message.success(t('employee:detail_page.compensation_tab.message.delete_success', 'Compensation record deleted successfully!'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 关系属性访问

```python
          message.error(deleteError.message || t('employee:detail_page.compensation_tab.message.delete_failed', 'Failed to delete compensation record.'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 100** - 关系属性访问

```python
        message.success(t('employee:detail_page.compensation_tab.message.add_success', 'Compensation record added successfully!'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 103** - 关系属性访问

```python
        message.success(t('employee:detail_page.compensation_tab.message.update_success', 'Compensation record updated successfully!'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
      message.error(submitError.message || t('employee:detail_page.compensation_tab.message.save_failed', 'Failed to save compensation record.'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
          {t('employee:detail_page.compensation_tab.button_add_record', 'Add Compensation Record')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/BasicInfoTab.tsx

**行 19** - 关系属性访问

```python
      <Spin tip={t('employee:detail_page.common_value.loading_basic_info')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 26** - 关系属性访问

```python
    return <p>{t('employee:detail_page.alert.description_employee_not_selected_or_found', 'No employee data available.')}</p>;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 38** - 关系属性访问

```python
    return statusKey ? t(`employee:list_page.table.status_text.${statusKey.toLowerCase()}`, { defaultValue: statusKey }) : String(statusId);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 44** - 关系属性访问

```python
    <Descriptions title={t('employee:detail_page.tabs.basic_info')} bordered column={2} layout="vertical">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_full_name')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_id')}>{employee.employee_code || naText}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 56** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_dob')}>{employee.date_of_birth ? (dayjs(employee.date_of_birth).isValid() ? dayjs(employee.date_of_birth).format('YYYY-MM-DD'): String(employee.date_of_birth)) : naText}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_gender')}>{getGenderText(employee.gender_lookup_value_id)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_education_level')}>{employee.education_level_lookup_value_id ? t(`employee:education_level.${String(employee.education_level_lookup_value_id).toLowerCase()}`, { defaultValue: String(employee.education_level_lookup_value_id) }) : naText}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 62** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_mobile_phone')}>{employee.phone_number || naText}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_email')} span={1}>{employee.email || naText}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_residential_address')} span={1}>{employee.home_address || naText}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_notes')} span={1}>{employee.notes || naText}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/LeaveBalanceTab.tsx

**行 37** - 关系属性访问

```python
      setLeaveBalances(result.data.map(item => ({ ...item, balance: item.total_entitlement - item.taken }) ));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 38** - 关系属性访问

```python
      setTotalRecords(result.meta.total || 0);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 39** - 关系属性访问

```python
      setCurrentPage(result.meta.page);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 40** - 关系属性访问

```python
      setPageSize(result.meta.size);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/CompensationModal.tsx

**行 42** - 关系属性访问

```python
        message.error(t('employee:detail_page.compensation_tab.modal.message_load_lookups_failed', 'Failed to load lookup data for compensation.'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
      title={mode === 'add' ? t('employee:detail_page.compensation_tab.modal.title_add', 'Add New Compensation Record') : t('employee:detail_page.compensation_tab.modal.title_edit', 'Edit Compensation Record')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 97** - 关系属性访问

```python
            <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.compensation_tab.modal.loading_options', 'Loading options...')}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
            label={t('employee:detail_page.compensation_tab.table.column_effective_date', 'Effective Date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_effective_date_required', 'Please select the effective date!') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
            label={t('employee:detail_page.compensation_tab.table.column_basic_salary', 'Basic Salary')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 112** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_basic_salary_required', 'Please input the basic salary!'), type: 'number' }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 118** - 关系属性访问

```python
            label={t('employee:detail_page.compensation_tab.table.column_allowances', 'Allowances')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
            rules={[{ type: 'number', message: t('employee:detail_page.compensation_tab.modal.validation_allowances_number', 'Please input a valid number for allowances') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 125** - 关系属性访问

```python
            label={t('employee:detail_page.compensation_tab.table.column_pay_frequency', 'Pay Frequency')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 126** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_pay_frequency_required', 'Please select the pay frequency!') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 128** - 关系属性访问

```python
            <Select placeholder={t('employee:detail_page.compensation_tab.modal.placeholder_select_pay_frequency', 'Select pay frequency')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 136** - 关系属性访问

```python
            label={t('employee:detail_page.compensation_tab.table.column_currency', 'Currency')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_currency_required', 'Please input the currency code (e.g., CNY)')}]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 144** - 关系属性访问

```python
            label={t('employee:detail_page.compensation_tab.table.column_change_reason', 'Reason for Change')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/ContractModal.tsx

**行 51** - 关系属性访问

```python
        message.error(t('employee:detail_page.contracts_tab.modal.message_load_lookups_failed'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
      title={mode === 'add' ? t('employee:detail_page.contracts_tab.modal.title_add') : t('employee:detail_page.contracts_tab.modal.title_edit')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 106** - 关系属性访问

```python
            <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.contracts_tab.modal.loading_options')}</div>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
            label={t('employee:detail_page.contracts_tab.table.column_contract_number')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_contract_number_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 120** - 关系属性访问

```python
            label={t('employee:detail_page.contracts_tab.table.column_contract_type')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 121** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_contract_type_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 关系属性访问

```python
            <Select placeholder={t('employee:detail_page.contracts_tab.modal.placeholder_select_contract_type')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 关系属性访问

```python
            label={t('employee:detail_page.contracts_tab.table.column_start_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 132** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_start_date_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
            label={t('employee:detail_page.contracts_tab.table.column_end_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 140** - 关系属性访问

```python
              { required: true, message: t('employee:detail_page.contracts_tab.modal.validation_end_date_required') },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
                  return Promise.reject(new Error(t('employee:detail_page.contracts_tab.modal.validation_end_date_after_start_date')));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
            label={t('employee:detail_page.contracts_tab.table.column_status')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 159** - 关系属性访问

```python
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_status_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 161** - 关系属性访问

```python
            <Select placeholder={t('employee:detail_page.contracts_tab.modal.placeholder_select_status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/CompensationTable.tsx

**行 29** - 关系属性访问

```python
  const zeroDecimalText = t('employee:detail_page.common_value.zero_decimal', '0.00');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 30** - 关系属性访问

```python
  const defaultCurrencyText = t('employee:detail_page.compensation_tab.default_currency', 'CNY');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 34** - 关系属性访问

```python
      title: t('employee:detail_page.compensation_tab.table.column_effective_date', 'Effective Date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 41** - 关系属性访问

```python
      title: t('employee:detail_page.compensation_tab.table.column_basic_salary', 'Basic Salary'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 46** - 关系属性访问

```python
      render: (_, record) => typeof record.basic_salary === 'number' ? record.basic_salary.toFixed(2) : naText,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 49** - 关系属性访问

```python
      title: t('employee:detail_page.compensation_tab.table.column_allowances', 'Allowances'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 54** - 关系属性访问

```python
      render: (_, record) => typeof record.allowances === 'number' ? record.allowances.toFixed(2) : (record.allowances === null || record.allowances === undefined ? zeroDecimalText : naText),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 57** - 关系属性访问

```python
      title: t('employee:detail_page.compensation_tab.table.column_total_salary', 'Total Salary'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 62** - 关系属性访问

```python
      render: (_, record) => typeof record.total_salary === 'number' ? record.total_salary.toFixed(2) : naText,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
      title: t('employee:detail_page.compensation_tab.table.column_pay_frequency', 'Pay Frequency'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
      title: t('employee:detail_page.compensation_tab.table.column_currency', 'Currency'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 81** - 关系属性访问

```python
      title: t('employee:detail_page.compensation_tab.table.column_change_reason', 'Reason for Change'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
              tooltipTitle={t('employee:detail_page.compensation_tab.tooltip_edit_record')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
              title={t('employee:detail_page.compensation_tab.delete_confirm.content_table', 'Are you sure you want to delete this record?')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
              <TableActionButton actionType="delete" danger tooltipTitle={t('employee:detail_page.compensation_tab.tooltip_delete_record')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 139** - 关系属性访问

```python
      title={t('employee:detail_page.compensation_tab.table_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/HRManagement/employees/partials/ContractTable.tsx

**行 32** - 关系属性访问

```python
      title: t('employee:detail_page.contracts_tab.table.column_contract_number'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 39** - 关系属性访问

```python
      title: t('employee:detail_page.contracts_tab.table.column_contract_type'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 50** - 关系属性访问

```python
      title: t('employee:detail_page.contracts_tab.table.column_start_date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 60** - 关系属性访问

```python
      title: t('employee:detail_page.contracts_tab.table.column_end_date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - 关系属性访问

```python
      title: t('employee:detail_page.contracts_tab.table.column_status'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 103** - 关系属性访问

```python
              tooltipTitle={t('employee:detail_page.contracts_tab.tooltip_edit_contract')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
              title={t('employee:detail_page.contracts_tab.delete_confirm.title_popconfirm')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
              description={t('common:modal.confirm_delete.content')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
              <TableActionButton actionType="delete" danger tooltipTitle={t('employee:detail_page.contracts_tab.tooltip_delete_contract')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Roles.tsx

**行 12** - 关系属性访问

```python
import styles from './Roles.module.less'; // 导入样式
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
        const currentPermissionIdsAsStrings = (editingRole.permissions || []).map(p => p.id.toString());
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
      // getPermissions from api/permissions.ts is defined as: export const getPermissions = async (): Promise<Permission[]> => { ... return response.data.data; }
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 155** - 关系属性访问

```python
        const serverErrorData = error.response.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 166** - 关系属性访问

```python
          } else if (detail.error && typeof detail.error.message === 'string') { // e.g. { error: { message: "..."} }
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 167** - 关系属性访问

```python
             errorToDisplay = detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 176** - 关系属性访问

```python
           } else if (typeof serverErrorData.error === 'object' && serverErrorData.error !== null && typeof serverErrorData.error.message === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
             errorToDisplay = serverErrorData.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 179** - 关系属性访问

```python
        } else if (Array.isArray(serverErrorData.errors) && serverErrorData.errors.length > 0 && typeof serverErrorData.errors[0].message === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 185** - 关系属性访问

```python
        if (error.response.status === 500) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
      title: t('table.column.id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
      title: t('table.column.code'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 219** - 关系属性访问

```python
      sorter: (a, b) => a.code.localeCompare(b.code),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 223** - 关系属性访问

```python
      title: t('table.column.name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 227** - 关系属性访问

```python
      sorter: (a, b) => a.name.localeCompare(b.name),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 231** - 关系属性访问

```python
      title: t('table.column.permissions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 237** - 关系属性访问

```python
        if (!record.permissions || record.permissions.length === 0) return '-';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 238** - 关系属性访问

```python
        return record.permissions.map(p => p.code).join(', ');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - 关系属性访问

```python
      title: t('table.column.actions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 271** - 关系属性访问

```python
      title: t('modal.confirm_delete.title'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 272** - 关系属性访问

```python
      content: t('modal.confirm_delete.content', { roleName: role.name }),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 273** - 关系属性访问

```python
      okText: t('modal.confirm_delete.ok_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 275** - 关系属性访问

```python
      cancelText: t('modal.confirm_delete.cancel_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 326** - 关系属性访问

```python
          ? t('modal.role_form.title.edit'): t('modal.role_form.title.create')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 344** - 关系属性访问

```python
            label={t('modal.role_form.label.name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 345** - 关系属性访问

```python
            rules={[{ required: true, message: t('modal.role_form.validation.name_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 351** - 关系属性访问

```python
            label={t('modal.role_form.label.code')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 352** - 关系属性访问

```python
            rules={[{ required: true, message: t('modal.role_form.validation.code_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 357** - 关系属性访问

```python
            label={t('modal.role_form.label.permissions')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 362** - 关系属性访问

```python
                key: p.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/DataSources.tsx

**行 149** - 关系属性访问

```python
      title: t('data_source.column.name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 168** - 关系属性访问

```python
      title: t('data_source.column.table_name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
      title: t('data_source.column.view_name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 193** - 关系属性访问

```python
      title: t('data_source.column.connection_type'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
      title: t('data_source.column.sync_status'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 206** - 关系属性访问

```python
          success: { color: 'success', text: t('data_source.status.success') },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
          failed: { color: 'error', text: t('data_source.status.failed') },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 208** - 关系属性访问

```python
          pending: { color: 'warning', text: t('data_source.status.pending') },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
      title: t('data_source.column.last_sync'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 222** - 关系属性访问

```python
      title: t('data_source.column.status'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 233** - 关系属性访问

```python
      title: t('data_source.column.actions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 239** - 关系属性访问

```python
          <Tooltip title={t('data_source.action.view_fields')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 246** - 关系属性访问

```python
          <Tooltip title={t('data_source.action.sync_structure')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 283** - 关系属性访问

```python
      title: t('data_source.field_column.name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 294** - 关系属性访问

```python
      title: t('data_source.field_column.type'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 307** - 关系属性访问

```python
      title: t('data_source.field_column.nullable'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 314** - 关系属性访问

```python
      title: t('data_source.field_column.default_value'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 321** - 关系属性访问

```python
      title: t('data_source.field_column.comment'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 330** - 关系属性访问

```python
      source.name.toLowerCase().includes(searchText.toLowerCase()) ||
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 381** - 关系属性访问

```python
              onChange={(e) => setSearchText(e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 438** - 关系属性访问

```python
                label={t('data_source.form.name_label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 440** - 关系属性访问

```python
                rules={[{ required: true, message: t('data_source.form.name_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 442** - 关系属性访问

```python
                <Input placeholder={t('data_source.form.name_placeholder')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 447** - 关系属性访问

```python
                label={t('data_source.form.connection_type_label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 449** - 关系属性访问

```python
                rules={[{ required: true, message: t('data_source.form.connection_type_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 465** - 关系属性访问

```python
                label={t('data_source.form.schema_name_label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 467** - 关系属性访问

```python
                rules={[{ required: true, message: t('data_source.form.schema_name_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 469** - 关系属性访问

```python
                <Input placeholder={t('data_source.form.schema_name_placeholder')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 475** - 关系属性访问

```python
              {/* If source_type is part of the form, you'd use Form.Item.useWatch and conditional rules/rendering */}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 477** - 关系属性访问

```python
                label={t('data_source.form.table_name_label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 479** - 关系属性访问

```python
                rules={[{ required: true, message: t('data_source.form.table_name_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 481** - 关系属性访问

```python
                <Input placeholder={t('data_source.form.table_name_placeholder')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 486** - 关系属性访问

```python
          <Form.Item label={t('data_source.form.description_label')} name="description">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 489** - 关系属性访问

```python
              placeholder={t('data_source.form.description_placeholder')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 494** - 关系属性访问

```python
            label={t('data_source.form.active_status_label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Config.tsx

**行 6** - 关系属性访问

```python
import styles from './Config.module.less'; // 导入样式
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 17** - 关系属性访问

```python
      label: t('configpage.tabs.chatbot'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 23** - 关系属性访问

```python
      label: t('configpage.tabs.general'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 28** - 关系属性访问

```python
      label: t('configpage.tabs.notifications'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/UsersV2.tsx

**行 56** - 关系属性访问

```python
      title: t('table.column.id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
      title: t('table.column.username'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 68** - 关系属性访问

```python
      sorter: (a, b) => a.username.localeCompare(b.username),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
      title: t('table.column.employee_id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 82** - 关系属性访问

```python
      title: t('table.column.roles'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
          {record.roles.map((role, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 97** - 关系属性访问

```python
      title: t('table.column.is_active'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
          <Tag color="green">{t('table.value.active')}</Tag> :
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
          <Tag color="red">{t('table.value.inactive')}</Tag>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
        { text: t('table.value.active'), value: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
        { text: t('table.value.inactive'), value: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
      title: t('table.column.created_at'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
        const pageUsers: PageUser[] = apiResponse.data.map((apiUser: ApiUser) => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
          roles: apiUser.roles ? apiUser.roles.map((role) => role.name || t('common:role.unknown')) : [],
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 191** - 关系属性访问

```python
          created_at: apiUser.created_at ? format(new Date(apiUser.created_at), 'yyyy-MM-dd HH:mm:ss') : t('table.value.not_applicable'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 266** - 关系属性访问

```python
        addButtonTextKey="user_list_page.button.create_user"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 291** - 关系属性访问

```python
          titleKey: 'modal.confirm_delete.title',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 292** - 关系属性访问

```python
          contentKey: 'modal.confirm_delete.content',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 293** - 关系属性访问

```python
          okTextKey: 'modal.confirm_delete.ok_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 294** - 关系属性访问

```python
          cancelTextKey: 'modal.confirm_delete.cancel_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 296** - 关系属性访问

```python
          errorMessageKey: 'message.delete_user_error.default',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Users.tsx

**行 14** - 关系属性访问

```python
import styles from './Users.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 91** - 关系属性访问

```python
        const pageUsers: PageUser[] = apiResponse.data.map((apiUser: ApiUser) => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 关系属性访问

```python
          roles: apiUser.roles ? apiUser.roles.map((role: ApiRole) => role.name || t('common:role.unknown')) : [],
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 98** - 关系属性访问

```python
          created_at: apiUser.created_at ? format(new Date(apiUser.created_at), 'yyyy-MM-dd HH:mm:ss') : t('table.value.not_applicable'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 190** - 关系属性访问

```python
      const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || t('message.create_user_error.default');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 246** - 关系属性访问

```python
      let errorMsg = t('message.update_user_error.default');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 251** - 关系属性访问

```python
        if (backendError.detail?.details && typeof backendError.detail.details === 'string') { // Assuming error is nested in detail.details
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 252** - 关系属性访问

```python
            errorMsg = backendError.detail.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 255** - 关系属性访问

```python
        } else if (backendError.error?.details && typeof backendError.error.details === 'string') { // Common structure { error: { details: "..."}}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 256** - 关系属性访问

```python
             errorMsg = backendError.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
        } else if (backendError.error?.message && typeof backendError.error.message === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
             errorMsg = backendError.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 279** - 关系属性访问

```python
      title: t('modal.confirm_delete.title', { username }),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 280** - 关系属性访问

```python
      content: t('modal.confirm_delete.content'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 281** - 关系属性访问

```python
      okText: t('modal.confirm_delete.ok_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 283** - 关系属性访问

```python
      cancelText: t('modal.confirm_delete.cancel_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 301** - 关系属性访问

```python
          const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || t('message.delete_user_error.default');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 311** - 关系属性访问

```python
      title: t('table.column.id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 319** - 关系属性访问

```python
      title: t('table.column.username'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 322** - 关系属性访问

```python
      sorter: (a, b) => a.username.localeCompare(b.username),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 326** - 关系属性访问

```python
      title: t('table.column.employee_id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 334** - 关系属性访问

```python
      title: t('table.column.roles'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 340** - 关系属性访问

```python
          {record.roles.map((role, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 349** - 关系属性访问

```python
      title: t('table.column.is_active'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 356** - 关系属性访问

```python
          <Tag color="green">t('table.value.active')</Tag> : 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 357** - 关系属性访问

```python
          <Tag color="red">t('table.value.inactive')</Tag>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 361** - 关系属性访问

```python
      title: t('table.column.created_at'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 369** - 关系属性访问

```python
      title: t('table.column.actions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 413** - 关系属性访问

```python
            t('user_list_page.button.create_user')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 443** - 关系属性访问

```python
              t('user_list_page.button.create_user')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 448** - 关系属性访问

```python
        title={editingUser ?      t('modal.title.edit_user'): t('modal.title.create_user')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 464** - 关系属性访问

```python
            label={t('form.username.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 465** - 关系属性访问

```python
            rules={[{ required: true, message: t('form.username.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 474** - 关系属性访问

```python
                label={t('form.password.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 475** - 关系属性访问

```python
                rules={[{ required: true, message: t('form.password.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 482** - 关系属性访问

```python
                label={t('form.confirm_password.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 486** - 关系属性访问

```python
                  { required: true, message: t('form.confirm_password.validation.required') },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 492** - 关系属性访问

```python
                      return Promise.reject(new Error(t('form.confirm_password.validation.match')));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 503** - 关系属性访问

```python
            t('form.section.employee_association')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 507** - 关系属性访问

```python
            label={t('form.label.employee_last_name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 509** - 关系属性访问

```python
            <Input placeholder={t('form.placeholder.employee_last_name')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 513** - 关系属性访问

```python
            label={t('form.label.employee_first_name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 515** - 关系属性访问

```python
            <Input placeholder={t('form.placeholder.employee_first_name')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 519** - 关系属性访问

```python
            label={t('form.label.employee_id_card')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 520** - 关系属性访问

```python
            tooltip={t('form.tooltip.employee_id_card_for_association')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 522** - 关系属性访问

```python
            <Input placeholder={t('form.placeholder.employee_id_card')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 527** - 关系属性访问

```python
            label={t('form.roles.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 528** - 关系属性访问

```python
            rules={[{ required: true, message: t('form.roles.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 533** - 关系属性访问

```python
              placeholder={t('form.roles.placeholder')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 541** - 关系属性访问

```python
            label={t('form.status.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 545** - 关系属性访问

```python
              checkedChildren={t('form.status_switch.active')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 546** - 关系属性访问

```python
              unCheckedChildren={t('form.status_switch.inactive')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/RolesV2.tsx

**行 42** - 关系属性访问

```python
      title: t('table.column.id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
      title: t('table.column.code'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 55** - 关系属性访问

```python
      sorter: (a, b) => a.code.localeCompare(b.code),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 60** - 关系属性访问

```python
      title: t('table.column.name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
      sorter: (a, b) => a.name.localeCompare(b.name),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
      title: t('table.column.permissions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
        if (!record.permissions || record.permissions.length === 0) return '-';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 76** - 关系属性访问

```python
        return record.permissions.map(p => p.code).join(', ');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 197** - 关系属性访问

```python
          titleKey: 'common:modal.confirm_delete.title',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 198** - 关系属性访问

```python
          contentKey: 'common:modal.confirm_delete.content_item',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
          okTextKey: 'common:modal.confirm_delete.ok_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
          cancelTextKey: 'common:modal.confirm_delete.cancel_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 209** - 关系属性访问

```python
          confirmOkText: t('common:modal.confirm_delete.ok_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 210** - 关系属性访问

```python
          confirmCancelText: t('common:modal.confirm_delete.cancel_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Organization/DepartmentManagementPageV2.tsx

**行 134** - 关系属性访问

```python
          key: dept.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 209** - 关系属性访问

```python
        key: dept.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 331** - 关系属性访问

```python
              if (info.selectedNodes && info.selectedNodes.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 333** - 关系属性访问

```python
                const department = flatData.find(d => d.id.toString() === selectedNode.key);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Organization/PersonnelCategoriesPageV2.tsx

**行 137** - 关系属性访问

```python
          key: cat.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 218** - 关系属性访问

```python
        key: cat.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 492** - 关系属性访问

```python
                    if (info.selectedNodes && info.selectedNodes.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 494** - 关系属性访问

```python
                      const category = flatData.find(c => c.id.toString() === selectedNode.key);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Organization/JobPositionLevelPageV2.tsx

**行 115** - 关系属性访问

```python
          key: level.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 关系属性访问

```python
          key: level.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 345** - 关系属性访问

```python
                    if (info.selectedNodes && info.selectedNodes.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 347** - 关系属性访问

```python
                      const level = levels.find(l => l.id.toString() === selectedNode.key);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Organization/ActualPositionPageV2.tsx

**行 162** - 关系属性访问

```python
          response.data.map(async (pos: Position) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
            const childrenCount = response.data.filter((p: Position) => p.parent_position_id === pos.id).length;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 关系属性访问

```python
            const parent = response.data.find((p: Position) => p.id === pos.parent_position_id);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 198** - 关系属性访问

```python
          key: pos.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 233** - 关系属性访问

```python
        effective_date: values.effective_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 234** - 关系属性访问

```python
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
        effective_date: values.effective_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 534** - 关系属性访问

```python
                if (info.selectedNodes && info.selectedNodes.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 536** - 关系属性访问

```python
                  const position = flatData.find(p => p.id.toString() === selectedNode.key);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/ReportView/index.tsx

**行 107** - 关系属性访问

```python
      filters: lookupMaps?.categoryMap ? Array.from(lookupMaps.categoryMap.entries()).map((entry: any) => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 127** - 关系属性访问

```python
      filters: lookupMaps?.statusMap ? Array.from(lookupMaps.statusMap.entries()).map((entry: any) => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 168** - 关系属性访问

```python
              onClick={() => onViewDetails(record.id.toString())}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
              onClick={() => onDelete(record.id.toString())}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Configuration/ChatbotSettingsTab.tsx

**行 14** - 关系属性访问

```python
import styles from './ChatbotSettingsTab.module.less'; // 导入样式
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 124** - 关系属性访问

```python
          tooltip={t('admin:base_url_tooltip', 'Dify.AI URL (e.g., http://dify.example.com)')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Configuration/ReportTableDemo.tsx

**行 158** - 关系属性访问

```python
              onChange={(e) => setReportTitle(e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 185** - 关系属性访问

```python
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Configuration/ReportTemplateDemo.tsx

**行 197** - 关系属性访问

```python
              onChange={(e) => updateTemplateConfig('reportTitle', e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 210** - 关系属性访问

```python
                  onChange={(e) => updateDescriptionLine(index, e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Permissions/PermissionListPageV2.tsx

**行 42** - 关系属性访问

```python
      title: t('list_page.table.column.id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
      title: t('list_page.table.column.code'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 55** - 关系属性访问

```python
      sorter: (a, b) => a.code.localeCompare(b.code),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 60** - 关系属性访问

```python
      title: t('list_page.table.column.description'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
            tooltipTitle={t('list_page.tooltip.edit_permission')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
            tooltipTitle={t('list_page.tooltip.delete_permission')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 159** - 关系属性访问

```python
        addButtonTextKey="list_page.button.create_permission"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
          titleKey: 'list_page.modal.confirm_delete.title',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
          contentKey: 'list_page.modal.confirm_delete.content',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 185** - 关系属性访问

```python
          okTextKey: 'list_page.modal.confirm_delete.ok_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 186** - 关系属性访问

```python
          cancelTextKey: 'list_page.modal.confirm_delete.cancel_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
          successMessageKey: 'list_page.message.delete_success',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 188** - 关系属性访问

```python
          errorMessageKey: 'list_page.message.delete_error_prefix',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
        lookupErrorMessageKey="list_page.message.load_list_error_prefix"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 213** - 关系属性访问

```python
        lookupDataErrorMessageKey="list_page.message.load_list_error_prefix"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Permissions/PermissionListPage.tsx

**行 13** - 关系属性访问

```python
import styles from './PermissionListPage.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 41** - 关系属性访问

```python
      message.success(t('list_page.message.create_success', { permissionCode: data.code }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
      message.error(`${t('list_page.message.create_error_prefix')}${error.message}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
      message.success(t('list_page.message.update_success', { permissionCode: data.code }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
      message.error(`${t('list_page.message.update_error_prefix')}${error.message}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
      message.success(t('list_page.message.delete_success', { permissionId }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 78** - 关系属性访问

```python
      message.error(`${t('list_page.message.delete_error_prefix', { permissionId })}${error.message}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
    message.error(`${t('list_page.message.load_list_error_prefix')}${fetchError.message}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
      title: t('list_page.table.column.id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
      title: t('list_page.table.column.code'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 98** - 关系属性访问

```python
      sorter: (a, b) => a.code.localeCompare(b.code),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
      title: t('list_page.table.column.description'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
      title: t('list_page.table.column.actions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
            tooltipTitle={t('list_page.tooltip.edit_permission')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 关系属性访问

```python
            tooltipTitle={t('list_page.tooltip.delete_permission')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 142** - 关系属性访问

```python
      title: t('list_page.modal.confirm_delete.title', { permissionCode: permission.code }),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
      content: t('list_page.modal.confirm_delete.content'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 144** - 关系属性访问

```python
      okText: t('list_page.modal.confirm_delete.ok_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 146** - 关系属性访问

```python
      cancelText: t('list_page.modal.confirm_delete.cancel_text'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 180** - 关系属性访问

```python
            {t('list_page.button.create_permission')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 198** - 关系属性访问

```python
        title={t('list_page.table.title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
            {t('list_page.button.create_permission')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/Permissions/components/PermissionForm.tsx

**行 48** - 关系属性访问

```python
      title={isEditing ?      t('form.title.edit'): t('form.title.create')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
          t('form.button.cancel')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
          {isEditing ?      t('form.button.save_changes'): t('form.button.create')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
          label={t('form.label.code')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
          rules={[{ required: true, message: t('form.validation.code_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
          <Input placeholder={t('form.placeholder.code')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 81** - 关系属性访问

```python
          label={t('form.label.description')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
          <Input.TextArea rows={3} placeholder={t('form.placeholder.description')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/components/PermissionFormModal.tsx

**行 49** - 关系属性访问

```python
        message.success(t('list_page.message.update_success', { permissionCode: values.code }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
        message.success(t('list_page.message.create_success', { permissionCode: newPermission.code }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 59** - 关系属性访问

```python
        ? `${t('list_page.message.update_error_prefix')}${error.message}`
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 60** - 关系属性访问

```python
        : `${t('list_page.message.create_error_prefix')}${error.message}`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
      title={isEditMode ? t('form.title.edit') : t('form.title.create')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
          label={t('form.label.code')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
          rules={[{ required: true, message: t('form.validation.code_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
          <Input placeholder={t('form.placeholder.code')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 92** - 关系属性访问

```python
          label={t('form.label.description')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 94** - 关系属性访问

```python
          <Input.TextArea rows={3} placeholder={t('form.placeholder.description')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/components/RoleFormModal.tsx

**行 58** - 关系属性访问

```python
          const currentPermissionIdsAsStrings = (role.permissions || []).map(p => p.id.toString());
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 120** - 关系属性访问

```python
        const serverErrorData = error.response.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 关系属性访问

```python
          } else if (detail.error && typeof detail.error.message === 'string') { // e.g. { error: { message: "..."} }
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 132** - 关系属性访问

```python
             errorToDisplay = detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 140** - 关系属性访问

```python
           } else if (typeof serverErrorData.error === 'object' && serverErrorData.error !== null && typeof serverErrorData.error.message === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
             errorToDisplay = serverErrorData.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
        } else if (Array.isArray(serverErrorData.errors) && serverErrorData.errors.length > 0 && typeof serverErrorData.errors[0].message === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
        if (error.response.status === 500) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 161** - 关系属性访问

```python
        ? t('modal.role_form.title.edit') : t('modal.role_form.title.create')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 180** - 关系属性访问

```python
          label={t('modal.role_form.label.name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 181** - 关系属性访问

```python
          rules={[{ required: true, message: t('modal.role_form.validation.name_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
          label={t('modal.role_form.label.code')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 188** - 关系属性访问

```python
          rules={[{ required: true, message: t('modal.role_form.validation.code_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 193** - 关系属性访问

```python
          label={t('modal.role_form.label.permissions')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 197** - 关系属性访问

```python
              key: p.id.toString(),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Admin/components/UserFormModal.tsx

**行 135** - 关系属性访问

```python
        ? `${t('message.update_user_error.default')}` : `${t('message.create_user_error.default')}`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 140** - 关系属性访问

```python
        if (backendError.detail?.details && typeof backendError.detail.details === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
          errorMsg = backendError.detail.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 144** - 关系属性访问

```python
        } else if (backendError.error?.details && typeof backendError.error.details === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 145** - 关系属性访问

```python
          errorMsg = backendError.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 146** - 关系属性访问

```python
        } else if (backendError.error?.message && typeof backendError.error.message === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 147** - 关系属性访问

```python
          errorMsg = backendError.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 160** - 关系属性访问

```python
      title={isEditMode ? t('modal.title.edit_user') : t('modal.title.create_user')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 176** - 关系属性访问

```python
          label={t('form.username.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
          rules={[{ required: true, message: t('form.username.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 186** - 关系属性访问

```python
              label={t('form.password.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
              rules={[{ required: true, message: t('form.password.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 194** - 关系属性访问

```python
              label={t('form.confirm_password.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 198** - 关系属性访问

```python
                { required: true, message: t('form.confirm_password.validation.required') },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 204** - 关系属性访问

```python
                    return Promise.reject(new Error(t('form.confirm_password.validation.match')));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
          {t('form.section.employee_association')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 219** - 关系属性访问

```python
          label={t('form.label.employee_last_name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 221** - 关系属性访问

```python
          <Input placeholder={t('form.placeholder.employee_last_name')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 225** - 关系属性访问

```python
          label={t('form.label.employee_first_name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 227** - 关系属性访问

```python
          <Input placeholder={t('form.placeholder.employee_first_name')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 231** - 关系属性访问

```python
          label={t('form.label.employee_id_card')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 232** - 关系属性访问

```python
          tooltip={t('form.tooltip.employee_id_card_for_association')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 234** - 关系属性访问

```python
          <Input placeholder={t('form.placeholder.employee_id_card')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 239** - 关系属性访问

```python
          label={t('form.roles.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 240** - 关系属性访问

```python
          rules={[{ required: true, message: t('form.roles.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 245** - 关系属性访问

```python
            placeholder={t('form.roles.placeholder')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 253** - 关系属性访问

```python
          label={t('form.status.label')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
            checkedChildren={t('form.status_switch.active')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
            unCheckedChildren={t('form.status_switch.inactive')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Dashboard/DashboardV3.tsx

**行 26** - 关系属性访问

```python
import styles from './DashboardV3.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Dashboard/components/PayrollAnalysisSection.tsx

**行 87** - 关系属性访问

```python
      departmentName: item.departmentName.replace(t('dashboard:auto_text_e983a8'), '').replace(t('dashboard:auto_text_e7a791'), t('dashboard:auto_text_e7a791'))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Dashboard/components/ManagementEfficiencySection.tsx

**行 307** - 关系属性访问

```python
                    <List.Item.Meta
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Dashboard/components/ComplianceRiskSection.tsx

**行 289** - 关系属性访问

```python
                  <List.Item.Meta
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 311** - 关系属性访问

```python
                            <BankOutlined /> 潜在损失: ¥{alert.potentialCost.toLocaleString()}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 341** - 关系属性访问

```python
                  <List.Item.Meta
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 425** - 关系属性访问

```python
                    <List.Item.Meta
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 430** - 关系属性访问

```python
                          <Tag color={getRiskLevelColor(item.level)}>{item.level.toUpperCase()}</Tag>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 466** - 关系属性访问

```python
                    <List.Item.Meta
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Manager/LeaveApprovals.tsx

**行 6** - 关系属性访问

```python
  return <div>t('manager_page.leave_approvals.placeholder_title')</div>;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Manager/Subordinates.tsx

**行 6** - 关系属性访问

```python
  return <div>{t('manager:manager_page.subordinates.placeholder_title')}</div>;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/PayrollWorkflowPage.tsx

**行 40** - 关系属性访问

```python
      title: t('payroll:workflow.steps.data_review.title', '薪资数据审核'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 41** - 关系属性访问

```python
      description: t('payroll:workflow.steps.data_review.description', '审核员工基础薪资、调整和变动记录'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 46** - 关系属性访问

```python
      title: t('payroll:workflow.steps.auto_calculation.title', '工资自动计算'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 47** - 关系属性访问

```python
      description: t('payroll:workflow.steps.auto_calculation.description', '系统根据预设规则和已审核数据执行计算'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
      title: t('payroll:workflow.steps.period_review.title', '工资周期复核'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
      description: t('payroll:workflow.steps.period_review.description', '复核整个工资周期的计算结果和报表'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
      title: t('payroll:workflow.steps.period_approval.title', '工资周期批准'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 59** - 关系属性访问

```python
      description: t('payroll:workflow.steps.period_approval.description', '最终批准当前工资周期，准备发放'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
      title: t('payroll:workflow.steps.payroll_distribution.title', '工资发放与归档'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
      description: t('payroll:workflow.steps.payroll_distribution.description', '执行工资发放，生成工资条，并归档相关记录'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 81** - 关系属性访问

```python
          message.success(t('payroll:workflow.messages.workflow_completed', '整个工资计算与发放流程已成功完成！'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 100** - 关系属性访问

```python
              message.error(t('payroll:workflow.steps.data_review.validation.must_initialize_data', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
            message.success(t('payroll:workflow.messages.step_completed', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
            message.success(t('payroll:workflow.messages.step_completed', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
            message.success(t('payroll:workflow.messages.step_completed', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 166** - 关系属性访问

```python
            message.success(t('payroll:workflow.messages.step_completed', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 185** - 关系属性访问

```python
            message.success(t('payroll:workflow.messages.step_completed', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/utils/payrollWorkflowUtils.ts

**行 32** - 关系属性访问

```python
      message.warning(t('payroll:workflow.steps.data_review.form.payroll_period', '请先选择一个薪资周期'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
      message.info(t('payroll:workflow.steps.data_review.data_initialization.no_data_message', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
    const url = window.URL.createObjectURL(blob);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
    document.body.appendChild(link);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 71** - 关系属性访问

```python
    document.body.removeChild(link);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
    window.URL.revokeObjectURL(url);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 237** - 关系属性访问

```python
      title: t('payroll:workflow.steps.data_review.data_initialization.copy_confirm_title', '确认复制上月数据'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 238** - 关系属性访问

```python
      content: t('payroll:workflow.steps.data_review.data_initialization.copy_confirm_content', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/utils/performanceMonitor.ts

**行 64** - 关系属性访问

```python
    this.metrics.push(metric);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
    this.comparisons.push(comparison);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 133** - 关系属性访问

```python
      originalDuration: `${originalMetric.duration.toFixed(2)}ms`,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
      viewDuration: `${viewMetric.duration.toFixed(2)}ms`,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 154** - 关系属性访问

```python
    const apiMetrics = this.metrics.filter(m => m.apiName === apiName);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 190** - 关系属性访问

```python
    const apiNames = [...new Set(this.metrics.map(m => m.apiName))];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
    this.comparisons.forEach(comparison => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 205** - 关系属性访问

```python
          `🚀 ${viewApi.apiName} 比 ${originalApi.apiName} 性能提升 ${improvement.percentageImprovement.toFixed(1)}%，建议优先使用视图API`
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/utils/payrollUtils.ts

**行 44** - 关系属性访问

```python
  if (statusId === undefined || statusId === null) return { key: 'run.common.status_na', color: 'default', type: 'custom' };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 48** - 关系属性访问

```python
    : { key: 'run.common.unknown_status_param', params: { statusId }, color: 'default', type: 'custom' };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollEntryFormModal.tsx

**行 138** - 关系属性访问

```python
    if (visible && payrollConfig.componentDefinitions.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 140** - 关系属性访问

```python
        payrollConfig.componentDefinitions.map(comp => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 240** - 关系属性访问

```python
            .filter(([key]) => payrollConfig.componentDefinitions.some(c => c.code === key && (c.type === 'EARNING')))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 244** - 关系属性访问

```python
              description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 250** - 关系属性访问

```python
                !payrollConfig.componentDefinitions.some(c => c.code === key && c.type === 'EARNING')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
          const validItems = entry.earnings_details.filter(item => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
            payrollConfig.componentDefinitions.some(c => c.code === item.name && c.type === 'EARNING')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 262** - 关系属性访问

```python
          if (validItems.length < entry.earnings_details.length) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 265** - 关系属性访问

```python
                .filter(item => !payrollConfig.componentDefinitions.some(c => c.code === item.name && c.type === 'EARNING'))
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 299** - 关系属性访问

```python
                  description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 307** - 关系属性访问

```python
            payrollConfig.componentDefinitions.some(c => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 315** - 关系属性访问

```python
                .filter(item => !payrollConfig.componentDefinitions.some(c => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 352** - 关系属性访问

```python
        messageApi.error(`${t('payroll:entry_form.error.invalid_earnings')}: ${invalidEarningCodes.join(', ')}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 362** - 关系属性访问

```python
        messageApi.error(`${t('payroll:entry_form.error.invalid_deductions')}: ${invalidDeductionCodes.join(', ')}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 368** - 关系属性访问

```python
        messageApi.error(t('payroll:entry_form.error.no_earnings'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 445** - 关系属性访问

```python
        messageApi.error(t('payroll:entry_form.validation.employee_required'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 485** - 关系属性访问

```python
            messageApi.success(`${t('payroll:entry_form.message.update_success')} - ID: ${returnedData.id}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 487** - 关系属性访问

```python
            messageApi.warning(t('payroll:entry_form.message.update_success_no_data'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 492** - 关系属性访问

```python
          messageApi.success(t('payroll:entry_form.message.create_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 498** - 关系属性访问

```python
        let errorMessage = t('payroll:entry_form.validation.failed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 499** - 关系属性访问

```python
        if (error.response && error.response.data && error.response.data.detail) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 500** - 关系属性访问

```python
          if (typeof error.response.data.detail === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 501** - 关系属性访问

```python
            errorMessage = error.response.data.detail;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 502** - 关系属性访问

```python
          } else if (Array.isArray(error.response.data.detail)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 503** - 关系属性访问

```python
            errorMessage = error.response.data.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join('; ');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 547** - 关系属性访问

```python
      messageApi.warning(t('payroll:entry_form.message.component_already_exists'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 567** - 关系属性访问

```python
      messageApi.warning(t('payroll:entry_form.message.component_already_exists'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 617** - 关系属性访问

```python
          <Card title={t('payroll:entry_form.section.employee_info')} variant="outlined">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 622** - 关系属性访问

```python
                    label={t('payroll:entry_form.label.employee_id')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 624** - 关系属性访问

```python
                    rules={[{ required: true, message: t('payroll:entry_form.validation.employee_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 630** - 关系属性访问

```python
                    label={t('payroll:entry_form.label.employee')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 632** - 关系属性访问

```python
                    rules={[{ required: true, message: t('payroll:entry_form.validation.employee_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 635** - 关系属性访问

```python
                      placeholder={t('payroll:entry_form.placeholder.select_employee')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 645** - 关系属性访问

```python
                  label={t('payroll:entry_form.label.employee_name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 653** - 关系属性访问

```python
                  label={t('payroll:entry_form.label.department')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 667** - 关系属性访问

```python
                    label={t('payroll:entry_form.label.personnel_category')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 677** - 关系属性访问

```python
                    label={t('payroll:entry_form.label.actual_position')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 698** - 关系属性访问

```python
                {t('payroll:entry_form.section.earnings')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 704** - 关系属性访问

```python
                placeholder={t('payroll:entry_form.placeholder.select_earnings_component')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 731** - 关系属性访问

```python
                      <Form.Item label={t('payroll:entry_form.label.amount')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 754** - 关系属性访问

```python
                {t('payroll:entry_form.section.deductions')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 760** - 关系属性访问

```python
                placeholder={t('payroll:entry_form.placeholder.select_deductions_component')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 787** - 关系属性访问

```python
                      <Form.Item label={t('payroll:entry_form.label.amount')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 807** - 关系属性访问

```python
                      <Card title={t('payroll:entry_form.section.summary')} variant="outlined">
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 811** - 关系属性访问

```python
                  label={t('payroll:entry_form.label.total_earnings')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 824** - 关系属性访问

```python
                  label={t('payroll:entry_form.label.total_deductions')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 837** - 关系属性访问

```python
                  label={t('payroll:entry_form.label.net_pay')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 853** - 关系属性访问

```python
                  label={t('payroll:entry_form.label.status')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 855** - 关系属性访问

```python
                  rules={[{ required: true, message: t('payroll:entry_form.validation.status_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 860** - 关系属性访问

```python
                        {status.display_name_key.includes(':') 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 870** - 关系属性访问

```python
                  label={t('payroll:entry_form.label.remarks')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/TaxConfigManager.tsx

**行 203** - 关系属性访问

```python
        effective_date: values.effective_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 204** - 关系属性访问

```python
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/AttendanceRuleManager.tsx

**行 199** - 关系属性访问

```python
        work_start_time: values.work_start_time.format('HH:mm:ss'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
        work_end_time: values.work_end_time.format('HH:mm:ss'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollEntriesTable.tsx

**行 67** - 关系属性访问

```python
      if (response.data && response.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
    messageApi.info(t('payroll:payroll_entries_table.message.edit_entry_todo'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 194** - 关系属性访问

```python
      title: t('payroll:payroll_entries_table.column.employeeId'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 203** - 关系属性访问

```python
      title: t('payroll:payroll_entries_table.column.employeeName'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
      title: t('payroll:payroll_entries_table.column.grossPay'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 231** - 关系属性访问

```python
      title: t('payroll:payroll_entries_table.column.deductions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - 关系属性访问

```python
      title: t('payroll:payroll_entries_table.column.netPay'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 255** - 关系属性访问

```python
      title: t('payroll:payroll_entries_table.column.status'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollPeriodForm.tsx

**行 74** - 关系属性访问

```python
        label={t('payroll_periods:payroll_period_form.label.name')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
        rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.name_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
        <Input placeholder={t('payroll_periods:payroll_period_form.placeholder.name')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
            label={t('payroll_periods:payroll_period_form.label.start_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 84** - 关系属性访问

```python
            rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.start_date_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 关系属性访问

```python
            label={t('payroll_periods:payroll_period_form.label.end_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 98** - 关系属性访问

```python
              { required: true, message: t('payroll_periods:payroll_period_form.validation.end_date_required') },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
                    return Promise.reject(new Error(t('payroll_periods:payroll_period_form.validation.end_date_before_start_date')));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 120** - 关系属性访问

```python
            label={t('payroll_periods:payroll_period_form.label.pay_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 121** - 关系属性访问

```python
            rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.pay_date_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
            label={t('payroll_periods:payroll_period_form.label.frequency')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
            rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.frequency_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 132** - 关系属性访问

```python
            <Select placeholder={t('payroll_periods:payroll_period_form.placeholder.frequency')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 142** - 关系属性访问

```python
        label={t('payroll_periods:payroll_period_form.label.status')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
        rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.status_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 145** - 关系属性访问

```python
        <Select placeholder={t('payroll_periods:payroll_period_form.placeholder.status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
              {t('payroll_periods:payroll_period_form.button.cancel')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 164** - 关系属性访问

```python
            {isEditMode ? t('payroll_periods:payroll_period_form.button.save_changes') : t('payroll_periods:payroll_period_form.button.create_period')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollEntryDetailModal.tsx

**行 59** - 关系属性访问

```python
      if (payrollConfig.componentDefinitions.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
    const definition = payrollConfig.componentDefinitions.find(def => def.code === code);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 128** - 关系属性访问

```python
      if (!response.data.employee_name && response.data.employee_id) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
        fetchEmployeeInfo(response.data.employee_id);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 167** - 关系属性访问

```python
          const definition = payrollConfig.componentDefinitions.find(def => def.code === item.name);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 176** - 关系属性访问

```python
              <Descriptions.Item label={t('payroll:entries_table.modal.component_name')}>{displayName}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
              <Descriptions.Item label={t('payroll:entries_table.modal.amount')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
              {item.description && <Descriptions.Item label={t('payroll:entries_table.modal.notes')}>{item.description}</Descriptions.Item>}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
      return `${entry.employee.last_name || ''}${entry.employee.first_name || ''}`.trim();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
      title: t('payroll:entry_detail_modal.earnings_table.component_name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 225** - 关系属性访问

```python
      title: t('payroll:entry_detail_modal.earnings_table.amount'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 232** - 关系属性访问

```python
      title: t('payroll:entry_detail_modal.earnings_table.description'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - 关系属性访问

```python
      title: t('payroll:entry_detail_modal.deductions_table.component_name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 247** - 关系属性访问

```python
      title: t('payroll:entry_detail_modal.deductions_table.amount'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 254** - 关系属性访问

```python
      title: t('payroll:entry_detail_modal.deductions_table.description'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollRunForm.tsx

**行 131** - 关系属性访问

```python
        label={t('payroll_runs:payroll_run_form.label.payroll_period')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 132** - 关系属性访问

```python
        rules={[{ required: true, message: t('payroll_runs:payroll_run_form.validation.payroll_period_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
        <Select placeholder={t('payroll_runs:payroll_run_form.placeholder.payroll_period')} loading={loadingPeriods} showSearch filterOption={(input, option) => (option?.children as unknown as string ?? '').toLowerCase().includes(input.toLowerCase())}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
            label={t('payroll_runs:payroll_run_form.label.run_date')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
            rules={[{ required: true, message: t('payroll_runs:payroll_run_form.validation.run_date_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 157** - 关系属性访问

```python
            label={isEditMode ? t('payroll_runs:payroll_run_form.label.status_edit_mode') : t('payroll_runs:payroll_run_form.label.status_create_mode')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
            rules={[{ required: true, message: t('payroll_runs:payroll_run_form.validation.status_required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 160** - 关系属性访问

```python
            <Select placeholder={t('payroll_runs:payroll_run_form.placeholder.status')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 173** - 关系属性访问

```python
        label={t('payroll_runs:payroll_run_form.label.employee_ids')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 174** - 关系属性访问

```python
        tooltip={t('payroll_runs:payroll_run_form.tooltip.employee_ids')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 关系属性访问

```python
          placeholder={t('payroll_runs:payroll_run_form.placeholder.employee_ids')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
        label={t('payroll_runs:payroll_run_form.label.notes')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 186** - 关系属性访问

```python
        <Input.TextArea rows={3} placeholder={t('payroll_runs:payroll_run_form.placeholder.notes')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 193** - 关系属性访问

```python
              {t('payroll_runs:payroll_run_form.button.cancel')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
            {isEditMode ? t('payroll_runs:payroll_run_form.button.save_changes') : t('payroll_runs:payroll_run_form.button.create_run')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollTableTextConverter.tsx

**行 46** - 关系属性访问

```python
    { key: 'earnings_details.basic.amount', label: t('payroll_table_converter:api_fields.earnings_basic_amount'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 47** - 关系属性访问

```python
    { key: 'earnings_details.bonus.amount', label: t('payroll_table_converter:api_fields.earnings_bonus_amount'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 48** - 关系属性访问

```python
    { key: 'earnings_details.allowance.amount', label: t('payroll_table_converter:api_fields.earnings_allowance_amount'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 49** - 关系属性访问

```python
    { key: 'earnings_details.overtime.amount', label: t('payroll_table_converter:api_fields.earnings_overtime_amount'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 50** - 关系属性访问

```python
    { key: 'deductions_details.tax.amount', label: t('payroll_table_converter:api_fields.deductions_tax_amount'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
    { key: 'deductions_details.insurance.amount', label: t('payroll_table_converter:api_fields.deductions_insurance_amount'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
    { key: 'deductions_details.fund.amount', label: t('payroll_table_converter:api_fields.deductions_fund_amount'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 68** - 关系属性访问

```python
    [t('payroll_table_converter:predefined_mapping.basic')]: 'earnings_details.basic.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
    [t('payroll_table_converter:predefined_mapping.bonus')]: 'earnings_details.bonus.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - 关系属性访问

```python
    [t('payroll_table_converter:predefined_mapping.allowance')]: 'earnings_details.allowance.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 71** - 关系属性访问

```python
    [t('payroll_table_converter:predefined_mapping.overtime_pay')]: 'earnings_details.overtime.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
    [t('payroll_table_converter:predefined_mapping.personal_income_tax')]: 'deductions_details.tax.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
    [t('payroll_table_converter:predefined_mapping.social_insurance')]: 'deductions_details.insurance.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
    [t('payroll_table_converter:predefined_mapping.housing_fund')]: 'deductions_details.fund.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 209** - 关系属性访问

```python
            if (mapping.apiField.includes('.')) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 210** - 关系属性访问

```python
              const [category, itemType, property] = mapping.apiField.split('.');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 307** - 关系属性访问

```python
          return selectedApiField.key.includes('date') ? t('common:data_type.date') :
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 308** - 关系属性访问

```python
                 selectedApiField.key.includes('amount') || selectedApiField.key.includes('number') ? t('common:data_type.number') :
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 329** - 关系属性访问

```python
          onChange={e => setTableText(e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollRunFormModal.tsx

**行 54** - 关系属性访问

```python
      if (formData.employee_ids_str && formData.employee_ids_str.trim() !== '') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
        run_date: formData.run_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
        messageApi.success(t('runs_page.message.update_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
        messageApi.success(t('runs_page.message.create_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 84** - 关系属性访问

```python
          ? t('runs_page.error.update_failed')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
          : t('runs_page.error.create_failed')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
      title={isEditMode ? t('payroll_runs:runs_page.modal_title.edit') : t('payroll_runs:runs_page.modal_title.create')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/DailyAttendanceManager.tsx

**行 190** - 关系属性访问

```python
        attendance_date: values.attendance_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/SocialInsuranceConfigManager.tsx

**行 140** - 关系属性访问

```python
        effective_date: values.effective_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/PayrollPeriodFormModal.tsx

**行 65** - 关系属性访问

```python
        start_date: values.start_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 66** - 关系属性访问

```python
        end_date: values.end_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 67** - 关系属性访问

```python
        pay_date: values.pay_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
        messageApi.success(t('payroll_periods_page.message.update_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
        messageApi.success(t('payroll_periods_page.message.create_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 84** - 关系属性访问

```python
          ? t('payroll_periods_page.message.update_failed')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
          : t('payroll_periods_page.message.create_failed')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/CalculationRuleSetManager.tsx

**行 159** - 关系属性访问

```python
        effective_date: values.effective_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 160** - 关系属性访问

```python
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/WorkflowSteps/AutoCalculationStep.tsx

**行 157** - 关系属性访问

```python
      if (!runsResponse.data?.data || runsResponse.data.data.length === 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 164** - 关系属性访问

```python
      const latestRun = runsResponse.data.data.sort((a: any, b: any) => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
          `${entry.employee.last_name || ''}${entry.employee.first_name || ''}`.trim() || '未知员工' 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 344** - 关系属性访问

```python
      <ProCard title={t('payroll:workflow.steps.auto_calculation.params_title', '计算参数概览')} style={{ marginBottom: 24 }}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 346** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.selected_cycle', '选定周期')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 359** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.employee_count', '参与员工数')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 363** - 关系属性访问

```python
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.run_id', '运行批次ID')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 367** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.calculation_engine', '计算引擎')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 368** - 关系属性访问

```python
            <Tag color="green">{t('payroll:workflow.steps.auto_calculation.engine_version', 'PayrollCalculationEngine v2.0')}</Tag>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 416** - 关系属性访问

```python
                  <ProTable.Summary.Row>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 417** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={0}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 419** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 420** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={1}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 424** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 425** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={2}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 429** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 430** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={3}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 434** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 435** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={4}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 439** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 440** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={5}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 449** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 450** - 关系属性访问

```python
                  </ProTable.Summary.Row>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 480** - 关系属性访问

```python
        <ProCard title={t('payroll:workflow.steps.auto_calculation.progress_title', '计算进度')} style={{ marginBottom: 24 }}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 488** - 关系属性访问

```python
              {t('payroll:workflow.steps.auto_calculation.current_employee', '正在处理：')} {typedCalculationProgress.current_employee}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 493** - 关系属性访问

```python
              {t('payroll:workflow.steps.auto_calculation.estimated_time', '预计剩余时间：')} {Math.ceil(typedCalculationProgress.estimated_remaining_time / 60)} 分钟
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 499** - 关系属性访问

```python
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.status', '计算状态')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 504** - 关系属性访问

```python
                {t(`payroll:workflow.steps.auto_calculation.status_${typedCalculationProgress?.status || 'unknown'}`, typedCalculationProgress?.status || '未知状态')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 507** - 关系属性访问

```python
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.task_id', '任务ID')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 628** - 关系属性访问

```python
        label={t('payroll:workflow.steps.auto_calculation.modules_label', '计算模块选择')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 631** - 关系属性访问

```python
            label: t('payroll:workflow.steps.auto_calculation.module_summary', '合计计算（应发、扣款、实发）'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 636** - 关系属性访问

```python
            label: t('payroll:workflow.steps.auto_calculation.module_basic', '基本工资计算'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 641** - 关系属性访问

```python
            label: t('payroll:workflow.steps.auto_calculation.module_allowance', '津贴补贴计算'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 646** - 关系属性访问

```python
            label: t('payroll:workflow.steps.auto_calculation.module_overtime', '加班费计算'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 651** - 关系属性访问

```python
            label: t('payroll:workflow.steps.auto_calculation.module_social_insurance', '社保公积金计算'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 656** - 关系属性访问

```python
            label: t('payroll:workflow.steps.auto_calculation.module_tax', '个人所得税计算'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 679** - 关系属性访问

```python
        title={t('payroll:workflow.steps.auto_calculation.technical_info_title', '计算引擎技术特性')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 685** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_precision', '计算精度')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 686** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_precision_desc', '使用Decimal类型确保金额计算精度，避免浮点数误差')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 688** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_async', '异步处理')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 689** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_async_desc', '支持大批量员工数据的异步计算，提供实时进度反馈')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 691** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_validation', '数据验证')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 692** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_validation_desc', '完整的输入验证和计算结果校验机制')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 694** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_audit', '审计追踪')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 695** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_audit_desc', '详细的计算日志和操作审计，支持问题追溯')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/WorkflowSteps/PayrollReviewStep.tsx

**行 263** - 关系属性访问

```python
            if (e.target.checked) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/WorkflowSteps/DataReviewStep.tsx

**行 202** - 关系属性访问

```python
          `${entry.employee.last_name || ''}${entry.employee.first_name || ''}`.trim() || '未知员工' 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 506** - 关系属性访问

```python
        return a.displayName.localeCompare(b.displayName, 'zh-CN');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 567** - 关系属性访问

```python
        return a.displayName.localeCompare(b.displayName, 'zh-CN');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 956** - 关系属性访问

```python
             entry.employee.id && 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1006** - 关系属性访问

```python
              <Text>{workflow.currentPayrollRun?.id ? `批次 #${workflow.currentPayrollRun.id}` : '未创建'}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1010** - 关系属性访问

```python
          {workflow.workflowStatus.steps && workflow.workflowStatus.steps[WORKFLOW_STEPS.DATA_REVIEW as any] && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1013** - 关系属性访问

```python
              description={`数据审核步骤已开始，开始时间: ${new Date((workflow.workflowStatus.steps[WORKFLOW_STEPS.DATA_REVIEW as any] as any)?.data?.started_at || '').toLocaleString()}`}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1023** - 关系属性访问

```python
      <ProCard title={t('payroll:workflow.steps.data_review.review_points.title', '审核要点')} style={{ marginBottom: 24 }}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1025** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.employee_data', '员工基础信息完整性')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1026** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.employee_data_desc', '确保员工信息、部门、职位等基础数据完整准确')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1028** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.attendance_data', '考勤数据准确性')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1029** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.attendance_data_desc', '核实出勤天数、加班时长、请假记录等考勤数据')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1031** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.component_config', '薪资组件配置正确性')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1032** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.component_config_desc', '检查基本工资、津贴、扣款等薪资组件配置')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1034** - 关系属性访问

```python
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.calculation_rules', '计算规则有效性')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1035** - 关系属性访问

```python
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.calculation_rules_desc', '确认社保、公积金、个税等计算规则设置正确')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1045** - 关系属性访问

```python
        cardTitle={t('payroll:workflow.steps.data_review.form.payroll_period', '薪资周期选择')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1050** - 关系属性访问

```python
        placeholder={t('payroll:workflow.steps.data_review.form.payroll_period_placeholder', '请选择薪资周期')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1063** - 关系属性访问

```python
          title={t('payroll:workflow.steps.data_review.data_initialization.title', '初始化当前周期薪资数据')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1070** - 关系属性访问

```python
            message={t('payroll:workflow.steps.data_review.data_initialization.no_data_title', '当前薪资周期尚无数据')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1071** - 关系属性访问

```python
            description={t('payroll:workflow.steps.data_review.data_initialization.no_data_message', 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1085** - 关系属性访问

```python
              {t('payroll:workflow.steps.data_review.data_initialization.copy_last_month', '一键复制上月薪资数据')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1093** - 关系属性访问

```python
              {t('payroll:workflow.steps.data_review.data_initialization.bulk_import', '通过批量导入页面导入新数据')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1168** - 关系属性访问

```python
                  <ProTable.Summary.Row>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1169** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={0}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1175** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1176** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={1}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1184** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1185** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={2}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1195** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1196** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={3}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1204** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1205** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={4}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1215** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1216** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={5}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1226** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1227** - 关系属性访问

```python
                    <ProTable.Summary.Cell index={6} colSpan={4}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1235** - 关系属性访问

```python
                    </ProTable.Summary.Cell>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1236** - 关系属性访问

```python
                  </ProTable.Summary.Row>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1246** - 关系属性访问

```python
              label={t('payroll:workflow.steps.data_review.form.review_comments', '审核备注')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1247** - 关系属性访问

```python
              placeholder={t('payroll:workflow.steps.data_review.form.review_comments_placeholder', '请输入审核备注或说明')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1249** - 关系属性访问

```python
              rules={[{ required: true, message: t('payroll:workflow.steps.data_review.form.review_comments_required', '审核备注不能为空')}]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1253** - 关系属性访问

```python
              label={t('payroll:workflow.steps.data_review.form.review_result', '审核结果')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1255** - 关系属性访问

```python
                { label: t('payroll:workflow.steps.data_review.form.review_result_pass', '审核通过'), value: 'pass' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1256** - 关系属性访问

```python
                { label: t('payroll:workflow.steps.data_review.form.review_result_adjust', '需调整 (退回)'), value: 'adjust' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1258** - 关系属性访问

```python
              rules={[{ required: true, message: t('payroll:workflow.steps.data_review.form.review_result_required', '请选择审核结果') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1456** - 关系属性访问

```python
                    ¥{calculatedSummary.grossPay.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1464** - 关系属性访问

```python
                    ¥{calculatedSummary.totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1472** - 关系属性访问

```python
                    ¥{calculatedSummary.netPay.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/components/WorkflowSteps/CalculationResultSummary.tsx

**行 78** - 关系属性访问

```python
            {t('payroll:workflow.steps.auto_calculation.result_summary_title', '计算结果汇总')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 91** - 关系属性访问

```python
                title: t('payroll:workflow.steps.auto_calculation.total_employees', '参与员工数'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 99** - 关系属性访问

```python
                title: t('payroll:workflow.steps.auto_calculation.total_gross_pay', '应发合计总额'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
                title: t('payroll:workflow.steps.auto_calculation.total_deductions', '扣款总额'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
                title: t('payroll:workflow.steps.auto_calculation.total_net_pay', '实发合计总额'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
              <ProCard size="small" title={t('payroll:workflow.steps.auto_calculation.average_stats', '平均薪资统计')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 133** - 关系属性访问

```python
                      title={t('payroll:workflow.steps.auto_calculation.avg_gross_pay', '平均应发')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
                      title={t('payroll:workflow.steps.auto_calculation.avg_net_pay', '平均实发')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 151** - 关系属性访问

```python
              <ProCard size="small" title={t('payroll:workflow.steps.auto_calculation.tax_stats', '税费统计')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 155** - 关系属性访问

```python
                      title={t('payroll:workflow.steps.auto_calculation.total_tax', '个税总额')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 163** - 关系属性访问

```python
                      title={t('payroll:workflow.steps.auto_calculation.deduction_rate', '扣款比例')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 176** - 关系属性访问

```python
            message={t('payroll:workflow.steps.auto_calculation.validation_success', '数据验证通过')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
            description={t('payroll:workflow.steps.auto_calculation.validation_desc', '所有薪资数据已通过完整性检查，可以进入下一步复核流程。')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
                {t('payroll:workflow.steps.auto_calculation.calculation_completed_at', '计算完成时间：')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
                  {t('payroll:workflow.steps.auto_calculation.export_summary', '导出汇总表')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
                  {t('payroll:workflow.steps.auto_calculation.export_detail', '导出明细表')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
                  {t('payroll:workflow.steps.auto_calculation.export_bank', '导出银行文件')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/hooks/usePayrollWorkflowState.ts

**行 103** - 关系属性访问

```python
              message.success(t('payroll:workflow.messages.operation_success', '计算完成！'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
              message.error(t('payroll:workflow.messages.operation_failed', '计算失败：') + progress.error_message);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/hooks/usePayrollWorkflowActions.ts

**行 64** - 关系属性访问

```python
        const activeRuns = runsResponse.data.filter((run: any) => run.status_lookup_value_id !== 5); // 排除已取消的
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 306** - 关系属性访问

```python
      const entries = entriesResponse.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 456** - 关系属性访问

```python
        state.currentPayrollRun.id, 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 461** - 关系属性访问

```python
        state.currentPayrollRun.id, 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/hooks/usePayrollQueries.ts

**行 61** - 关系属性访问

```python
    staleTime: CACHE_CONFIG.PERIODS.staleTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 62** - 关系属性访问

```python
    gcTime: CACHE_CONFIG.PERIODS.gcTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 81** - 关系属性访问

```python
    staleTime: CACHE_CONFIG.RUNS.staleTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 82** - 关系属性访问

```python
    gcTime: CACHE_CONFIG.RUNS.gcTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
    staleTime: CACHE_CONFIG.ENTRIES.staleTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
    gcTime: CACHE_CONFIG.ENTRIES.gcTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
    staleTime: CACHE_CONFIG.COMPONENTS.staleTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
    gcTime: CACHE_CONFIG.COMPONENTS.gcTime,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollEntryPage.tsx

**行 64** - 关系属性访问

```python
    if (category.child_categories && category.child_categories.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 关系属性访问

```python
      title: t('payroll:entries_table.column.employee_id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 97** - 关系属性访问

```python
      title: t('payroll:entries_table.column.employee_name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 118** - 关系属性访问

```python
          firstName = record.employee.first_name || '';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
          lastName = record.employee.last_name || '';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
      title: t('payroll:entries_table.column.department'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
      filters: lookupMaps?.departmentMap ? Array.from(lookupMaps.departmentMap.entries()).map((entry: any) => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
      title: t('payroll:entries_table.column.personnel_category'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 156** - 关系属性访问

```python
      title: t('payroll:entries_table.column.gross_pay'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 167** - 关系属性访问

```python
      title: t('payroll:entries_table.column.total_deductions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 关系属性访问

```python
      title: t('payroll:entries_table.column.net_pay'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
      title: t('payroll:entries_table.column.status'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 209** - 关系属性访问

```python
      title: t('payroll:entries_table.column.actions'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 305** - 关系属性访问

```python
        response.data.slice(0, 3).forEach((entry, index) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 355** - 关系属性访问

```python
    message.success(t('payroll:entry_page.message.operation_success'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 454** - 关系属性访问

```python
          addButtonTextKey="payroll:entry_page.button.add_entry"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 468** - 关系属性访问

```python
            titleKey: 'payroll:entry_page.delete_confirm.title',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 469** - 关系属性访问

```python
            contentKey: 'payroll:entry_page.delete_confirm.content',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 470** - 关系属性访问

```python
            okTextKey: 'payroll:entry_page.delete_confirm.ok_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 471** - 关系属性访问

```python
            cancelTextKey: 'payroll:entry_page.delete_confirm.cancel_text',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 472** - 关系属性访问

```python
            successMessageKey: 'payroll:entry_page.message.delete_success',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 473** - 关系属性访问

```python
            errorMessageKey: 'payroll:entry_page.message.delete_failed',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 481** - 关系属性访问

```python
          lookupErrorMessageKey="payroll:entry_page.message.load_aux_data_failed"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollComponentsPage.tsx

**行 40** - 关系属性访问

```python
      response.data.forEach((type: any) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - 关系属性访问

```python
      messageApi.error(t('common.error.fetch'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 332** - 关系属性访问

```python
          errorMessage = errorDetail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 336** - 关系属性访问

```python
          const errorText = JSON.stringify(error.response.data).toLowerCase();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 372** - 关系属性访问

```python
              rules={[{ required: true, message: t('common.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 381** - 关系属性访问

```python
              rules={[{ required: true, message: t('common.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 393** - 关系属性访问

```python
              rules={[{ required: true, message: t('common.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 413** - 关系属性访问

```python
              rules={[{ required: true, message: t('common.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 425** - 关系属性访问

```python
              rules={[{ required: true, message: t('common.validation.required') }]}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 544** - 关系属性访问

```python
          t('common.button.close')
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 839** - 关系属性访问

```python
          errorMessageKey: 'common.error.delete',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 862** - 关系属性访问

```python
        lookupErrorMessageKey="common.error.fetch"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 864** - 关系属性访问

```python
        lookupDataErrorMessageKey="common.error.loadData"
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage.tsx

**行 28** - 关系属性访问

```python
import styles from './PayrollBulkImportPage.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
// const IS_PRODUCTION = process.env.NODE_ENV === 'production';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 147** - 关系属性访问

```python
      { key: 'employee_code', label: t('batch_import.fields.employee_code'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
      { key: 'employee_full_name', label: t('batch_import.fields.employee_full_name'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
      { key: 'id_number', label: t('batch_import.fields.id_number'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 150** - 关系属性访问

```python
      { key: 'gross_pay', label: t('batch_import.fields.gross_pay'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 151** - 关系属性访问

```python
      { key: 'total_deductions', label: t('batch_import.fields.total_deductions'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 152** - 关系属性访问

```python
      { key: 'net_pay', label: t('batch_import.fields.net_pay'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 153** - 关系属性访问

```python
      { key: 'remarks', label: t('batch_import.fields.remarks'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 182** - 关系属性访问

```python
      [t('batch_import.mapping.serial_number')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
      // t('batch_import.mapping.personnel_identity'): '__IGNORE_FIELD__', // 保留这个给下面更具体的映射
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_level')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 185** - 关系属性访问

```python
      [t('batch_import.mapping.salary_unified')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 186** - 关系属性访问

```python
      [t('batch_import.mapping.fiscal_support')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
      [t('batch_import.mapping.department')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 188** - 关系属性访问

```python
      [t('batch_import.mapping.department_name')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 191** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_identity')]: 'raw_personnel_identity',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 195** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_number')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 196** - 关系属性访问

```python
      [t('batch_import.mapping.employee_id')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 197** - 关系属性访问

```python
      [t('batch_import.mapping.employee_number')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 198** - 关系属性访问

```python
      [t('batch_import.mapping.work_number')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_name')]: 'employee_full_name',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
      [t('batch_import.mapping.name')]: 'employee_full_name',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 201** - 关系属性访问

```python
      [t('batch_import.mapping.employee_name')]: 'employee_full_name',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 202** - 关系属性访问

```python
      [t('batch_import.mapping.id_card')]: 'id_number',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 203** - 关系属性访问

```python
      [t('batch_import.mapping.id_number')]: 'id_number',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 204** - 关系属性访问

```python
      [t('batch_import.mapping.id_card_number')]: 'id_number',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 207** - 关系属性访问

```python
      [t('batch_import.mapping.gross_salary')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 208** - 关系属性访问

```python
      [t('batch_import.mapping.total_income')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 209** - 关系属性访问

```python
      [t('batch_import.mapping.salary_total')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 210** - 关系属性访问

```python
      [t('batch_import.mapping.total_earnings')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
      [t('batch_import.mapping.gross_total')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 212** - 关系属性访问

```python
      [t('batch_import.mapping.net_salary')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 213** - 关系属性访问

```python
      [t('batch_import.mapping.net_pay')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 214** - 关系属性访问

```python
      [t('batch_import.mapping.actual_amount')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 215** - 关系属性访问

```python
      [t('batch_import.mapping.net_total')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 216** - 关系属性访问

```python
      [t('batch_import.mapping.deduction_total')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 217** - 关系属性访问

```python
      [t('batch_import.mapping.total_deductions')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 218** - 关系属性访问

```python
      [t('batch_import.mapping.deduction_amount')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 219** - 关系属性访问

```python
      [t('batch_import.mapping.total_deduction_amount')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
      [t('batch_import.mapping.should_deduct_total')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 223** - 关系属性访问

```python
      [t('batch_import.mapping.remarks')]: 'remarks',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 224** - 关系属性访问

```python
      [t('batch_import.mapping.description')]: 'remarks',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 246** - 关系属性访问

```python
      [t('components.earnings.position_tech_grade_salary')]: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 247** - 关系属性访问

```python
      [t('payroll:auto____e8818c')]: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 248** - 关系属性访问

```python
      [t('payroll:auto___e8818c')]: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 250** - 关系属性访问

```python
      [t('components.earnings.grade_position_level_salary')]: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 251** - 关系属性访问

```python
      [t('payroll:auto____e7baa7')]: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 252** - 关系属性访问

```python
      [t('payroll:auto___e7baa7')]: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 253** - 关系属性访问

```python
      [t('components.earnings.grade_salary')]: 'earnings_details.GRADE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 254** - 关系属性访问

```python
      [t('payroll:auto_text_e7baa7')]: 'earnings_details.GRADE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 255** - 关系属性访问

```python
      [t('components.earnings.position_salary_general')]: 'earnings_details.POSITION_SALARY_GENERAL.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 256** - 关系属性访问

```python
      [t('payroll:auto_text_e5b297')]: 'earnings_details.POSITION_SALARY_GENERAL.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
      [t('components.earnings.staff_salary_grade')]: 'earnings_details.STAFF_SALARY_GRADE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
      [t('payroll:auto_text_e896aa')]: 'earnings_details.STAFF_SALARY_GRADE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 260** - 关系属性访问

```python
      [t('components.earnings.basic_salary')]: 'earnings_details.BASIC_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 261** - 关系属性访问

```python
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 264** - 关系属性访问

```python
      [t('components.earnings.basic_performance_award')]: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 265** - 关系属性访问

```python
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 266** - 关系属性访问

```python
      [t('components.earnings.basic_performance_salary')]: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 267** - 关系属性访问

```python
      [t('payroll:auto_text_e69c88')]: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 268** - 关系属性访问

```python
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 269** - 关系属性访问

```python
      [t('components.earnings.performance_bonus')]: 'earnings_details.PERFORMANCE_BONUS.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 270** - 关系属性访问

```python
      [t('payroll:auto_text_e69c88')]: 'earnings_details.PERFORMANCE_BONUS.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 271** - 关系属性访问

```python
      [t('payroll:auto_text_e5a596')]: 'earnings_details.PERFORMANCE_BONUS.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 272** - 关系属性访问

```python
      [t('payroll:auto_text_e5a596')]: 'earnings_details.PERFORMANCE_BONUS.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 273** - 关系属性访问

```python
      [t('payroll:auto_text_e7bba9')]: 'earnings_details.PERFORMANCE_BONUS.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 276** - 关系属性访问

```python
      [t('components.earnings.reform_allowance_1993')]: 'earnings_details.REFORM_ALLOWANCE_1993.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 277** - 关系属性访问

```python
      [t('payroll:auto_93_3933e5')]: 'earnings_details.REFORM_ALLOWANCE_1993.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 278** - 关系属性访问

```python
      [t('payroll:auto_text_e4b99d')]: 'earnings_details.REFORM_ALLOWANCE_1993.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 279** - 关系属性访问

```python
      [t('components.earnings.only_child_parent_bonus')]: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 280** - 关系属性访问

```python
      [t('payroll:auto_text_e78bac')]: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 281** - 关系属性访问

```python
      [t('components.earnings.civil_standard_allowance')]: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 282** - 关系属性访问

```python
      [t('payroll:auto_text_e585ac')]: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 283** - 关系属性访问

```python
      [t('payroll:auto_text_e585ac')]: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 284** - 关系属性访问

```python
      [t('components.earnings.traffic_allowance')]: 'earnings_details.TRAFFIC_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 285** - 关系属性访问

```python
      [t('payroll:auto_text_e585ac')]: 'earnings_details.TRAFFIC_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 286** - 关系属性访问

```python
      [t('components.earnings.position_allowance')]: 'earnings_details.POSITION_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 287** - 关系属性访问

```python
      [t('payroll:auto_text_e5b297')]: 'earnings_details.POSITION_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 288** - 关系属性访问

```python
      [t('components.earnings.petition_allowance')]: 'earnings_details.PETITION_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 289** - 关系属性访问

```python
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 290** - 关系属性访问

```python
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 291** - 关系属性访问

```python
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 292** - 关系属性访问

```python
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 293** - 关系属性访问

```python
      [t('components.earnings.township_allowance')]: 'earnings_details.TOWNSHIP_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 294** - 关系属性访问

```python
      [t('payroll:auto_text_e4b9a1')]: 'earnings_details.TOWNSHIP_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 297** - 关系属性访问

```python
      [t('components.earnings.back_pay')]: 'earnings_details.BACK_PAY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 298** - 关系属性访问

```python
      [t('payroll:auto_text_e8a1a5')]: 'earnings_details.BACK_PAY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 301** - 关系属性访问

```python
      [t('components.earnings.probation_salary')]: 'earnings_details.PROBATION_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 302** - 关系属性访问

```python
      [t('payroll:auto_text_e8a781')]: 'earnings_details.PROBATION_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 303** - 关系属性访问

```python
      [t('payroll:auto_text_e8af95')]: 'earnings_details.PROBATION_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 306** - 关系属性访问

```python
      [t('components.deductions.pension_personal_amount')]: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 307** - 关系属性访问

```python
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 308** - 关系属性访问

```python
      [t('components.deductions.medical_ins_personal_amount')]: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 309** - 关系属性访问

```python
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 310** - 关系属性访问

```python
      [t('components.deductions.occupational_pension_personal_amount')]: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 311** - 关系属性访问

```python
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 312** - 关系属性访问

```python
      [t('components.deductions.unemployment_personal_amount')]: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 313** - 关系属性访问

```python
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 314** - 关系属性访问

```python
      [t('components.deductions.housing_fund_personal')]: 'deductions_details.HOUSING_FUND_PERSONAL.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 315** - 关系属性访问

```python
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.HOUSING_FUND_PERSONAL.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 316** - 关系属性访问

```python
      [t('payroll:auto_text_e8a1a5')]: 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount', // 社保补扣专用字段
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 319** - 关系属性访问

```python
      [t('components.deductions.personal_income_tax')]: 'deductions_details.PERSONAL_INCOME_TAX.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 320** - 关系属性访问

```python
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.PERSONAL_INCOME_TAX.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 324** - 关系属性访问

```python
      [t('payroll:auto_text_e7bba9')]: 'earnings_details.PERFORMANCE_SALARY.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 325** - 关系属性访问

```python
      [t('payroll:auto_text_e8a1a5')]: 'earnings_details.ALLOWANCE_GENERAL.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 326** - 关系属性访问

```python
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_PERFORMANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 327** - 关系属性访问

```python
      [t('payroll:auto_text_e6b4a5')]: 'earnings_details.GENERAL_ALLOWANCE.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 328** - 关系属性访问

```python
      [t('payroll:auto_text_e5ada3')]: 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 331** - 关系属性访问

```python
      [t('payroll:auto_text_e4b880')]: 'deductions_details.ONE_TIME_DEDUCTION_ADJUSTMENT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 332** - 关系属性访问

```python
      [t('payroll:auto_text_e7bba9')]: 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 333** - 关系属性访问

```python
      [t('payroll:auto_text_e5a596')]: 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 334** - 关系属性访问

```python
      [t('payroll:auto____e8a1a5')]: 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 335** - 关系属性访问

```python
      [t('payroll:auto_2022_e8a1a5')]: 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 338** - 关系属性访问

```python
      [t('payroll:auto_text_e59bba')]: 'earnings_details.ANNUAL_FIXED_SALARY_TOTAL.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 339** - 关系属性访问

```python
      [t('payroll:auto_1_31e5ad')]: 'earnings_details.QUARTERLY_PERFORMANCE_Q1.amount',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 381** - 关系属性访问

```python
        if (response.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 382** - 关系属性访问

```python
          if (response.meta && response.meta.total > response.data.length) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 409** - 关系属性访问

```python
      if (textAreaRef.current.resizableTextArea && textAreaRef.current.resizableTextArea.textArea) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 410** - 关系属性访问

```python
        textAreaRef.current.resizableTextArea.textArea.focus();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 411** - 关系属性访问

```python
      } else if (typeof textAreaRef.current.focus === 'function') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 412** - 关系属性访问

```python
        textAreaRef.current.focus();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 418** - 关系属性访问

```python
    setJsonInput(e.target.value);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 440** - 关系属性访问

```python
      message.info(t('batch_import.message.use_table_converter_first'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 446** - 关系属性访问

```python
      setParseError(t('batch_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 454** - 关系属性访问

```python
        setParseError(t('batch_import.validation.json_not_array'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 459** - 关系属性访问

```python
        setParseError(t('batch_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 482** - 关系属性访问

```python
      message.success(t('batch_import.message.file_parsed_success', { count: totalRecords }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 484** - 关系属性访问

```python
      setParseError(t('batch_import.message.file_parse_error') + ': ' + (error instanceof Error ? error.message : String(error)));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 490** - 关系属性访问

```python
      message.error(t('batch_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 495** - 关系属性访问

```python
      message.error(t('batch_import.validation.period_required'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 508** - 关系属性访问

```python
    const validRecords = parsedData.filter(record => !record.validationErrors || record.validationErrors.length === 0);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 511** - 关系属性访问

```python
      message.error(t('batch_import.validation.no_valid_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 579** - 关系属性访问

```python
      if (result?.errors && result.errors.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 580** - 关系属性访问

```python
        result.errors.forEach((err: any, index: number) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 619** - 关系属性访问

```python
      message.success(t('batch_import.message.upload_success', { count: result.success_count }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 622** - 关系属性访问

```python
        message.warning(t('batch_import.message.upload_partial_success', { 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 644** - 关系属性访问

```python
        if (typeof error.response.data.detail === 'string') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 645** - 关系属性访问

```python
          extractedErrorMessage = error.response.data.detail;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 646** - 关系属性访问

```python
          detailedErrorMessage = error.response.data.detail;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 647** - 关系属性访问

```python
        } else if (Array.isArray(error.response.data.detail) && error.response.data.detail.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 648** - 关系属性访问

```python
          extractedErrorMessage = `${t('batch_import.message.upload_failed_with_errors', { count: error.response.data.detail.length })}`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 649** - 关系属性访问

```python
          detailedErrorMessage = error.response.data.detail
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 652** - 关系属性访问

```python
        } else if (typeof error.response.data.detail === 'object') {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 653** - 关系属性访问

```python
          extractedErrorMessage = error.response.data.detail.msg || t('batch_import.message.upload_failed_with_details');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 654** - 关系属性访问

```python
          detailedErrorMessage = JSON.stringify(error.response.data.detail, null, 2);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 656** - 关系属性访问

```python
          extractedErrorMessage = t('batch_import.message.upload_failed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 657** - 关系属性访问

```python
          detailedErrorMessage = JSON.stringify(error.response.data.detail);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 683** - 关系属性访问

```python
        message.error(`${t('batch_import.message.upload_failed_prefix')} ${extractedErrorMessage}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 726** - 关系属性访问

```python
      { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 727** - 关系属性访问

```python
      { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 728** - 关系属性访问

```python
      { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 729** - 关系属性访问

```python
      { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 730** - 关系属性访问

```python
      { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrency(text) }, // Use imported formatCurrency
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 731** - 关系属性访问

```python
      { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrency(text) }, // Use imported formatCurrency
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 732** - 关系属性访问

```python
      { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrency(text) }, // Use imported formatCurrency
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 733** - 关系属性访问

```python
      { title: t('batch_import.table_header.status'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 734** - 关系属性访问

```python
      { title: t('batch_import.table_header.remarks'), dataIndex: 'remarks', key: 'remarks', width: 200, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 736** - 关系属性访问

```python
        title: t('batch_import.table_header.validation_errors'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 746** - 关系属性访问

```python
    { title: t('batch_import.results_table.employee_id'), dataIndex: ['record', 'employee_id'], key: 'employee_id', render: (text: any, item:any) => item.record?.employee_id || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 747** - 关系属性访问

```python
    { title: t('batch_import.results_table.employee_name'), dataIndex: ['record', 'employee_name'], key: 'employee_name', render: (text: any, item:any) => item.record?.employee_name || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 749** - 关系属性访问

```python
      title: t('batch_import.results_table.error_message'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 794** - 关系属性访问

```python
      title = t('batch_import.results.all_success', { count: uploadResult.successCount });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 797** - 关系属性访问

```python
      title = t('batch_import.results.partial_success', { success: uploadResult.successCount, error: uploadResult.errorCount });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 802** - 关系属性访问

```python
      title = t('payroll:batch_import.results.all_failed_at_server', { count: uploadResult.errorCount });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 805** - 关系属性访问

```python
      title = t('batch_import.results.no_records_processed_at_server');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 820** - 关系属性访问

```python
            {t('batch_import.button.import_another_file')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 824** - 关系属性访问

```python
        {uploadResult.errors.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 827** - 关系属性访问

```python
            {uploadResult.errors.some(err => 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 855** - 关系属性访问

```python
                    {t('batch_import.button.re_import')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 867** - 关系属性访问

```python
                ? t('batch_import.button.hide_error_details') : t('batch_import.button.show_error_details')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 872** - 关系属性访问

```python
                <Title level={5}>{t('batch_import.results_table.title_failed_records')}</Title>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 887** - 关系属性访问

```python
        {uploadResult.createdEntries && uploadResult.createdEntries.length > 0 && showDetailedErrors && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 889** - 关系属性访问

```python
            <Title level={5}>{t('batch_import.results_table.title_successfully_imported_records_preview')}</Title>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 891** - 关系属性访问

```python
              dataSource={uploadResult.createdEntries.slice(0, 100)} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 914** - 关系属性访问

```python
        message.success(t('batch_import.message.table_converted_success', { count: jsonData.length }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 935** - 关系属性访问

```python
            {t('batch_import.button.back_to_entries')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 942** - 关系属性访问

```python
          <Step title={t('batch_import.steps.input_data')} icon={<FileTextOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 943** - 关系属性访问

```python
          <Step title={t('batch_import.steps.preview_data')} icon={<PlaySquareOutlined />} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 944** - 关系属性访问

```python
          <Step title={t('batch_import.steps.upload_progress')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 945** - 关系属性访问

```python
          <Step title={t('batch_import.steps.results')} />
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 977** - 关系属性访问

```python
                    label: <><TableOutlined /> {t('batch_import.tab.table_input')}</>,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 991** - 关系属性访问

```python
                            message.success(t('batch_import.message.table_converted_success', { count: jsonData.length }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 999** - 关系属性访问

```python
                    label: <><FileTextOutlined /> {t('batch_import.tab.json_input')}</>,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1007** - 关系属性访问

```python
                          placeholder={t('batch_import.placeholder.enter_json')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1018** - 关系属性访问

```python
                            {t('batch_import.button.parse_and_preview')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1024** - 关系属性访问

```python
                            <Tooltip title={t('batch_import.help.overwrite_mode')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1026** - 关系属性访问

```python
                                label={t('batch_import.options.overwrite_mode')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1038** - 关系属性访问

```python
                            <Tooltip title={t('batch_import.help.validation_mode_tooltip')}> 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1040** - 关系属性访问

```python
                                label={t('batch_import.options.validation_mode_label')} 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1063** - 关系属性访问

```python
            <Card title={t('batch_import.card_title.preview_data_count', { count: parsedData.length })}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1077** - 关系属性访问

```python
              <p>{t('batch_import.notes.preview_warning_max_100')}</p>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1088** - 关系属性访问

```python
                  return record.validationErrors && record.validationErrors.length > 0 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 1111** - 关系属性访问

```python
            <p style={{ marginTop: 16 }}>{t('batch_import.message.upload_in_progress')}</p>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PerformanceTestPage.tsx

**行 180** - 关系属性访问

```python
    document.body.appendChild(a);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 182** - 关系属性访问

```python
    document.body.removeChild(a);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 222** - 关系属性访问

```python
        return `${record.comparison.originalApi.duration.toFixed(2)}ms`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 231** - 关系属性访问

```python
        return `${record.comparison.viewApi.duration.toFixed(2)}ms`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 246** - 关系属性访问

```python
              {improvement.percentageImprovement.toFixed(1)}%
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 250** - 关系属性访问

```python
              {improvement.durationImprovement.toFixed(2)}ms)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 262** - 关系属性访问

```python
        const originalSize = record.comparison.originalApi.recordCount || 0;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 263** - 关系属性访问

```python
        const viewSize = record.comparison.viewApi.recordCount || 0;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 428** - 关系属性访问

```python
              message = `🚀 ${result.testName}: 视图API性能提升显著 (${improvement.percentageImprovement.toFixed(1)}%)，建议优先使用`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 431** - 关系属性访问

```python
              message = `✅ ${result.testName}: 视图API性能略有提升 (${improvement.percentageImprovement.toFixed(1)}%)，可以安全切换`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 434** - 关系属性访问

```python
              message = `⚠️ ${result.testName}: 性能差异较小 (${improvement.percentageImprovement.toFixed(1)}%)，需要进一步优化`;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollPeriodDetailPage.tsx

**行 63** - 关系属性访问

```python
          throw new Error(error.response.data.detail.error.details);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 125** - 关系属性访问

```python
        message.error(`获取薪资条目失败：${error.response.data.detail.error.details}`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 152** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 157** - 关系属性访问

```python
        const details = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
        const details = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/CalculationLogsPage.tsx

**行 85** - 关系属性访问

```python
      params.append('page', pagination.current.toString());
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
      params.append('size', pagination.pageSize.toString());
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 关系属性访问

```python
        params.append('payroll_run_id', filters.payroll_run_id.toString());
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 92** - 关系属性访问

```python
        params.append('employee_id', filters.employee_id.toString());
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
      setLogs(response.data.data);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
        total: response.data.meta.total,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 329** - 关系属性访问

```python
                onChange={(e) => handleFilterChange('payroll_run_id', e.target.value ? parseInt(e.target.value) : undefined)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 337** - 关系属性访问

```python
                onChange={(e) => handleFilterChange('employee_id', e.target.value ? parseInt(e.target.value) : undefined)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 345** - 关系属性访问

```python
                onChange={(e) => handleFilterChange('component_code', e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollRunsPage.tsx

**行 233** - 关系属性访问

```python
            errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 235** - 关系属性访问

```python
            errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 288** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 290** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 314** - 关系属性访问

```python
            errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 316** - 关系属性访问

```python
            errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 330** - 关系属性访问

```python
      const url = window.URL.createObjectURL(new Blob([response]));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 334** - 关系属性访问

```python
      document.body.appendChild(link);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 343** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 345** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 358** - 关系属性访问

```python
        run_date: values.run_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 378** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 380** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollPeriodsPageV2.tsx

**行 59** - 关系属性访问

```python
      title: t('payroll_periods_page.table.column_id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 68** - 关系属性访问

```python
      title: t('payroll_periods_page.table.column_period_name'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
      title: t('payroll_periods_page.table.column_frequency'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 关系属性访问

```python
          return [...(lookupMaps.payFrequencyMap.entries() || [])]
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 101** - 关系属性访问

```python
      title: t('payroll_periods_page.table.column_start_date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
      title: t('payroll_periods_page.table.column_end_date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 121** - 关系属性访问

```python
      title: t('payroll_periods_page.table.column_pay_date'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 关系属性访问

```python
      title: t('payroll_periods_page.table.column_status'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
        if (status.name.includes(t('payroll_periods:payroll_period_status.closed')) || status.name.includes(t('payroll_periods:payroll_period_status.closed'))) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
        } else if (status.name.includes(t('payroll_periods:payroll_period_status.open')) || status.name.includes(t('payroll_periods:payroll_period_status.planned'))) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 167** - 关系属性访问

```python
            <Tooltip title={t('payroll_periods:table.tooltip.employee_count_has_data')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 关系属性访问

```python
            <Tooltip title={t('payroll_periods:table.tooltip.employee_count_no_data')}>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 181** - 关系属性访问

```python
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{t('payroll_periods:table.status.no_data')}</span>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 350** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 353** - 关系属性访问

```python
        errorMessage = error.response.data.detail.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollRunsPageV2.tsx

**行 229** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 231** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 303** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 305** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 329** - 关系属性访问

```python
            errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 331** - 关系属性访问

```python
            errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 345** - 关系属性访问

```python
      const url = window.URL.createObjectURL(new Blob([response]));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 349** - 关系属性访问

```python
      document.body.appendChild(link);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 358** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 360** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 372** - 关系属性访问

```python
        run_date: values.run_date.format('YYYY-MM-DD'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 392** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.details;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 394** - 关系属性访问

```python
        errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollRunDetailPage.tsx

**行 77** - 关系属性访问

```python
    const periodName = run.payroll_period?.name || t('payroll_runs:run_detail_page.value.period_id_prefix');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
              `${runDetails.payroll_period.name} (${t('payroll_runs:payroll_run_detail_page.value_period_id_prefix')}${runDetails.payroll_period_id})` : 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/dataProcessing.ts

**行 39** - 关系属性访问

```python
    if (record.earnings_details.PERFORMANCE_BONUS) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 50** - 关系属性访问

```python
    const fullName = record.employee_full_name.trim();
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 256** - 关系属性访问

```python
  if (!record.employee_full_name && !record.employee_name) errors.push(t('batch_import.validation.employee_name_required', { record: recordDescription }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 257** - 关系属性访问

```python
  if (!record.id_number) errors.push(t('batch_import.validation.id_number_required', { record: recordDescription }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
    errors.push(t('batch_import.validation.gross_pay_invalid', { record: recordDescription }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 262** - 关系属性访问

```python
    errors.push(t('batch_import.validation.total_deductions_invalid', { record: recordDescription }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 265** - 关系属性访问

```python
    errors.push(t('batch_import.validation.net_pay_invalid', { record: recordDescription }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 273** - 关系属性访问

```python
      t('batch_import.validation.balance_mismatch', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 289** - 关系属性访问

```python
    // errors.push(t('batch_import.validation.unknown_personnel_type', { record: recordDescription }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 293** - 关系属性访问

```python
  if (!record.employee_info || !record.employee_info.id_number || (!record.employee_info.last_name && !record.employee_info.first_name)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 295** - 关系属性访问

```python
    // errors.push(t('batch_import.validation.missing_employee_match_info', { record: recordDescription }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/DynamicTable.tsx

**行 25** - 关系属性访问

```python
      { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 26** - 关系属性访问

```python
      { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 27** - 关系属性访问

```python
      { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 28** - 关系属性访问

```python
      { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
      { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrency(text) },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 66** - 关系属性访问

```python
      { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrency(text) },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 67** - 关系属性访问

```python
      { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrency(text) },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 71** - 关系属性访问

```python
      { title: t('batch_import.table_header.status'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
      { title: t('batch_import.table_header.remarks'), dataIndex: 'remarks', key: 'remarks', width: 200, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
        title: t('batch_import.table_header.validation_errors'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 92** - 关系属性访问

```python
      rowClassName={record => record.validationErrors && record.validationErrors.length > 0 ? 'invalidRow' : ''}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/test_regex.js

**行 49** - 关系属性访问

```python
  if (SALARY_PATTERNS.positionTechGradeSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
  } else if (SALARY_PATTERNS.gradePositionLevelSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 55** - 关系属性访问

```python
  } else if (SALARY_PATTERNS.monthlyPerformanceBonus.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
  } else if (SALARY_PATTERNS.basicSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
  } else if (SALARY_PATTERNS.gradeSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
  } else if (REGEX_PATTERNS.civilStandardAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 67** - 关系属性访问

```python
  } else if (REGEX_PATTERNS.positionAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - 关系属性访问

```python
  } else if (REGEX_PATTERNS.petitionAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
  } else if (REGEX_PATTERNS.onlyChildBonus.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 76** - 关系属性访问

```python
  } else if (REGEX_PATTERNS.reformAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 79** - 关系属性访问

```python
  } else if (REGEX_PATTERNS.allowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/ResultPanel.tsx

**行 18** - 关系属性访问

```python
    title = t('batch_import.results.all_success', { count: uploadResult.successCount });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 21** - 关系属性访问

```python
    title = t('batch_import.results.partial_success', { success: uploadResult.successCount, error: uploadResult.errorCount });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 24** - 关系属性访问

```python
    title = t('batch_import.results.all_failed', { count: uploadResult.errorCount });
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 27** - 关系属性访问

```python
    title = t('batch_import.results.no_records_processed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 39** - 关系属性访问

```python
      {uploadResult.errors.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 42** - 关系属性访问

```python
            {showDetailedErrors ?      t('batch_import.button.hide_error_details'): t('batch_import.button.show_error_details')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 60** - 关系属性访问

```python
      {uploadResult.createdEntries && uploadResult.createdEntries.length > 0 && showDetailedErrors && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
            dataSource={uploadResult.createdEntries.slice(0, 100)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/constants.ts

**行 2** - 关系属性访问

```python
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/payrollPageUtils.tsx

**行 40** - 关系属性访问

```python
    { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 41** - 关系属性访问

```python
    { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 42** - 关系属性访问

```python
    { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 43** - 关系属性访问

```python
    { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
    { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrency(text) },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 76** - 关系属性访问

```python
    { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrency(text) },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
    { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrency(text) },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 81** - 关系属性访问

```python
    { title: t('batch_import.table_header.status'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 82** - 关系属性访问

```python
    { title: t('batch_import.table_header.remarks'), dataIndex: 'remarks', key: 'remarks', width: 200, render: (text: any) => text || '-' },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 84** - 关系属性访问

```python
      title: t('batch_import.table_header.validation_errors'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/types/constants.tsx

**行 49** - 关系属性访问

```python
  'earnings_details.BASIC_SALARY.amount': '基本工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 50** - 关系属性访问

```python
  'earnings_details.POSITION_SALARY_GENERAL.amount': '岗位工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
  'earnings_details.GRADE_SALARY.amount': '级别工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
  'earnings_details.SALARY_GRADE.amount': '薪级工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
  'earnings_details.PERFORMANCE_SALARY.amount': '绩效工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 54** - 关系属性访问

```python
  'earnings_details.PERFORMANCE_BONUS.amount': '奖励性绩效工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 55** - 关系属性访问

```python
  'earnings_details.BASIC_PERFORMANCE_SALARY.amount': '基础性绩效工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 56** - 关系属性访问

```python
  'earnings_details.BASIC_PERFORMANCE.amount': '基础绩效',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 57** - 关系属性访问

```python
  'earnings_details.BASIC_PERFORMANCE_AWARD.amount': '基础绩效奖',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
  'earnings_details.GENERAL_ALLOWANCE.amount': '津贴',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 59** - 关系属性访问

```python
  'earnings_details.ALLOWANCE_GENERAL.amount': '补助',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 60** - 关系属性访问

```python
  'earnings_details.TRAFFIC_ALLOWANCE.amount': '公务交通补贴',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
  'earnings_details.TOWNSHIP_ALLOWANCE.amount': '乡镇工作补贴',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 62** - 关系属性访问

```python
  'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount': '公务员规范后津补贴',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
  'earnings_details.POSITION_ALLOWANCE.amount': '岗位职务补贴',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
  'earnings_details.PETITION_ALLOWANCE.amount': '信访工作人员岗位工作津贴',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
  'earnings_details.ONLY_CHILD_PARENT_BONUS.amount': '独生子女父母奖励金',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 66** - 关系属性访问

```python
  'earnings_details.REFORM_ALLOWANCE_1993.amount': '九三年工改保留津补贴',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 67** - 关系属性访问

```python
  'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount': '季度绩效考核薪酬',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 68** - 关系属性访问

```python
  'earnings_details.PROBATION_SALARY.amount': '试用期工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
  'earnings_details.BACK_PAY.amount': '补发工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - 关系属性访问

```python
  'earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount': '奖励绩效补发',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 71** - 关系属性访问

```python
  'earnings_details.POSITION_TECH_GRADE_SALARY.amount': '职务/技术等级工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
  'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount': '级别/岗位级别工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
  'earnings_details.MONTHLY_PERFORMANCE_BONUS.amount': '月奖励绩效',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
  'earnings_details.STAFF_SALARY_GRADE.amount': '事业单位人员薪级工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
  'deductions_details.PERSONAL_INCOME_TAX.amount': '个人所得税',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 78** - 关系属性访问

```python
  'deductions_details.HOUSING_FUND_PERSONAL.amount': '个人缴住房公积金',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 79** - 关系属性访问

```python
  'deductions_details.PENSION_PERSONAL_AMOUNT.amount': '养老保险个人应缴金额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
  'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount': '医疗保险个人缴纳金额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 81** - 关系属性访问

```python
  'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount': '失业个人应缴金额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 82** - 关系属性访问

```python
  'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount': '职业年金个人应缴费额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
  'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount': '补扣（退）款',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 84** - 关系属性访问

```python
  'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount': '补扣社保',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
  'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount': '补扣2022年医保款',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
  'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount': '绩效奖金补扣发',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 87** - 关系属性访问

```python
  'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount': '奖励绩效补扣发',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
  'deductions_details.ONE_TIME_ADJUSTMENT.amount': '一次性补扣发',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 91** - 关系属性访问

```python
  'employer_deductions.HOUSING_FUND_EMPLOYER.amount': '单位缴住房公积金',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 92** - 关系属性访问

```python
  'employer_deductions.PENSION_EMPLOYER_AMOUNT.amount': '养老保险单位应缴金额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 93** - 关系属性访问

```python
  'employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount': '医疗保险单位缴纳金额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 94** - 关系属性访问

```python
  'employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount': '失业单位应缴金额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
  'employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount': '职业年金单位应缴费额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 关系属性访问

```python
  'employer_deductions.INJURY_EMPLOYER_AMOUNT.amount': '工伤单位应缴金额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 97** - 关系属性访问

```python
  'employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount': '大病医疗单位缴纳',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 100** - 关系属性访问

```python
  'calculation_results.TAXABLE_INCOME.amount': '应纳税所得额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 101** - 关系属性访问

```python
  'calculation_results.TAX_DEDUCTION_AMOUNT.amount': '扣除额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
  'calculation_results.TAX_EXEMPT_AMOUNT.amount': '免税额',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 103** - 关系属性访问

```python
  'calculation_results.QUICK_DEDUCTION.amount': '速算扣除数',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
  'calculation_results.AFTER_TAX_SALARY.amount': '税后工资',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 107** - 关系属性访问

```python
  'stats.ANNUAL_FIXED_SALARY_TOTAL.amount': '固定薪酬全年应发数',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
  'stats.QUARTERLY_PERFORMANCE_Q1.amount': '1季度绩效考核薪酬',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 关系属性访问

```python
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/utils/fileProcessing.ts

**行 39** - 关系属性访问

```python
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/utils/fieldMapping.ts

**行 62** - 关系属性访问

```python
    if (REGEX_PATTERNS.employeeName.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
    if (REGEX_PATTERNS.employeeCode.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 68** - 关系属性访问

```python
    if (REGEX_PATTERNS.department.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 71** - 关系属性访问

```python
    if (REGEX_PATTERNS.idNumber.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
    if (REGEX_PATTERNS.rowNumber.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 79** - 关系属性访问

```python
    if (REGEX_PATTERNS.basicSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 80** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.BASIC_SALARY.amount', confidence: 0.98, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 82** - 关系属性访问

```python
    if (REGEX_PATTERNS.positionSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 83** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.POSITION_SALARY_GENERAL.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 85** - 关系属性访问

```python
    if (REGEX_PATTERNS.gradeSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 86** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.GRADE_SALARY.amount', confidence: 0.92, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
    if (REGEX_PATTERNS.salaryGrade.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.SALARY_GRADE.amount', confidence: 0.90, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 91** - 关系属性访问

```python
    if (REGEX_PATTERNS.performanceSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 92** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 94** - 关系属性访问

```python
    if (REGEX_PATTERNS.performanceBonus.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.85, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 99** - 关系属性访问

```python
    if (REGEX_PATTERNS.positionTechGradeSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 100** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
    if (REGEX_PATTERNS.gradePositionLevelSalary.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 103** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
    if (REGEX_PATTERNS.monthlyPerformanceBonus.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 106** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.MONTHLY_PERFORMANCE_BONUS.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 110** - 关系属性访问

```python
    if (REGEX_PATTERNS.civilStandardAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount', confidence: 0.98, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
    if (REGEX_PATTERNS.positionAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.POSITION_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 116** - 关系属性访问

```python
    if (REGEX_PATTERNS.petitionAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PETITION_ALLOWANCE.amount', confidence: 0.98, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 119** - 关系属性访问

```python
    if (REGEX_PATTERNS.onlyChildBonus.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 120** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount', confidence: 0.98, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 122** - 关系属性访问

```python
    if (REGEX_PATTERNS.reformAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.REFORM_ALLOWANCE_1993.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 127** - 关系属性访问

```python
    if (REGEX_PATTERNS.trafficAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 128** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.TRAFFIC_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
    if (REGEX_PATTERNS.townshipAllowance.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.TOWNSHIP_ALLOWANCE.amount', confidence: 0.92, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
    if (REGEX_PATTERNS.personalTax.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 136** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.PERSONAL_INCOME_TAX.amount', confidence: 0.98, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
    if (REGEX_PATTERNS.housingFund.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 139** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.HOUSING_FUND_PERSONAL.amount', confidence: 0.95, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
    if (REGEX_PATTERNS.pension.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 142** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 144** - 关系属性访问

```python
    if (REGEX_PATTERNS.medical.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 145** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 147** - 关系属性访问

```python
    if (REGEX_PATTERNS.unemployment.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount', confidence: 0.88, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 152** - 关系属性访问

```python
    if (REGEX_PATTERNS.grossPay.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 155** - 关系属性访问

```python
    if (REGEX_PATTERNS.netPay.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
    if (REGEX_PATTERNS.totalDeductions.test(fieldLower)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 175** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.BASIC_SALARY.amount', confidence: 0.98, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.POSITION_SALARY_GENERAL.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 181** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.GRADE_SALARY.amount', confidence: 0.92, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 184** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.SALARY_GRADE.amount', confidence: 0.90, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 187** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 190** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.85, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 193** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.GENERAL_ALLOWANCE.amount', confidence: 0.82, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 196** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.ALLOWANCE_GENERAL.amount', confidence: 0.80, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.TRAFFIC_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 202** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.TOWNSHIP_ALLOWANCE.amount', confidence: 0.92, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 205** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 208** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount', confidence: 0.88, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE.amount', confidence: 0.86, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 214** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 217** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount', confidence: 0.93, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount', confidence: 0.90, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 223** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.POSITION_ALLOWANCE.amount', confidence: 0.88, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 226** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PETITION_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 229** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount', confidence: 0.95, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 232** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.PROBATION_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 235** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.BACK_PAY.amount', confidence: 0.88, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 238** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount', confidence: 0.86, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 241** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 244** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.MONTHLY_PERFORMANCE_BONUS.amount', confidence: 0.90, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 247** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.REFORM_ALLOWANCE_1993.amount', confidence: 0.84, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 250** - 关系属性访问

```python
      return { sourceField: header, targetField: 'earnings_details.STAFF_SALARY_GRADE.amount', confidence: 0.82, category: 'earning', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 255** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.PERSONAL_INCOME_TAX.amount', confidence: 0.95, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 258** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.HOUSING_FUND_PERSONAL.amount', confidence: 0.90, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 261** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 264** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 267** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount', confidence: 0.88, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 270** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 273** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 276** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount', confidence: 0.88, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 279** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount', confidence: 0.86, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 282** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount', confidence: 0.84, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 285** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.ONE_TIME_ADJUSTMENT.amount', confidence: 0.82, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 288** - 关系属性访问

```python
      return { sourceField: header, targetField: 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 304** - 关系属性访问

```python
      return { sourceField: header, targetField: 'stats.ANNUAL_FIXED_SALARY_TOTAL.amount', confidence: 0.95, category: 'stat', required: false };
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/ImportResultStep.tsx

**行 46** - 关系属性访问

```python
        <Text>{t('batch_import.result.no_result')}</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 59** - 关系属性访问

```python
      title: t('batch_import.result.error_table.index'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 66** - 关系属性访问

```python
      title: t('batch_import.result.error_table.employee_id'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
      title: t('batch_import.result.error_table.error_message'),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 88** - 关系属性访问

```python
          title={t('batch_import.result.success_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 89** - 关系属性访问

```python
          subTitle={t('batch_import.result.success_subtitle', { count: successCount })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 99** - 关系属性访问

```python
          title={t('batch_import.result.partial_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 100** - 关系属性访问

```python
          subTitle={t('batch_import.result.partial_subtitle', { 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
          title={t('batch_import.result.failure_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
          subTitle={t('batch_import.result.failure_subtitle', { count: errorCount })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
            title={t('batch_import.result.statistics.total_processed')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
            title={t('batch_import.result.statistics.successful')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
            title={t('batch_import.result.statistics.failed')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 166** - 关系属性访问

```python
          {t('batch_import.result.error_details_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 170** - 关系属性访问

```python
          message={t('batch_import.result.error_alert_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 171** - 关系属性访问

```python
          description={t('batch_import.result.error_alert_desc')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 203** - 关系属性访问

```python
                {t('batch_import.result.success_details_title', { count: successCount })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 210** - 关系属性访问

```python
            message={t('batch_import.result.success_alert_title')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
            description={t('batch_import.result.success_alert_desc', { count: successCount })}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
                {t('batch_import.result.created_entries_preview')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 226** - 关系属性访问

```python
                      {t('batch_import.result.entry_item', {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 237** - 关系属性访问

```python
                      {t('batch_import.result.more_entries', { 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 254** - 关系属性访问

```python
      <Title level={5}>{t('batch_import.result.next_steps_title')}</Title>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 259** - 关系属性访问

```python
            message={t('batch_import.result.success_suggestion')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 267** - 关系属性访问

```python
            message={t('batch_import.result.partial_suggestion')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 268** - 关系属性访问

```python
            description={t('batch_import.result.partial_suggestion_desc')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 276** - 关系属性访问

```python
            message={t('batch_import.result.failure_suggestion')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 277** - 关系属性访问

```python
            description={t('batch_import.result.failure_suggestion_desc')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 289** - 关系属性访问

```python
        <Title level={3}>{t('batch_import.step.result')}</Title>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 291** - 关系属性访问

```python
          {t('batch_import.step.result_subtitle')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 320** - 关系属性访问

```python
            {t('batch_import.button.start_again')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 330** - 关系属性访问

```python
              {t('batch_import.button.view_entries')}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/ImportPreviewStep.tsx

**行 32** - 关系属性访问

```python
import bulkImportStyles from '../../../../../styles/payroll-bulk-import.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 361** - 关系属性访问

```python
              record.validationErrors && record.validationErrors.length > 0 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/DataPreview.tsx

**行 66** - 关系属性访问

```python
                   (!validationResult.errors || validationResult.errors.length === 0);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
    if (validationResult.errors && validationResult.errors.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 145** - 关系属性访问

```python
        {validationResult.errors && validationResult.errors.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 155** - 关系属性访问

```python
                  {validationResult.errors.slice(0, 5).map((error, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
                  {validationResult.errors.length > 5 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 159** - 关系属性访问

```python
                    <li>... 还有 {validationResult.errors.length - 5} 个错误</li>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 176** - 关系属性访问

```python
            dataSource={importData.rows.slice(0, 5).map((row, index) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 178** - 关系属性访问

```python
              importData.headers.forEach((header, i) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
            columns={importData.headers.map((header, colIndex) => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 210** - 关系属性访问

```python
              x: Math.max(800, importData.headers.length * 120),
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 321** - 关系属性访问

```python
          {validationResult.errors && validationResult.errors.length > 0 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/ImportInputStep.tsx

**行 8** - 关系属性访问

```python
import responsiveStyles from '../../../../../styles/responsive-import.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 9** - 关系属性访问

```python
import bulkImportStyles from '../../../../../styles/payroll-bulk-import.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 361** - 关系属性访问

```python
                onChange={(e) => setTableText(e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 403** - 关系属性访问

```python
                onChange={(e) => setJsonText(e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/ImportProcessStep.tsx

**行 20** - 关系属性访问

```python
import bulkImportStyles from '../../../../../styles/payroll-bulk-import.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/MappingTable.tsx

**行 91** - 关系属性访问

```python
                    <Option value="earnings_details.BASIC_SALARY.amount">{getFieldDisplayName('earnings_details.BASIC_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 92** - 关系属性访问

```python
                    <Option value="earnings_details.POSITION_SALARY_GENERAL.amount">{getFieldDisplayName('earnings_details.POSITION_SALARY_GENERAL.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 93** - 关系属性访问

```python
                    <Option value="earnings_details.GRADE_SALARY.amount">{getFieldDisplayName('earnings_details.GRADE_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 94** - 关系属性访问

```python
                    <Option value="earnings_details.SALARY_GRADE.amount">{getFieldDisplayName('earnings_details.SALARY_GRADE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 95** - 关系属性访问

```python
                    <Option value="earnings_details.PERFORMANCE_SALARY.amount">{getFieldDisplayName('earnings_details.PERFORMANCE_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 关系属性访问

```python
                    <Option value="earnings_details.PERFORMANCE_BONUS.amount">{getFieldDisplayName('earnings_details.PERFORMANCE_BONUS.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 97** - 关系属性访问

```python
                    <Option value="earnings_details.BASIC_PERFORMANCE_SALARY.amount">{getFieldDisplayName('earnings_details.BASIC_PERFORMANCE_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 98** - 关系属性访问

```python
                    <Option value="earnings_details.BASIC_PERFORMANCE.amount">{getFieldDisplayName('earnings_details.BASIC_PERFORMANCE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 99** - 关系属性访问

```python
                    <Option value="earnings_details.BASIC_PERFORMANCE_AWARD.amount">{getFieldDisplayName('earnings_details.BASIC_PERFORMANCE_AWARD.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 100** - 关系属性访问

```python
                    <Option value="earnings_details.GENERAL_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.GENERAL_ALLOWANCE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 101** - 关系属性访问

```python
                    <Option value="earnings_details.ALLOWANCE_GENERAL.amount">{getFieldDisplayName('earnings_details.ALLOWANCE_GENERAL.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 102** - 关系属性访问

```python
                    <Option value="earnings_details.TRAFFIC_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.TRAFFIC_ALLOWANCE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 103** - 关系属性访问

```python
                    <Option value="earnings_details.TOWNSHIP_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.TOWNSHIP_ALLOWANCE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
                    <Option value="earnings_details.CIVIL_STANDARD_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.CIVIL_STANDARD_ALLOWANCE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
                    <Option value="earnings_details.POSITION_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.POSITION_ALLOWANCE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 106** - 关系属性访问

```python
                    <Option value="earnings_details.PETITION_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.PETITION_ALLOWANCE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 107** - 关系属性访问

```python
                    <Option value="earnings_details.ONLY_CHILD_PARENT_BONUS.amount">{getFieldDisplayName('earnings_details.ONLY_CHILD_PARENT_BONUS.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 108** - 关系属性访问

```python
                    <Option value="earnings_details.REFORM_ALLOWANCE_1993.amount">{getFieldDisplayName('earnings_details.REFORM_ALLOWANCE_1993.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 109** - 关系属性访问

```python
                    <Option value="earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount">{getFieldDisplayName('earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 110** - 关系属性访问

```python
                    <Option value="earnings_details.PROBATION_SALARY.amount">{getFieldDisplayName('earnings_details.PROBATION_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 111** - 关系属性访问

```python
                    <Option value="earnings_details.BACK_PAY.amount">{getFieldDisplayName('earnings_details.BACK_PAY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 112** - 关系属性访问

```python
                    <Option value="earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount">{getFieldDisplayName('earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 113** - 关系属性访问

```python
                    <Option value="earnings_details.POSITION_TECH_GRADE_SALARY.amount">{getFieldDisplayName('earnings_details.POSITION_TECH_GRADE_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 114** - 关系属性访问

```python
                    <Option value="earnings_details.GRADE_POSITION_LEVEL_SALARY.amount">{getFieldDisplayName('earnings_details.GRADE_POSITION_LEVEL_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 115** - 关系属性访问

```python
                    <Option value="earnings_details.MONTHLY_PERFORMANCE_BONUS.amount">{getFieldDisplayName('earnings_details.MONTHLY_PERFORMANCE_BONUS.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 116** - 关系属性访问

```python
                    <Option value="earnings_details.STAFF_SALARY_GRADE.amount">{getFieldDisplayName('earnings_details.STAFF_SALARY_GRADE.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 121** - 关系属性访问

```python
                    <Option value="deductions_details.PERSONAL_INCOME_TAX.amount">{getFieldDisplayName('deductions_details.PERSONAL_INCOME_TAX.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 122** - 关系属性访问

```python
                    <Option value="deductions_details.HOUSING_FUND_PERSONAL.amount">{getFieldDisplayName('deductions_details.HOUSING_FUND_PERSONAL.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 123** - 关系属性访问

```python
                    <Option value="deductions_details.PENSION_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.PENSION_PERSONAL_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 124** - 关系属性访问

```python
                    <Option value="deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 125** - 关系属性访问

```python
                    <Option value="deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 126** - 关系属性访问

```python
                    <Option value="deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 127** - 关系属性访问

```python
                    <Option value="deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 128** - 关系属性访问

```python
                    <Option value="deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
                    <Option value="deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
                    <Option value="deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 关系属性访问

```python
                    <Option value="deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 132** - 关系属性访问

```python
                    <Option value="deductions_details.ONE_TIME_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.ONE_TIME_ADJUSTMENT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
                    <Option value="employer_deductions.HOUSING_FUND_EMPLOYER.amount">{getFieldDisplayName('employer_deductions.HOUSING_FUND_EMPLOYER.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
                    <Option value="employer_deductions.PENSION_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.PENSION_EMPLOYER_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 139** - 关系属性访问

```python
                    <Option value="employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 140** - 关系属性访问

```python
                    <Option value="employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
                    <Option value="employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 142** - 关系属性访问

```python
                    <Option value="employer_deductions.INJURY_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.INJURY_EMPLOYER_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
                    <Option value="employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
                    <Option value="calculation_results.TAXABLE_INCOME.amount">{getFieldDisplayName('calculation_results.TAXABLE_INCOME.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
                    <Option value="calculation_results.TAX_DEDUCTION_AMOUNT.amount">{getFieldDisplayName('calculation_results.TAX_DEDUCTION_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 150** - 关系属性访问

```python
                    <Option value="calculation_results.TAX_EXEMPT_AMOUNT.amount">{getFieldDisplayName('calculation_results.TAX_EXEMPT_AMOUNT.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 151** - 关系属性访问

```python
                    <Option value="calculation_results.QUICK_DEDUCTION.amount">{getFieldDisplayName('calculation_results.QUICK_DEDUCTION.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 152** - 关系属性访问

```python
                    <Option value="calculation_results.AFTER_TAX_SALARY.amount">{getFieldDisplayName('calculation_results.AFTER_TAX_SALARY.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 157** - 关系属性访问

```python
                    <Option value="stats.ANNUAL_FIXED_SALARY_TOTAL.amount">{getFieldDisplayName('stats.ANNUAL_FIXED_SALARY_TOTAL.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 158** - 关系属性访问

```python
                    <Option value="stats.QUARTERLY_PERFORMANCE_Q1.amount">{getFieldDisplayName('stats.QUARTERLY_PERFORMANCE_Q1.amount')}</Option>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/DataUpload.tsx

**行 63** - 关系属性访问

```python
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 276** - 关系属性访问

```python
              onChange={(e) => setTextInput(e.target.value)}
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/ImportExecution.tsx

**行 144** - 关系属性访问

```python
                    {importResult.errors.slice(0, 10).map((error, index) => (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 151** - 关系属性访问

```python
                    {importResult.errors.length > 10 && (
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 153** - 关系属性访问

```python
                        <Text type="secondary">... 还有 {importResult.errors.length - 10} 个错误</Text>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/hooks/usePayrollComponents.ts

**行 26** - 关系属性访问

```python
      if (response.data.length === 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 28** - 关系属性访问

```python
      } else if (response.meta && response.meta.total > response.data.length) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 29** - 关系属性访问

```python
        console.warn(`Only ${response.data.length} of ${response.meta.total} components loaded. Consider increasing page size.`);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/hooks/useImportFlow.ts

**行 103** - 关系属性访问

```python
        totalRows: importData.rows.length,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 125** - 关系属性访问

```python
      if (importSettings.overwriteExisting && result.errors && result.errors.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
        result.errors.forEach((error, index) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/hooks/usePayrollImport.ts

**行 59** - 关系属性访问

```python
      setParseError(t('batch_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 67** - 关系属性访问

```python
        setParseError(t('batch_import.validation.json_not_array'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
        setParseError(t('batch_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 关系属性访问

```python
      message.success(t('batch_import.message.file_parsed_success', { count: totalRecords }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 99** - 关系属性访问

```python
        t('batch_import.message.file_parse_error') + 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 112** - 关系属性访问

```python
      message.error(t('batch_import.validation.no_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 117** - 关系属性访问

```python
      message.error(t('batch_import.validation.period_required'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 122** - 关系属性访问

```python
      !record.validationErrors || record.validationErrors.length === 0
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 126** - 关系属性访问

```python
      message.error(t('batch_import.validation.no_valid_data_to_upload'));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
      message.success(t('batch_import.message.upload_success', { count: response.success_count }));
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 192** - 关系属性访问

```python
        message.warning(t('batch_import.message.upload_partial_success', { 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 211** - 关系属性访问

```python
        errorMessage = typeof error.response.data.detail === 'string' 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 212** - 关系属性访问

```python
          ? error.response.data.detail 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 213** - 关系属性访问

```python
          : t('batch_import.message.upload_failed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/hooks/usePayrollFieldMapping.ts

**行 35** - 关系属性访问

```python
        label: t('batch_import.fields.employee_code'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 42** - 关系属性访问

```python
        label: t('batch_import.fields.employee_full_name'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 49** - 关系属性访问

```python
        label: t('batch_import.fields.id_number'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 56** - 关系属性访问

```python
        label: t('batch_import.fields.gross_pay'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
        label: t('batch_import.fields.net_pay'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - 关系属性访问

```python
        label: t('batch_import.fields.total_deductions'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 77** - 关系属性访问

```python
        label: t('batch_import.fields.remarks'), 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 182** - 关系属性访问

```python
    if (field.label.toLowerCase() === fieldLower) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 189** - 关系属性访问

```python
    const codeMatch = field.key.match(/\.([A-Z_]+)\./);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 287** - 关系属性访问

```python
    if (fieldLower.includes(comp.name.toLowerCase()) || 
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 288** - 关系属性访问

```python
        (comp.description && fieldLower.includes(comp.description.toLowerCase()))) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/pages/components/PayrollFieldMapper.tsx

**行 9** - 关系属性访问

```python
      { key: 'employee_code', label: t('batch_import.fields.employee_code'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 10** - 关系属性访问

```python
      { key: 'employee_full_name', label: t('batch_import.fields.employee_full_name'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 11** - 关系属性访问

```python
      { key: 'id_number', label: t('batch_import.fields.id_number'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 12** - 关系属性访问

```python
      { key: 'gross_pay', label: t('batch_import.fields.gross_pay'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 13** - 关系属性访问

```python
      { key: 'total_deductions', label: t('batch_import.fields.total_deductions'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 14** - 关系属性访问

```python
      { key: 'net_pay', label: t('batch_import.fields.net_pay'), required: true },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 15** - 关系属性访问

```python
      { key: 'remarks', label: t('batch_import.fields.remarks'), required: false },
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 43** - 关系属性访问

```python
      [t('batch_import.mapping.serial_number')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 44** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_identity')]: 'raw_personnel_identity',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 45** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_level')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 46** - 关系属性访问

```python
      [t('batch_import.mapping.salary_unified')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 47** - 关系属性访问

```python
      [t('batch_import.mapping.fiscal_support')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 48** - 关系属性访问

```python
      [t('batch_import.mapping.department')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 49** - 关系属性访问

```python
      [t('batch_import.mapping.department_name')]: '__IGNORE_FIELD__',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 50** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_number')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 51** - 关系属性访问

```python
      [t('batch_import.mapping.employee_id')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
      [t('batch_import.mapping.employee_number')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
      [t('batch_import.mapping.work_number')]: 'employee_code',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 54** - 关系属性访问

```python
      [t('batch_import.mapping.personnel_name')]: 'employee_full_name',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 55** - 关系属性访问

```python
      [t('batch_import.mapping.name')]: 'employee_full_name',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 56** - 关系属性访问

```python
      [t('batch_import.mapping.employee_name')]: 'employee_full_name',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 57** - 关系属性访问

```python
      [t('batch_import.mapping.id_card')]: 'id_number',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 58** - 关系属性访问

```python
      [t('batch_import.mapping.id_number')]: 'id_number',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 59** - 关系属性访问

```python
      [t('batch_import.mapping.id_card_number')]: 'id_number',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 60** - 关系属性访问

```python
      [t('batch_import.mapping.gross_salary')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
      [t('batch_import.mapping.total_income')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 62** - 关系属性访问

```python
      [t('batch_import.mapping.salary_total')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
      [t('batch_import.mapping.total_earnings')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 64** - 关系属性访问

```python
      [t('batch_import.mapping.gross_total')]: 'gross_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
      [t('batch_import.mapping.net_salary')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 66** - 关系属性访问

```python
      [t('batch_import.mapping.net_pay')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 67** - 关系属性访问

```python
      [t('batch_import.mapping.actual_amount')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 68** - 关系属性访问

```python
      [t('batch_import.mapping.net_total')]: 'net_pay',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 69** - 关系属性访问

```python
      [t('batch_import.mapping.deduction_total')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 70** - 关系属性访问

```python
      [t('batch_import.mapping.total_deductions')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 71** - 关系属性访问

```python
      [t('batch_import.mapping.deduction_amount')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 72** - 关系属性访问

```python
      [t('batch_import.mapping.total_deduction_amount')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 73** - 关系属性访问

```python
      [t('batch_import.mapping.should_deduct_total')]: 'total_deductions',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 74** - 关系属性访问

```python
      [t('batch_import.mapping.remarks')]: 'remarks',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 75** - 关系属性访问

```python
      [t('batch_import.mapping.description')]: 'remarks',
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/services/payrollWorkflowApi.ts

**行 120** - 关系属性访问

```python
        hasData: response.data.data.length > 0,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 121** - 关系属性访问

```python
        entryCount: response.data.meta?.total || 0
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 326** - 关系属性访问

```python
    return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 336** - 关系属性访问

```python
    const summary = response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/services/payrollViewsApi.ts

**行 232** - 关系属性访问

```python
      return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 253** - 关系属性访问

```python
      return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 276** - 关系属性访问

```python
      return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 297** - 关系属性访问

```python
      return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 318** - 关系属性访问

```python
      return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 339** - 关系属性访问

```python
      return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 385** - 关系属性访问

```python
      return response.data.data || [];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 404** - 关系属性访问

```python
      return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/services/payrollPeriodService.ts

**行 34** - 关系属性访问

```python
      if (runsResponse.data && runsResponse.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 36** - 关系属性访问

```python
        const entriesPromises = runsResponse.data.map(async (run) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 43** - 关系属性访问

```python
            if (entriesResponse.data && entriesResponse.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 44** - 关系属性访问

```python
              entriesResponse.data.forEach(entry => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 52** - 关系属性访问

```python
            if (error.response && error.response.status === 422 && error.response.data && error.response.data.detail && error.response.data.detail.error && error.response.data.detail.error.message) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 53** - 关系属性访问

```python
              errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 133** - 关系属性访问

```python
      const sortedPeriods = response.data.sort((a, b) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/services/payrollApi.ts

**行 128** - 关系属性访问

```python
        status: error.response.status,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 129** - 关系属性访问

```python
        statusText: error.response.statusText,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 130** - 关系属性访问

```python
        data: error.response.data,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 131** - 关系属性访问

```python
        headers: error.response.headers
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 242** - 关系属性访问

```python
    if (response.data.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 243** - 关系属性访问

```python
      const firstEntry = response.data.data[0];
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 286** - 关系属性访问

```python
      headers: apiClient.defaults.headers
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/services/payrollWorkflowStatusService.ts

**行 122** - 关系属性访问

```python
      const stepIndex = currentStatus.steps.findIndex(step => step.stepKey === stepKey);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
          if (nextStepIndex < currentStatus.steps.length) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 142** - 关系属性访问

```python
        const allCompleted = currentStatus.steps.every(step => step.status === 'completed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 143** - 关系属性访问

```python
        const anyInProgress = currentStatus.steps.some(step => step.status === 'in_progress');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 144** - 关系属性访问

```python
        const anyFailed = currentStatus.steps.some(step => step.status === 'failed');
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 176** - 关系属性访问

```python
      return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
      return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 221** - 关系属性访问

```python
      const payrollRun = createRunResponse.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Payroll/services/payrollBulkImportApi.ts

**行 94** - 关系属性访问

```python
    if (overwriteMode && validationResult.errors && validationResult.errors.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 96** - 关系属性访问

```python
        totalErrors: validationResult.errors.length,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 103** - 关系属性访问

```python
      validationResult.errors.forEach((error, index) => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 171** - 关系属性访问

```python
      errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 173** - 关系属性访问

```python
      errorMessage = error.response.data.detail;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 322** - 关系属性访问

```python
      entriesCount: data.entries.length,
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 339** - 关系属性访问

```python
      errorMessage = error.response.data.detail.error.message;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 341** - 关系属性访问

```python
      errorMessage = error.response.data.detail;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 366** - 关系属性访问

```python
    return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 389** - 关系属性访问

```python
    return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 490** - 关系属性访问

```python
      else if (headerTrimmed.includes(component.name) || component.name.includes(headerTrimmed)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 496** - 关系属性访问

```python
        component.description.includes(headerTrimmed)
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 503** - 关系属性访问

```python
        const componentKeywords = component.name.replace(/[^\u4e00-\u9fff\w]/g, '').split('').filter(w => w.length > 0);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 690** - 关系属性访问

```python
  optionGroups.special.push(
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 701** - 关系属性访问

```python
      return a.component.name.localeCompare(b.component.name);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Employee/MyInfo.tsx

**行 14** - 关系属性访问

```python
import styles from './MyInfo.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 32** - 关系属性访问

```python
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 132** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.firstName')}>{employee?.first_name}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 133** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.lastName')}>{employee?.last_name}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.dob')}>{employee?.date_of_birth ? String(employee.date_of_birth) : ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 135** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_gender')}>{getLookupDisplayName(employee?.gender_lookup_value_id, genders)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 136** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.idNumber')}>{employee?.id_number || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 137** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.nationality')}>{employee?.nationality || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 138** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.maritalStatus')}>{getLookupDisplayName(employee?.marital_status_lookup_value_id, maritalStatuses)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 139** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.ethnicity')}>{employee?.ethnicity || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 140** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.politicalStatus')}>{getLookupDisplayName(employee?.political_status_lookup_value_id /*, politicalStatuses - if fetched */)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 141** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.personal_info.educationLevel')}>{getLookupDisplayName(employee?.education_level_lookup_value_id, educationLevels)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 148** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.contact_info.personalEmail')}>{employee?.email || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 149** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.contact_info.mobilePhone')}>{employee?.phone_number || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 150** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.contact_info.address')} span={1}>{employee?.home_address || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 169** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.department')}>{employee?.departmentName || getLookupDisplayName(employee?.department_id, departments)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 170** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.personnelCategory')}>{employee?.personnelCategoryName || getLookupDisplayName(employee?.personnel_category_id, personnelCategories)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 171** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.actualPosition')}>{employee?.actual_position_name || getLookupDisplayName(employee?.actual_position_id, actualPositions)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 172** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.hireDate')}>{employee?.hire_date ? String(employee.hire_date) : ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 173** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.probationEndDate')}>{employee?.probationEndDate ? String(employee.probationEndDate) : ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 174** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.employmentType')}>{getLookupDisplayName(employee?.employment_type_lookup_value_id, employmentTypes)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 175** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.status')}>{getLookupDisplayName(employee?.status_lookup_value_id, employeeStatuses)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 176** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.reportsTo')}>{getLookupDisplayName(employee?.reports_to_employee_id /*, employees - if fetched for manager name lookup */)}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 177** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.employment_info.workLocation')} span={1}>{employee?.workLocation || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 196** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.financial_info.bankName')} span={1}>{employee?.bank_name || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 197** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.financial_info.bankAccountNumber')} span={1}>{employee?.bank_account_number || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 204** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.emergency_contact.emergencyContactName')}>{employee?.emergency_contact_name || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 205** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.emergency_contact.emergencyContactPhone')}>{employee?.emergency_contact_phone || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 206** - 关系属性访问

```python
              <Descriptions.Item label={t('employee:detail_page.emergency_contact.emergencyContactRelation')} span={1}>{employee?.emergencyContactRelation || ''}</Descriptions.Item>
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/pages/Employee/MyPayslips.tsx

**行 15** - 关系属性访问

```python
import styles from './MyPayslips.module.less';
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 21** - 关系属性访问

```python
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 104** - 关系属性访问

```python
        const aDate = a.payroll_run?.run_date ? new Date(a.payroll_run.run_date).getTime() : 0;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 105** - 关系属性访问

```python
        const bDate = b.payroll_run?.run_date ? new Date(b.payroll_run.run_date).getTime() : 0;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 146** - 关系属性访问

```python
        const aDate = a.payroll_run?.paid_at ? new Date(a.payroll_run.paid_at).getTime() : 0;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 147** - 关系属性访问

```python
        const bDate = b.payroll_run?.paid_at ? new Date(b.payroll_run.paid_at).getTime() : 0;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/services/tableConfigApi.ts

**行 29** - 关系属性访问

```python
  return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 44** - 关系属性访问

```python
  return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/services/employeeService.ts

**行 48** - 关系属性访问

```python
// const API_BASE_URL = import.meta.env.VITE_API_PATH_PREFIX || '/api/v2'; // This line is removed
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 65** - 关系属性访问

```python
    if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined && params[key] !== null) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 121** - 关系属性访问

```python
      return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 133** - 关系属性访问

```python
      if (error.response && error.response.data && error.response.data.detail) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 134** - 关系属性访问

```python
      } else if (error.response && error.response.data) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 181** - 关系属性访问

```python
      if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 183** - 关系属性访问

```python
        return response.data.data.map(apiItem => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 199** - 关系属性访问

```python
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 200** - 关系属性访问

```python
          return fallbackResponse.data.data.map(apiItem => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 220** - 关系属性访问

```python
      if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 221** - 关系属性访问

```python
        return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 236** - 关系属性访问

```python
      if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 237** - 关系属性访问

```python
        return response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 503** - 关系属性访问

```python
        if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 504** - 关系属性访问

```python
          response.data.data.forEach(emp => {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

### 📄 frontend/v2/src/services/lookupService.ts

**行 56** - 关系属性访问

```python
    if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 61** - 关系属性访问

```python
    // response.data.data 对应 LookupTypeListResponse 中的 data 数组
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 62** - 关系属性访问

```python
    if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 63** - 关系属性访问

```python
      cachedLookupTypes = Object.freeze([...response.data.data]); // 从 response.data.data 获取数组
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 420** - 关系属性访问

```python
    if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 422** - 关系属性访问

```python
      return response.data.data
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 438** - 关系属性访问

```python
      if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 439** - 关系属性访问

```python
        return fallbackResponse.data.data
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 473** - 关系属性访问

```python
      if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 474** - 关系属性访问

```python
        rawDepartments = response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 579** - 关系属性访问

```python
      if ('data' in response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 580** - 关系属性访问

```python
        rawPersonnelCategories = response.data.data; // MODIFIED
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 687** - 关系属性访问

```python
      if (response.data && Array.isArray(response.data.data)) {
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 688** - 关系属性访问

```python
        const positionsWithParentId: PositionWithParentId[] = response.data.data.map(p => ({
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 729** - 关系属性访问

```python
      const createdValue = response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 755** - 关系属性访问

```python
      const updatedValue = response.data.data;
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 841** - 关系属性访问

```python
      return response.data.data
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 864** - 关系属性访问

```python
      return response.data.data
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

**行 887** - 关系属性访问

```python
      return response.data.data
```

💡 **建议**: 检查是否需要预加载关联数据避免懒加载

---

## 🛠️ N+1查询优化指南

### 1. 使用预加载

```python
# 错误：N+1查询
entries = db.query(PayrollEntry).all()
for entry in entries:
    print(entry.employee.name)  # 每次都查询数据库

# 正确：预加载
entries = db.query(PayrollEntry).options(
    joinedload(PayrollEntry.employee)
).all()
for entry in entries:
    print(entry.employee.name)  # 使用已加载的数据
```

### 2. 批量查询

```python
# 错误：循环查询
for employee_id in employee_ids:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

# 正确：批量查询
employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
```

### 3. 使用合适的加载策略

- `joinedload()`: 使用LEFT JOIN，适合一对一关系
- `selectinload()`: 使用IN查询，适合一对多关系
- `subqueryload()`: 使用子查询，适合复杂关系

