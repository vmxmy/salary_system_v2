import apiClient from '../../../api/apiClient';
import type {
  EmployeeManagementItem,
  EmployeeManagementQuery,
  EmployeeManagementPageResult,
  CreateEmployeeData,
  UpdateEmployeeData,
} from '../types';

/**
 * 员工管理API服务 - 传统ORM架构
 * 
 * 🔧 所有操作 - 使用传统ORM API (/employees)  
 * - getEmployees() - 基于ORM查询，支持完整的关联数据
 * - getEmployeeById() - 基于ORM查询，获取详细信息
 * - createEmployee() - 支持复杂业务逻辑和数据验证
 * - updateEmployee() - 支持事务处理和关联更新
 * - deleteEmployee() - 支持级联删除和业务规则
 * - bulkCreateEmployees() - 支持批量事务处理
 * 
 * 🎯 优势：
 * - 数据一致性（ORM事务支持）
 * - 业务逻辑完整性（ORM级联处理）
 * - 统一的数据访问模式
 */
export class EmployeeManagementApi {
  // 获取员工列表 - 使用传统ORM API
  async getEmployees(query?: EmployeeManagementQuery): Promise<EmployeeManagementPageResult> {
    try {
      const params = new URLSearchParams();
      
      if (query) {
        // 转换查询参数以匹配传统ORM API格式
        const { page, size, full_name_contains, employee_code_contains, department_id, is_active, ...otherFilters } = query;
        
        // 分页参数
        if (page && size) {
          params.append('page', String(page));
          params.append('size', String(size));
        } else {
          params.append('page', '1');
          params.append('size', '100');
        }
        
        // 搜索参数 - 合并姓名和员工编号搜索
        if (full_name_contains || employee_code_contains) {
          const searchTerms = [full_name_contains, employee_code_contains].filter(Boolean);
          if (searchTerms.length > 0) {
            params.append('search', searchTerms.join(' '));
          }
        }
        
        // 部门筛选
        if (department_id) {
          params.append('department_id', String(department_id));
        }
        
        // 在职状态筛选
        if (is_active !== undefined) {
          params.append('is_active', String(is_active));
        }
      } else {
        params.append('page', '1');
        params.append('size', '100');
      }
      
      const queryString = params.toString();
      const url = `/employees${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<{
        data: Array<{
          id: number;
          employee_code?: string;
          first_name: string;
          last_name: string;
          email?: string;
          phone_number?: string;
          id_number?: string;
          hire_date?: string;
          status_lookup_value_id?: number;
          department_id?: number;
          departmentName?: string;
          personnel_category_id?: number;
          personnelCategoryName?: string;
          actual_position_id?: number;
          actualPositionName?: string;
          social_security_client_number?: string;
          housing_fund_client_number?: string;
          bank_name?: string;
          bank_account_number?: string;
          created_at?: string;
          updated_at?: string;
        }>;
        meta: {
          page: number;
          size: number;
          total: number;
          totalPages: number;
        };
      }>(url);
      
      // 转换为预期的分页格式
      const data = response.data.data.map(item => ({
        id: item.id,
        employee_code: item.employee_code,
        first_name: item.first_name,
        last_name: item.last_name,
        full_name: `${item.first_name || ''} ${item.last_name || ''}`.trim(),
        email: item.email,
        phone_number: item.phone_number,
        id_number: item.id_number,
        hire_date: item.hire_date || '',
        status_lookup_value_id: item.status_lookup_value_id || 1,
        department_id: item.department_id,
        department_name: item.departmentName,
        personnel_category_id: item.personnel_category_id,
        personnel_category_name: item.personnelCategoryName,
        actual_position_id: item.actual_position_id,
        position_name: item.actualPositionName,
        social_security_client_number: item.social_security_client_number,
        housing_fund_client_number: item.housing_fund_client_number,
        is_active: true, // 默认为在职，可根据实际status判断
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      }));
      
      // 直接使用传统API返回的分页信息
      return {
        data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('获取员工列表失败:', error);
      throw error;
    }
  }

  // 获取单个员工详情 - 使用传统ORM API (支持所有字段的修改和完整信息获取)
  async getEmployeeById(id: string | number): Promise<EmployeeManagementItem> {
    try {
      const response = await apiClient.get<{data: any}>(`/employees/${id}`);
      
      // 检查响应数据结构 - 后端返回格式为 {data: {...员工信息...}}
      const employee = response.data.data;
      
      if (!employee || !employee.id) {
        throw new Error('员工数据格式不正确或员工不存在');
      }
      
      // 转换后端数据为前端期望的格式
      const result = {
        id: employee.id,
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name,
        full_name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        phone_number: employee.phone_number,
        id_number: employee.id_number,
        date_of_birth: employee.date_of_birth,
        gender_lookup_value_id: employee.gender_lookup_value_id,
        nationality: employee.nationality,
        ethnicity: employee.ethnicity,
        hire_date: employee.hire_date || '',
        first_work_date: employee.first_work_date,
        status_lookup_value_id: employee.status_lookup_value_id,
        employment_type_lookup_value_id: employee.employment_type_lookup_value_id,
        education_level_lookup_value_id: employee.education_level_lookup_value_id,
        marital_status_lookup_value_id: employee.marital_status_lookup_value_id,
        political_status_lookup_value_id: employee.political_status_lookup_value_id,
        contract_type_lookup_value_id: employee.contract_type_lookup_value_id,
        home_address: employee.home_address,
        emergency_contact_name: employee.emergency_contact_name,
        emergency_contact_phone: employee.emergency_contact_phone,
        department_id: employee.department_id,
        department_name: employee.current_department?.name,
        personnel_category_id: employee.personnel_category_id,
        personnel_category_name: employee.personnel_category?.name,
        actual_position_id: employee.actual_position_id,
        position_name: employee.actual_position?.name,
        career_position_level_date: employee.career_position_level_date,
        current_position_start_date: employee.current_position_start_date,
        salary_level_lookup_value_id: employee.salary_level_lookup_value_id,
        salary_grade_lookup_value_id: employee.salary_grade_lookup_value_id,
        ref_salary_level_lookup_value_id: employee.ref_salary_level_lookup_value_id,
        job_position_level_lookup_value_id: employee.job_position_level_lookup_value_id,
        interrupted_service_years: employee.interrupted_service_years,
        social_security_client_number: employee.social_security_client_number,
        housing_fund_client_number: employee.housing_fund_client_number || '',
        bank_name: employee.bank_name,
        bank_account_number: employee.bank_account_number,
        is_active: employee.status?.code === 'ACTIVE',
        created_at: employee.created_at || new Date().toISOString(),
        updated_at: employee.updated_at || new Date().toISOString(),
      };
      
      return result;
    } catch (error) {
      console.error('获取员工详情失败:', error);
      throw error;
    }
  }

  // 创建员工 - 使用传统ORM API (支持复杂业务逻辑)
  async createEmployee(data: CreateEmployeeData): Promise<EmployeeManagementItem> {
    try {
      const response = await apiClient.post<{ data: EmployeeManagementItem }>('/employees/', data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('创建员工失败:', error);
      throw error;
    }
  }

  // 更新员工 - 使用传统ORM API (支持复杂业务逻辑)
  async updateEmployee(id: string | number, data: UpdateEmployeeData): Promise<EmployeeManagementItem> {
    try {
      const response = await apiClient.put<{ data: EmployeeManagementItem }>(`/employees/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('更新员工失败:', error);
      throw error;
    }
  }

