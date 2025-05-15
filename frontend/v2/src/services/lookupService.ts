import type { Department, ContractStatus } from '../pages/HRManagement/types'; // Types that are only used as types
import { EmploymentStatus, Gender, EmploymentType, ContractType, EducationLevel, LeaveType, MaritalStatus, PoliticalStatus } from '../pages/HRManagement/types'; // Enums used as values
import type { LookupItem, PositionItem } from '../pages/HRManagement/types';
import apiClient from '../api'; // Added apiClient import
import { message } from 'antd'; // Added message import

// General Lookup Item type
// export interface LookupItem {
//   value: string | number;
//   label: string;
//   disabled?: boolean;
// }

// Simulate API delay
const RqDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper type for raw API response for departments
interface ApiDepartment {
  id: number | string;
  name: string;
  code?: string; // Assuming code might be used as a value or for other logic
  parent_department_id?: number | string | null;
  // Add other relevant fields from your actual API response if needed
  is_active?: boolean;
}

// Internal type that extends the imported Department to include parentId for tree building
interface DepartmentWithParentId extends Department {
  parentId?: string;
}

// Helper type for raw API response for positions
interface ApiPosition {
  id: number | string;
  name: string;
  code?: string;
  is_active?: boolean;
  parent_job_title_id?: number | string | null;
}

// Internal type that extends the imported PositionItem to include parentId for tree building
interface PositionItemWithParentId extends PositionItem {
  parentId?: string;
}

// 定义通用的 API Lookup Value 结构
interface ApiLookupValue {
  id: number;
  name: string; // 这是显示名称，例如：'男', '女', '固定期限'
  code: string; // 这是机器可读的代码，例如：'MALE', 'FEMALE', 'FIXED_TERM'
}

// 定义通用的 API Lookup Value 列表响应结构 (用于分页的 lookup values)
// Old interface, to be replaced or removed if not used elsewhere.
// interface ApiLookupValueListResponse {
//   items: ApiLookupValue[];
//   total: number;
//   page: number;
//   size: number;
// }

// New interfaces for the correct API response structure
interface ApiListMeta {
  total: number;
  page: number;
  size: number;
  // Add other meta fields if necessary, e.g., total_pages
}

interface ActualApiLookupValueListResponse {
  data: ApiLookupValue[];
  meta: ApiListMeta;
}

// Mock data for lookups
/*
const mockPositions: PositionItem[] = [
  { id: 'p1', name: '初级软件工程师', departmentId: 'frontend' },
  { id: 'p2', name: '高级软件工程师', departmentId: 'frontend' },
  { id: 'p3', name: '技术经理', departmentId: 'tech' },
  { id: 'p4', name: '人力资源专员', departmentId: 'hr' },
  { id: 'p5', name: '销售代表', departmentId: 'sales' },
  { id: 'p6', name: '产品经理' }, // Global position
];
*/

const mockEmployeeStatuses: LookupItem[] = [
  { value: 1, label: '在职', code: EmploymentStatus.ACTIVE },
  { value: 2, label: '试用期', code: EmploymentStatus.PROBATION },
  { value: 3, label: '休假', code: EmploymentStatus.LEAVE },
  { value: 4, label: '离职', code: EmploymentStatus.TERMINATED },
  { value: 5, label: '待入职', code: EmploymentStatus.PENDING },
];

const mockGender: LookupItem[] = Object.values(Gender).map(g => ({
  value: g,
  label: (() => {
    switch (g) {
      case Gender.MALE: return '男';
      case Gender.FEMALE: return '女';
      case Gender.OTHER: return '其他';
      default: return g;
    }
  })(),
}));

const mockEducationLevels: LookupItem[] = Object.values(EducationLevel).map(el => ({
  value: el,
  label: (() => {
    switch (el) {
      case EducationLevel.HIGH_SCHOOL: return '高中';
      case EducationLevel.DIPLOMA: return '大专';
      case EducationLevel.BACHELOR: return '本科';
      case EducationLevel.MASTER: return '硕士';
      case EducationLevel.DOCTORATE: return '博士';
      case EducationLevel.OTHER: return '其他';
      default: return el;
    }
  })(),
}));

const mockEmploymentTypes: LookupItem[] = Object.values(EmploymentType).map(et => ({
  value: et,
  label: (() => {
    switch (et) {
      case EmploymentType.FULL_TIME: return '全职';
      case EmploymentType.PART_TIME: return '兼职';
      case EmploymentType.CONTRACTOR: return '合同工';
      case EmploymentType.INTERN: return '实习';
      default: return et;
    }
  })(),
}));

const mockContractTypes: LookupItem[] = Object.values(ContractType).map(ct => ({
  value: ct,
  label: (() => {
    switch (ct) {
      case ContractType.FIXED_TERM: return '固定期限';
      case ContractType.PERMANENT: return '无固定期限';
      case ContractType.PROJECT_BASED: return '项目制';
      case ContractType.OTHER: return '其他';
      default: return ct;
    }
  })(),
}));

