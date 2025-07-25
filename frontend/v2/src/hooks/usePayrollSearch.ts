import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PayrollSearchEngine, 
  SearchMode, 
  smartSearch,
  createDebouncedSearch 
} from '../utils/searchUtils';

// 本地类型定义，避免导入问题
type SearchConfig = {
  threshold: number;
  includeScore: boolean;
  includeMatches: boolean;
  minMatchCharLength: number;
  keys: string[];
};

type SearchResult<T> = {
  item: T;
  score?: number;
  matches?: any[];
};

// 搜索状态接口
export interface SearchState<T> {
  query: string;
  results: SearchResult<T>[];
  isSearching: boolean;
  searchMode: SearchMode;
  suggestions: string[];
  totalResults: number;
  searchTime: number; // 搜索耗时（毫秒）
}

// Hook 配置接口
export interface UsePayrollSearchConfig extends Partial<SearchConfig> {
  debounceDelay?: number;
  enableSuggestions?: boolean;
  maxSuggestions?: number;
}

// 默认配置
const DEFAULT_CONFIG: UsePayrollSearchConfig = {
  debounceDelay: 300,
  enableSuggestions: true,
  maxSuggestions: 5,
};

/**
 * 薪资数据搜索 Hook
 * @param data 数据源
 * @param config 配置选项
 * @returns 搜索状态和操作函数
 */
