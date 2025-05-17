import type { Department } from '../pages/HRManagement/types'; // Types that are only used as types
import { EmploymentStatus, Gender, EmploymentType, ContractType, EducationLevel, LeaveType, MaritalStatus, PoliticalStatus, ContractStatus } from '../pages/HRManagement/types'; // Enums used as values
import type { LookupItem, JobTitle } from '../pages/HRManagement/types'; // Changed PositionItem to JobTitle
import apiClient from '../api'; // Added apiClient import
import { message } from 'antd'; // Added message import

// Define standard Lookup Type Codes used by the backend -- REMOVING THIS as we will fetch dynamically
// export const LookupTypeCodes = { ... } as const;

// Interface for the structure of a single LookupType object from /v2/lookup/types API
interface LookupType {
  id: number;
  code: string; // This is the actual type_code we need for fetchLookupValuesByType
  name: string; // This is the human-readable name we will use as a key, e.g., "性别"
  description?: string;
}

// Interface for the API response of /v2/lookup/types
interface LookupTypeListResponse {
  data: LookupType[]; // data 属性直接是 LookupType 数组
  meta: {
    total_items: number;
    total_pages: number;
    page?: number;
    size?: number;
  };
}

let cachedLookupTypes: readonly LookupType[] | null = null;
let isFetchingLookupTypes = false;
let fetchLookupTypesPromise: Promise<readonly LookupType[] | null> | null = null;

// Fetches all lookup types from the API and caches them
export const fetchAllLookupTypesAndCache = async (): Promise<readonly LookupType[] | null> => {
  if (cachedLookupTypes) {
    return cachedLookupTypes;
  }
  if (isFetchingLookupTypes && fetchLookupTypesPromise) {
    return fetchLookupTypesPromise;
  }

  isFetchingLookupTypes = true;
  fetchLookupTypesPromise = apiClient.get<LookupTypeListResponse>('/lookup/types', {
    params: {
      size: 100, // Assuming up to 100 lookup types, based on openapi.json
      page: 1,
    }
  })
  .then(response => {
    // 调整判断条件以匹配新的 LookupTypeListResponse 结构
    // response.data (axios 的 data) 对应整个 LookupTypeListResponse
    // response.data.data 对应 LookupTypeListResponse 中的 data 数组
    if (response.data && Array.isArray(response.data.data)) {
      cachedLookupTypes = Object.freeze([...response.data.data]); // 从 response.data.data 获取数组
      return cachedLookupTypes;
    }
    console.error('lookupService: Unexpected API response structure for /lookup/types:', response.data);
    message.error('Failed to load lookup type definitions.');
    return null;
  })
  .catch(error => {
    console.error('lookupService: Error fetching lookup types:', error);
    message.error('Error loading lookup type definitions.');
    return null;
  })
  .finally(() => {
    isFetchingLookupTypes = false;
    // fetchLookupTypesPromise = null; // Keep promise to return its result for concurrent calls
  });
  return fetchLookupTypesPromise;
};

// Renamed and modified to search by system code key against the 'code' field of lookup types
const getTypeCodeBySystemCode = async (systemCodeKey: string): Promise<string | undefined> => {
  const allTypes = await fetchAllLookupTypesAndCache();
  if (!allTypes) {
    return undefined;
  }
  // Find the type where its 'code' (from DB, e.g., 'GENDER') matches our systemCodeKey (e.g., LookupSystemCodes.GENDER which is also 'GENDER')
  const foundType = allTypes.find(type => type.code === systemCodeKey);
  if (!foundType) {
    console.warn(`lookupService: Could not find lookup type with system code key "${systemCodeKey}" in cached types. Ensure this key exists in 'config.lookup_types.code' column.`);
  }
  // The 'code' property of the found type is the actual type_code we need.
  return foundType?.code;
};

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
  label: string; // Changed from name to label to match what LookupItem expects directly from API if possible
  value: string; // Changed from code to value for consistency, assuming API code is the value for LookupItem
  code?: string; // Keep original code if needed for other logic
  lookup_type_id?: number;
  lookup_type_code?: string; // If API provides this directly for context
  is_active?: boolean;
  sort_order?: number;
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
  total_items: number; // Adjusted to match typical meta, or use total if API gives that
  total_pages: number; 
  page?: number; // openapi shows page and size as request params, not always in response meta
  size?: number;
}

interface ActualApiLookupValueListResponse {
  data: ApiLookupValue[]; // Expecting an array of ApiLookupValue
}

