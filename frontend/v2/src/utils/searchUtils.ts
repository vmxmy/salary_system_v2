import Fuse from 'fuse.js';
import { debounce } from 'lodash';

// 直接定义类型，避免复杂的导入
type FuseResultMatch = {
  indices: readonly [number, number][];
  value?: string;
  key?: string;
  arrayIndex?: number;
};

// 搜索配置类型
export type SearchConfig = {
  threshold: number;
  includeScore: boolean;
  includeMatches: boolean;
  minMatchCharLength: number;
  keys: string[];
};

// 搜索结果类型
export type SearchResult<T> = {
  item: T;
  score?: number;
  matches?: FuseResultMatch[];
};

// 确保导出
export type { SearchConfig as SearchConfigType, SearchResult as SearchResultType };

// 搜索模式枚举
export enum SearchMode {
  FUZZY = 'fuzzy',
  EXACT = 'exact',
  AUTO = 'auto'
}

// 默认配置
const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
  keys: [
    '员工姓名',
    '员工编号', 
    '部门名称',
    '职位名称',
    '人员类别',
    '编制',
    '薪资期间名称'
  ]
};

// 搜索引擎类
export class PayrollSearchEngine<T> {
  private fuse: Fuse<T>;
  private data: T[] = [];
  private config: SearchConfig;

  constructor(data: T[], config: Partial<SearchConfig> = {}) {
    this.config = { ...DEFAULT_SEARCH_CONFIG, ...config };
    this.data = data;
    this.fuse = new Fuse(data, {
      threshold: this.config.threshold,
      includeScore: this.config.includeScore,
      includeMatches: this.config.includeMatches,
      minMatchCharLength: this.config.minMatchCharLength,
      keys: this.config.keys,
      ignoreLocation: true,
      findAllMatches: true,
    });
  }

  updateData(newData: T[]): void {
    this.data = newData;
    this.fuse.setCollection(newData);
  }

  search(query: string): SearchResult<T>[] {
    console.log(`🔍 [PayrollSearchEngine] 搜索`, {
      query,
      dataLength: this.data.length,
      keys: this.config.keys,
      sampleData: this.data.slice(0, 1)
    });

    if (!query.trim()) {
      return this.data.map(item => ({ item }));
    }

    const results = this.fuse.search(query);
    console.log(`🔍 [PayrollSearchEngine] Fuse搜索结果`, {
      query,
      resultsCount: results.length,
      sampleResults: results.slice(0, 2)
    });

    return results.map(result => ({
      item: result.item,
      score: result.score,
      matches: result.matches ? [...result.matches] : undefined
    }));
  }

  searchMultipleKeywords(query: string): SearchResult<T>[] {
    if (!query.trim()) {
      return this.data.map(item => ({ item }));
    }

    const keywords = query.trim().split(/\s+/);
    if (keywords.length === 1) {
      return this.search(query);
    }

    let results = this.data.map(item => ({ item }));
    
    for (const keyword of keywords) {
      const keywordResults = this.search(keyword);
      const keywordItems = new Set(keywordResults.map(r => r.item));
      results = results.filter(r => keywordItems.has(r.item));
    }

    return results;
  }

  exactSearch(query: string): SearchResult<T>[] {
    if (!query.trim()) {
      return this.data.map(item => ({ item }));
    }

    const lowerQuery = query.toLowerCase();
    return this.data
      .filter(item => {
        return this.config.keys.some(key => {
          const value = (item as any)[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(lowerQuery);
        });
      })
      .map(item => ({ item }));
  }

  getSuggestions(query: string, limit: number = 5): string[] {
    if (!query.trim()) return [];

    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();

    this.data.forEach(item => {
      this.config.keys.forEach(key => {
        const value = (item as any)[key];
        if (value != null) {
          const strValue = String(value);
          if (strValue.toLowerCase().includes(lowerQuery)) {
            suggestions.add(strValue);
          }
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

// 防抖搜索函数
export const createDebouncedSearch = <T>(
  searchEngine: PayrollSearchEngine<T>,
  delay: number = 300
) => {
  return debounce((query: string, callback: (results: SearchResult<T>[]) => void) => {
    const results = searchEngine.searchMultipleKeywords(query);
    callback(results);
  }, delay);
};

// 高亮工具函数
export const getHighlightRanges = (text: string, matches?: FuseResultMatch[]): Array<[number, number]> => {
  if (!matches || !text) return [];

  const ranges: Array<[number, number]> = [];
  
  matches.forEach(match => {
    if (match.indices) {
      match.indices.forEach(([start, end]) => {
        ranges.push([start, end + 1]);
      });
    }
  });

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  
  for (const range of ranges) {
    if (merged.length === 0 || merged[merged.length - 1][1] < range[0]) {
      merged.push(range);
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], range[1]);
    }
  }

  return merged;
};

// 智能搜索函数
export const smartSearch = <T>(
  searchEngine: PayrollSearchEngine<T>,
  query: string,
  mode: SearchMode = SearchMode.AUTO
): SearchResult<T>[] => {
  if (!query.trim()) {
    return searchEngine.search('');
  }

  if (mode === SearchMode.AUTO) {
    if (query.includes('"')) {
      const exactQuery = query.replace(/"/g, '');
      return searchEngine.exactSearch(exactQuery);
    }
    if (query.length <= 2) {
      return searchEngine.exactSearch(query);
    }
    return searchEngine.searchMultipleKeywords(query);
  }

  switch (mode) {
    case SearchMode.EXACT:
      return searchEngine.exactSearch(query);
    case SearchMode.FUZZY:
    default:
      return searchEngine.searchMultipleKeywords(query);
  }
}; 