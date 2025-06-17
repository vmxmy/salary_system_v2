import { useState, useEffect } from 'react';
import { useLookupMaps } from '../../../hooks/useLookupMaps';

export interface PersonnelCategory {
  id: number;
  name: string;
  code: string;
}

export const usePersonnelCategories = () => {
  const [personnelCategories, setPersonnelCategories] = useState<PersonnelCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { lookupMaps } = useLookupMaps();

  useEffect(() => {
    // 从lookupMaps中获取人员类别数据
    if (lookupMaps && lookupMaps.personnelCategoryMap) {
      const categories = Array.from(lookupMaps.personnelCategoryMap.entries()).map(([key, value]) => ({
        id: parseInt(key, 10),
        name: value,
        code: key,
      }));
      setPersonnelCategories(categories);
    }
  }, [lookupMaps]);

  // 根据ID数组获取名称数组
  const getPersonnelCategoryNames = (ids: number[]): string[] => {
    if (!ids || !Array.isArray(ids)) return [];
    return ids
      .map(id => {
        const category = personnelCategories.find(cat => cat.id === id);
        return category ? category.name : `未知类别(${id})`;
      })
      .filter(Boolean);
  };

  // 根据ID数组获取名称字符串（用逗号分隔）
  const getPersonnelCategoryNamesString = (ids: number[]): string => {
    return getPersonnelCategoryNames(ids).join(', ');
  };

  return {
    personnelCategories,
    loading,
    error,
    getPersonnelCategoryNames,
    getPersonnelCategoryNamesString,
  };
}; 