interface LookupValueListResponse { // As per openapi.json
  data: {
    items: ApiLookupValue[];
  };
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

// REMOVING MOCK DATA as we will fetch from API
/*
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

const mockMaritalStatuses: LookupItem[] = Object.values(MaritalStatus).map(s => ({ value: s, label: s }));
const mockPoliticalStatuses: LookupItem[] = Object.values(PoliticalStatus).map(s => ({ value: s, label: s }));

const mockEmployeeStatuses: LookupItem[] = [
  { value: 1, label: '在职', code: EmploymentStatus.ACTIVE },
  { value: 2, label: '试用期', code: EmploymentStatus.PROBATION },
  { value: 3, label: '休假', code: EmploymentStatus.LEAVE },
  { value: 4, label: '离职', code: EmploymentStatus.TERMINATED },
  { value: 5, label: '待入职', code: EmploymentStatus.PENDING },
];

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

const mockPayFrequencies: LookupItem[] = [
  { value: 'monthly', label: '月度' },
  { value: 'bi_weekly', label: '双周' },
  { value: 'weekly', label: '每周' },
  { value: 'annually', label: '年度' },
];
*/

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

// Generic function to fetch lookup values by type code
const fetchLookupValuesByType = async (typeCode: string): Promise<LookupItem[]> => {
  if (!typeCode) { // Added a check for empty typeCode
    console.warn('fetchLookupValuesByType called with empty typeCode.');
    return [];
  }
  try {
    // Assuming the API returns a structure like { data: { items: ApiLookupValue[] } }
    // And we want all items, so setting a large page size.
    // Adjust size if pagination is desired or if API has a max limit.
    const response = await apiClient.get<LookupValueListResponse>(`${API_BASE_PATH}`, {
      params: {
        type_code: typeCode,
        is_active: true, // Typically, we only want active lookup values for forms
        size: 100, // API最大允许100，超出会422
        page: 1,
      }
    });
    
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data
        .filter(item => item.is_active !== false)
        .map(apiItem => ({
          value: apiItem.id,
          label: apiItem.label || apiItem.name, // 兼容label或name
          code: apiItem.code,
          id: apiItem.id,
          name: apiItem.label || apiItem.name,
        }));
    }
    console.error(`lookupService: Unexpected API response structure for type_code ${typeCode}:`, response.data);
    message.error(`Failed to load lookup values for type: ${typeCode}`);
    return [];
  } catch (error) {
    console.error(`lookupService: Error fetching lookup values for type_code ${typeCode}:`, error);
    message.error(`Error loading lookup values for type: ${typeCode}.`);
    return [];
  }
};

export const lookupService = {
  // Ensure all lookup types are primed (fetched and cached) when the service is first used or app starts.
  // This can be called early in the application lifecycle.
  primeLookupTypesCache: async (): Promise<void> => {
    await fetchAllLookupTypesAndCache();
  },

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
    const typeCode = await getTypeCodeBySystemCode('EMPLOYEE_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载员工状态选项：类型定义缺失或Code不匹配');
    return [];
  },

  getGenderLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('GENDER'); // Using direct system code string
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载性别选项：类型定义缺失或Code不匹配');
    return [];
  },

  getEducationLevelsLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('EDUCATION_LEVEL');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载学历选项：类型定义缺失或Code不匹配');
    return [];
  },

  getEmploymentTypesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('EMPLOYMENT_TYPE');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载雇佣类型选项：类型定义缺失或Code不匹配');
    return [];
  },

  getContractTypesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('CONTRACT_TYPE');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载合同类型选项：类型定义缺失或Code不匹配');
    return [];
  },

  getMaritalStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('MARITAL_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载婚姻状况选项：类型定义缺失或Code不匹配');
    return [];
  },

  getPoliticalStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('POLITICAL_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载政治面貌选项：类型定义缺失或Code不匹配');
    return [];
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
    const typeCode = await getTypeCodeBySystemCode('LEAVE_TYPE');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载假期类型选项：类型定义缺失或Code不匹配');
    return [];
  },

  getPayFrequenciesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('PAY_FREQUENCY');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载发薪频率选项：类型定义缺失或Code不匹配');
    return [];
  },

  // Mock for contract statuses until API is ready or confirmed
  getContractStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('CONTRACT_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error('无法加载合同状态选项：类型定义缺失或Code不匹配');
    return [];
  },

  // Example of fetching specific lookup values if needed, e.g., for a single value by code
  // async getLookupValueByCode(typeCode: string, valueCode: string): Promise<LookupItem | null> {
  //   const values = await fetchLookupValuesByType(typeCode);
  //   return values.find(v => v.code === valueCode) || null;
  // }
};