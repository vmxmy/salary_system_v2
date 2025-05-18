import { create } from 'zustand';
import { employeeService } from '../services/employeeService';
import { lookupService } from '../services/lookupService';
import type { LookupValue, Department, PersonnelCategory, Position } from '../pages/HRManagement/types';

export interface HrLookupData {
  genders: LookupValue[];
  maritalStatuses: LookupValue[];
  educationLevels: LookupValue[];
  employmentTypes: LookupValue[];
  employeeStatuses: LookupValue[]; // For general employee status
  departments: Department[]; // For department selection/display
  personnelCategories: PersonnelCategory[]; // MODIFIED from jobTitles: JobTitle[];
  actualPositions: Position[];
  // Add other lookup types as needed, e.g., contract types, pay frequencies
}

interface HrLookupState extends HrLookupData {
  loading: Set<string>; // Set of lookup types currently loading
  errors: Map<string, string | null>; // Map of lookup types to their error messages
  fetchLookup: (lookupType: keyof HrLookupData | 'all', params?: any) => Promise<void>;
  // Helper to get a specific lookup array by its key in HrLookupData
  getLookupByType: (lookupType: keyof HrLookupData) => LookupValue[] | Department[] | PersonnelCategory[] | Position[];
}

const initialLookupData: HrLookupData = {
  genders: [],
  maritalStatuses: [],
  educationLevels: [],
  employmentTypes: [],
  employeeStatuses: [],
  departments: [],
  personnelCategories: [],
  actualPositions: [],
};

const useHrLookupStore = create<HrLookupState>((set, get) => ({
  ...initialLookupData,
  loading: new Set(),
  errors: new Map(),

  fetchLookup: async (lookupType: keyof HrLookupData | 'all', params?: any) => {
    const { loading, errors } = get();
    const newLoading = new Set(loading);
    const newErrors = new Map(errors);

    const typesToFetch: (keyof HrLookupData)[] = lookupType === 'all' 
      ? Object.keys(initialLookupData) as (keyof HrLookupData)[] 
      : [lookupType];

    typesToFetch.forEach(type => newLoading.add(type));
    set({ loading: newLoading });

    for (const type of typesToFetch) {
      newErrors.delete(type);
      try {
        let data: LookupValue[] | Department[] | PersonnelCategory[] | Position[] = [];
        switch (type) {
          case 'genders':
            data = await employeeService.getLookupValues('GENDER'); // Assuming 'GENDER' is the type_code
            break;
          case 'maritalStatuses':
            data = await employeeService.getLookupValues('MARITAL_STATUS');
            break;
          case 'educationLevels':
            data = await employeeService.getLookupValues('EDUCATION_LEVEL');
            break;
          case 'employmentTypes':
            data = await employeeService.getEmploymentTypesLookup(); // Uses specific service method which internally calls getLookupValues('EMPLOYMENT_TYPE')
            break;
          case 'employeeStatuses':
             data = await employeeService.getLookupValues('EMPLOYEE_STATUS'); // Assuming 'EMPLOYEE_STATUS' for general active/inactive etc.
            break;
          case 'departments':
            data = await employeeService.getDepartmentsLookup();
            break;
          case 'personnelCategories': // MODIFIED from 'jobTitles'
            data = await employeeService.getPersonnelCategoriesLookup(params); // MODIFIED, params might be department_id for filtering
            break;
          case 'actualPositions':
            data = await lookupService.getPositionsLookup();
            break;
          default:
            const exhaustiveCheck: never = type;
            console.warn(`Unhandled lookup type in fetchLookup: ${exhaustiveCheck}`);
            continue;
        }
        set((state) => ({ ...state, [type]: data }));
      } catch (err: any) {
        console.error(`Error fetching ${type}:`, err);
        newErrors.set(type, err.message || `Failed to fetch ${type}`);
      }
      newLoading.delete(type);
      set({ loading: new Set(newLoading), errors: new Map(newErrors) }); // Update incrementally
    }
  },

  getLookupByType: (lookupType: keyof HrLookupData) => {
    return get()[lookupType] as LookupValue[] | Department[] | PersonnelCategory[] | Position[];
  },
}));

export default useHrLookupStore; 