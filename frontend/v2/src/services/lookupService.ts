import type { Department } from '../pages/HRManagement/types'; // Types that are only used as types
import { EmploymentStatus, Gender, EmploymentType, ContractType, EducationLevel, LeaveType, MaritalStatus, PoliticalStatus, ContractStatus } from '../pages/HRManagement/types'; // Enums used as values
import type { LookupItem, PersonnelCategory, Position as PositionType } from '../pages/HRManagement/types'; // MODIFIED: No longer JobTitle as PersonnelCategory, ADDED PositionType
import apiClient from '../api'; // Added apiClient import
import { message } from 'antd'; // Added message import
import { employeeService } from './employeeService'; // 添加对employeeService的导入

// Define standard Lookup Type Codes used by the backend -- REMOVING THIS as we will fetch dynamically
// export const LookupTypeCodes = { ... } as const;

// Interface for the structure of a single LookupType object from /v2/lookup/types API
interface LookupType {
  id: number;
  code: string; // This is the actual type_code we need for fetchLookupValuesByType
  name: string; // This is the human-readable name we will use as a key, e.g., {t('common:auto_text_e680a7')}
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
    // console.log({t('common:auto_lookup__e4bdbf')}, cachedLookupTypes.length, {t('common:auto_text_e9a1b9')});
    return cachedLookupTypes;
  }
  if (isFetchingLookupTypes && fetchLookupTypesPromise) {
    // console.log({t('common:auto_lookup___e6ada3')});
    return fetchLookupTypesPromise;
  }

  // console.log({t('common:auto__lookup_get_lookup_types_f09f94')});
  isFetchingLookupTypes = true;
  fetchLookupTypesPromise = apiClient.get<LookupTypeListResponse>('/lookup/types', {
    params: {
      size: 100, // Assuming up to 100 lookup types, based on openapi.json
      page: 1,
    }
  })
  .then(response => {
    // console.log({t('common:auto__lookupapi__e29c85')}, {
    //   status: response.status,
    //   url: response.config.url,
    //   hasData: !!response.data,
    //   dataIsArray: response.data && Array.isArray(response.data.data),
    //   dataLength: response.data && response.data.data ? response.data.data.length : 0,
    // });
    
    // 详细输出响应数据的前几项
    if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      // console.log({t('common:auto_lookup__6c6f6f')});
      // response.data.data.slice(0, 3).forEach((item, index) => {
      //   console.log(`  ${index+1}. id=${item.id}, code="${item.code}", name="${item.name}"`);
      // });
      // console.log({t('common:auto___response_data_data_length__20202e')});
    }
    
    // 调整判断条件以匹配新的 LookupTypeListResponse 结构
    // response.data (axios 的 data) 对应整个 LookupTypeListResponse
    // response.data.data 对应 LookupTypeListResponse 中的 data 数组
    if (response.data && Array.isArray(response.data.data)) {
      cachedLookupTypes = Object.freeze([...response.data.data]); // 从 response.data.data 获取数组
      return cachedLookupTypes;
    }
    // console.error({t('common:auto__lookupservice_api_lookup_types__e29d8c')}, response.data);
    message.error('Failed to load lookup type definitions.');
    return null;
  })
  .catch(error => {
    // console.error({t('common:auto__lookupservice_lookup__e29d8c')}, error);
    // console.error({t('common:auto___e99499')}, error.message);
    // console.error({t('common:auto___e8afb7')}, error.config);
    // if (error.response) {
    //   console.error({t('common:auto___e5938d')}, error.response.data);
    //   console.error({t('common:auto___e5938d')}, error.response.status);
    // }
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
  // console.log(`开始查询系统码 "${systemCodeKey}" 的类型代码`);
  try {
    const allTypes = await fetchAllLookupTypesAndCache();
    if (!allTypes) {
      // console.warn(`查询系统码 "${systemCodeKey}" 失败：缓存类型为空`);
      return undefined;
    }
    
    // 首先尝试直接匹配code字段 (默认方式)
    let foundType = allTypes.find(type => type.code === systemCodeKey);
    
    // 如果没找到，尝试不区分大小写的匹配
    if (!foundType) {
      // console.log(`未找到精确匹配系统码 "${systemCodeKey}"，尝试不区分大小写的匹配...`);
      foundType = allTypes.find(type => type.code?.toUpperCase() === systemCodeKey.toUpperCase());
    }
    
    // 如果仍未找到，检查是否有部分匹配
    if (!foundType) {
      // console.log({t('common:auto____e69caa')});
      foundType = allTypes.find(type =>
        type.code?.includes(systemCodeKey) ||
        systemCodeKey.includes(type.code || '')
      );
    }
    
    if (!foundType) {
      // 如果系统码是PAY_FREQUENCY，可以尝试其他变体名称
      if (systemCodeKey === 'PAY_FREQUENCY') {
        // console.log({t('common:auto__pay_frequency__e789b9')});
        foundType = allTypes.find(type =>
          type.code?.includes('PAY') ||
          type.code?.includes('FREQUENCY') ||
          type.name?.includes({t('common:auto_text_e9a291')}) ||
          type.name?.includes({t('common:auto_text_e896aa')}) ||
          type.name?.includes({t('common:auto_text_e5b7a5')})
        );
      }
      // 如果系统码是CONTRACT_STATUS，可以尝试其他变体名称
      else if (systemCodeKey === 'CONTRACT_STATUS') {
        // console.log({t('common:auto__contract_status__e789b9')});
        foundType = allTypes.find(type =>
          type.code?.includes('CONTRACT') ||
          type.code?.includes('STATUS') ||
          type.name?.includes({t('common:auto_text_e59088')}) ||
          type.name?.includes({t('common:auto_text_e78ab6')})
        );
      }
    }
    
    if (!foundType) {
      // console.warn(`lookupService: Could not find lookup type with system code key "${systemCodeKey}" in cached types. Ensure this key exists in 'config.lookup_types.code' column.`);
    } else {
      // console.log(`找到系统码 "${systemCodeKey}" 对应的类型：`, foundType);
    }
    
    // The 'code' property of the found type is the actual type_code we need.
    return foundType?.code;
  } catch (error) {
    // console.error(`查询系统码 "${systemCodeKey}" 时发生错误:`, error);
    return undefined;
  }
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

// Helper type for raw API response for PersonnelCategories (formerly JobTitles)
interface ApiPersonnelCategory { // MODIFIED from ApiJobTitle
  id: number | string;
  name: string;
  code?: string;
  is_active?: boolean;
  parent_category_id?: number | string | null; // MODIFIED from parent_job_title_id, and ensure it matches API response field name for parent ID
}

// Internal type that extends the imported PersonnelCategory to include parentId for tree building
interface PersonnelCategoryWithParentId extends PersonnelCategory { // MODIFIED from JobTitleWithParentId
  parentId?: string;
  children?: PersonnelCategoryWithParentId[]; 
}

// ADDED for Position
interface ApiPosition { 
  id: number | string;
  name: string;
  code?: string;
  is_active?: boolean;
  parent_position_id?: number | string | null; 
}

// ADDED for Position
interface PositionWithParentId extends PositionType { 
  parentId?: string;
  children?: PositionWithParentId[]; 
}

// 定义通用的 API Lookup Value 结构
interface ApiLookupValue {
  id: number;
  label?: string; // Changed from name to label to match what LookupItem expects directly from API if possible
  name?: string;  // 添加name属性，API实际返回的是name而不是label
  value?: string; // Changed from code to value for consistency, assuming API code is the value for LookupItem
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
  { id: 'p1', name: {t('common:auto_text_e5889d')}, departmentId: 'frontend' },
  { id: 'p2', name: {t('common:auto_text_e9ab98')}, departmentId: 'frontend' },
  { id: 'p3', name: {t('common:auto_text_e68a80')}, departmentId: 'tech' },
  { id: 'p4', name: {t('common:auto_text_e4baba')}, departmentId: 'hr' },
  { id: 'p5', name: {t('common:auto_text_e99480')}, departmentId: 'sales' },
  { id: 'p6', name: {t('common:auto_text_e4baa7')} }, // Global position
];
*/

// REMOVING MOCK DATA as we will fetch from API
/*
const mockGender: LookupItem[] = Object.values(Gender).map(g => ({
  value: g,
  label: (() => {
    switch (g) {
      case Gender.MALE: return {t('common:auto_text_e794b7')};
      case Gender.FEMALE: return {t('common:auto_text_e5a5b3')};
      case Gender.OTHER: return {t('common:auto_text_e585b6')};
      default: return g;
    }
  })(),
}));

const mockEducationLevels: LookupItem[] = Object.values(EducationLevel).map(el => ({
  value: el,
  label: (() => {
    switch (el) {
      case EducationLevel.HIGH_SCHOOL: return {t('common:auto_text_e9ab98')};
      case EducationLevel.DIPLOMA: return {t('common:auto_text_e5a4a7')};
      case EducationLevel.BACHELOR: return {t('common:auto_text_e69cac')};
      case EducationLevel.MASTER: return {t('common:auto_text_e7a195')};
      case EducationLevel.DOCTORATE: return {t('common:auto_text_e58d9a')};
      case EducationLevel.OTHER: return {t('common:auto_text_e585b6')};
      default: return el;
    }
  })(),
}));

const mockEmploymentTypes: LookupItem[] = Object.values(EmploymentType).map(et => ({
  value: et,
  label: (() => {
    switch (et) {
      case EmploymentType.FULL_TIME: return {t('common:auto_text_e585a8')};
      case EmploymentType.PART_TIME: return {t('common:auto_text_e585bc')};
      case EmploymentType.CONTRACTOR: return {t('common:auto_text_e59088')};
      case EmploymentType.INTERN: return {t('common:auto_text_e5ae9e')};
      default: return et;
    }
  })(),
}));

const mockContractTypes: LookupItem[] = Object.values(ContractType).map(ct => ({
  value: ct,
  label: (() => {
    switch (ct) {
      case ContractType.FIXED_TERM: return {t('common:auto_text_e59bba')};
      case ContractType.PERMANENT: return {t('common:auto_text_e697a0')};
      case ContractType.PROJECT_BASED: return {t('common:auto_text_e9a1b9')};
      case ContractType.OTHER: return {t('common:auto_text_e585b6')};
      default: return ct;
    }
  })(),
}));

const mockMaritalStatuses: LookupItem[] = Object.values(MaritalStatus).map(s => ({ value: s, label: s }));
const mockPoliticalStatuses: LookupItem[] = Object.values(PoliticalStatus).map(s => ({ value: s, label: s }));

const mockEmployeeStatuses: LookupItem[] = [
  { value: 1, label: {t('common:auto_text_e59ca8')}, code: EmploymentStatus.ACTIVE },
  { value: 2, label: {t('common:auto_text_e8af95')}, code: EmploymentStatus.PROBATION },
  { value: 3, label: {t('common:auto_text_e4bc91')}, code: EmploymentStatus.LEAVE },
  { value: 4, label: {t('common:auto_text_e7a6bb')}, code: EmploymentStatus.TERMINATED },
  { value: 5, label: {t('common:auto_text_e5be85')}, code: EmploymentStatus.PENDING },
];

const mockLeaveTypesLookup: LookupItem[] = Object.values(LeaveType).map(lt => ({
  value: lt,
  label: (() => {
    switch (lt) {
      case LeaveType.ANNUAL: return {t('common:auto_text_e5b9b4')};
      case LeaveType.SICK: return {t('common:auto_text_e79785')};
      case LeaveType.MATERNITY: return {t('common:auto_text_e4baa7')};
      case LeaveType.PATERNITY: return {t('common:auto_text_e999aa')};
      case LeaveType.UNPAID: return {t('common:auto_text_e697a0')};
      case LeaveType.OTHER: return {t('common:auto_text_e585b6')};
      default: return lt;
    }
  })(),
}));

const mockPayFrequencies: LookupItem[] = [
  { value: 'monthly', label: {t('common:auto_text_e69c88')} },
  { value: 'bi_weekly', label: {t('common:auto_text_e58f8c')} },
  { value: 'weekly', label: {t('common:auto_text_e6af8f')} },
  { value: 'annually', label: {t('common:auto_text_e5b9b4')} },
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

// Helper function to build tree structure from flat list of personnel categories
const buildPersonnelCategoryTree = (flatPersonnelCategories: PersonnelCategoryWithParentId[]): PersonnelCategory[] => { // MODIFIED from buildJobTitleTree
  const map = new Map<string, PersonnelCategoryWithParentId>();
  const roots: PersonnelCategoryWithParentId[] = [];

  flatPersonnelCategories.forEach(pc => { // MODIFIED jt to pc
    pc.children = pc.children || [];
    map.set(String(pc.id), pc); // Use String(pc.id) as PersonnelCategory.id is number and map key is string
  });

  flatPersonnelCategories.forEach(pc => { // MODIFIED jt to pc
    if (pc.parentId && map.has(pc.parentId)) {
      const parent = map.get(pc.parentId)!;
      const parentChildren = parent.children as PersonnelCategory[] | undefined; 
      if (parentChildren) {
        parentChildren.push(pc as PersonnelCategory); 
      } else {
        parent.children = [pc as PersonnelCategory];
      }
    } else {
      roots.push(pc);
    }
  });
  return roots as PersonnelCategory[]; 
};

// ADDED for Position
const buildPositionTree = (flatPositions: PositionWithParentId[]): PositionType[] => {
  const map = new Map<string, PositionWithParentId>();
  const roots: PositionWithParentId[] = [];

  flatPositions.forEach(p => {
    map.set(String(p.id), { ...p, children: [] });
  });

  flatPositions.forEach(p => {
    // Use parent_position_id from PositionWithParentId which should have been mapped from ApiPosition
    const parentId = p.parentId; // This is the critical change
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(map.get(String(p.id))!);
    } else {
      roots.push(map.get(String(p.id))!);
    }
  });
  return roots as PositionType[];
};

const API_BASE_PATH = 'lookup/values'; // Changed from 'config/lookup-values'

// Generic function to fetch lookup values by type code
const fetchLookupValuesByType = async (typeCode: string): Promise<LookupItem[]> => {
  if (!typeCode) { // Added a check for empty typeCode
    // console.warn({t('common:auto__fetchlookupvaluesbytype_typecode_e29d8c')});
    return [];
  }
  
  // console.log(`🔍 开始获取类型 "${typeCode}" 的查找值`);
  
  try {
    // 构建请求URL和参数
    const apiPath = `/${API_BASE_PATH}`;
    const params = {
      type_code: typeCode,
      is_active: true,
      size: 100,
      page: 1,
    };
    
    // console.log({t('common:auto_api_get_apipath__415049')}, { params });
    
    // Assuming the API returns a structure like { data: [...ApiLookupValue] }
    const response = await apiClient.get<ActualApiLookupValueListResponse>(apiPath, { params });
    
    // console.log(`✅ 类型 "${typeCode}" 的API响应:`, {
    //   status: response.status,
    //   url: response.config.url,
    //   hasData: !!response.data,
    //   dataType: response.data ? typeof response.data.data : 'undefined',
    //   isArray: response.data && Array.isArray(response.data.data),
    //   itemCount: response.data && Array.isArray(response.data.data) ? response.data.data.length : 0
    // });
    
    // 详细输出响应数据的前几项
    if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      // console.log(`类型 "${typeCode}" 数据预览:`);
      // response.data.data.slice(0, 3).forEach((item, index) => {
      //   console.log(`  ${index+1}. id=${item.id}, name="${item.name || item.label}", code="${item.code}"`);
      // });
      // console.log({t('common:auto___response_data_data_length__20202e')});
    }
    
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data
        .filter(item => item.is_active !== false)
        .map(apiItem => ({
          value: apiItem.id,
          label: apiItem.name || apiItem.label || '', // 首先使用name，因为API数据结构是这样的
          code: apiItem.code,
          id: apiItem.id,
          name: apiItem.name || apiItem.label || '',
        }));
    }
    // console.error({t('common:auto__lookupservice_api_type_code_typecode__e29d8c')}, response.data);
    message.error(`Failed to load lookup values for type: ${typeCode}`);
    return [];
  } catch (error: any) {
    // console.error(`❌ lookupService: 获取类型为"${typeCode}"的查找值时出错:`, error);
    // console.error({t('common:auto___e99499')}, error.message);
    // console.error({t('common:auto___e8afb7')}, error.config);
    // if (error.response) {
    //   console.error({t('common:auto___e5938d')}, error.response.data);
    //   console.error({t('common:auto___e5938d')}, error.response.status);
    // }
    message.error(`获取"${typeCode}"类型的查找值失败`);
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
      const response = await apiClient.get<{ data: ApiDepartment[], meta?: any }>( // Expect ApiDepartment
        '/departments/', 
        { params: { size: 100, is_active: true } } // CORRECTED size to 100
      );
      
      console.log({t('common:auto_getdepartmentslookup_api_raw__676574')}, response.data);

      let rawDepartments: ApiDepartment[];
      // Check if data is nested under a 'data' property or if response itself is the array
      if (response.data && Array.isArray(response.data.data)) {
        rawDepartments = response.data.data;
      } else if (Array.isArray(response.data)) { 
        rawDepartments = response.data as ApiDepartment[];
      } else {
        console.warn('Departments lookup: data array not found or not an array in response:', response.data);
        message.error({t('common:auto___e88eb7')});
        return [];
      }

      if (!rawDepartments || rawDepartments.length === 0) {
        console.log('getDepartmentsLookup: No raw departments returned from API or list is empty.');
        return [];
      }

      const departmentsWithParentId: DepartmentWithParentId[] = rawDepartments.map(apiDept => {
        const deptIdAsNumber = Number(apiDept.id); // Ensure id is treated as number
        return {
          id: deptIdAsNumber, 
          name: apiDept.name,
          code: apiDept.code, 
          is_active: apiDept.is_active,
          value: deptIdAsNumber, // Ensure value is also number, consistent with id
          label: apiDept.name, // Used by transformToTreeData if labelKey is 'name'
          parentId: apiDept.parent_department_id ? String(apiDept.parent_department_id) : undefined,
          children: [], // Initialize for buildDepartmentTree
        } as DepartmentWithParentId; // Explicit cast to satisfy DepartmentWithParentId which extends Department
      });
      
      console.log('getDepartmentsLookup - departmentsWithParentId (first 3):', departmentsWithParentId.slice(0,3));

      const treeResult = buildDepartmentTree(departmentsWithParentId);
      console.log('getDepartmentsLookup - final treeResult (first 3 roots):', treeResult.slice(0,3));
      return treeResult;

    } catch (error) {
      console.error('Error fetching and processing departments lookup:', error);
      message.error({t('common:auto___e88eb7')} + (error instanceof Error ? error.message : {t('common:auto_text_e69caa')}));
      return [];
    }
  },

  getEmployeeStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('EMPLOYEE_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getGenderLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('GENDER'); // Using direct system code string
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getEducationLevelsLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('EDUCATION_LEVEL');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getEmploymentTypesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('EMPLOYMENT_TYPE');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getContractTypesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('CONTRACT_TYPE');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getMaritalStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('MARITAL_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getPoliticalStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('POLITICAL_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getPersonnelCategoriesLookup: async (): Promise<PersonnelCategory[]> => { // MODIFIED from getJobTitlesLookup
    try {
      // MODIFIED path and expected type
      const response = await apiClient.get<{ data: PersonnelCategory[], meta?: any }>(`/personnel-categories/`, { params: { size: 100, page: 1 } }); // CORRECTED size to 100
      console.log({t('common:auto_getpersonnelcategorieslookup_api__676574')}, response.data);
      
      let rawPersonnelCategories: PersonnelCategory[]; // MODIFIED
      if ('data' in response.data && Array.isArray(response.data.data)) {
        rawPersonnelCategories = response.data.data; // MODIFIED
      } else if (Array.isArray(response.data)) { 
        rawPersonnelCategories = response.data as PersonnelCategory[]; // MODIFIED
      } else {
        console.error('lookupService: Unexpected personnel categories API response structure:', response.data); // MODIFIED
        return [];
      }

      console.log('raw personnel categories:', rawPersonnelCategories.slice(0, 3));

      const personnelCategoriesWithParent: PersonnelCategoryWithParentId[] = rawPersonnelCategories // MODIFIED
        .filter(pc => pc.is_active !== false) // MODIFIED jt to pc
        .map(apiPc => ({ // MODIFIED apiJt to apiPc
          id: Number(apiPc.id),       // Ensure ID is number to match PersonnelCategory type
          name: apiPc.name,        
          code: apiPc.code,       
          value: Number(apiPc.id),  // Use numeric ID for value if PersonnelCategory value is number
          label: apiPc.name,        
          children: [],
          parentId: apiPc.parent_category_id ? String(apiPc.parent_category_id) : undefined, // MODIFIED from parent_job_title_id
          is_active: apiPc.is_active,
          // description and other fields from PersonnelCategory can be mapped here if available in ApiPersonnelCategory
        }));

      // console.log('mapped personnel categories:', personnelCategoriesWithParent.slice(0, 3));

      const result = buildPersonnelCategoryTree(personnelCategoriesWithParent); // MODIFIED
      // console.log('final personnel categories tree:', result.slice(0, 3));
      return result;
    } catch (error) {
      // console.error('Error fetching personnel categories lookup:', error); // MODIFIED
      message.error({t('common:auto_text_e88eb7')}); // MODIFIED
      return [];
    }
  },

  getLeaveTypesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('LEAVE_TYPE');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  getPayFrequenciesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('PAY_FREQUENCY');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    
    // 不立即显示错误，而是尝试使用employeeService作为备选
    try {
      // console.log({t('common:auto_lookupservice_gettypecodebysystemcodepay_frequency_employeeservice_getpayfrequencieslookup_e697a0')});
      const frequenciesFromEmployeeService = await employeeService.getPayFrequenciesLookup();
      
      // 将从employeeService获取的数据转换为LookupItem[]
      return frequenciesFromEmployeeService.map(f => {
        // 由于不确定LookupValue的精确格式，以下代码采用通用处理方式
        const freqItem = f as any; // 临时使用any类型避免类型检查错误
        return {
          value: freqItem.id || freqItem.value || 0,
          label: freqItem.label || freqItem.value_name || String(freqItem.id || ''),
          code: String(freqItem.value || freqItem.id || ''),
          id: Number(freqItem.id || 0),
          name: freqItem.label || freqItem.value_name || String(freqItem.id || '')
        };
      });
    } catch (error) {
      // console.error({t('common:auto_employeeservice__e9809a')}, error);
      message.error({t('common:auto__code_e697a0')});
      return [];
    }
  },

  // Mock for contract statuses until API is ready or confirmed
  getContractStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('CONTRACT_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    
    // 不立即显示错误，而是尝试使用employeeService作为备选
    try {
      // console.log({t('common:auto_lookupservice_gettypecodebysystemcodecontract_status_employeeservice_getcontractstatuseslookup_e697a0')});
      const statusesFromEmployeeService = await employeeService.getContractStatusesLookup();
      
      // 将从employeeService获取的数据转换为LookupItem[]
      return statusesFromEmployeeService.map(s => {
        // 由于不确定LookupValue的精确格式，以下代码采用通用处理方式
        const statusItem = s as any; // 临时使用any类型避免类型检查错误
        return {
          value: statusItem.id || statusItem.value || 0,
          label: statusItem.label || statusItem.value_name || String(statusItem.id || ''),
          code: String(statusItem.value || statusItem.id || ''),
          id: Number(statusItem.id || 0),
          name: statusItem.label || statusItem.value_name || String(statusItem.id || '')
        };
      });
    } catch (error) {
      // console.error({t('common:auto_employeeservice__e9809a')}, error);
      message.error({t('common:auto__code_e697a0')});
      return [];
    }
  },

  // Example of fetching specific lookup values if needed, e.g., for a single value by code
  // async getLookupValueByCode(typeCode: string, valueCode: string): Promise<LookupItem | null> {
  //   const values = await fetchLookupValuesByType(typeCode);
  //   return values.find(v => v.code === valueCode) || null;
  // }

  // ADDED: Fetch all Positions (tree structure)
  getPositionsLookup: async (): Promise<PositionType[]> => {
    try {
      const response = await apiClient.get<{ data: ApiPosition[] }>('/positions/', { params: { size: 100 } }); // 修改为最大允许值100
      if (response.data && Array.isArray(response.data.data)) {
        const positionsWithParentId: PositionWithParentId[] = response.data.data.map(p => ({
          ...p, // Spread ApiPosition
          id: Number(p.id),
          // Convert parent_position_id from ApiPosition to number for PositionWithParentId
          parent_position_id: p.parent_position_id ? Number(p.parent_position_id) : null, 
          // parentId is for tree building logic, derived from parent_position_id
          parentId: p.parent_position_id ? String(p.parent_position_id) : undefined, 
        }));
        return buildPositionTree(positionsWithParentId);
      }
      message.error('Failed to load position list or data is not in expected format.');
      return [];
    } catch (error) {
      // console.error('Error fetching positions:', error);
      message.error('Error loading positions.');
      return [];
    }
  },

  // 获取职务级别选项
  getJobPositionLevelsLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('JOB_POSITION_LEVEL');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  // 创建新的查找值
  createLookupValue: async (data: {
    lookup_type_id: number;
    code: string;
    name: string;
    label?: string;
    value?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<LookupItem> => {
    try {
      const response = await apiClient.post<{ data: ApiLookupValue }>('/lookup/values', data);
      const createdValue = response.data.data;
      return {
        id: createdValue.id,
        value: createdValue.code || createdValue.value || String(createdValue.id),
        label: createdValue.label || createdValue.name || '',
        code: createdValue.code,
        name: createdValue.name
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail?.details || error?.response?.data?.detail || error.message || {t('common:auto_text_e5889b')};
      throw new Error(errorMessage);
    }
  },

  // 更新查找值
  updateLookupValue: async (id: number, data: {
    code?: string;
    name?: string;
    label?: string;
    value?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<LookupItem> => {
    try {
      const response = await apiClient.put<{ data: ApiLookupValue }>(`/lookup/values/${id}`, data);
      const updatedValue = response.data.data;
      return {
        id: updatedValue.id,
        value: updatedValue.code || updatedValue.value || String(updatedValue.id),
        label: updatedValue.label || updatedValue.name || '',
        code: updatedValue.code,
        name: updatedValue.name
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail?.details || error?.response?.data?.detail || error.message || {t('common:auto_text_e69bb4')};
      throw new Error(errorMessage);
    }
  },

  // 删除查找值
  deleteLookupValue: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/lookup/values/${id}`);
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail?.details || error?.response?.data?.detail || error.message || {t('common:auto_text_e588a0')};
      throw new Error(errorMessage);
    }
  },

  // 获取lookup type ID通过code
  getLookupTypeIdByCode: async (code: string): Promise<number | null> => {
    try {
      const allTypes = await fetchAllLookupTypesAndCache();
      const foundType = allTypes?.find(type => type.code === code);
      return foundType?.id || null;
    } catch (error) {
      console.error('Error finding lookup type by code:', error);
      return null;
    }
  },

  // 获取薪资条目状态选项
  getPayrollEntryStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('PAYROLL_ENTRY_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  // 获取薪资审核状态选项
  getPayrollRunStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('PAYROLL_RUN_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  // 获取薪资周期状态选项
  getPayrollPeriodStatusesLookup: async (): Promise<LookupItem[]> => {
    const typeCode = await getTypeCodeBySystemCode('PAYROLL_PERIOD_STATUS');
    if (typeCode) {
      return fetchLookupValuesByType(typeCode);
    }
    message.error({t('common:auto__code_e697a0')});
    return [];
  },

  // 根据类型代码和值代码获取特定的lookup值ID
  getLookupValueIdByCode: async (typeCode: string, valueCode: string): Promise<number | null> => {
    try {
      const lookupValues = await fetchLookupValuesByType(typeCode);
      const foundValue = lookupValues.find(item => item.code === valueCode);
      return foundValue ? Number(foundValue.id) : null;
    } catch (error) {
      console.error(`Error finding lookup value ID for type: ${typeCode}, code: ${valueCode}`, error);
      return null;
    }
  },

  // 添加获取薪资周期状态选项的方法
  getPayrollPeriodStatusOptions: async (): Promise<LookupItem[]> => {
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(`/${API_BASE_PATH}`, {
        params: {
          lookup_type_code: 'PAYROLL_PERIOD_STATUS',
          size: 100
        }
      });
      return response.data.data
        .filter(item => item.is_active !== false)
        .map(apiItem => ({
          value: apiItem.id,
          label: apiItem.name || apiItem.label || '',
          code: apiItem.code,
          id: apiItem.id,
          name: apiItem.name || apiItem.label || '',
        }));
    } catch (error) {
      console.error('Error fetching payroll period status options:', error);
      throw error;
    }
  },

  // 添加获取薪资审核状态选项的方法
  getPayrollRunStatusOptions: async (): Promise<LookupItem[]> => {
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(`/${API_BASE_PATH}`, {
        params: {
          lookup_type_code: 'PAYROLL_RUN_STATUS',
          size: 100
        }
      });
      return response.data.data
        .filter(item => item.is_active !== false)
        .map(apiItem => ({
          value: apiItem.id,
          label: apiItem.name || apiItem.label || '',
          code: apiItem.code,
          id: apiItem.id,
          name: apiItem.name || apiItem.label || '',
        }));
    } catch (error) {
      console.error('Error fetching payroll run status options:', error);
      throw error;
    }
  },

  // 添加获取薪资条目状态选项的方法
  getPayrollEntryStatusOptions: async (): Promise<LookupItem[]> => {
    try {
      const response = await apiClient.get<ActualApiLookupValueListResponse>(`/${API_BASE_PATH}`, {
        params: {
          lookup_type_code: 'PAYROLL_ENTRY_STATUS',
          size: 100
        }
      });
      return response.data.data
        .filter(item => item.is_active !== false)
        .map(apiItem => ({
          value: apiItem.id,
          label: apiItem.name || apiItem.label || '',
          code: apiItem.code,
          id: apiItem.id,
          name: apiItem.name || apiItem.label || '',
        }));
    } catch (error) {
      console.error('Error fetching payroll entry status options:', error);
      throw error;
    }
  },
};