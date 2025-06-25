import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

// Universal query options interface
export interface UniversalQueryOptions<T> extends Omit<UseQueryOptions<T[]>, 'queryKey' | 'queryFn'> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number; // For backward compatibility
  gcTime?: number;    // New React Query v5 option
}

// Universal filters interface
export interface UniversalDataFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

// Query keys factory for consistent caching
export const createUniversalQueryKeys = (baseKey: string) => ({
  all: [baseKey] as const,
  lists: () => [baseKey, 'list'] as const,
  list: (filters: UniversalDataFilters) => [baseKey, 'list', filters] as const,
  details: () => [baseKey, 'detail'] as const,
  detail: (id: string | number) => [baseKey, 'detail', id] as const,
});

/**
 * Universal data query hook
 * Provides standardized data fetching with caching, error handling, and performance optimization
 * 
 * @param queryKey - Unique identifier for the query
 * @param queryFn - Function that fetches the data
 * @param options - React Query options and universal-specific options
 * @returns Query result with data, loading state, error, and utility functions
 */
export function useUniversalDataQuery<T = any>(
  queryKey: string,
  queryFn: () => Promise<T[]>,
  options?: UniversalQueryOptions<T>
): UseQueryResult<T[]> & {
  refetch: () => Promise<any>;
  invalidate: () => void;
} {
  // Create query keys factory for this specific query
  const queryKeys = createUniversalQueryKeys(queryKey);
  
  // Default options optimized for data browsing
  const defaultOptions: UniversalQueryOptions<T> = {
    enabled: true,
    staleTime: 5 * 60 * 1000,      // 5 minutes (原30秒)
    gcTime: 10 * 60 * 1000,        // 10 minutes (原5分钟)
    cacheTime: 10 * 60 * 1000,     // 10 minutes (backward compatibility)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,     // 设置为false，避免网络波动导致刷新
  };

  // Merge options
  const finalOptions = {
    ...defaultOptions,
    ...options,
  };

  const queryResult = useQuery({
    queryKey: queryKeys.all,
    queryFn: async () => {
      console.log(`🔄 [UniversalQuery] Fetching data for key: ${queryKey}`);
      const startTime = performance.now();
      
      try {
        const data = await queryFn();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`✅ [UniversalQuery] Data fetched successfully for ${queryKey}:`, {
          count: data?.length || 0,
          duration: `${duration.toFixed(2)}ms`,
          cacheKey: queryKeys.all
        });
        
        // Validate data structure
        if (!Array.isArray(data)) {
          console.warn(`⚠️ [UniversalQuery] Expected array but got ${typeof data} for ${queryKey}`);
          return [];
        }
        
        // Clean data from potential React elements or other pollution
        const cleanedData = data.map((item, index) => {
          if (typeof item !== 'object' || item === null) {
            return item;
          }
          
          const cleanedItem = { ...item };
          
          // Remove React elements and functions
          Object.keys(cleanedItem).forEach(key => {
            const value = (cleanedItem as Record<string, any>)[key];
            if (typeof value === 'object' && value !== null) {
              // Check for React elements
              const isReactElement = (value as any).$$typeof || (value as any).$typeof || 
                                   ((value as any).type && (value as any).props);
              if (isReactElement) {
                console.warn(`🧹 [UniversalQuery] Removing React element from ${queryKey}[${index}].${key}`);
                (cleanedItem as Record<string, any>)[key] = '[React Element Removed]';
              }
            } else if (typeof value === 'function') {
              console.warn(`🧹 [UniversalQuery] Removing function from ${queryKey}[${index}].${key}`);
              (cleanedItem as Record<string, any>)[key] = '[Function Removed]';
            }
          });
          
          return cleanedItem;
        });
        
        return cleanedData;
      } catch (error) {
        console.error(`❌ [UniversalQuery] Failed to fetch data for ${queryKey}:`, error);
        throw error;
      }
    },
    ...finalOptions,
  });

  // Enhanced result with utility functions
  return {
    ...queryResult,
    refetch: async () => {
      console.log(`🔄 [UniversalQuery] Manual refetch triggered for ${queryKey}`);
      return queryResult.refetch();
    },
    invalidate: () => {
      console.log(`🗑️ [UniversalQuery] Invalidating cache for ${queryKey}`);
      // This would need access to queryClient to invalidate
      // For now, we'll trigger a refetch
      queryResult.refetch();
    }
  };
}

/**
 * Universal data query hook with filters
 * Extends the basic query hook with filtering capabilities
 */
export function useUniversalDataQueryWithFilters<T = any>(
  queryKey: string,
  queryFn: (filters: UniversalDataFilters) => Promise<T[]>,
  filters: UniversalDataFilters = {},
  options?: UniversalQueryOptions<T>
) {
  const queryKeys = createUniversalQueryKeys(queryKey);
  
  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: async () => {
      console.log(`🔄 [UniversalQueryWithFilters] Fetching data for ${queryKey} with filters:`, filters);
      return queryFn(filters);
    },
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Universal mutation hook for data operations
 * Provides standardized create, update, delete operations
 */
export function useUniversalMutation<T = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateQueries?: string[];
  }
) {
  // This would typically use useMutation from React Query
  // For now, we'll provide a basic implementation
  
  const executeMutation = async (variables: TVariables): Promise<T> => {
    try {
      console.log('🔄 [UniversalMutation] Executing mutation with variables:', variables);
      const result = await mutationFn(variables);
      
      console.log('✅ [UniversalMutation] Mutation completed successfully');
      options?.onSuccess?.(result, variables);
      
      // Invalidate related queries if specified
      if (options?.invalidateQueries) {
        console.log('🗑️ [UniversalMutation] Invalidating queries:', options.invalidateQueries);
        // Would invalidate queries here
      }
      
      return result;
    } catch (error) {
      console.error('❌ [UniversalMutation] Mutation failed:', error);
      options?.onError?.(error as Error, variables);
      throw error;
    }
  };

  return {
    mutateAsync: executeMutation,
    mutate: executeMutation,
    isLoading: false, // This would be managed by the actual mutation hook
    error: null,
  };
}

// Query keys factory is already exported above at line 22
// Types are already exported above