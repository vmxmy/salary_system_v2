"""add_job_position_level_to_employees

Revision ID: 51287468b666
Revises: 965982a6f0cb
Create Date: 2025-05-23 16:40:20.810178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51287468b666'
down_revision: Union[str, None] = '965982a6f0cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. 创建职务级别的lookup_type
    op.execute("""
        INSERT INTO config.lookup_types (code, name, description)
        VALUES ('JOB_POSITION_LEVEL', '职务级别', '员工的职务级别分类，包括调研员、管理岗位等级别')
        ON CONFLICT (code) DO NOTHING
    """)
    
    # 2. 获取刚创建的lookup_type的ID
    result = op.get_bind().execute(
        sa.text("SELECT id FROM config.lookup_types WHERE code = 'JOB_POSITION_LEVEL'")
    ).fetchone()
    
    if result:
        lookup_type_id = result[0]
        
        # 3. 创建职务级别的lookup_values
        job_position_levels = [
            ('FIRST_LEVEL_RESEARCHER', '一级调研员'),
            ('SECOND_LEVEL_RESEARCHER', '二级调研员'),
            ('FOURTH_LEVEL_RESEARCHER', '四级调研员'),
            ('COUNTY_LEVEL_CHIEF', '县处级正职'),
            ('COUNTY_LEVEL_DEPUTY', '县处级副职'),
            ('FIRST_LEVEL_CHIEF_CLERK', '一级主任科员'),
            ('SECOND_LEVEL_CHIEF_CLERK', '二级主任科员'),
            ('THIRD_LEVEL_CHIEF_CLERK', '三级主任科员'),
            ('FOURTH_LEVEL_CHIEF_CLERK', '四级主任科员'),
            ('SENIOR_WORKER', '高级工'),
            ('TECHNICAL_WORKER_LEVEL_2', '技术工二级'),
            ('MANAGEMENT_LEVEL_5', '五级管理岗位'),
            ('MANAGEMENT_LEVEL_6', '六级管理岗位'),
            ('MANAGEMENT_LEVEL_7', '七级管理岗位'),
            ('MANAGEMENT_LEVEL_8', '八级管理岗位'),
            ('PROBATION_PERIOD', '试用期')
        ]
        
        for value, display_name in job_position_levels:
            op.execute(f"""
                INSERT INTO config.lookup_values (lookup_type_id, code, name, sort_order)
                VALUES ({lookup_type_id}, '{value}', '{display_name}', 
                       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM config.lookup_values WHERE lookup_type_id = {lookup_type_id}))
                ON CONFLICT (lookup_type_id, code) DO NOTHING
            """)
    
    # 4. 为employees表添加job_position_level_lookup_value_id字段
    op.add_column('employees', 
                  sa.Column('job_position_level_lookup_value_id', 
                           sa.BigInteger, 
                           sa.ForeignKey('config.lookup_values.id', 
                                       name='fk_employee_job_position_level_id', 
                                       ondelete='SET NULL'), 
                           nullable=True, 
                           comment="员工职务级别"),
                  schema='hr')


def downgrade() -> None:
    """Downgrade schema."""
    # 1. 移除employees表的job_position_level_lookup_value_id字段
    op.drop_column('employees', 'job_position_level_lookup_value_id', schema='hr')
    
    # 2. 删除职务级别的lookup_values
    op.execute("""
        DELETE FROM config.lookup_values 
        WHERE lookup_type_id = (SELECT id FROM config.lookup_types WHERE code = 'JOB_POSITION_LEVEL')
    """)
    
    # 3. 删除职务级别的lookup_type
    op.execute("DELETE FROM config.lookup_types WHERE code = 'JOB_POSITION_LEVEL'")