const mockMaritalStatuses: LookupItem[] = Object.values(MaritalStatus).map(s => ({ value: s, label: s })); // TODO: Provide proper labels
const mockPoliticalStatuses: LookupItem[] = Object.values(PoliticalStatus).map(s => ({ value: s, label: s })); // TODO: Provide proper labels

const mockLeaveTypesLookup: LookupItem[] = Object.values(LeaveType).map(lt => ({
  value: lt,
  label: (() => {
    switch (lt) {
      case LeaveType.ANNUAL: return '年假';
      case LeaveType.SICK: return '病假';
      case LeaveType.MATERNITY: return '产假';
      case LeaveType.PATERNITY: return '陪产假';
      case LeaveType.UNPAID: return '无薪假';
      case LeaveType.OTHER: return '其他假期';
      default: return lt;
    }
  })(),
}));

// Helper function to build tree structure from flat list of departments
const buildDepartmentTree = (flatDepartments: DepartmentWithParentId[]): Department[] => {
  const map = new Map<string, DepartmentWithParentId>();
  const roots: DepartmentWithParentId[] = [];

  flatDepartments.forEach(dept => {
    dept.children = dept.children || []; // Ensure children is initialized, using original Department type's children
    map.set(dept.id, dept);
  });

  flatDepartments.forEach(dept => {
    if (dept.parentId && map.has(dept.parentId)) {
      const parent = map.get(dept.parentId)!;
      // Ensure parent.children is treated as (Department[] | undefined) to align with original Department type
      const parentChildren = parent.children as Department[] | undefined;
      if (parentChildren) {
        parentChildren.push(dept as Department); // Cast back to Department for the children array
      } else {
        parent.children = [dept as Department];
      }
    } else {
      roots.push(dept);
    }
  });
  return roots as Department[]; // Cast roots back to Department[]
};

// Helper function to build tree structure from flat list of positions
const buildPositionTree = (flatPositions: PositionItemWithParentId[]): PositionItem[] => {
  const map = new Map<string, PositionItemWithParentId>();
  const roots: PositionItemWithParentId[] = [];

  flatPositions.forEach(pos => {
    pos.children = pos.children || [];
    map.set(pos.id, pos);
  });

  flatPositions.forEach(pos => {
    if (pos.parentId && map.has(pos.parentId)) {
      const parent = map.get(pos.parentId)!;
      const parentChildren = parent.children as PositionItem[] | undefined;
      if (parentChildren) {
        parentChildren.push(pos as PositionItem);
      } else {
        parent.children = [pos as PositionItem];
      }
    } else {
      roots.push(pos);
    }
  });
  return roots as PositionItem[];
};

const API_BASE_PATH = 'lookup/values'; // Changed from 'config/lookup-values'

