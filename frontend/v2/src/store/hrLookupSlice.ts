import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { employeeService } from '../services/employeeService';
import { lookupService } from '../services/lookupService';
import type { LookupValue, Department, PersonnelCategory, Position } from '../pages/HRManagement/types';

export interface HrLookupState {
  genders: LookupValue[];
  maritalStatuses: LookupValue[];
  educationLevels: LookupValue[];
  employmentTypes: LookupValue[];
  employeeStatuses: LookupValue[]; // For general employee status
  departments: Department[]; // For department selection/display
  personnelCategories: PersonnelCategory[]; // MODIFIED from jobTitles: JobTitle[];
  actualPositions: Position[];
  jobPositionLevels: LookupValue[]; // 新增职务级别数据
  // Add other lookup types as needed, e.g., contract types, pay frequencies
  loading: Record<string, boolean>; // Use a record to track loading for each type
  errors: Record<string, string | null>; // Use a record for errors
}

const initialLookupData: Omit<HrLookupState, 'loading' | 'errors'> = {
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

// Async Thunk for fetching lookup data
export const fetchHrLookup = createAsyncThunk(
  'hrLookup/fetchLookup',
  async ({ lookupType, params }: { lookupType: keyof Omit<HrLookupState, 'loading' | 'errors'> | 'all', params?: any }, { rejectWithValue, dispatch }) => {
    const typesToFetch: (keyof Omit<HrLookupState, 'loading' | 'errors'>)[] = lookupType === 'all'
      ? Object.keys(initialLookupData) as (keyof Omit<HrLookupState, 'loading' | 'errors'>)[]
      : [lookupType];

    const fetchedData: Partial<Omit<HrLookupState, 'loading' | 'errors'>> = {};
    const errors: Record<string, string | null> = {};

    for (const type of typesToFetch) {
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
            continue;
        }
        fetchedData[type] = data as any; // Type assertion needed due to complex union type
      } catch (err: any) {
        errors[type] = err.message || `Failed to fetch ${type}`;
      }
    }

    if (Object.keys(errors).length > 0) {
        // Dispatch actions to update state with partial data and errors
        dispatch(hrLookupSlice.actions.setLookupData(fetchedData));
        dispatch(hrLookupSlice.actions.setLookupErrors(errors));
        return rejectWithValue(errors);
    }

    return fetchedData;
  }
);


const hrLookupSlice = createSlice({
  name: 'hrLookup',
  initialState,
  reducers: {
    setLookupData: (state, action: PayloadAction<Partial<Omit<HrLookupState, 'loading' | 'errors'>>>) => {
        Object.assign(state, action.payload);
    },
    setLookupErrors: (state, action: PayloadAction<Record<string, string | null>>) => {
        state.errors = { ...state.errors, ...action.payload };
    },
    setLookupLoading: (state, action: PayloadAction<Record<string, boolean>>) => {
        state.loading = { ...state.loading, ...action.payload };
    },
    clearLookupErrors: (state, action: PayloadAction<string | 'all'>) => {
        if (action.payload === 'all') {
            state.errors = {};
        } else {
            delete state.errors[action.payload];
        }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHrLookup.pending, (state, action) => {
        const typesToFetch: (keyof Omit<HrLookupState, 'loading' | 'errors'>)[] = action.meta.arg.lookupType === 'all'
            ? Object.keys(initialLookupData) as (keyof Omit<HrLookupState, 'loading' | 'errors'>)[]
            : [action.meta.arg.lookupType];
        typesToFetch.forEach(type => { state.loading[type] = true; });
      })
      .addCase(fetchHrLookup.fulfilled, (state, action) => {
        // State updates are handled by setLookupData dispatched in the thunk
        const typesFetched = Object.keys(action.payload);
        typesFetched.forEach(type => { state.loading[type] = false; });
      })
      .addCase(fetchHrLookup.rejected, (state, action) => {
        // Errors are handled by setLookupErrors dispatched in the thunk
        const typesFailed = Object.keys(action.payload as Record<string, string>);
        typesFailed.forEach(type => { state.loading[type] = false; });
      });
  },
});

export const { setLookupData, setLookupErrors, setLookupLoading, clearLookupErrors } = hrLookupSlice.actions;

export default hrLookupSlice.reducer;