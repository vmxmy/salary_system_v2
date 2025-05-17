import { useState, useEffect } from 'react';
import { lookupService } from '../services/lookupService';
import { employeeService } from '../services/employeeService';
import type { 
  LookupItem, 
  Department as DepartmentType, 
  JobTitle as JobTitleType,
  // Add other specific types if needed by rawLookups, e.g. for tree data structure
} from '../pages/HRManagement/types'; // Adjust path as necessary based on actual file structure
import { message } from 'antd';

export interface LookupMaps {
  genderMap: Map<number, string>;
  statusMap: Map<number, string>;
  departmentMap: Map<number, string>;
  jobTitleMap: Map<number, string>;
  employmentTypeMap: Map<number, string>;
  contractTypeMap: Map<number, string>;
  educationLevelMap: Map<number, string>;
  maritalStatusMap: Map<number, string>;
  politicalStatusMap: Map<number, string>;
  leaveTypeMap: Map<number, string>;
  payFrequencyMap: Map<number, string>;
  contractStatusMap?: Map<number, string>;
  // Add more maps as needed
}

export interface RawLookups {
  genderOptions: LookupItem[];
  statusOptions: LookupItem[];
  departmentOptions: DepartmentType[]; // Tree structure
  jobTitleOptions: JobTitleType[];   // Flat list or tree
  employmentTypeOptions: LookupItem[];
  contractTypeOptions: LookupItem[];
  educationLevelOptions: LookupItem[];
  maritalStatusOptions: LookupItem[];
  politicalStatusOptions: LookupItem[];
  leaveTypeOptions: LookupItem[];
  payFrequencyOptions: LookupItem[];
  employeeStatuses: LookupItem[];
  contractStatusOptions?: LookupItem[];
  // Add more raw options as needed
}

export interface UseLookupsResult {
  lookupMaps: LookupMaps | null;
  rawLookups: RawLookups | null;
  loadingLookups: boolean;
  errorLookups: any;
}

const createFlatMapFromTree = (
  nodes: DepartmentType[] | JobTitleType[], 
  idKey: keyof (DepartmentType | JobTitleType) = 'id',
  nameKey: keyof (DepartmentType | JobTitleType) = 'name'
): Map<number, string> => {
  const flatMap = new Map<number, string>();
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node) {
      // Assuming id and name are present and id is number. Adjust if types differ.
      const id = node[idKey] as number;
      const name = node[nameKey] as string;
      if (id != null && name != null) {
        flatMap.set(id, name);
      }
      if ((node as any).children && Array.isArray((node as any).children)) {
        stack.push(...(node as any).children);
      }
    }
  }
  return flatMap;
};

export const useLookupMaps = (): UseLookupsResult => {
  const [lookupMaps, setLookupMaps] = useState<LookupMaps | null>(null);
  const [rawLookups, setRawLookups] = useState<RawLookups | null>(null);
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [errorLookups, setErrorLookups] = useState<any>(null);

  useEffect(() => {
    const fetchAllLookups = async () => {
      setLoadingLookups(true);
      setErrorLookups(null);
      try {
        const [
          genders,
          statuses,
          departments, // Tree structure
          jobTitles,   // Flat list or tree
          empTypes,
          contractTypesData,
          eduLevels,
          maritals,
          politicals,
          leaveTypesData,
          payFrequencies,
          contractStatusesData
        ] = await Promise.all([
          lookupService.getGenderLookup(),
          lookupService.getEmployeeStatusesLookup(),
          lookupService.getDepartmentsLookup(),
          lookupService.getJobTitlesLookup(),
          lookupService.getEmploymentTypesLookup(),
          lookupService.getContractTypesLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getLeaveTypesLookup(),
          lookupService.getPayFrequenciesLookup(),
          employeeService.getContractStatusesLookup()
        ]);

        const createMapFromArray = (items: LookupItem[]): Map<number, string> =>
          new Map(items.map(item => [Number(item.value), item.label]));

        setLookupMaps({
          genderMap: createMapFromArray(genders),
          statusMap: createMapFromArray(statuses),
          departmentMap: createFlatMapFromTree(departments),
          jobTitleMap: createFlatMapFromTree(jobTitles), // Assuming jobTitles might be tree-like for consistency, or flat
          employmentTypeMap: createMapFromArray(empTypes),
          contractTypeMap: createMapFromArray(contractTypesData),
          educationLevelMap: createMapFromArray(eduLevels),
          maritalStatusMap: createMapFromArray(maritals),
          politicalStatusMap: createMapFromArray(politicals),
          leaveTypeMap: createMapFromArray(leaveTypesData),
          payFrequencyMap: createMapFromArray(payFrequencies),
          contractStatusMap: createMapFromArray(contractStatusesData)
        });

        setRawLookups({
          genderOptions: genders,
          statusOptions: statuses,
          departmentOptions: departments,
          jobTitleOptions: jobTitles,
          employmentTypeOptions: empTypes,
          contractTypeOptions: contractTypesData,
          educationLevelOptions: eduLevels,
          maritalStatusOptions: maritals,
          politicalStatusOptions: politicals,
          leaveTypeOptions: leaveTypesData,
          payFrequencyOptions: payFrequencies,
          employeeStatuses: statuses,
          contractStatusOptions: contractStatusesData
        });
      } catch (error) {
        console.error("Failed to fetch lookups:", error);
        message.error('加载辅助选项数据失败');
        setErrorLookups(error);
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchAllLookups();
  }, []);

  return { lookupMaps, rawLookups, loadingLookups, errorLookups };
}; 