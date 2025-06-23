import { useState, useMemo, useCallback, useEffect } from 'react';
import { SearchMode } from '../../../utils/searchUtils';

// Search configuration interface
export interface UniversalSearchConfig {
  searchableFields?: string[] | Array<{key: string, label: string, type: string}>;
  threshold?: number;
  debounceDelay?: number;
  enableSuggestions?: boolean;
  maxSuggestions?: number;
  supportExpressions?: boolean;
  caseSensitive?: boolean;
}

// Search result interface
export interface SearchResult<T = any> {
  item: T;
  score: number;
  matches?: Array<{
    key: string;
    value: string;
    indices: Array<[number, number]>;
  }>;
}

// Performance metrics
export interface SearchPerformance {
  isOptimal: boolean;
  duration: number;
  resultsCount: number;
  mode: SearchMode;
}

// Default search configuration
const defaultSearchConfig: Required<UniversalSearchConfig> = {
  searchableFields: [],
  threshold: 0.3,
  debounceDelay: 300,
  enableSuggestions: true,
  maxSuggestions: 5,
  supportExpressions: true,
  caseSensitive: false,
};

/**
 * Universal search hook
 * Provides intelligent search functionality with multiple search modes
 */
export const useUniversalSearch = <T extends Record<string, any>>(
  dataSource: T[],
  config: UniversalSearchConfig = {}
) => {
  // 使用useMemo稳定化searchConfig对象，避免每次渲染都创建新对象
  const searchConfig = useMemo(() => ({ ...defaultSearchConfig, ...config }), [config]);
  
  // State management
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.AUTO);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [performance, setPerformance] = useState<SearchPerformance>({
    isOptimal: true,
    duration: 0,
    resultsCount: 0,
    mode: SearchMode.AUTO
  });

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, searchConfig.debounceDelay);

    return () => clearTimeout(timer);
  }, [query, searchConfig.debounceDelay]);

  // Extract searchable fields from data if not provided
  const searchableFields = useMemo(() => {
    if (searchConfig.searchableFields && searchConfig.searchableFields.length > 0) {
      // Handle both string[] and SearchableField[] formats
      if (typeof searchConfig.searchableFields[0] === 'string') {
        return searchConfig.searchableFields as string[];
      } else {
        return (searchConfig.searchableFields as Array<{key: string, label: string, type: string}>).map(f => f.key);
      }
    }
    
    // Auto-detect searchable fields
    if (!dataSource || dataSource.length === 0) return [];
    
    const sample = dataSource[0];
    const fields: string[] = [];
    
    Object.keys(sample).forEach(key => {
      const value = sample[key];
      // Include text fields and simple values
      if (typeof value === 'string' || 
          typeof value === 'number' || 
          (typeof value === 'object' && value !== null && !Array.isArray(value))) {
        fields.push(key);
      }
    });
    
    return fields;
  }, [dataSource, searchConfig.searchableFields]);

  // Parse expression queries (e.g., "salary>10000", "department=技术部")
  const parseExpression = useCallback((queryStr: string) => {
    const expressionRegex = /(\w+)\s*(>=|<=|>|<|=|!=)\s*(.+)/;
    const match = queryStr.match(expressionRegex);
    
    if (!match) return null;
    
    const [, field, operator, value] = match;
    
    return {
      field: field.trim(),
      operator: operator.trim(),
      value: value.trim().replace(/['"]/g, '') // Remove quotes
    };
  }, []);

  // Evaluate expression against a record
  const evaluateExpression = useCallback((record: T, expression: ReturnType<typeof parseExpression>) => {
    if (!expression) return false;
    
    const { field, operator, value } = expression;
    const recordValue = record[field];
    
    if (recordValue == null) return false;
    
    const recordStr = String(recordValue).toLowerCase();
    const compareValue = value.toLowerCase();
    
    switch (operator) {
      case '=':
        return recordStr === compareValue;
      case '!=':
        return recordStr !== compareValue;
      case '>':
        const recordNum = Number(recordValue);
        const compareNum = Number(value);
        if (!isNaN(recordNum) && !isNaN(compareNum)) {
          return recordNum > compareNum;
        }
        return recordStr > compareValue;
      case '<':
        const recordNumLt = Number(recordValue);
        const compareNumLt = Number(value);
        if (!isNaN(recordNumLt) && !isNaN(compareNumLt)) {
          return recordNumLt < compareNumLt;
        }
        return recordStr < compareValue;
      case '>=':
        const recordNumGte = Number(recordValue);
        const compareNumGte = Number(value);
        if (!isNaN(recordNumGte) && !isNaN(compareNumGte)) {
          return recordNumGte >= compareNumGte;
        }
        return recordStr >= compareValue;
      case '<=':
        const recordNumLte = Number(recordValue);
        const compareNumLte = Number(value);
        if (!isNaN(recordNumLte) && !isNaN(compareNumLte)) {
          return recordNumLte <= compareNumLte;
        }
        return recordStr <= compareValue;
      default:
        return false;
    }
  }, []);

  // Fuzzy search implementation
  const fuzzySearch = useCallback((text: string, pattern: string): number => {
    if (!pattern) return 1;
    if (pattern === text) return 1;
    
    const textLower = searchConfig.caseSensitive ? text : text.toLowerCase();
    const patternLower = searchConfig.caseSensitive ? pattern : pattern.toLowerCase();
    
    // Simple fuzzy matching algorithm
    let score = 0;
    let textIndex = 0;
    let patternIndex = 0;
    
    while (textIndex < textLower.length && patternIndex < patternLower.length) {
      if (textLower[textIndex] === patternLower[patternIndex]) {
        score++;
        patternIndex++;
      }
      textIndex++;
    }
    
    return patternIndex === patternLower.length ? score / patternLower.length : 0;
  }, [searchConfig.caseSensitive]);

  // Perform search with different modes
  const performSearch = useCallback((queryStr: string, mode: SearchMode): SearchResult<T>[] => {
    if (!queryStr.trim() || !dataSource || dataSource.length === 0) {
      return [];
    }

    const startTime = window.performance.now();
    let results: SearchResult<T>[] = [];

    // Check if it's an expression query
    if (searchConfig.supportExpressions && mode !== SearchMode.FUZZY) {
      const expression = parseExpression(queryStr);
      if (expression) {
        results = dataSource
          .map((item, index) => ({ item, score: 1, originalIndex: index }))
          .filter(({ item }) => evaluateExpression(item, expression))
          .map(({ item, score }) => ({ item, score }));
        
        const endTime = window.performance.now();
        setPerformance({
          isOptimal: true,
          duration: endTime - startTime,
          resultsCount: results.length,
          mode: SearchMode.EXACT
        });
        
        return results;
      }
    }

    const queryTerms = queryStr.toLowerCase().trim().split(/\s+/);

    results = dataSource.map((item, index) => {
      let totalScore = 0;
      let matchCount = 0;
      const matches: Array<{ key: string; value: string; indices: Array<[number, number]> }> = [];

      for (const field of searchableFields) {
        const fieldValue = item[field];
        if (fieldValue == null) continue;

        const fieldText = String(fieldValue);
        const fieldTextLower = searchConfig.caseSensitive ? fieldText : fieldText.toLowerCase();

        for (const term of queryTerms) {
          let fieldScore = 0;

          switch (mode) {
            case SearchMode.EXACT:
              if (fieldTextLower.includes(term)) {
                fieldScore = term.length / fieldTextLower.length;
                matchCount++;
              }
              break;

            case SearchMode.FUZZY:
              const fuzzyScore = fuzzySearch(fieldText, term);
              if (fuzzyScore >= searchConfig.threshold) {
                fieldScore = fuzzyScore;
                matchCount++;
              }
              break;

            case SearchMode.REGEX:
              try {
                const regex = new RegExp(term, searchConfig.caseSensitive ? 'g' : 'gi');
                const regexMatches = Array.from(fieldTextLower.matchAll(regex));
                if (regexMatches.length > 0) {
                  fieldScore = Math.min(regexMatches.length * 0.5, 1);
                  matchCount++;
                }
              } catch {
                // Fallback to exact search if regex is invalid
                if (fieldTextLower.includes(term)) {
                  fieldScore = 0.5;
                  matchCount++;
                }
              }
              break;

            case SearchMode.SMART:
            case SearchMode.AUTO:
            default:
              // Smart search combines exact and fuzzy
              if (fieldTextLower.includes(term)) {
                fieldScore = 0.8; // High score for exact match
                matchCount++;
              } else {
                const fuzzyScore = fuzzySearch(fieldText, term);
                if (fuzzyScore >= searchConfig.threshold) {
                  fieldScore = fuzzyScore * 0.6; // Lower score for fuzzy match
                  matchCount++;
                }
              }
              break;
          }

          if (fieldScore > 0) {
            matches.push({
              key: field,
              value: fieldText,
              indices: [[0, term.length]] // Simplified for now
            });
          }

          totalScore += fieldScore;
        }
      }

      // Calculate final score
      const finalScore = matchCount > 0 ? totalScore / queryTerms.length : 0;

      return {
        item,
        score: finalScore,
        matches: matches.length > 0 ? matches : undefined
      };
    }).filter(result => result.score > 0);

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    const endTime = window.performance.now();
    const duration = endTime - startTime;
    
    setPerformance({
      isOptimal: duration < 100 && results.length < 1000,
      duration,
      resultsCount: results.length,
      mode
    });

    return results;
  }, [dataSource, searchableFields, searchConfig, parseExpression, evaluateExpression, fuzzySearch]);

  // Generate search suggestions
  const generateSuggestions = useCallback((queryStr: string): string[] => {
    if (!searchConfig.enableSuggestions || !queryStr || !dataSource) {
      return [];
    }

    const suggestions = new Set<string>();
    const queryLower = queryStr.toLowerCase();

    // Extract suggestions from searchable fields
    dataSource.forEach(item => {
      searchableFields.forEach(field => {
        const value = item[field];
        if (value != null) {
          const valueStr = String(value);
          if (valueStr.toLowerCase().includes(queryLower) && valueStr.length <= 50) {
            suggestions.add(valueStr);
          }
        }
      });
    });

    // Add search history suggestions
    searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(queryLower)) {
        suggestions.add(historyItem);
      }
    });

    return Array.from(suggestions)
      .slice(0, searchConfig.maxSuggestions)
      .sort((a, b) => a.length - b.length); // Prefer shorter suggestions
  }, [dataSource, searchableFields, searchHistory, searchConfig]);

  // Search results - 修复无限循环：移除useMemo中的状态更新
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return [];
    }

    return performSearch(debouncedQuery, searchMode);
  }, [debouncedQuery, searchMode, performSearch]);

  // 单独管理搜索状态 - 避免在useMemo中调用setState
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsSearching(true);
      // 使用短暂的延迟来显示加载状态，然后快速完成
      const timer = setTimeout(() => setIsSearching(false), 50);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [debouncedQuery]);

  // Update suggestions when query changes
  useEffect(() => {
    if (query && query.length > 1) {
      const newSuggestions = generateSuggestions(query);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, generateSuggestions]);

  // Search function
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    // Add to search history if it's a meaningful query
    if (searchQuery.trim().length > 2) {
      setSearchHistory(prev => {
        const newHistory = [searchQuery, ...prev.filter(item => item !== searchQuery)];
        return newHistory.slice(0, 20); // Keep only last 20 searches
      });
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSuggestions([]);
  }, []);

  // Computed properties
  const isEmptyQuery = !debouncedQuery.trim();
  const hasResults = searchResults.length > 0;
  const totalResults = searchResults.length;
  const searchTime = performance.duration;

  return {
    // State
    query,
    results: searchResults,
    isSearching,
    searchMode,
    suggestions,
    totalResults,
    searchTime,
    isEmptyQuery,
    hasResults,
    performance,
    
    // Actions
    search,
    clearSearch,
    setSearchMode,
    
    // Utilities
    parseExpression,
    generateSuggestions,
    
    // Configuration
    searchableFields,
    searchHistory
  };
};

export default useUniversalSearch;