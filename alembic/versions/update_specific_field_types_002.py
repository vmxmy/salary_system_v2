"""
Update data_type for specific fields in salary_field_mappings
"""
from alembic import op
import sqlalchemy as sa # Needed for downgrade if reverting types

# revision identifiers, used by Alembic.
revision = 'update_specific_field_types_002'
down_revision = 'auto_money_type_001' # Assumes the previous one was this
branch_labels = None
depends_on = None

def upgrade():
    # Update to TEXT
    op.execute("""
        UPDATE salary_field_mappings SET data_type = 'TEXT'
        WHERE target_name IN ('salary_level', 'salary_grade');
    """)
    
    # Update to NUMERIC(15, 2)
    op.execute("""
        UPDATE salary_field_mappings SET data_type = 'NUMERIC(15, 2)'
        WHERE target_name IN (
            'self_pension_contribution', 'self_medical_contribution', 
            'self_annuity_contribution', 'self_housing_fund_contribution',
            'self_unemployment_contribution', 'self_injury_contribution',
            'social_insurance_adjustment', 'housing_fund_adjustment',
            'employer_pension_contribution', 'employer_medical_contribution',
            'employer_annuity_contribution', 'employer_housing_fund_contribution',
            'employer_unemployment_contribution', 'employer_injury_contribution',
            'employer_critical_illness_contribution'
        );
    """)
    
    # Update to DATE
    op.execute("""
        UPDATE salary_field_mappings SET data_type = 'DATE'
        WHERE target_name = 'employment_start_date';
    """)

def downgrade():
    # Revert changes (assuming original was TEXT for simplicity, adjust if needed)
    op.execute("""
        UPDATE salary_field_mappings SET data_type = 'TEXT'
        WHERE target_name IN (
            'salary_level', 'salary_grade', 
            'self_pension_contribution', 'self_medical_contribution', 
            'self_annuity_contribution', 'self_housing_fund_contribution',
            'self_unemployment_contribution', 'self_injury_contribution',
            'social_insurance_adjustment', 'housing_fund_adjustment',
            'employer_pension_contribution', 'employer_medical_contribution',
            'employer_annuity_contribution', 'employer_housing_fund_contribution',
            'employer_unemployment_contribution', 'employer_injury_contribution',
            'employer_critical_illness_contribution',
            'employment_start_date'
        );
    """) 