export const usePayrollSearch = <T>(
  data: T[],
  config: UsePayrollSearchConfig = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 搜索状态
  const [searchState, setSearchState] = useState<SearchState<T>>({
    query: '',
    results: [],
    isSearching: false,
    searchMode: SearchMode.AUTO,
    suggestions: [],
    totalResults: 0,
    searchTime: 0,
  });

  // 创建搜索引擎实例 - 修复竞态条件问题
  const searchEngine = useMemo(() => {
    console.log(`🔍 [usePayrollSearch] 创建/更新搜索引擎`, {
      dataLength: data.length,
      hasData: data.length > 0,
      sampleData: data.slice(0, 1),
      configKeys: finalConfig.keys
    });
    
    // 动态生成搜索配置，不使用固定的keys
    const dynamicConfig = {
      ...finalConfig,
      keys: undefined // 清除固定keys，让搜索引擎自动生成
    };
    
    // 即使是空数组也创建搜索引擎，这样后续可以正确更新
    return new PayrollSearchEngine(data, dynamicConfig);
  }, [data, finalConfig]);

  // 🔄 修复：监听数据变化并重新处理搜索状态 - 避免循环依赖
  useEffect(() => {
    console.log(`🔄 [usePayrollSearch] 数据变化检测`, {
      dataLength: data.length,
      hasCurrentQuery: !!searchState.query.trim()
    });

    // 更新搜索引擎数据
    searchEngine.updateData(data);
    
    // 只在数据从空变为非空时，初始化显示所有数据
    if (data.length > 0 && searchState.results.length === 0 && !searchState.query.trim()) {
      console.log(`🔄 [usePayrollSearch] 初始化显示所有数据`);
      setSearchState(prev => ({
        ...prev,
        results: data.map(item => ({ item })),
        totalResults: data.length,
      }));
    }
  }, [data.length]); // 只依赖数据长度变化

  // 内部搜索函数 - 避免依赖循环
  const performSearchInternal = useCallback((query: string, mode: SearchMode = SearchMode.AUTO) => {
    console.log(`🔍 [usePayrollSearch] 执行内部搜索`, {
      query,
      mode,
      dataLength: data.length,
      searchEngineKeys: finalConfig.keys
    });

    if (data.length === 0) {
      console.log(`⚠️ [usePayrollSearch] 数据为空，跳过搜索`);
      return;
    }

    const startTime = performance.now();
    
    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      query,
      searchMode: mode,
    }));

    try {
      console.log('🔍 [usePayrollSearch] 准备执行搜索', { query, mode });
      const results = smartSearch(searchEngine, query, mode);
      const endTime = performance.now();
      const searchTime = endTime - startTime;

      console.log(`🔍 [usePayrollSearch] 搜索完成`, {
        query,
        mode,
        resultsCount: results.length,
        searchTime: `${searchTime.toFixed(2)}ms`,
        sampleResults: results.slice(0, 2).map(r => r.item)
      });

      setSearchState(prev => ({
        ...prev,
        results,
        isSearching: false,
        totalResults: results.length,
        searchTime,
      }));

      // 生成搜索建议
      if (finalConfig.enableSuggestions && query.trim()) {
        const suggestions = searchEngine.getSuggestions(
          query, 
          finalConfig.maxSuggestions
        );
        setSearchState(prev => ({
          ...prev,
          suggestions,
        }));
      }

    } catch (error) {
      console.error('❌ [usePayrollSearch] 搜索失败:', error);
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        results: [],
        totalResults: 0,
      }));
    }
  }, [searchEngine, finalConfig, data.length]);

  // 执行搜索的核心函数 - 公开接口
  const performSearch = useCallback((query: string, mode: SearchMode = SearchMode.AUTO) => {
    performSearchInternal(query, mode);
  }, [performSearchInternal]);

  // 创建防抖搜索函数
  const debouncedSearch = useMemo(() => {
    return createDebouncedSearch(searchEngine, finalConfig.debounceDelay);
  }, [searchEngine, finalConfig.debounceDelay]);

  // 搜索函数（带防抖）
  const search = useCallback((query: string, mode: SearchMode = SearchMode.AUTO) => {
    setSearchState(prev => ({
      ...prev,
      query,
      isSearching: true,
      searchMode: mode,
    }));

    debouncedSearch(query, (results) => {
      const searchTime = performance.now(); // 简化的时间计算
      
      setSearchState(prev => ({
        ...prev,
        results,
        isSearching: false,
        totalResults: results.length,
        searchTime: searchTime % 1000, // 简化显示
      }));

      // 生成搜索建议
      if (finalConfig.enableSuggestions && query.trim()) {
        const suggestions = searchEngine.getSuggestions(
          query, 
          finalConfig.maxSuggestions
        );
        setSearchState(prev => ({
          ...prev,
          suggestions,
        }));
      }
    });
  }, [debouncedSearch, searchEngine, finalConfig]);

  // 立即搜索（不防抖）
  const searchImmediate = useCallback((query: string, mode: SearchMode = SearchMode.AUTO) => {
    performSearch(query, mode);
  }, [performSearch]);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      results: data.map(item => ({ item })), // 返回所有数据
      isSearching: false,
      searchMode: SearchMode.AUTO,
      suggestions: [],
      totalResults: data.length,
      searchTime: 0,
    });
  }, [data]);

  // 设置搜索模式 - 移除自动重新搜索，避免循环
  const setSearchMode = useCallback((mode: SearchMode) => {
    setSearchState(prev => {
      // 如果有当前查询，重新搜索
      if (prev.query.trim()) {
        // 直接在状态更新中执行搜索，避免依赖循环
        setTimeout(() => {
          performSearch(prev.query, mode);
        }, 0);
      }
      
      return {
        ...prev,
        searchMode: mode,
      };
    });
  }, [performSearch]);

  // 获取搜索建议
  const getSuggestions = useCallback((query: string) => {
    return searchEngine.getSuggestions(query, finalConfig.maxSuggestions);
  }, [searchEngine, finalConfig.maxSuggestions]);

  // 移除冗余的初始化逻辑 - 现在由数据变化监听处理

  return {
    // 搜索状态
    ...searchState,
    
    // 操作函数
    search,
    searchImmediate,
    clearSearch,
    setSearchMode,
    getSuggestions,
    
    // 工具函数
    isEmptyQuery: !searchState.query.trim(),
    hasResults: searchState.results.length > 0,
    
    // 性能信息
    performance: {
      searchTime: searchState.searchTime,
      resultsCount: searchState.totalResults,
      isOptimal: searchState.searchTime < 100, // 100ms 以下认为是最优的
    },
  };
};

// 搜索历史管理 Hook
export const useSearchHistory = (maxHistory: number = 10) => {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, maxHistory);
    });
  }, [maxHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => prev.filter(item => item !== query));
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}; 