import { useState, useEffect } from 'react';
import { lookupService } from '../services/lookupService';
import { employeeService } from '../services/employeeService';
import type {
  LookupItem,
  Department as DepartmentType,
  PersonnelCategory as PersonnelCategoryType,
  Position as PositionType,
} from '../pages/HRManagement/types'; // Adjust path as necessary based on actual file structure

export interface LookupMaps {
  genderMap: Map<number, string>;
  statusMap: Map<number, string>;
  departmentMap: Map<string, string>;
  personnelCategoryMap: Map<string, string>;
  employmentTypeMap: Map<number, string>;
  contractTypeMap: Map<number, string>;
  educationLevelMap: Map<number, string>;
  maritalStatusMap: Map<number, string>;
  politicalStatusMap: Map<number, string>;
  leaveTypeMap: Map<number, string>;
  payFrequencyMap: Map<number, string>;
  contractStatusMap?: Map<number, string>;
  positionMap: Map<string, string>;
  jobPositionLevelMap: Map<number, string>;
  // Add more maps as needed
}

export interface RawLookups {
  genderOptions: LookupItem[];
  statusOptions: LookupItem[];
  departmentOptions: DepartmentType[]; // Tree structure
  personnelCategoryOptions: PersonnelCategoryType[];
  employmentTypeOptions: LookupItem[];
  contractTypeOptions: LookupItem[];
  educationLevelOptions: LookupItem[];
  maritalStatusOptions: LookupItem[];
  politicalStatusOptions: LookupItem[];
  leaveTypeOptions: LookupItem[];
  payFrequencyOptions: LookupItem[];
  employeeStatuses: LookupItem[];
  contractStatusOptions?: LookupItem[];
  positionOptions: PositionType[];
  jobPositionLevelOptions: LookupItem[]; // 新增职务级别选项
  // Add more raw options as needed
}

export interface UseLookupsResult {
  lookupMaps: LookupMaps | null;
  rawLookups: RawLookups | null;
  loadingLookups: boolean;
  errorLookups: any;
}

const createFlatMapFromTree = (
  nodes: DepartmentType[] | PersonnelCategoryType[] | PositionType[],
  idKey: keyof (DepartmentType | PersonnelCategoryType | PositionType) = 'id',
  nameKey: keyof (DepartmentType | PersonnelCategoryType | PositionType) = 'name'
): Map<string, string> => {
  const flatMap = new Map<string, string>();

  // 检查输入是否为空数组
  if (!nodes || nodes.length === 0) {
    return flatMap;
  }

  // 处理节点和子节点
  const processNode = (node: any) => {
    try {
      // 更安全的属性访问
      const nodeId = node[idKey];
      const nodeName = node[nameKey];

      if (nodeId === undefined || nodeId === null || nodeName === undefined || nodeName === null) {
        return;
      }

      // 尝试将ID转换为数字
      let numericId: number;
      if (typeof nodeId === 'number') {
        numericId = nodeId;
      } else if (typeof nodeId === 'string') {
        numericId = parseInt(nodeId, 10);
        if (isNaN(numericId)) { // Fixed: Missing closing parenthesis
          return;
        }
      } else {
        return;
      }

      // 将转换后的ID和名称加入映射表
      flatMap.set(String(nodeId), String(nodeName)); // Fixed: Missing closing parenthesis
      // 处理子节点
      const childrenField = 'children';
      if (node[childrenField] && Array.isArray(node[childrenField])) { // Fixed: Missing closing parenthesis
        node[childrenField].forEach(processNode);
      }
    } catch (err) {
      // Intentionally empty catch block as per original code's intent to suppress errors
    }
  };

  // 处理所有顶级节点及其子节点
  nodes.forEach(processNode);

  return flatMap;
};

