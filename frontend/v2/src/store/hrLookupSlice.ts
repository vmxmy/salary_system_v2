import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { employeeService } from '../services/employeeService';
import { lookupService } from '../services/lookupService';
import type { LookupValue, Department, PersonnelCategory, Position } from '../pages/HRManagement/types';

export interface HrLookupData {
  genders: LookupValue[];
  maritalStatuses: LookupValue[];
  educationLevels: LookupValue[];
  employmentTypes: LookupValue[];
  employeeStatuses: LookupValue[];
  departments: Department[];
  personnelCategories: PersonnelCategory[];
  actualPositions: Position[];
  jobPositionLevels: LookupValue[];
}

interface HrLookupState extends HrLookupData {
  loading: { [key: string]: boolean };
  errors: { [key: string]: string | null };
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
  jobPositionLevels: [],
};

const initialState: HrLookupState = {
  ...initialLookupData,
  loading: {},
  errors: {},
};

type LookupType = keyof HrLookupData;

export const fetchHrLookup = createAsyncThunk(
  'hrLookup/fetchLookup',
  async ({ lookupType, params }: { lookupType: LookupType | 'all', params?: any }, { dispatch, getState }) => {
    const state = getState() as { hrLookup: HrLookupState };
    const typesToFetch: LookupType[] = lookupType === 'all'
      ? Object.keys(initialLookupData) as LookupType[]
      : [lookupType];

    for (const type of typesToFetch) {
      dispatch(hrLookupSlice.actions.setLoading({ type, isLoading: true }));
      dispatch(hrLookupSlice.actions.setError({ type, error: null }));
      try {
        let data: LookupValue[] | Department[] | PersonnelCategory[] | Position[] = [];
        switch (type) {
          case 'genders':
            data = await employeeService.getLookupValues('GENDER');
            break;
          case 'maritalStatuses':
            data = await employeeService.getLookupValues('MARITAL_STATUS');
            break;
          case 'educationLevels':
            data = await employeeService.getLookupValues('EDUCATION_LEVEL');
            break;
          case 'employmentTypes':
            data = await employeeService.getEmploymentTypesLookup();
            break;
          case 'employeeStatuses':
            data = await employeeService.getLookupValues('EMPLOYEE_STATUS');
            break;
          case 'departments':
            data = await employeeService.getDepartmentsLookup();
            break;
          case 'personnelCategories':
            data = await employeeService.getPersonnelCategoriesLookup(params);
            break;
          case 'actualPositions':
            data = await lookupService.getPositionsLookup();
            break;
          case 'jobPositionLevels':
            data = await employeeService.getJobPositionLevelsLookup();
            break;
          default:
            const exhaustiveCheck: never = type;
            break;
        }
        dispatch(hrLookupSlice.actions.setLookupData({ type, data }));
      } catch (err: any) {
        dispatch(hrLookupSlice.actions.setError({ type, error: err.message || `Failed to fetch ${type}` }));
      } finally {
        dispatch(hrLookupSlice.actions.setLoading({ type, isLoading: false }));
      }
    }
  }
);

const hrLookupSlice = createSlice({
  name: 'hrLookup',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ type: LookupType, isLoading: boolean }>) => {
      state.loading[action.payload.type] = action.payload.isLoading;
    },
    setError: (state, action: PayloadAction<{ type: LookupType, error: string | null }>) => {
      state.errors[action.payload.type] = action.payload.error;
    },
    setLookupData: (state, action: PayloadAction<{ type: LookupType, data: any }>) => {
      state[action.payload.type as keyof HrLookupData] = action.payload.data;
    },
  },
});

export const { setLoading, setError, setLookupData } = hrLookupSlice.actions;
export default hrLookupSlice.reducer;

export const selectHrLookupData = (state: { hrLookup: HrLookupState }) => state.hrLookup;
export const selectLookupByType = (state: { hrLookup: HrLookupState }, lookupType: LookupType) => state.hrLookup[lookupType];
export const selectHrLookupLoading = (state: { hrLookup: HrLookupState }, lookupType: LookupType) => state.hrLookup.loading[lookupType];
export const selectHrLookupError = (state: { hrLookup: HrLookupState }, lookupType: LookupType) => state.hrLookup.errors[lookupType];