export const lookupService = {
  getDepartmentsLookup: async (): Promise<Department[]> => {
    try {
      const response = await apiClient.get<{ data: ApiDepartment[] } | { data: { data: ApiDepartment[] } }>('/departments');

      let rawDepartments: ApiDepartment[];
      if ('data' in response.data && Array.isArray(response.data.data)) {
        rawDepartments = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawDepartments = response.data as ApiDepartment[];
      } else {
        console.error('lookupService: Unexpected departments API response structure:', response.data);
        return [];
      }

      // Map to DepartmentWithParentId first
      const departmentsWithParent: DepartmentWithParentId[] = rawDepartments
        .filter(dept => dept.is_active !== false)
        .map(apiDept => ({
          id: String(apiDept.id),
          value: String(apiDept.id), // 使用id作为value，保持与key一致
          label: apiDept.name,
          name: apiDept.name,
          // Ensure children is part of Department type, initialize if not directly from apiDept
          children: [], // Initialize based on Department type, buildDepartmentTree will populate it
          parentId: apiDept.parent_department_id ? String(apiDept.parent_department_id) : undefined,
        }));

      return buildDepartmentTree(departmentsWithParent);
    } catch (error) {
      console.error('lookupService: Failed to fetch departments:', error);
      throw error;
    }
  },

  getEmployeeStatusesLookup: async (): Promise<LookupItem[]> => {
    console.log('Mock lookupService: Fetching employee statuses');
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(API_BASE_PATH, {
        params: { type_code: 'EMPLOYEE_STATUS' },
      });
      return (response.data?.data || []).map(item => ({
        value: item.id, 
        label: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error('Error fetching employee statuses lookup:', error);
      message.error('获取员工状态选项失败');
      return [];
    }
  },

  getGenderLookup: async (): Promise<LookupItem[]> => {
    console.log('Mock lookupService: Fetching genders');
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(API_BASE_PATH, {
        params: { type_code: 'GENDER' },
      });
      return (response.data?.data || []).map(item => ({
        value: item.id,
        label: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error('lookupService: Failed to fetch genders:', error);
      message.error('获取性别选项失败');
      return []; // Return empty array on error
    }
  },

  getEducationLevelsLookup: async (): Promise<LookupItem[]> => {
    console.log('Mock lookupService: Fetching education levels');
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(API_BASE_PATH, {
        params: { type_code: 'EDUCATION_LEVEL' },
      });
      return (response.data?.data || []).map(item => ({
        value: item.id,
        label: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error('Error fetching education levels lookup:', error);
      message.error('获取学历选项失败');
      return [];
    }
  },

  getEmploymentTypesLookup: async (): Promise<LookupItem[]> => {
    console.log('Mock lookupService: Fetching employment types');
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(API_BASE_PATH, {
        params: { type_code: 'EMPLOYMENT_TYPE' },
      });
      return (response.data?.data || []).map(item => ({
        value: item.id,
        label: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error('Error fetching employment types lookup:', error);
      message.error('获取雇佣类型选项失败');
      return [];
    }
  },

  getContractTypesLookup: async (): Promise<LookupItem[]> => {
    console.log('Mock lookupService: Fetching contract types');
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(API_BASE_PATH, {
        params: { type_code: 'CONTRACT_TYPE' }, 
      });
      return (response.data?.data || []).map(item => ({
        value: item.id,
        label: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error('Error fetching contract types lookup:', error);
      message.error('获取合同类型选项失败');
      return [];
    }
  },

  getMaritalStatusesLookup: async (): Promise<LookupItem[]> => {
    console.log('Mock lookupService: Fetching marital statuses');
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(API_BASE_PATH, {
        params: { type_code: 'MARITAL_STATUS' }, 
      });
      return (response.data?.data || []).map(item => ({
        value: item.id,
        label: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error('Error fetching marital statuses lookup:', error);
      message.error('获取婚姻状况选项失败');
      return [];
    }
  },

  getPoliticalStatusesLookup: async (): Promise<LookupItem[]> => {
    console.log('Mock lookupService: Fetching political statuses');
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(API_BASE_PATH, {
        params: { type_code: 'POLITICAL_STATUS' }, 
      });
      return (response.data?.data || []).map(item => ({
        value: item.id,
        label: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error('Error fetching political statuses lookup:', error);
      message.error('获取政治面貌选项失败');
      return [];
    }
  },

  getPositionsLookup: async (departmentId?: string): Promise<PositionItem[]> => {
    try {
      let apiUrl = '/job-titles';
      if (departmentId) {
        console.warn(`lookupService: getPositionsLookup called with departmentId=${departmentId}, but API filtering by department is not yet implemented/confirmed for /job-titles. Fetching all positions.`);
      }

      const response = await apiClient.get<{ data: ApiPosition[] } | { data: { data: ApiPosition[] } }>(apiUrl);

      let rawPositions: ApiPosition[];
      if ('data' in response.data && Array.isArray(response.data.data)) {
        rawPositions = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawPositions = response.data as ApiPosition[];
      } else {
        console.error('lookupService: Unexpected positions API response structure:', response.data);
        return [];
      }

      const positionsWithParent: PositionItemWithParentId[] = rawPositions
        .filter(pos => pos.is_active !== false)
        .map(apiPos => ({
          id: String(apiPos.id),
          name: apiPos.name,
          value: String(apiPos.id), // Populate value for TreeSelect
          label: apiPos.name,     // Populate label for TreeSelect
          children: [],           // Initialize children
          parentId: apiPos.parent_job_title_id ? String(apiPos.parent_job_title_id) : undefined,
        }));

      return buildPositionTree(positionsWithParent);
    } catch (error) {
      console.error('lookupService: Failed to fetch positions:', error);
      throw error;
    }
  },

  getLeaveTypesLookup: async (): Promise<LookupItem[]> => {
    await RqDelay(250);
    console.log('Mock lookupService: Fetching leave types');
    return JSON.parse(JSON.stringify(mockLeaveTypesLookup));
  },

  // Example: Fetching positions based on department (can be more complex)
  // async getPositionsLookup(departmentId?: string): Promise<LookupItem[]> {
  //   await RqDelay(200);
  //   const allPositions = [
  //     { value: 'P001', label: '高级软件工程师', departmentId: 'D001' },
  //     { value: 'P002', label: '软件工程师', departmentId: 'D001' },
  //     { value: 'P003', label: '测试工程师', departmentId: 'D001' },
  //     { value: 'P004', label: '市场经理', departmentId: 'D002' },
  //     { value: 'P005', label: '行政助理', departmentId: 'D003' },
  //   ];
  //   if (departmentId) {
  //     return allPositions.filter(p => p.departmentId === departmentId);
  //   }
  //   return allPositions;
  // }

  // getPoliticalStatusLookup, getContractTypeLookup below were duplicates and used wrong path.
  // Correct versions are part of the lookupService object above.
};