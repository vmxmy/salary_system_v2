/**
 * 智能字段映射工具
 * 使用字符串相似度算法自动推荐字段映射
 */

// 智能映射配置接口
export interface SmartMappingConfig {
  // 算法权重配置
  weights: {
    levenshtein: number;      // Levenshtein权重 (0-1)
    jaroWinkler: number;      // Jaro-Winkler权重 (0-1)
    contains: number;         // 包含关系权重 (0-1)
    rules: number;            // 规则匹配权重 (0-1)
  };
  
  // 置信度阈值配置
  thresholds: {
    highConfidence: number;   // 高置信度阈值 (0-1)
    mediumConfidence: number; // 中等置信度阈值 (0-1)
    minimumRecommend: number; // 最低推荐阈值 (0-1)
    autoApply: number;        // 自动应用阈值 (0-1)
  };
  
  // 高级配置
  advanced: {
    caseSensitive: boolean;         // 大小写敏感
    enablePrefixBonus: boolean;     // 启用前缀奖励
    prefixBonusWeight: number;      // 前缀奖励权重
    enableRuleBoost: boolean;       // 启用规则提升
    ruleBoostAmount: number;        // 规则提升数值
    maxRecommendations: number;     // 最大推荐数量
  };
}

// 默认配置
export const DEFAULT_CONFIG: SmartMappingConfig = {
  weights: {
    levenshtein: 0.3,
    jaroWinkler: 0.3,
    contains: 0.4,
    rules: 0.0  // 规则匹配不参与权重计算，而是作为加分项
  },
  thresholds: {
    highConfidence: 0.7,
    mediumConfidence: 0.4,
    minimumRecommend: 0.3,
    autoApply: 0.8
  },
  advanced: {
    caseSensitive: false,
    enablePrefixBonus: true,
    prefixBonusWeight: 0.1,
    enableRuleBoost: true,
    ruleBoostAmount: 0.3,
    maxRecommendations: 5
  }
};

// 简单的Levenshtein距离算法
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// 计算字符串相似度（0-1之间，1表示完全相同）
export function calculateSimilarity(str1: string, str2: string, caseSensitive: boolean = false): number {
  if (!str1 || !str2) return 0;
  
  // 预处理：去除空白、根据配置决定是否转换为小写
  const s1 = caseSensitive ? str1.trim() : str1.trim().toLowerCase();
  const s2 = caseSensitive ? str2.trim() : str2.trim().toLowerCase();
  
  if (s1 === s2) return 1;
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return (maxLength - distance) / maxLength;
}

// Jaro-Winkler 相似度算法（更适合短字符串）
export function jaroWinklerSimilarity(str1: string, str2: string, caseSensitive: boolean = false, enablePrefixBonus: boolean = true, prefixBonusWeight: number = 0.1): number {
  if (!str1 || !str2) return 0;
  
  const s1 = caseSensitive ? str1.trim() : str1.trim().toLowerCase();
  const s2 = caseSensitive ? str2.trim() : str2.trim().toLowerCase();
  
  if (s1 === s2) return 1;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  if (matchWindow < 0) return 0;
  
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // 找到匹配字符
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  // 计算换位
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler 前缀奖励
  if (!enablePrefixBonus) {
    return jaro;
  }
  
  let prefix = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + (prefixBonusWeight * prefix * (1 - jaro));
}

// 包含关系检查
export function containsSimilarity(str1: string, str2: string, caseSensitive: boolean = false): number {
  if (!str1 || !str2) return 0;
  
  const s1 = caseSensitive ? str1.trim() : str1.trim().toLowerCase();
  const s2 = caseSensitive ? str2.trim() : str2.trim().toLowerCase();
  
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLength = Math.min(s1.length, s2.length);
    const maxLength = Math.max(s1.length, s2.length);
    return minLength / maxLength;
  }
  
  return 0;
}

// 新增：特定规则匹配函数
function applySpecificRules(sourceField: string, targetLabel: string): number {
  const sField = sourceField.trim().toLowerCase();
  const tLabel = targetLabel.trim().toLowerCase();

  // 规则1：姓名拆分
  // 当源字段为"姓名"或"员工姓名"，且目标为"自动拆分"时，给予高分
  if ((sField === '姓名' || sField === '员工姓名') && tLabel.includes('自动拆分为姓和名')) {
    return 1.0; // 直接返回最高分，确保优先匹配
  }

  return 0;
}

// 综合相似度评分
export function calculateCompositeSimilarity(
  sourceField: string, 
  targetName: string, 
  config?: SmartMappingConfig
): number {
  const mappingConfig = config || DEFAULT_CONFIG;
  
  // 首先检查是否有特定规则匹配
  if (mappingConfig.advanced.enableRuleBoost) {
    const ruleScore = applySpecificRules(sourceField, targetName);
    if (ruleScore > 0) {
      // 如果规则匹配，直接返回一个非常高的、确定的分数
      return ruleScore;
    }
  }
  
  const levenshtein = calculateSimilarity(sourceField, targetName, mappingConfig.advanced.caseSensitive);
  const jaroWinkler = jaroWinklerSimilarity(
    sourceField, 
    targetName, 
    mappingConfig.advanced.caseSensitive,
    mappingConfig.advanced.enablePrefixBonus,
    mappingConfig.advanced.prefixBonusWeight
  );
  const contains = containsSimilarity(sourceField, targetName, mappingConfig.advanced.caseSensitive);
  
  // 使用配置的权重进行加权平均
  return (
    levenshtein * mappingConfig.weights.levenshtein + 
    jaroWinkler * mappingConfig.weights.jaroWinkler + 
    contains * mappingConfig.weights.contains
  );
}