  // 删除员工 - 使用传统ORM API (支持复杂业务逻辑)
  async deleteEmployee(id: string | number): Promise<void> {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch (error) {
      console.error('删除员工失败:', error);
      throw error;
    }
  }

  // 批量删除员工
  async batchDeleteEmployees(ids: (string | number)[]): Promise<void> {
    try {
      await Promise.all(ids.map(id => this.deleteEmployee(id)));
    } catch (error) {
      console.error('批量删除员工失败:', error);
      throw error;
    }
  }

  // 批量创建员工 - 使用传统ORM API (支持复杂业务逻辑和事务处理)
  async bulkCreateEmployees(employees: CreateEmployeeData[]): Promise<{
    success_count: number;
    failed_count: number;
    total_count: number;
    created_employees: EmployeeManagementItem[];
    failed_records: Array<{
      original_index: number;
      employee_code?: string;
      id_number?: string;
      first_name?: string;
      last_name?: string;
      errors: string[];
    }>;
  }> {
    try {
      const response = await apiClient.post('/employees/bulk', employees);
      return response.data;
    } catch (error) {
      console.error('批量创建员工失败:', error);
      throw error;
    }
  }

  // 获取部门列表（用于下拉选择）
  async getDepartments(): Promise<Array<{ id: number; name: string; code: string }>> {
    try {
      const response = await apiClient.get('/views-optimized/departments');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('获取部门列表失败:', error);
      return [];
    }
  }

  // 获取人员类别列表
  async getPersonnelCategories(departmentId?: number): Promise<Array<{ id: number; name: string; code: string }>> {
    try {
      const params = departmentId ? `?department_id=${departmentId}` : '';
      const response = await apiClient.get(`/views-optimized/personnel-categories${params}`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('获取人员类别列表失败:', error);
      return [];
    }
  }

  // 获取职位列表
  async getPositions(): Promise<Array<{ id: number; name: string; code: string }>> {
    try {
      const response = await apiClient.get('/positions');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('获取职位列表失败:', error);
      return [];
    }
  }

  // 获取查找值列表（性别、状态、雇佣类型等）
  async getLookupValues(lookupTypeCode: string): Promise<Array<{ 
    id: number; 
    value: string; 
    label: string; 
    is_active: boolean 
  }>> {
    try {
      // 优先使用公共接口
      let response;
      try {
        response = await apiClient.get(`/config/lookup-values-public?lookup_type_code=${lookupTypeCode}`);
      } catch (publicError) {
        // 降级到权限接口
        response = await apiClient.get(`/config/lookup-values?lookup_type_code=${lookupTypeCode}`);
      }
      
      const data = response.data.data || response.data || [];
      return data.map((item: any) => ({
        id: item.id,
        value: item.code || '',
        label: item.name || '',
        is_active: item.is_active ?? true,
      }));
    } catch (error) {
      console.error(`获取查找值列表失败 (${lookupTypeCode}):`, error);
      return [];
    }
  }
}

// 导出单例实例
export const employeeManagementApi = new EmployeeManagementApi(); 