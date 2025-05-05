// Service functions for interacting with calculation rules and formulas API

// Base interface for common fields
interface BaseSchema {
    created_at: string; // Assuming ISO string format from backend
    updated_at: string; // Assuming ISO string format from backend
}

// --- Formula Types ---
export interface CalculationFormulaBase {
    name: string;
    description?: string | null;
    formula_expression: string;
}

export interface CalculationFormulaCreate extends CalculationFormulaBase {}

export interface CalculationFormulaUpdate extends Partial<CalculationFormulaBase> {}

export interface CalculationFormula extends CalculationFormulaBase, BaseSchema {
    formula_id: number;
    rules_using_formula?: CalculationRule[]; // Optional, depending on API response needs
}

// --- Condition Types ---
export interface CalculationRuleConditionBase {
    context_field_name: string;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not contains' | 'in' | 'not in';
    comparison_value: string; // Stored as string, backend handles conversion
}

export interface CalculationRuleConditionCreate extends CalculationRuleConditionBase {}

// Note: Update for conditions might not be typical separately, usually updated via Rule
// export interface CalculationRuleConditionUpdate extends Partial<CalculationRuleConditionBase> {}

export interface CalculationRuleCondition extends CalculationRuleConditionBase, BaseSchema {
    condition_id: number;
    rule_id: number;
}

// --- Rule Types ---
export interface CalculationRuleBase {
    name: string;
    description?: string | null;
    priority: number;
    is_active: boolean;
    target_field_db_name: string;
    action_type: 'APPLY_FORMULA' | 'SET_FIXED_VALUE';
    formula_id?: number | null; // FK to CalculationFormula
    fixed_value?: string | null; // Stored as string
    conditions?: CalculationRuleConditionCreate[]; // Used for creation/update with nested conditions
}

export interface CalculationRuleCreate extends CalculationRuleBase {
    conditions: CalculationRuleConditionCreate[]; // Make conditions required on create
}

export interface CalculationRuleUpdate extends Partial<CalculationRuleBase> {
    // Conditions update is handled by replacing the list if provided
    conditions?: CalculationRuleConditionCreate[];
}

export interface CalculationRule extends CalculationRuleBase, BaseSchema {
    rule_id: number;
    formula?: CalculationFormula | null; // Eager loaded relationship
    conditions: CalculationRuleCondition[]; // Eager loaded relationship
}

// --- Paginated Response Type (Generic) ---
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    // Optional: page, size, pages if needed, but backend currently only gives total
}

// --- API Service Function Signatures (Placeholder for next step) ---

// Import the shared apiClient instance
import apiClient from './api';
// Import axios specifically for type checking
import axios from 'axios';

// --- Configuration ---
// Remove API_BASE_URL definition as it's handled by apiClient
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Update endpoints to be relative paths used with apiClient, add trailing slash for collection endpoints
const FORMULA_ENDPOINT = '/api/v1/admin/calculation-engine/formulas/'; // Added trailing slash

// --- Formula API Functions ---

/**
 * Get a paginated list of calculation formulas.
 */
export const getFormulas = async (
    params: { skip?: number; limit?: number } = {}
): Promise<PaginatedResponse<CalculationFormula>> => {
    try {
        // Use apiClient instead of axios
        // Request the collection endpoint (with trailing slash)
        const response = await apiClient.get<CalculationFormula[]>(FORMULA_ENDPOINT, { params }); 
        // Simulate PaginatedResponse structure
        return {
            items: response.data,
            total: response.data.length // Simulate total based on received items
        };
    } catch (error) {
        console.error("Error fetching formulas:", error);
        throw new Error("Failed to fetch formulas");
    }
};

/**
 * Get a single calculation formula by its ID.
 */
export const getFormulaById = async (id: number): Promise<CalculationFormula> => {
    try {
        // Use apiClient instead of axios
        // Request the specific resource endpoint (no trailing slash)
        const response = await apiClient.get<CalculationFormula>(`${FORMULA_ENDPOINT}${id}`); 
        return response.data;
    } catch (error) {
        console.error(`Error fetching formula with ID ${id}:`, error);
        throw new Error("Failed to fetch formula details");
    }
};

/**
 * Create a new calculation formula.
 */
export const createFormula = async (data: CalculationFormulaCreate): Promise<CalculationFormula> => {
    try {
        // Use apiClient instead of axios
        // Post to the collection endpoint (with trailing slash)
        const response = await apiClient.post<CalculationFormula>(FORMULA_ENDPOINT, data); 
        return response.data;
    } catch (error) {
        console.error("Error creating formula:", error);
        throw new Error("Failed to create formula");
    }
};