export const useLookupMaps = (): UseLookupsResult => {
  const [lookupMaps, setLookupMaps] = useState<LookupMaps | null>(null);
  const [rawLookups, setRawLookups] = useState<RawLookups | null>(null);
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [errorLookups, setErrorLookups] = useState<any>(null);

  useEffect(() => {
    let isMounted = true; // 添加组件挂载状态跟踪

    const fetchAllLookups = async () => {
      if (!isMounted) return; // 如果组件已卸载，不执行操作

      setLoadingLookups(true);
      setErrorLookups(null);
      try {
        const [
          genders,
          statuses,
          departments, // Tree structure
          personnelCategories,
          empTypes,
          contractTypesData,
          eduLevels,
          maritals,
          politicals,
          leaveTypesData,
          payFrequencies,
          contractStatusesData,
          positions,
          jobPositionLevels // 新增职务级别数据
        ] = await Promise.all([
          lookupService.getGenderLookup(),
          lookupService.getEmployeeStatusesLookup(),
          lookupService.getDepartmentsLookup(),
          lookupService.getPersonnelCategoriesLookup(),
          lookupService.getEmploymentTypesLookup(),
          lookupService.getContractTypesLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getLeaveTypesLookup(),
          lookupService.getPayFrequenciesLookup(),
          employeeService.getContractStatusesLookup(),
          lookupService.getPositionsLookup(),
          lookupService.getJobPositionLevelsLookup() // 新增职务级别获取
        ]);

        if (!isMounted) return; // 再次检查，避免在异步操作后组件已卸载

        const createMapFromArray = (items: LookupItem[]): Map<number, string> =>
          new Map(items.map(item => [Number(item.value), item.label]));

        // 创建部门和人员身份映射表
        const departmentMap = createFlatMapFromTree(departments);
        const personnelCategoryMap = createFlatMapFromTree(personnelCategories);

        // 确保所有映射表都创建完成后，创建最终的lookupMaps对象
        if (!isMounted) return; // 再次检查，避免在状态更新前组件已卸载

        const newLookupMaps: LookupMaps = {
          genderMap: createMapFromArray(genders),
          statusMap: createMapFromArray(statuses),
          departmentMap,
          personnelCategoryMap,
          employmentTypeMap: createMapFromArray(empTypes),
          contractTypeMap: createMapFromArray(contractTypesData),
          educationLevelMap: createMapFromArray(eduLevels),
          maritalStatusMap: createMapFromArray(maritals),
          politicalStatusMap: createMapFromArray(politicals),
          leaveTypeMap: createMapFromArray(leaveTypesData),
          payFrequencyMap: createMapFromArray(payFrequencies),
          positionMap: createFlatMapFromTree(positions),
          jobPositionLevelMap: createMapFromArray(jobPositionLevels),
          // 可选的contractStatusMap，如果contractStatusesData存在的话
          ...(contractStatusesData ? { contractStatusMap: createMapFromArray(contractStatusesData) } : {})
        };

        // 在组件仍然挂载的情况下更新状态
        if (isMounted) {
          setLookupMaps(newLookupMaps);
          setRawLookups({
            genderOptions: genders,
            statusOptions: statuses,
            departmentOptions: departments,
            personnelCategoryOptions: personnelCategories,
            employmentTypeOptions: empTypes,
            contractTypeOptions: contractTypesData,
            educationLevelOptions: eduLevels,
            maritalStatusOptions: maritals,
            politicalStatusOptions: politicals,
            leaveTypeOptions: leaveTypesData,
            payFrequencyOptions: payFrequencies,
            employeeStatuses: statuses, // 保持一致性，可能是之前的另一个引用
            contractStatusOptions: contractStatusesData || [],
            positionOptions: positions,
            jobPositionLevelOptions: jobPositionLevels // 修正：使用jobPositionLevels数组
          });
          setLoadingLookups(false);
        }
      } catch (error) {
        if (isMounted) {
          setErrorLookups(error);
          setLoadingLookups(false);
        }
      }
    };

    fetchAllLookups();

    // 清理函数，当组件卸载时设置isMounted为false
    return () => {
      isMounted = false;
    };
  }, []); // 仅在组件挂载时执行一次

  return { lookupMaps, rawLookups, loadingLookups, errorLookups };
};