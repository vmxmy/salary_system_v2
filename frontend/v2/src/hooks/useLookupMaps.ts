import { useState, useEffect } from 'react';
import { lookupService } from '../services/lookupService';
import { employeeService } from '../services/employeeService';
import type { 
  LookupItem, 
  Department as DepartmentType, 
  PersonnelCategory as PersonnelCategoryType,
  Position as PositionType,
  // Add other specific types if needed by rawLookups, e.g. for tree data structure
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
  console.log(`\n========= 开始创建平面映射表 =========`);
  console.log(`数据类型: ${nodes && nodes.length > 0 ? nodes[0].constructor.name : '未知'}`);
  console.log(`ID字段: ${String(idKey)}, 名称字段: ${String(nameKey)}`);
  console.log(`节点数量: ${nodes ? nodes.length : 0}`);
  
  const flatMap = new Map<string, string>();
  
  // 检查输入是否为空数组
  if (!nodes || nodes.length === 0) {
    console.warn('⚠️ createFlatMapFromTree: 输入为空数组');
    return flatMap;
  }
  
  // 输出前3个节点的详细结构
  console.log('输入数据预览:');
  for (let i = 0; i < Math.min(3, nodes.length); i++) {
    const node = nodes[i];
    console.log(`节点[${i}]: {
      ${String(idKey)}: ${node[idKey]} (${typeof node[idKey]}),
      ${String(nameKey)}: ${node[nameKey]} (${typeof node[nameKey]}),
      children: ${node['children' as keyof typeof node] ? 
        `Array[${(node['children' as keyof typeof node] as any[]).length}]` : 
        'undefined'}
    }`);
  }
  
  // 处理节点和子节点
  const processNode = (node: any) => {
    try {
      // 更安全的属性访问
      const nodeId = node[idKey];
      const nodeName = node[nameKey];
      
      if (nodeId === undefined || nodeId === null || nodeName === undefined || nodeName === null) {
        console.warn(`⚠️ 节点缺少有效的ID或名称: id=${nodeId}, name=${nodeName}`, node);
        return;
      }
      
      // 尝试将ID转换为数字
      let numericId: number;
      if (typeof nodeId === 'number') {
        numericId = nodeId;
      } else if (typeof nodeId === 'string') {
        numericId = parseInt(nodeId, 10);
        if (isNaN(numericId)) {
          console.warn(`⚠️ 字符串ID "${nodeId}" 无法转换为数字`);
          return;
        }
      } else {
        console.warn(`⚠️ 不支持的ID类型: ${typeof nodeId}`);
        return;
      }
      
      // 将转换后的ID和名称加入映射表
      flatMap.set(String(nodeId), String(nodeName));
      
      // 处理子节点
      const childrenField = 'children';
      if (node[childrenField] && Array.isArray(node[childrenField])) {
        node[childrenField].forEach(processNode);
      }
    } catch (err) {
      console.error('❌ 处理节点时出错:', err, node);
    }
  };
  
  // 处理所有顶级节点及其子节点
  nodes.forEach(processNode);
  
  console.log(`\n✅ 映射表创建完成:`);
  console.log(`- 映射表项目数: ${flatMap.size}`);
  
  if (flatMap.size > 0) {
    console.log('映射表内容预览:');
    const previewEntries = Array.from(flatMap.entries()).slice(0, 5);
    previewEntries.forEach(([key, value], index) => {
      console.log(`  ${index+1}. ${key} => "${value}"`);
    });
    
    if (flatMap.size > 5) {
      console.log(`  ... 还有${flatMap.size - 5}项`);
    }
  }
  
  console.log('========= 映射表创建结束 =========\n');
  
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
        console.log('开始获取所有lookups数据');
        const [
          genders,
          statuses,
          departments, // Tree structure
          personnelCategories,   // MODIFIED from jobTitles
          empTypes,
          contractTypesData,
          eduLevels,
          maritals,
          politicals,
          leaveTypesData,
          payFrequencies,
          contractStatusesData,
          positions
        ] = await Promise.all([
          lookupService.getGenderLookup(),
          lookupService.getEmployeeStatusesLookup(),
          lookupService.getDepartmentsLookup(),
          lookupService.getPersonnelCategoriesLookup(), // MODIFIED from getJobTitlesLookup
          lookupService.getEmploymentTypesLookup(),
          lookupService.getContractTypesLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getLeaveTypesLookup(),
          lookupService.getPayFrequenciesLookup(),
          employeeService.getContractStatusesLookup(),
          lookupService.getPositionsLookup()
        ]);

        if (!isMounted) return; // 再次检查，避免在异步操作后组件已卸载

        console.log('所有lookups API调用已返回', {
          genders: genders.length,
          statuses: statuses.length,
          departments: departments.length,
          personnelCategories: personnelCategories.length,
          empTypes: empTypes.length,
          contractTypesData: contractTypesData.length,
          eduLevels: eduLevels.length,
          maritals: maritals.length,
          politicals: politicals.length,
          leaveTypesData: leaveTypesData.length,
          payFrequencies: payFrequencies.length,
          contractStatusesData: contractStatusesData ? contractStatusesData.length : 'undefined',
          positions: positions.length
        });

        console.log('API返回的departments数据:', {
          departments: departments,
          length: departments.length,
          sample: departments.slice(0, 2)
        });
        console.log('API返回的personnelCategories数据:', {
          personnelCategories: personnelCategories,
          length: personnelCategories.length,
          sample: personnelCategories.slice(0, 2)
        });

        const createMapFromArray = (items: LookupItem[]): Map<number, string> =>
          new Map(items.map(item => [Number(item.value), item.label]));

        // 创建部门和人员身份映射表
        const departmentMap = createFlatMapFromTree(departments);
        console.log('departmentMap创建结果:', {
          size: departmentMap.size,
          entries: Array.from(departmentMap.entries()).slice(0, 3)
        });
        
        const personnelCategoryMap = createFlatMapFromTree(personnelCategories);
        console.log('personnelCategoryMap创建结果:', {
          size: personnelCategoryMap.size,
          entries: Array.from(personnelCategoryMap.entries()).slice(0, 3)
        });

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
            positionOptions: positions
          });
          setLoadingLookups(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ useLookupMaps 获取数据失败:', error);
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