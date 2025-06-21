import Fuse from 'fuse.js';
import { debounce } from 'lodash';

// 类型定义
type FuseResultMatch = {
  indices: readonly [number, number][];
  value?: string;
  key?: string;
  arrayIndex?: number;
};

export type SearchConfig = {
  threshold: number;
  includeScore: boolean;
  includeMatches: boolean;
  minMatchCharLength: number;
  keys: string[];
};

export type SearchResult<T> = {
  item: T;
  score?: number;
  matches?: FuseResultMatch[];
};

export enum SearchMode {
  FUZZY = 'fuzzy',
  EXACT = 'exact',
  RANGE = 'range',
  AUTO = 'auto'
}

// 默认配置
const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
  keys: []
};

// 动态生成搜索配置
export const generateSearchConfig = <T>(data: T[]): SearchConfig => {
  if (!data || data.length === 0) {
    console.log('⚠️ [generateSearchConfig] 数据为空，使用默认配置');
    return DEFAULT_SEARCH_CONFIG;
  }

  const firstItem = data[0] as any;
  const allKeys = Object.keys(firstItem);
  
  console.log('🔧 [generateSearchConfig] 动态生成搜索配置', {
    totalFields: allKeys.length,
    allFields: allKeys.slice(0, 20)
  });

  const textFields: string[] = [];
  const numericFields: string[] = [];
  const priorityFields: string[] = [];
  
  // 高优先级字段
  const priorityPatterns = [
    /^员工姓名$|^姓名$/,
    /^员工编号$|^编号$/,
    /^身份证号$/,
    /^部门名称$|^部门$/,
    /^职位名称$|^职位$|^岗位$/,
    /^人员类别$/,
    /^编制$/
  ];

  // 数值字段模式
  const numericPatterns = [
    /合计$/,
    /工资$/,
    /津贴$/,
    /奖金$/,
    /补贴$/,
    /扣除$/,
    /金额$/,
    /费用$/,
    /^基本/,
    /保险$/,
    /公积金$/
  ];

  // 排除字段模式
  const excludePatterns = [
    /^id$|.*id$/i,
    /^key$/,
    /时间$|日期$/,
    /创建|更新|修改/,
    /^\$|^_/
  ];

  allKeys.forEach(key => {
    if (excludePatterns.some(pattern => pattern.test(key))) {
      return;
    }

    const value = firstItem[key];
    const isPriority = priorityPatterns.some(pattern => pattern.test(key));
    
    if (isPriority) {
      priorityFields.push(key);
    } else {
      const isNumeric = typeof value === 'number' || 
                       (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') ||
                       numericPatterns.some(pattern => pattern.test(key));
      
      if (isNumeric) {
        numericFields.push(key);
      } else if (typeof value === 'string' && value.trim() !== '') {
        textFields.push(key);
      }
    }
  });

  const searchKeys = [
    ...priorityFields,
    ...textFields.slice(0, 10),
    ...numericFields.slice(0, 15)
  ];

  console.log('🔧 [generateSearchConfig] 字段分类结果', {
    priorityFields: priorityFields.length,
    textFields: textFields.length,
    numericFields: numericFields.length,
    totalSearchKeys: searchKeys.length,
    finalKeys: searchKeys
  });

  return {
    ...DEFAULT_SEARCH_CONFIG,
    keys: searchKeys
  };
};

// 🧹 重构后的统一搜索引擎
export class UnifiedSearchEngine<T> {
  private fuse!: Fuse<T>;
  private data: T[] = [];
  private config: SearchConfig;

  constructor(data: T[], config: Partial<SearchConfig> = {}) {
    const baseConfig = { ...DEFAULT_SEARCH_CONFIG, ...config };
    
    if (!config.keys || config.keys.length === 0) {
      const dynamicConfig = generateSearchConfig(data);
      this.config = { ...baseConfig, keys: dynamicConfig.keys };
    } else {
      this.config = baseConfig;
    }
    
    if (!this.config.keys || !Array.isArray(this.config.keys)) {
      this.config.keys = [];
    }
    
    this.data = data;
    this.updateFuseInstance();

    console.log('🚀 [UnifiedSearchEngine] 搜索引擎初始化完成', {
      dataLength: data.length,
      searchKeys: this.config.keys.length,
      threshold: this.config.threshold
    });
  }

  private updateFuseInstance(): void {
    this.fuse = new Fuse(this.data, {
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
    
    if (newData.length > 0) {
      const newConfig = generateSearchConfig(newData);
      this.config = { ...this.config, keys: newConfig.keys };
      
      console.log('🔄 [updateData] 重新生成搜索配置', {
        newDataLength: newData.length,
        newSearchKeys: this.config.keys.length
      });
    }
    
    if (!this.config.keys || !Array.isArray(this.config.keys)) {
      this.config.keys = [];
    }
    
    this.updateFuseInstance();
  }

  // 🎯 统一搜索接口
  search(query: string, mode: SearchMode = SearchMode.AUTO): SearchResult<T>[] {
    console.log('🔍 [UnifiedSearchEngine] 统一搜索', { query, mode });

    if (!query.trim()) {
      return this.data.map(item => ({ item }));
    }

    // 根据模式或自动检测选择搜索策略
    if (mode === SearchMode.AUTO) {
      mode = this.detectSearchMode(query);
      console.log('🤖 [AutoDetect] 检测到搜索模式:', mode);
    }

    switch (mode) {
      case SearchMode.RANGE:
        return this.executeRangeSearch(query);
      case SearchMode.EXACT:
        return this.executeExactSearch(query);
      case SearchMode.FUZZY:
      default:
        return this.executeFuzzySearch(query);
    }
  }

  // 🎯 自动检测搜索模式
  private detectSearchMode(query: string): SearchMode {
    // 检查是否包含数值范围表达式
    const rangePatterns = [
      /[^><=!]+\s*(>=|<=|>|<|!=|=)\s*\d+(?:\.\d+)?/,
      /\d+(?:\.\d+)?\s*(>=|<=|>|<|!=|=)\s*[^><=!]+/
    ];
    
    if (rangePatterns.some(pattern => pattern.test(query))) {
      return SearchMode.RANGE;
    }
    
    // 检查是否使用引号（精确搜索）
    if (query.includes('"')) {
      return SearchMode.EXACT;
    }
    
    // 短查询使用精确搜索
    if (query.length <= 2) {
      return SearchMode.EXACT;
    }
    
    // 默认使用模糊搜索
    return SearchMode.FUZZY;
  }

  // 🔍 模糊搜索实现
  private executeFuzzySearch(query: string): SearchResult<T>[] {
    console.log('🔍 [FuzzySearch] 执行模糊搜索', { query });
    
    const keywords = query.trim().split(/\s+/);
    
    if (keywords.length === 1) {
      // 单关键词搜索
      const results = this.fuse.search(query);
      return results.map(result => ({
        item: result.item,
        score: result.score,
        matches: result.matches ? [...result.matches] : undefined
      }));
    } else {
      // 多关键词AND搜索
      let results = this.data.map(item => ({ item }));
      
      for (const keyword of keywords) {
        const keywordResults = this.fuse.search(keyword);
        const keywordItems = new Set(keywordResults.map(r => r.item));
        results = results.filter(r => keywordItems.has(r.item));
      }
      
      return results;
    }
  }

  // 🎯 精确搜索实现
  private executeExactSearch(query: string): SearchResult<T>[] {
    console.log('🎯 [ExactSearch] 执行精确搜索', { query });
    
    const cleanQuery = query.replace(/"/g, '').toLowerCase();
    
    return this.data
      .filter(item => {
        return this.config.keys.some(key => {
          const value = (item as any)[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(cleanQuery);
        });
      })
      .map(item => ({ item }));
  }

  // 🔢 数值范围搜索实现
  private executeRangeSearch(query: string): SearchResult<T>[] {
    console.log('🔢 [RangeSearch] 执行数值范围搜索', { query });

    const rangeExpressions = this.parseRangeQuery(query);
    if (rangeExpressions.length === 0) {
      console.log('⚠️ [RangeSearch] 未识别到范围表达式，回退到模糊搜索');
      return this.executeFuzzySearch(query);
    }

    console.log('🔢 [RangeSearch] 解析的范围表达式:', rangeExpressions);

    const filteredData = this.data.filter(item => {
      return rangeExpressions.every(expr => this.evaluateRangeExpression(item, expr));
    });

    console.log('🔢 [RangeSearch] 搜索完成', {
      totalData: this.data.length,
      filteredCount: filteredData.length
    });

    return filteredData.map(item => ({ item }));
  }

  // 解析范围表达式
  private parseRangeQuery(query: string): Array<{
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
    value: number;
    originalText: string;
  }> {
    const expressions: Array<{
      field: string;
      operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
      value: number;
      originalText: string;
    }> = [];

    const patterns = [
      /([^><=!]+)\s*(>=|<=|>|<|!=|=)\s*(\d+(?:\.\d+)?)/g,
      /(\d+(?:\.\d+)?)\s*(>=|<=|>|<|!=|=)\s*([^><=!]+)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        const [fullMatch, left, operator, right] = match;
        
        let field: string;
        let value: number;
        let actualOperator = operator as '>' | '<' | '>=' | '<=' | '=' | '!=';
        
        if (isNaN(Number(left))) {
          field = left.trim();
          value = parseFloat(right);
        } else {
          field = right.trim();
          value = parseFloat(left);
          const operatorMap: Record<string, string> = {
            '>': '<', '<': '>', '>=': '<=', '<=': '>=', '=': '=', '!=': '!='
          };
          actualOperator = operatorMap[operator] as '>' | '<' | '>=' | '<=' | '=' | '!=';
        }

        const matchedKey = this.findMatchingDataKey(field);
        if (matchedKey) {
          expressions.push({
            field: matchedKey,
            operator: actualOperator,
            value,
            originalText: fullMatch
          });
        }
      }
    }

    return expressions;
  }

  // 查找匹配的数据字段
  private findMatchingDataKey(searchField: string): string | null {
    const lowerSearchField = searchField.toLowerCase().trim();
    
    // 直接匹配
    const directMatch = this.config.keys.find(key => 
      key.toLowerCase() === lowerSearchField
    );
    if (directMatch) return directMatch;

    // 包含匹配
    const containsMatch = this.config.keys.find(key => 
      key.toLowerCase().includes(lowerSearchField) || 
      lowerSearchField.includes(key.toLowerCase())
    );
    if (containsMatch) return containsMatch;

    // 在所有数值字段中查找
    if (this.data.length > 0) {
      const firstItem = this.data[0] as any;
      const allKeys = Object.keys(firstItem);
      const numericKeys = allKeys.filter(key => {
        const value = firstItem[key];
        return typeof value === 'number' || 
               (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '');
      });

      const numericMatch = numericKeys.find(key => 
        key.toLowerCase().includes(lowerSearchField) || 
        lowerSearchField.includes(key.toLowerCase())
      );
      if (numericMatch) return numericMatch;
    }

    return null;
  }

  // 评估范围表达式
  private evaluateRangeExpression(item: any, expr: {
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
    value: number;
  }): boolean {
    const fieldValue = item[expr.field];
    
    if (fieldValue == null) return false;

    const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(String(fieldValue));
    if (isNaN(numValue)) return false;

    switch (expr.operator) {
      case '>': return numValue > expr.value;
      case '<': return numValue < expr.value;
      case '>=': return numValue >= expr.value;
      case '<=': return numValue <= expr.value;
      case '=': return numValue === expr.value;
      case '!=': return numValue !== expr.value;
      default: return false;
    }
  }

  // 获取搜索建议
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

  // 获取搜索配置信息
  getSearchInfo() {
    return {
      searchKeys: this.config.keys,
      dataLength: this.data.length,
      threshold: this.config.threshold
    };
  }
}

// 🕐 简化的防抖搜索函数
export const createDebouncedSearch = <T>(
  searchEngine: UnifiedSearchEngine<T>,
  delay: number = 300
) => {
  return debounce((query: string, callback: (results: SearchResult<T>[]) => void) => {
    console.log('🕐 [DebouncedSearch] 执行防抖搜索', { query });
    const results = searchEngine.search(query, SearchMode.AUTO);
    callback(results);
  }, delay);
};

// 保持向后兼容的别名
export const PayrollSearchEngine = UnifiedSearchEngine;
export const smartSearch = <T>(
  searchEngine: UnifiedSearchEngine<T>,
  query: string,
  mode: SearchMode = SearchMode.AUTO
): SearchResult<T>[] => {
  return searchEngine.search(query, mode);
};

// 检查查询是否包含数值范围表达式（保持向后兼容）
export const containsRangeExpression = (query: string): boolean => {
  const rangePatterns = [
    /[^><=!]+\s*(>=|<=|>|<|!=|=)\s*\d+(?:\.\d+)?/,
    /\d+(?:\.\d+)?\s*(>=|<=|>|<|!=|=)\s*[^><=!]+/
  ];
  return rangePatterns.some(pattern => pattern.test(query));
};

// 高亮工具函数（向后兼容）
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