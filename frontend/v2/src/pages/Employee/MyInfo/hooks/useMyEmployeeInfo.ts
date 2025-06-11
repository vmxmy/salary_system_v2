/**
 * 获取当前用户员工信息的自定义钩子
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useSelector } from 'react-redux';
import { employeeService } from '../../../../services/employeeService';
import { QUERY_KEYS, CACHE_TIME } from '../constants/employeeConstants.tsx';
import type { MyEmployeeInfo } from '../types/employee';
import type { Employee } from '../../../HRManagement/types';
import type { RootState } from '../../../../store';

/**
 * 获取当前用户员工信息
 */
export const useMyEmployeeInfo = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  
  // 使用Redux store获取认证状态
  const { 
    currentUser, 
    currentUserNumericId, 
    authToken, 
    currentUserId 
  } = useSelector((state: RootState) => state.auth);

  // 获取用户关联的员工ID
  const userEmployeeId = currentUser?.employee_id; // 使用正确的字段名

  // 添加详细调试日志
  console.log('🔍 MyEmployeeInfo Debug (Redux):', {
    currentUser,
    currentUserNumericId,
    authToken: authToken ? '存在' : '不存在',
    currentUserId,
    userEmployeeId, // 这应该是352
  });

  // 添加localStorage原始数据调试
  try {
    const authStorageRaw = localStorage.getItem('persist:auth');
    console.log('📦 Redux persist原始数据:', authStorageRaw);
    if (authStorageRaw) {
      const parsedStorage = JSON.parse(authStorageRaw);
      console.log('📋 解析后的Redux persist:', parsedStorage);
      console.log('🔑 Redux中的authToken:', parsedStorage.authToken ? '存在' : '不存在');
      console.log('👤 Redux中的currentUser:', parsedStorage.currentUser ? JSON.parse(parsedStorage.currentUser) : null);
    }
  } catch (error) {
    console.error('❌ 解析Redux persist失败:', error);
  }

  const {
    data: employeeInfo,
    isLoading,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: [QUERY_KEYS.MY_INFO, userEmployeeId],
    queryFn: async (): Promise<MyEmployeeInfo | null> => {
      try {
        // 检查认证状态
        if (!authToken) {
          throw new Error('用户未登录：没有认证token');
        }

        if (!userEmployeeId) {
          console.error('❌ 用户未关联员工信息:', {
            currentUser,
            userEmployeeId,
            currentUserNumericId,
            currentUserId
          });
          throw new Error('用户未关联员工信息');
        }

        console.log('📡 使用高性能视图API获取员工信息:', userEmployeeId);
        
        // 优化：使用高性能视图API获取员工信息
        const data: any | null = await employeeService.getEmployeeByIdFromView(String(userEmployeeId));
        console.log('✅ 成功获取员工扩展信息 (视图API):', data);
        
        // 转换扩展视图API数据为前端MyEmployeeInfo格式
        if (!data) return null;
        
        const transformedData: MyEmployeeInfo = {
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          employee_code: data.employee_code || '',
          is_active: data.is_active !== undefined ? data.is_active : true,
          
          // 基本信息 - 扩展视图直接提供
          id_number: data.id_number,
          date_of_birth: data.date_of_birth,
          gender_lookup_value_id: data.gender_lookup_value_id,
          genderName: data.gender_name, // 扩展视图已包含名称
          nationality: data.nationality,
          ethnicity: data.ethnicity,
          
          // 联系信息
          email: data.email,
          phone_number: data.phone_number,
          home_address: data.home_address,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          
          // 工作信息 - 扩展视图提供更多字段
          department_id: data.department_id || undefined,
          departmentName: data.department_name,
          actual_position_id: data.actual_position_id || undefined,
          actual_position_name: data.position_name,
          personnel_category_id: data.personnel_category_id === null ? undefined : data.personnel_category_id,
          personnelCategoryName: data.personnel_category_name,
          employment_type_lookup_value_id: data.employment_type_lookup_value_id,
          employmentTypeName: data.employment_type_name, // 扩展视图已包含名称
          job_position_level_lookup_value_id: data.job_position_level_lookup_value_id,
          jobPositionLevelName: data.job_position_level_name, // 扩展视图已包含名称
          
          // 日期字段 - 视图返回字符串格式
          hire_date: data.hire_date,
          first_work_date: data.first_work_date,
          current_position_start_date: data.current_position_start_date,
          career_position_level_date: data.career_position_level_date,
          interrupted_service_years: data.interrupted_service_years === null ? undefined : data.interrupted_service_years,
          
          // 教育背景 - 扩展视图已包含名称
          education_level_lookup_value_id: data.education_level_lookup_value_id,
          educationLevelName: data.education_level_name,
          marital_status_lookup_value_id: data.marital_status_lookup_value_id,
          maritalStatusName: data.marital_status_name,
          political_status_lookup_value_id: data.political_status_lookup_value_id,
          politicalStatusName: data.political_status_name,
          
          // 薪资信息 - 扩展视图已包含名称
          salary_level_lookup_value_id: data.salary_level_lookup_value_id,
          salaryLevelName: data.salary_level_name,
          salary_grade_lookup_value_id: data.salary_grade_lookup_value_id,
          salaryGradeName: data.salary_grade_name,
          ref_salary_level_lookup_value_id: data.ref_salary_level_lookup_value_id,
          refSalaryLevelName: data.ref_salary_level_name,
          
          // 社保信息
          social_security_client_number: data.social_security_client_number,
          
          // 状态信息 - 扩展视图已包含名称
          status_lookup_value_id: data.status_lookup_value_id,
          
          // 时间戳 - 视图返回字符串格式
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        
        console.log('🔄 转换后的员工信息:', transformedData);
        return transformedData;

      } catch (error: any) {
        console.error('❌ 获取员工信息失败:', error);
        
        // 处理特定错误
        if (error.response?.status === 404) {
          message.warning('未找到您的员工信息，请联系管理员');
          return null;
        }
        
        if (error.response?.status === 403) {
          message.error('您没有权限查看员工信息');
          throw error;
        }

        // 添加更详细的错误信息
        const errorMessage = error?.response?.data?.detail?.message || 
                           error?.response?.data?.message || 
                           error?.message || 
                           '获取员工信息失败';
        
        console.error('详细错误信息:', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: errorMessage
        });
        
        message.error(`获取员工信息失败: ${errorMessage}`);
        throw error;
      }
    },
    enabled: !!userEmployeeId && !!authToken, // 需要有员工ID和认证token
    staleTime: CACHE_TIME.MY_INFO,
    gcTime: CACHE_TIME.MY_INFO,
    retry: (failureCount, error: any) => {
      console.log(`🔄 重试 ${failureCount}/3:`, error?.response?.status, error?.message);
      // 对于404和403错误不重试
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  /**
   * 刷新员工信息
   */
  const refreshEmployeeInfo = async () => {
    try {
      await refetch();
      message.success('员工信息已更新');
    } catch (error) {
      console.error('刷新员工信息失败:', error);
    }
  };

  /**
   * 清除缓存并重新获取
   */
  const invalidateEmployeeInfo = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.MY_INFO, userEmployeeId],
    });
  };

  /**
   * 更新本地缓存数据
   */
  const updateCachedEmployeeInfo = (updatedData: Partial<MyEmployeeInfo>) => {
    queryClient.setQueryData(
      [QUERY_KEYS.MY_INFO, userEmployeeId], 
      (oldData: MyEmployeeInfo | null) => {
        if (!oldData) return null;
        return {
          ...oldData,
          ...updatedData,
        };
      }
    );
  };

  /**
   * 获取格式化的员工姓名
   */
  const getEmployeeName = () => {
    if (!employeeInfo) return '--';
    return `${employeeInfo.last_name || ''}${employeeInfo.first_name || ''}`.trim() || '--';
  };

  /**
   * 获取员工状态信息
   */
  const getEmployeeStatus = () => {
    if (!employeeInfo) return null;
    
    // 这里需要根据实际的状态字段来判断
    // 假设有status_lookup_value_id字段
    return {
      id: employeeInfo.status_lookup_value_id,
      isActive: employeeInfo.is_active,
    };
  };

  /**
   * 检查员工信息是否完整
   */
  const checkInfoCompleteness = () => {
    if (!employeeInfo) return { isComplete: false, missingFields: [] };

    const requiredFields = [
      'first_name',
      'last_name', 
      'hire_date',
      'department_id',
      'email',
      'phone_number',
    ];

    const missingFields = requiredFields.filter(field => {
      const value = employeeInfo[field as keyof MyEmployeeInfo];
      return !value || value === '';
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completeness: ((requiredFields.length - missingFields.length) / requiredFields.length) * 100,
    };
  };

  return {
    // 数据
    employeeInfo,
    
    // 状态
    isLoading,
    isError,
    error,
    
    // 方法
    refetch,
    refreshEmployeeInfo,
    invalidateEmployeeInfo,
    updateCachedEmployeeInfo,
    
    // 计算属性
    employeeName: getEmployeeName(),
    employeeStatus: getEmployeeStatus(),
    infoCompleteness: checkInfoCompleteness(),
    
    // 便利属性
    hasEmployeeInfo: !!employeeInfo,
    isEmployeeActive: employeeInfo?.is_active || false,
  };
}; 