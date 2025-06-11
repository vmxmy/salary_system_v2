/**
 * 员工信息更新的自定义钩子
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { employeeService } from '../../../../services/employeeService';
import { QUERY_KEYS } from '../constants/employeeConstants.tsx';
import type { EmployeeEditFormData, MyEmployeeInfo } from '../types/employee';
import { useAuthStore } from '../../../../store/authStore';

/**
 * 员工信息更新钩子
 */
export const useEmployeeUpdate = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { currentUser, currentUserNumericId } = useAuthStore();

  /**
   * 更新员工信息的mutation
   */
  const updateMutation = useMutation({
    mutationFn: async (formData: EmployeeEditFormData): Promise<MyEmployeeInfo> => {
      if (!currentUserNumericId) {
        throw new Error('用户未登录');
      }

      try {
        // 数据转换和清理
        const updatePayload = transformFormDataToUpdatePayload(formData);
        
        // 调用更新API
        const updatedEmployee = await employeeService.updateEmployee(
          String(currentUserNumericId),
          updatePayload
        );

        return updatedEmployee;
      } catch (error: any) {
        console.error('更新员工信息失败:', error);
        
        // 处理特定错误
        if (error.response?.status === 400) {
          const errorDetails = error.response?.data?.detail;
          if (errorDetails && typeof errorDetails === 'object') {
            // 如果是字段验证错误，抛出详细错误信息
            throw new Error(formatValidationErrors(errorDetails));
          }
          throw new Error('数据格式错误，请检查输入信息');
        }
        
        if (error.response?.status === 403) {
          throw new Error('您没有权限修改员工信息');
        }
        
        if (error.response?.status === 404) {
          throw new Error('员工信息不存在');
        }

        throw new Error('更新失败，请稍后重试');
      }
    },
    onSuccess: (updatedEmployee) => {
      // 更新缓存
      queryClient.setQueryData(
        [QUERY_KEYS.MY_INFO, currentUserNumericId],
        updatedEmployee
      );
      
      // 重新获取相关数据
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MY_INFO],
      });

      message.success('员工信息更新成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '更新失败，请稍后重试');
    },
  });

  /**
   * 转换表单数据为更新载荷
   */
  const transformFormDataToUpdatePayload = (formData: EmployeeEditFormData) => {
    const payload: any = { ...formData };

    // 处理日期字段
    const dateFields = [
      'date_of_birth',
      'hire_date',
      'first_work_date',
      'current_position_start_date',
      'career_position_level_date',
    ];

    dateFields.forEach(field => {
      if (payload[field]) {
        // 如果是dayjs对象，转换为字符串
        if (payload[field] && typeof payload[field].format === 'function') {
          payload[field] = payload[field].format('YYYY-MM-DD');
        }
      }
    });

    // 清理空值
    Object.keys(payload).forEach(key => {
      if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
        delete payload[key];
      }
    });

    return payload;
  };

  /**
   * 格式化验证错误信息
   */
  const formatValidationErrors = (errors: Record<string, string[]>): string => {
    const errorMessages: string[] = [];
    
    Object.entries(errors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          errorMessages.push(`${getFieldDisplayName(field)}: ${msg}`);
        });
      }
    });

    return errorMessages.join('; ');
  };

  /**
   * 获取字段显示名称
   */
  const getFieldDisplayName = (fieldName: string): string => {
    const fieldNameMap: Record<string, string> = {
      first_name: '名',
      last_name: '姓',
      date_of_birth: '出生日期',
      gender_lookup_value_id: '性别',
      id_number: '身份证号',
      nationality: '国籍',
      ethnicity: '民族',
      email: '邮箱',
      phone_number: '手机号',
      home_address: '家庭地址',
      emergency_contact_name: '紧急联系人',
      emergency_contact_phone: '紧急联系人电话',
      department_id: '部门',
      personnel_category_id: '人员类别',
      actual_position_id: '职位',
      employment_type_lookup_value_id: '雇佣类型',
      job_position_level_lookup_value_id: '职务级别',
      hire_date: '入职日期',
      first_work_date: '首次工作日期',
      current_position_start_date: '当前职位开始日期',
      career_position_level_date: '职级评定日期',
      interrupted_service_years: '中断服务年限',
      education_level_lookup_value_id: '学历',
      marital_status_lookup_value_id: '婚姻状况',
      political_status_lookup_value_id: '政治面貌',
      salary_level_lookup_value_id: '工资级别',
      salary_grade_lookup_value_id: '工资档次',
      ref_salary_level_lookup_value_id: '参照正编薪级',
      social_security_client_number: '社保客户号',
    };

    return fieldNameMap[fieldName] || fieldName;
  };

  /**
   * 执行更新操作
   */
  const updateEmployeeInfo = async (formData: EmployeeEditFormData) => {
    return updateMutation.mutateAsync(formData);
  };

  /**
   * 验证表单数据
   */
  const validateFormData = (formData: EmployeeEditFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 基本验证
    if (!formData.first_name?.trim()) {
      errors.push('名不能为空');
    }

    if (!formData.last_name?.trim()) {
      errors.push('姓不能为空');
    }

    if (!formData.hire_date) {
      errors.push('入职日期不能为空');
    }

    // 邮箱格式验证
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('邮箱格式不正确');
    }

    // 手机号格式验证
    if (formData.phone_number && !/^1[3-9]\d{9}$/.test(formData.phone_number)) {
      errors.push('手机号格式不正确');
    }

    // 身份证号格式验证
    if (formData.id_number) {
      const idCardRegex = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
      if (!idCardRegex.test(formData.id_number)) {
        errors.push('身份证号格式不正确');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    // Mutation状态
    isPending: updateMutation.isPending,
    isError: updateMutation.isError,
    error: updateMutation.error,
    isSuccess: updateMutation.isSuccess,
    
    // 方法
    updateEmployeeInfo,
    validateFormData,
    reset: updateMutation.reset,
    
    // 原始mutation（如果需要更多控制）
    updateMutation,
  };
}; 