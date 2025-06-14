"""enhance_payroll_audit_system

Revision ID: enhance_payroll_audit_system
Revises: 386b390211c2
Create Date: 2025-01-17 10:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enhance_payroll_audit_system'
down_revision = '0fbe97ae8c56'
branch_labels = None
depends_on = None


def upgrade():
    """
    增强薪资审核系统的数据库结构
    
    主要改进：
    1. 添加薪资审核相关表
    2. 优化现有表结构
    3. 添加性能索引
    4. 创建审核视图
    """
    
    # =====================================================
    # 1. 增强 payroll_entries 表 - 添加审核相关字段
    # =====================================================
    
    # 添加审核状态字段
    op.add_column('payroll_entries', 
        sa.Column('audit_status', sa.String(20), nullable=False, server_default='PENDING'),
        schema='payroll'
    )
    
    # 添加审核时间戳
    op.add_column('payroll_entries', 
        sa.Column('audit_timestamp', sa.TIMESTAMP(timezone=True), nullable=True),
        schema='payroll'
    )
    
    # 添加审核员ID
    op.add_column('payroll_entries', 
        sa.Column('auditor_id', sa.BigInteger, nullable=True),
        schema='payroll'
    )
    
    # 添加审核备注
    op.add_column('payroll_entries', 
        sa.Column('audit_notes', sa.Text, nullable=True),
        schema='payroll'
    )
    
    # 添加数据版本号（用于乐观锁）
    op.add_column('payroll_entries', 
        sa.Column('version', sa.Integer, nullable=False, server_default='1'),
        schema='payroll'
    )
    
    # =====================================================
    # 2. 创建薪资审核汇总表
    # =====================================================
    
    op.create_table('payroll_run_audit_summary',
        sa.Column('id', sa.BigInteger, primary_key=True),
        sa.Column('payroll_run_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_runs.id'), nullable=False),
        sa.Column('total_entries', sa.Integer, nullable=False, default=0),
        sa.Column('total_anomalies', sa.Integer, nullable=False, default=0),
        sa.Column('error_count', sa.Integer, nullable=False, default=0),
        sa.Column('warning_count', sa.Integer, nullable=False, default=0),
        sa.Column('info_count', sa.Integer, nullable=False, default=0),
        sa.Column('auto_fixable_count', sa.Integer, nullable=False, default=0),
        sa.Column('manually_ignored_count', sa.Integer, nullable=False, default=0),
        sa.Column('audit_status', sa.String(20), nullable=False, default='PENDING'),
        sa.Column('audit_type', sa.String(20), nullable=False, default='BASIC'),  # BASIC, ADVANCED, MANUAL
        sa.Column('audit_details', postgresql.JSONB, nullable=True),
        sa.Column('anomalies_by_type', postgresql.JSONB, nullable=True),
        sa.Column('total_gross_pay', sa.Numeric(15, 2), nullable=False, default=0),
        sa.Column('total_net_pay', sa.Numeric(15, 2), nullable=False, default=0),
        sa.Column('total_deductions', sa.Numeric(15, 2), nullable=False, default=0),
        sa.Column('comparison_with_previous', postgresql.JSONB, nullable=True),
        sa.Column('auditor_id', sa.BigInteger, nullable=True),
        sa.Column('audit_started_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('audit_completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        schema='payroll'
    )
    
    # =====================================================
    # 3. 创建薪资审核异常表
    # =====================================================
    
    op.create_table('payroll_audit_anomalies',
        sa.Column('id', sa.String(50), primary_key=True),  # 使用字符串ID便于前端处理
        sa.Column('payroll_entry_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_entries.id'), nullable=False),
        sa.Column('payroll_run_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_runs.id'), nullable=False),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id'), nullable=False),
        sa.Column('employee_code', sa.String(50), nullable=True),
        sa.Column('employee_name', sa.String(100), nullable=True),
        sa.Column('anomaly_type', sa.String(50), nullable=False),  # minimum_wage, tax_calculation, etc.
        sa.Column('severity', sa.String(20), nullable=False),  # error, warning, info
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('details', sa.Text, nullable=True),
        sa.Column('current_value', sa.Numeric(15, 2), nullable=True),
        sa.Column('expected_value', sa.Numeric(15, 2), nullable=True),
        sa.Column('can_auto_fix', sa.Boolean, nullable=False, default=False),
        sa.Column('is_ignored', sa.Boolean, nullable=False, default=False),
        sa.Column('ignore_reason', sa.Text, nullable=True),
        sa.Column('ignored_by_user_id', sa.BigInteger, nullable=True),
        sa.Column('ignored_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('suggested_action', sa.Text, nullable=True),
        sa.Column('fix_applied', sa.Boolean, nullable=False, default=False),
        sa.Column('fix_applied_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('fix_applied_by_user_id', sa.BigInteger, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        schema='payroll'
    )
    
    # =====================================================
    # 4. 创建薪资审核历史表
    # =====================================================
    
    op.create_table('payroll_audit_history',
        sa.Column('id', sa.BigInteger, primary_key=True),
        sa.Column('payroll_entry_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_entries.id'), nullable=False),
        sa.Column('payroll_run_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_runs.id'), nullable=False),
        sa.Column('audit_type', sa.String(50), nullable=False),  # BASIC, ADVANCED, MANUAL, AUTO_FIX
        sa.Column('audit_result', postgresql.JSONB, nullable=True),
        sa.Column('anomalies_found', postgresql.JSONB, nullable=True),
        sa.Column('audit_status', sa.String(20), nullable=False),  # PASSED, FAILED, WARNING
        sa.Column('before_data', postgresql.JSONB, nullable=True),  # 审核前的数据快照
        sa.Column('after_data', postgresql.JSONB, nullable=True),   # 审核后的数据快照
        sa.Column('changes_applied', postgresql.JSONB, nullable=True),  # 应用的修改
        sa.Column('auditor_id', sa.BigInteger, nullable=False),
        sa.Column('audit_timestamp', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('audit_duration_ms', sa.Integer, nullable=True),  # 审核耗时（毫秒）
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        schema='payroll'
    )
    
    # =====================================================
    # 5. 创建月度薪资快照表（审核通过后的数据）
    # =====================================================
    
    op.create_table('monthly_payroll_snapshots',
        sa.Column('id', sa.BigInteger, primary_key=True),
        sa.Column('period_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_periods.id'), nullable=False),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id'), nullable=False),
        sa.Column('payroll_run_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_runs.id'), nullable=False),
        sa.Column('employee_code', sa.String(50), nullable=True),
        sa.Column('employee_name', sa.String(100), nullable=True),
        sa.Column('department_name', sa.String(100), nullable=True),
        sa.Column('position_name', sa.String(100), nullable=True),
        sa.Column('gross_pay', sa.Numeric(15, 2), nullable=False, default=0),
        sa.Column('total_deductions', sa.Numeric(15, 2), nullable=False, default=0),
        sa.Column('net_pay', sa.Numeric(15, 2), nullable=False, default=0),
        sa.Column('earnings_details', postgresql.JSONB, nullable=False, default='{}'),
        sa.Column('deductions_details', postgresql.JSONB, nullable=False, default='{}'),
        sa.Column('audit_status', sa.String(20), nullable=False),
        sa.Column('audit_summary', postgresql.JSONB, nullable=True),
        sa.Column('snapshot_date', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('created_by_user_id', sa.BigInteger, nullable=True),
        schema='payroll'
    )
    
    # =====================================================
    # 6. 创建审核规则配置表
    # =====================================================
    
    op.create_table('audit_rule_configurations',
        sa.Column('id', sa.BigInteger, primary_key=True),
        sa.Column('rule_code', sa.String(50), nullable=False, unique=True),
        sa.Column('rule_name', sa.String(200), nullable=False),
        sa.Column('rule_description', sa.Text, nullable=True),
        sa.Column('rule_category', sa.String(50), nullable=False),  # COMPLIANCE, CALCULATION, BUSINESS
        sa.Column('severity_level', sa.String(20), nullable=False, default='warning'),
        sa.Column('is_enabled', sa.Boolean, nullable=False, default=True),
        sa.Column('can_auto_fix', sa.Boolean, nullable=False, default=False),
        sa.Column('rule_parameters', postgresql.JSONB, nullable=True),
        sa.Column('threshold_value', sa.Numeric(15, 2), nullable=True),
        sa.Column('error_message_template', sa.Text, nullable=True),
        sa.Column('suggested_action_template', sa.Text, nullable=True),
        sa.Column('effective_date', sa.Date, nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('end_date', sa.Date, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        schema='payroll'
    )
    
    # =====================================================
    # 7. 添加性能优化索引
    # =====================================================
    
    # payroll_entries 表的索引优化
    op.create_index('idx_payroll_entries_audit_status', 'payroll_entries', ['audit_status'], schema='payroll')
    op.create_index('idx_payroll_entries_audit_timestamp', 'payroll_entries', ['audit_timestamp'], schema='payroll')
    op.create_index('idx_payroll_entries_auditor_id', 'payroll_entries', ['auditor_id'], schema='payroll')
    op.create_index('idx_payroll_entries_period_run', 'payroll_entries', ['payroll_period_id', 'payroll_run_id'], schema='payroll')
    op.create_index('idx_payroll_entries_employee_period', 'payroll_entries', ['employee_id', 'payroll_period_id'], schema='payroll')
    op.create_index('idx_payroll_entries_calculated_at', 'payroll_entries', ['calculated_at'], schema='payroll')
    
    # 审核汇总表索引
    op.create_index('idx_audit_summary_payroll_run', 'payroll_run_audit_summary', ['payroll_run_id'], schema='payroll')
    op.create_index('idx_audit_summary_status', 'payroll_run_audit_summary', ['audit_status'], schema='payroll')
    op.create_index('idx_audit_summary_type', 'payroll_run_audit_summary', ['audit_type'], schema='payroll')
    op.create_index('idx_audit_summary_created_at', 'payroll_run_audit_summary', ['created_at'], schema='payroll')
    
    # 审核异常表索引
    op.create_index('idx_audit_anomalies_payroll_entry', 'payroll_audit_anomalies', ['payroll_entry_id'], schema='payroll')
    op.create_index('idx_audit_anomalies_payroll_run', 'payroll_audit_anomalies', ['payroll_run_id'], schema='payroll')
    op.create_index('idx_audit_anomalies_employee', 'payroll_audit_anomalies', ['employee_id'], schema='payroll')
    op.create_index('idx_audit_anomalies_type_severity', 'payroll_audit_anomalies', ['anomaly_type', 'severity'], schema='payroll')
    op.create_index('idx_audit_anomalies_can_auto_fix', 'payroll_audit_anomalies', ['can_auto_fix'], schema='payroll')
    op.create_index('idx_audit_anomalies_is_ignored', 'payroll_audit_anomalies', ['is_ignored'], schema='payroll')
    op.create_index('idx_audit_anomalies_created_at', 'payroll_audit_anomalies', ['created_at'], schema='payroll')
    
    # 审核历史表索引
    op.create_index('idx_audit_history_payroll_entry', 'payroll_audit_history', ['payroll_entry_id'], schema='payroll')
    op.create_index('idx_audit_history_payroll_run', 'payroll_audit_history', ['payroll_run_id'], schema='payroll')
    op.create_index('idx_audit_history_type_status', 'payroll_audit_history', ['audit_type', 'audit_status'], schema='payroll')
    op.create_index('idx_audit_history_auditor_timestamp', 'payroll_audit_history', ['auditor_id', 'audit_timestamp'], schema='payroll')
    
    # 月度快照表索引
    op.create_index('idx_monthly_snapshots_period_employee', 'monthly_payroll_snapshots', ['period_id', 'employee_id'], schema='payroll')
    op.create_index('idx_monthly_snapshots_audit_status', 'monthly_payroll_snapshots', ['audit_status'], schema='payroll')
    op.create_index('idx_monthly_snapshots_snapshot_date', 'monthly_payroll_snapshots', ['snapshot_date'], schema='payroll')
    
    # 审核规则配置表索引
    op.create_index('idx_audit_rules_category_enabled', 'audit_rule_configurations', ['rule_category', 'is_enabled'], schema='payroll')
    op.create_index('idx_audit_rules_effective_date', 'audit_rule_configurations', ['effective_date', 'end_date'], schema='payroll')
    
    # =====================================================
    # 8. 添加 JSONB 字段的 GIN 索引（提升 JSONB 查询性能）
    # =====================================================
    
    # payroll_entries 表的 JSONB 索引
    op.create_index('idx_payroll_entries_earnings_details_gin', 'payroll_entries', ['earnings_details'], 
                   postgresql_using='gin', schema='payroll')
    op.create_index('idx_payroll_entries_deductions_details_gin', 'payroll_entries', ['deductions_details'], 
                   postgresql_using='gin', schema='payroll')
    op.create_index('idx_payroll_entries_calculation_inputs_gin', 'payroll_entries', ['calculation_inputs'], 
                   postgresql_using='gin', schema='payroll')
    
    # 审核相关表的 JSONB 索引
    op.create_index('idx_audit_summary_details_gin', 'payroll_run_audit_summary', ['audit_details'], 
                   postgresql_using='gin', schema='payroll')
    op.create_index('idx_audit_summary_anomalies_by_type_gin', 'payroll_run_audit_summary', ['anomalies_by_type'], 
                   postgresql_using='gin', schema='payroll')
    op.create_index('idx_audit_history_result_gin', 'payroll_audit_history', ['audit_result'], 
                   postgresql_using='gin', schema='payroll')
    op.create_index('idx_monthly_snapshots_earnings_gin', 'monthly_payroll_snapshots', ['earnings_details'], 
                   postgresql_using='gin', schema='payroll')
    op.create_index('idx_monthly_snapshots_deductions_gin', 'monthly_payroll_snapshots', ['deductions_details'], 
                   postgresql_using='gin', schema='payroll')
    
    # =====================================================
    # 9. 添加唯一约束
    # =====================================================
    
    # 确保每个薪资运行只有一个审核汇总
    op.create_unique_constraint('uq_audit_summary_payroll_run_type', 'payroll_run_audit_summary', 
                               ['payroll_run_id', 'audit_type'], schema='payroll')
    
    # 确保月度快照的唯一性
    op.create_unique_constraint('uq_monthly_snapshot_period_employee', 'monthly_payroll_snapshots', 
                               ['period_id', 'employee_id'], schema='payroll')
    
    # =====================================================
    # 10. 创建审核相关的数据库视图
    # =====================================================
    
    # 创建审核概览视图
    op.execute("""
        CREATE VIEW payroll.audit_overview AS
        SELECT 
            pr.id as payroll_run_id,
            pp.name as period_name,
            pp.start_date,
            pp.end_date,
            COUNT(pe.id) as total_entries,
            COUNT(CASE WHEN pe.audit_status = 'PASSED' THEN 1 END) as passed_entries,
            COUNT(CASE WHEN pe.audit_status = 'FAILED' THEN 1 END) as failed_entries,
            COUNT(CASE WHEN pe.audit_status = 'WARNING' THEN 1 END) as warning_entries,
            COUNT(CASE WHEN pe.audit_status = 'PENDING' THEN 1 END) as pending_entries,
            SUM(pe.gross_pay) as total_gross_pay,
            SUM(pe.total_deductions) as total_deductions,
            SUM(pe.net_pay) as total_net_pay,
            MAX(pe.audit_timestamp) as last_audit_time,
            COALESCE(ras.total_anomalies, 0) as total_anomalies,
            COALESCE(ras.error_count, 0) as error_count,
            COALESCE(ras.warning_count, 0) as warning_count,
            COALESCE(ras.auto_fixable_count, 0) as auto_fixable_count
        FROM payroll.payroll_runs pr
        JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
        LEFT JOIN payroll.payroll_entries pe ON pr.id = pe.payroll_run_id
        LEFT JOIN payroll.payroll_run_audit_summary ras ON pr.id = ras.payroll_run_id
        GROUP BY pr.id, pp.name, pp.start_date, pp.end_date, ras.total_anomalies, 
                 ras.error_count, ras.warning_count, ras.auto_fixable_count
        ORDER BY pr.id DESC;
    """)
    
    # 创建异常详情视图
    op.execute("""
        CREATE VIEW payroll.audit_anomalies_detail AS
        SELECT 
            aa.id,
            aa.payroll_run_id,
            pp.name as period_name,
            aa.employee_code,
            aa.employee_name,
            e.first_name,
            e.last_name,
            d.name as department_name,
            pos.name as position_name,
            aa.anomaly_type,
            aa.severity,
            aa.message,
            aa.details,
            aa.current_value,
            aa.expected_value,
            aa.can_auto_fix,
            aa.is_ignored,
            aa.ignore_reason,
            aa.suggested_action,
            aa.fix_applied,
            aa.created_at,
            aa.updated_at
        FROM payroll.payroll_audit_anomalies aa
        JOIN payroll.payroll_runs pr ON aa.payroll_run_id = pr.id
        JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
        LEFT JOIN hr.employees e ON aa.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
        ORDER BY aa.created_at DESC, aa.severity DESC;
    """)
    
    # =====================================================
    # 11. 插入默认审核规则配置
    # =====================================================
    
    op.execute("""
        INSERT INTO payroll.audit_rule_configurations 
        (rule_code, rule_name, rule_description, rule_category, severity_level, is_enabled, can_auto_fix, rule_parameters, error_message_template, suggested_action_template)
        VALUES 
        ('MINIMUM_WAGE_CHECK', '最低工资标准检查', '检查实发合计是否低于当地最低工资标准', 'COMPLIANCE', 'error', true, false, 
         '{"minimum_wage": 2320, "region": "default"}', 
         '实发合计 ¥{current_value} 低于最低工资标准 ¥{threshold_value}', 
         '调整基本工资或减少扣除项'),
         
                 ('TAX_CALCULATION_CHECK', '个税计算检查', '验证个人所得税计算是否正确', 'CALCULATION', 'warning', true, true,
         '{"tolerance": 1.0, "basic_deduction": 5000}',
         '个税计算可能有误：计算值 ¥{expected_value}，实际值 ¥{current_value}',
         '检查个税计算公式和专项扣除'),
         
        ('SOCIAL_SECURITY_CHECK', '社保合规检查', '检查社保缴费是否符合规定', 'COMPLIANCE', 'error', true, true,
         '{"min_base": 3500, "max_base": 28000, "personal_rate": 0.105}',
         '社保扣除金额异常：{details}',
         '检查社保缴费基数和比例设置'),
         
        ('SALARY_VARIANCE_CHECK', '工资波动检查', '检测工资异常波动', 'BUSINESS', 'warning', true, false,
         '{"variance_threshold": 0.3, "history_months": 3}',
         '工资波动异常：{details}',
         '请检查工资计算是否正确'),
         
        ('MISSING_DATA_CHECK', '数据完整性检查', '检查必要数据是否缺失', 'BUSINESS', 'error', true, false,
         '{}',
         '缺少必要数据：{details}',
         '请补充缺失的数据'),
         
        ('CALCULATION_CONSISTENCY_CHECK', '计算一致性检查', '检查合计字段与明细是否一致', 'CALCULATION', 'error', true, true,
         '{"tolerance": 0.01}',
         '合计字段与明细不一致：{details}',
         '重新计算合计字段')
    """)


def downgrade():
    """回滚数据库更改"""
    
    # 删除视图
    op.execute("DROP VIEW IF EXISTS payroll.audit_anomalies_detail")
    op.execute("DROP VIEW IF EXISTS payroll.audit_overview")
    
    # 删除索引
    op.drop_index('idx_audit_rules_effective_date', 'audit_rule_configurations', schema='payroll')
    op.drop_index('idx_audit_rules_category_enabled', 'audit_rule_configurations', schema='payroll')
    op.drop_index('idx_monthly_snapshots_snapshot_date', 'monthly_payroll_snapshots', schema='payroll')
    op.drop_index('idx_monthly_snapshots_audit_status', 'monthly_payroll_snapshots', schema='payroll')
    op.drop_index('idx_monthly_snapshots_period_employee', 'monthly_payroll_snapshots', schema='payroll')
    op.drop_index('idx_audit_history_auditor_timestamp', 'payroll_audit_history', schema='payroll')
    op.drop_index('idx_audit_history_type_status', 'payroll_audit_history', schema='payroll')
    op.drop_index('idx_audit_history_payroll_run', 'payroll_audit_history', schema='payroll')
    op.drop_index('idx_audit_history_payroll_entry', 'payroll_audit_history', schema='payroll')
    op.drop_index('idx_audit_anomalies_created_at', 'payroll_audit_anomalies', schema='payroll')
    op.drop_index('idx_audit_anomalies_is_ignored', 'payroll_audit_anomalies', schema='payroll')
    op.drop_index('idx_audit_anomalies_can_auto_fix', 'payroll_audit_anomalies', schema='payroll')
    op.drop_index('idx_audit_anomalies_type_severity', 'payroll_audit_anomalies', schema='payroll')
    op.drop_index('idx_audit_anomalies_employee', 'payroll_audit_anomalies', schema='payroll')
    op.drop_index('idx_audit_anomalies_payroll_run', 'payroll_audit_anomalies', schema='payroll')
    op.drop_index('idx_audit_anomalies_payroll_entry', 'payroll_audit_anomalies', schema='payroll')
    op.drop_index('idx_audit_summary_created_at', 'payroll_run_audit_summary', schema='payroll')
    op.drop_index('idx_audit_summary_type', 'payroll_run_audit_summary', schema='payroll')
    op.drop_index('idx_audit_summary_status', 'payroll_run_audit_summary', schema='payroll')
    op.drop_index('idx_audit_summary_payroll_run', 'payroll_run_audit_summary', schema='payroll')
    
    # 删除 payroll_entries 表的新索引
    op.drop_index('idx_payroll_entries_calculated_at', 'payroll_entries', schema='payroll')
    op.drop_index('idx_payroll_entries_employee_period', 'payroll_entries', schema='payroll')
    op.drop_index('idx_payroll_entries_period_run', 'payroll_entries', schema='payroll')
    op.drop_index('idx_payroll_entries_auditor_id', 'payroll_entries', schema='payroll')
    op.drop_index('idx_payroll_entries_audit_timestamp', 'payroll_entries', schema='payroll')
    op.drop_index('idx_payroll_entries_audit_status', 'payroll_entries', schema='payroll')
    
    # 删除 JSONB GIN 索引
    op.drop_index('idx_monthly_snapshots_deductions_gin', 'monthly_payroll_snapshots', schema='payroll')
    op.drop_index('idx_monthly_snapshots_earnings_gin', 'monthly_payroll_snapshots', schema='payroll')
    op.drop_index('idx_audit_history_result_gin', 'payroll_audit_history', schema='payroll')
    op.drop_index('idx_audit_summary_anomalies_by_type_gin', 'payroll_run_audit_summary', schema='payroll')
    op.drop_index('idx_audit_summary_details_gin', 'payroll_run_audit_summary', schema='payroll')
    op.drop_index('idx_payroll_entries_calculation_inputs_gin', 'payroll_entries', schema='payroll')
    op.drop_index('idx_payroll_entries_deductions_details_gin', 'payroll_entries', schema='payroll')
    op.drop_index('idx_payroll_entries_earnings_details_gin', 'payroll_entries', schema='payroll')
    
    # 删除表
    op.drop_table('audit_rule_configurations', schema='payroll')
    op.drop_table('monthly_payroll_snapshots', schema='payroll')
    op.drop_table('payroll_audit_history', schema='payroll')
    op.drop_table('payroll_audit_anomalies', schema='payroll')
    op.drop_table('payroll_run_audit_summary', schema='payroll')
    
    # 删除 payroll_entries 表的新字段
    op.drop_column('payroll_entries', 'version', schema='payroll')
    op.drop_column('payroll_entries', 'audit_notes', schema='payroll')
    op.drop_column('payroll_entries', 'auditor_id', schema='payroll')
    op.drop_column('payroll_entries', 'audit_timestamp', schema='payroll')
    op.drop_column('payroll_entries', 'audit_status', schema='payroll') 