/**
 * Update an existing calculation formula.
 */
export const updateFormula = async (id: number, data: CalculationFormulaUpdate): Promise<CalculationFormula> => {
    try {
        // Use apiClient instead of axios
        // Put to the specific resource endpoint (no trailing slash)
        const response = await apiClient.put<CalculationFormula>(`${FORMULA_ENDPOINT}${id}`, data); 
        return response.data;
    } catch (error) {
        console.error(`Error updating formula with ID ${id}:`, error);
        throw new Error("Failed to update formula");
    }
};

/**
 * Delete a calculation formula by its ID.
 */
export const deleteFormula = async (id: number): Promise<void> => {
    try {
        // Use apiClient instead of axios
        // Delete the specific resource endpoint (no trailing slash)
        await apiClient.delete(`${FORMULA_ENDPOINT}${id}`); 
    } catch (error) {
        console.error(`Error deleting formula with ID ${id}:`, error);
        throw new Error("Failed to delete formula");
    }
};

// Update endpoints to be relative paths used with apiClient, add trailing slash for collection endpoints
const RULE_ENDPOINT = '/api/v1/admin/calculation-engine/rules/'; // Added trailing slash

// --- Rule API Functions ---

/**
 * Get a paginated list of calculation rules.
 */
export const getRules = async (
    params: {
        skip?: number;
        limit?: number;
        is_active?: boolean;
        target_field?: string;
    } = {}
): Promise<PaginatedResponse<CalculationRule>> => {
    try {
        // Expect the backend to return an object { data: CalculationRule[], total: number }
        // matching the schemas.CalculationRuleListResponse
        // Request the collection endpoint (with trailing slash)
        const response = await apiClient.get<{ data: CalculationRule[]; total: number }>(RULE_ENDPOINT, { params });

        // Destructure the data and total properties from the response object
        const { data, total } = response.data;

        // Return the data in the PaginatedResponse structure expected by the frontend
        return {
            items: data, // Map 'data' from backend to 'items' for frontend
            total: total,
        };
    } catch (error) {
        console.error("Error fetching rules:", error);
        // Type assertion to check if it's an AxiosError with a response
        // Now axios is imported and can be used for the type guard
        if (axios.isAxiosError(error) && error.response) {
             console.error('Backend Response Data:', error.response.data);
        }
        throw new Error("Failed to fetch rules");
    }
};

/**
 * Get a single calculation rule by its ID.
 */
export const getRuleById = async (id: number): Promise<CalculationRule> => {
    try {
        // Use apiClient instead of axios
        // Request the specific resource endpoint (no trailing slash)
        const response = await apiClient.get<CalculationRule>(`${RULE_ENDPOINT}${id}`); 
        return response.data;
    } catch (error) {
        console.error(`Error fetching rule with ID ${id}:`, error);
        throw new Error("Failed to fetch rule details");
    }
};

/**
 * Create a new calculation rule.
 */
export const createRule = async (data: CalculationRuleCreate): Promise<CalculationRule> => {
    try {
        // Ensure conditions is always an array, even if empty
        const payload = { ...data, conditions: data.conditions ?? [] };
        // Use apiClient instead of axios
        // Post to the collection endpoint (with trailing slash)
        const response = await apiClient.post<CalculationRule>(RULE_ENDPOINT, payload); 
        return response.data;
    } catch (error) {
        console.error("Error creating rule:", error);
        throw new Error("Failed to create rule");
    }
};

/**
 * Update an existing calculation rule.
 */
export const updateRule = async (id: number, data: CalculationRuleUpdate): Promise<CalculationRule> => {
    try {
         // If conditions are provided in the update, ensure it's an array
         const payload = { ...data };
         if (payload.conditions !== undefined && payload.conditions !== null) {
             payload.conditions = payload.conditions ?? [];
         }
        // Use apiClient instead of axios
        // Put to the specific resource endpoint (no trailing slash)
        const response = await apiClient.put<CalculationRule>(`${RULE_ENDPOINT}${id}`, payload); 
        return response.data;
    } catch (error) {
        console.error(`Error updating rule with ID ${id}:`, error);
        throw new Error("Failed to update rule");
    }
};

/**
 * Delete a calculation rule by its ID.
 */
export const deleteRule = async (id: number): Promise<void> => {
    try {
        // Use apiClient instead of axios
        // Delete the specific resource endpoint (no trailing slash)
        await apiClient.delete(`${RULE_ENDPOINT}${id}`); 
    } catch (error) {
        console.error(`Error deleting rule with ID ${id}:`, error);
        throw new Error("Failed to delete rule");
    }
}; 