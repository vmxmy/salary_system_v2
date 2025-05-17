import type { Department, ContractStatus } from '../pages/HRManagement/types'; // Types that are only used as types
import { EmploymentStatus, Gender, EmploymentType, ContractType, EducationLevel, LeaveType, MaritalStatus, PoliticalStatus } from '../pages/HRManagement/types'; // Enums used as values
import type { LookupItem, JobTitle } from '../pages/HRManagement/types'; // Changed PositionItem to JobTitle
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

// Helper type for raw API response for JobTitles (formerly Positions)
interface ApiJobTitle { // Renamed from ApiPosition
  id: number | string;
  name: string;
  code?: string;
  is_active?: boolean;
  parent_job_title_id?: number | string | null; // Ensure this field name matches API if it provides parent id for job titles
}

// Internal type that extends the imported JobTitle to include parentId for tree building
interface JobTitleWithParentId extends JobTitle { // Renamed from PositionItemWithParentId
  parentId?: string;
  children?: JobTitleWithParentId[]; 
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
    map.set(String(dept.id), dept); // Use String(dept.id) as map key is string
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

// Helper function to build tree structure from flat list of job titles
const buildJobTitleTree = (flatJobTitles: JobTitleWithParentId[]): JobTitle[] => { // Renamed from buildPositionTree
  const map = new Map<string, JobTitleWithParentId>();
  const roots: JobTitleWithParentId[] = [];

  flatJobTitles.forEach(jt => { // Renamed pos to jt
    jt.children = jt.children || [];
    map.set(String(jt.id), jt); // Use String(jt.id) as JobTitle.id is number and map key is string
  });

  flatJobTitles.forEach(jt => { // Renamed pos to jt
    if (jt.parentId && map.has(jt.parentId)) {
      const parent = map.get(jt.parentId)!;
      const parentChildren = parent.children as JobTitle[] | undefined; 
      if (parentChildren) {
        parentChildren.push(jt as JobTitle); 
      } else {
        parent.children = [jt as JobTitle];
      }
    } else {
      roots.push(jt);
    }
  });
  return roots as JobTitle[]; 
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

      const departmentsWithParent: DepartmentWithParentId[] = rawDepartments
        .filter(dept => dept.is_active !== false)
        .map(apiDept => ({
          id: Number(apiDept.id), // Ensure ID is number to match Department type
          name: apiDept.name,
          code: apiDept.code,
          value: Number(apiDept.id), // For select options
          label: apiDept.name, // For select options
          children: [], 
          parentId: apiDept.parent_department_id ? String(apiDept.parent_department_id) : undefined,
          is_active: apiDept.is_active,
        }));

      return buildDepartmentTree(departmentsWithParent);
    } catch (error) {
      console.error('Failed to fetch departments lookup:', error);
      message.error('获取部门列表失败');
      return [];
    }
  },

  getEmployeeStatusesLookup: async (): Promise<LookupItem[]> => {
    // console.log('Mock lookupService: Fetching employee statuses');
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
    // console.log('Mock lookupService: Fetching genders');
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
    // console.log('Mock lookupService: Fetching education levels');
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
    // console.log('Mock lookupService: Fetching employment types');
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
    // console.log('Mock lookupService: Fetching contract types');
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
    // console.log('Mock lookupService: Fetching marital statuses');
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
    // console.log('Mock lookupService: Fetching political statuses');
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

  getJobTitlesLookup: async (): Promise<JobTitle[]> => { // Renamed from getPositionsLookup
    try {
      const response = await apiClient.get<{ data: ApiJobTitle[] } | { data: { data: ApiJobTitle[] } }>('/job-titles');
      
      let rawJobTitles: ApiJobTitle[];
      if ('data' in response.data && Array.isArray(response.data.data)) {
        rawJobTitles = response.data.data;
      } else if (Array.isArray(response.data)) { 
        rawJobTitles = response.data as ApiJobTitle[];
      } else {
        console.error('lookupService: Unexpected job titles API response structure:', response.data);
        return [];
      }

      const jobTitlesWithParent: JobTitleWithParentId[] = rawJobTitles
        .filter(jt => jt.is_active !== false) 
        .map(apiJt => ({
          id: Number(apiJt.id),       // Ensure ID is number to match JobTitle type
          name: apiJt.name,        
          code: apiJt.code,       
          value: Number(apiJt.id),  // Use numeric ID for value if JobTitle value is number
          label: apiJt.name,        
          children: [],
          parentId: apiJt.parent_job_title_id ? String(apiJt.parent_job_title_id) : undefined,
          is_active: apiJt.is_active,
          // description and other fields from JobTitle can be mapped here if available in ApiJobTitle
        }));

      return buildJobTitleTree(jobTitlesWithParent); 
    } catch (error) {
      console.error('Failed to fetch job titles lookup:', error);
      message.error('获取职位列表失败');
      return [];
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