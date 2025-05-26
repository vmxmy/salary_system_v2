import { useState, useEffect } from 'react';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { lookupService } from '../../../../../services/lookupService';
import { transformToTreeData, transformListToSelectOptions } from '../utils/transforms';
import type { LookupItem, Department, PersonnelCategory, Position } from '../../../types';

/**
 * 用于获取并管理表单需要的所有查询数据
 */
export const useLookups = () => {
  const { t } = useTranslation(['employee', 'common']);
  const { message: antdMessage } = App.useApp();
  
  // 状态定义
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [personnelCategoryOptions, setPersonnelCategoryOptions] = useState<any[]>([]);
  const [positionOptions, setPositionOptions] = useState<any[]>([]);
  const [genderOptions, setGenderOptions] = useState<LookupItem[]>([]);
  const [educationLevelOptions, setEducationLevelOptions] = useState<LookupItem[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<LookupItem[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<LookupItem[]>([]);
  const [politicalStatusOptions, setPoliticalStatusOptions] = useState<LookupItem[]>([]);
  const [contractTypeOptions, setContractTypeOptions] = useState<LookupItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<LookupItem[]>([]);
  const [jobPositionLevelOptions, setJobPositionLevelOptions] = useState<LookupItem[]>([]);

  // 获取所有查询数据
  useEffect(() => {
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [
          depts, 
          personnelCategoriesData,
          positionsData,
          genders, 
          eduLevels, 
          empTypes, 
          maritals, 
          politicals, 
          contractTypesData, 
          empStatuses,
          jobLevels
        ] = await Promise.all([
          lookupService.getDepartmentsLookup(),
          lookupService.getPersonnelCategoriesLookup(),
          lookupService.getPositionsLookup(),
          lookupService.getGenderLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getEmploymentTypesLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getContractTypesLookup(),
          lookupService.getEmployeeStatusesLookup(),
          lookupService.getJobPositionLevelsLookup(),
        ]);
        
        setDepartmentOptions(transformToTreeData(depts));
        setPersonnelCategoryOptions(transformToTreeData(personnelCategoriesData as any[]));
        setPositionOptions(transformListToSelectOptions(positionsData as Position[]));
        setGenderOptions(genders);
        setEducationLevelOptions(eduLevels);
        setEmploymentTypeOptions(empTypes);
        setMaritalStatusOptions(maritals);
        setPoliticalStatusOptions(politicals);
        setContractTypeOptions(contractTypesData);
        setStatusOptions(empStatuses);
        setJobPositionLevelOptions(jobLevels);
      } catch (error) {
        antdMessage.error(t('common:message.data_loading_error'));
        console.error('Failed to load lookups:', error);
      }
      setLoadingLookups(false);
    };
    fetchLookups();
  }, [t, antdMessage]);

  return {
    loadingLookups,
    departmentOptions,
    personnelCategoryOptions,
    positionOptions,
    genderOptions,
    educationLevelOptions,
    employmentTypeOptions,
    maritalStatusOptions,
    politicalStatusOptions,
    contractTypeOptions,
    statusOptions,
    jobPositionLevelOptions
  };
}; 