// AI智能映射完全依赖字符串相似度算法
// 不再使用硬编码规则，避免维护负担

// 智能字段映射接口
export interface SmartMappingResult {
  sourceField: string;
  recommendations: Array<{
    targetField: string;
    targetLabel: string;
    confidence: number;
    reason: string;
    category: string;
  }>;
  bestMatch?: {
    targetField: string;
    targetLabel: string;
    confidence: number;
    reason: string;
    category: string;
  };
}

// 智能字段映射主函数
export function performSmartMapping(
  sourceFields: string[],
  targetOptions: Array<{
    value: string;
    label: string;
    category: string;
    component?: any;
  }>,
  config?: SmartMappingConfig
): SmartMappingResult[] {
  const mappingConfig = config || DEFAULT_CONFIG;
  
  console.log('🤖 [SmartMapping] 开始智能字段映射...');
  console.log('🤖 [SmartMapping] 源字段:', sourceFields);
  console.log('🤖 [SmartMapping] 目标选项数量:', targetOptions.length);
  console.log('🤖 [SmartMapping] 使用配置:', mappingConfig);
  
  const results: SmartMappingResult[] = [];
  
  sourceFields.forEach(sourceField => {
    const recommendations: SmartMappingResult['recommendations'] = [];
    
    // 对每个目标选项计算相似度
    targetOptions.forEach(option => {
      // 使用综合相似度算法 - 完全依赖AI算法
      const confidence = calculateCompositeSimilarity(sourceField, option.label, mappingConfig);
      
      if (confidence > mappingConfig.thresholds.minimumRecommend) { // 使用配置的最低推荐阈值
        
        // 针对规则匹配，设定一个更显眼的理由
        const isRuleMatch = applySpecificRules(sourceField, option.label) > 0;
        const reason = isRuleMatch 
          ? `规则匹配: 自动拆分姓名`
          : `AI相似度: ${(confidence * 100).toFixed(1)}%`;

        recommendations.push({
          targetField: option.value,
          targetLabel: option.label,
          confidence,
          reason,
          category: option.category
        });
      }
    });
    
    // 按置信度排序
    recommendations.sort((a, b) => b.confidence - a.confidence);
    
    // 取配置的最大推荐数量
    const topRecommendations = recommendations.slice(0, mappingConfig.advanced.maxRecommendations);
    
    const result: SmartMappingResult = {
      sourceField,
      recommendations: topRecommendations,
      bestMatch: topRecommendations.length > 0 ? topRecommendations[0] : undefined
    };
    
    results.push(result);
    
    // 调试日志
    if (topRecommendations.length > 0) {
      console.log(`🎯 [SmartMapping] "${sourceField}" 最佳匹配:`, {
        target: topRecommendations[0].targetLabel,
        confidence: (topRecommendations[0].confidence * 100).toFixed(1) + '%',
        reason: topRecommendations[0].reason
      });
    } else {
      console.log(`⚠️ [SmartMapping] "${sourceField}" 无匹配项`);
    }
  });
  
  return results;
}

// 移除硬编码规则匹配，完全依赖AI相似度算法
// 这样可以减少维护工作量，并且更加灵活

// 批量应用智能映射
export function applySmartMappingToRules(
  sourceFields: string[],
  targetOptions: Array<{ value: string; label: string; category: string; component?: any }>,
  currentRules: Array<{ sourceField: string; targetField: string }>,
  config?: SmartMappingConfig
): Array<{ sourceField: string; targetField: string }> {
  const mappingConfig = config || DEFAULT_CONFIG;
  const smartResults = performSmartMapping(sourceFields, targetOptions, mappingConfig);
  const newRules = [...currentRules];
  
  let appliedCount = 0;
  
  smartResults.forEach(result => {
    // 查找是否已存在映射规则
    const existingRuleIndex = newRules.findIndex(rule => rule.sourceField === result.sourceField);
    
    // 如果有高置信度的推荐，且置信度超过配置的自动应用阈值
    if (result.bestMatch && result.bestMatch.confidence > mappingConfig.thresholds.autoApply) {
      if (existingRuleIndex >= 0) {
        // 更新现有规则
        newRules[existingRuleIndex].targetField = result.bestMatch.targetField;
      } else {
        // 添加新规则
        newRules.push({
          sourceField: result.sourceField,
          targetField: result.bestMatch.targetField
        });
      }
      appliedCount++;
    }
  });
  
  console.log(`✅ [SmartMapping] 已自动应用 ${appliedCount} 个映射规则 (阈值: ${(mappingConfig.thresholds.autoApply * 100).toFixed(0)}%)`);
  
  return newRules;
} 