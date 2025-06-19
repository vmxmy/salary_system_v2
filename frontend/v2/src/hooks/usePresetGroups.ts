// 预设分组管理Hook

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { presetGroupsApi, type PresetGroupCreateRequest, type PresetGroupUpdateRequest } from '../services/presetGroups';
import type { PresetGroup } from '../types/payrollDataPresets';

interface GroupStats {
  [groupId: number]: {
    presetCount: number;
    lastUsedAt?: string;
  };
}

export const usePresetGroups = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [groups, setGroups] = useState<PresetGroup[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStats>({});
  const [loading, setLoading] = useState(false);

  // 加载分组列表
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const [groupsResponse, statsResponse] = await Promise.all([
        presetGroupsApi.getGroups(),
        presetGroupsApi.getGroupsStats()
      ]);
      
      setGroups(groupsResponse.groups);
      
      // 转换统计数据为便于查找的格式
      const statsMap = statsResponse.reduce((acc, stat) => {
        acc[stat.groupId] = {
          presetCount: stat.presetCount,
          lastUsedAt: stat.lastUsedAt
        };
        return acc;
      }, {} as GroupStats);
      
      setGroupStats(statsMap);
      
      console.log('🎯 [usePresetGroups] 加载分组成功:', {
        groupsCount: groupsResponse.groups.length,
        statsCount: statsResponse.length
      });
    } catch (error) {
      console.error('❌ [usePresetGroups] 加载分组失败:', error);
      message.error(t('payroll:presets.group_manager.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 创建分组
  const createGroup = useCallback(async (data: PresetGroupCreateRequest) => {
    try {
      setLoading(true);
      const newGroup = await presetGroupsApi.createGroup(data);
      setGroups(prev => [...prev, newGroup]);
      
      // 初始化新分组的统计信息
      setGroupStats(prev => ({
        ...prev,
        [newGroup.id!]: { presetCount: 0 }
      }));
      
      message.success(t('payroll:presets.group_manager.create_success'));
      return newGroup;
    } catch (error: any) {
      console.error('❌ [usePresetGroups] 创建分组失败:', error);
      
      // 解析后端错误信息
      let errorMessage = t('payroll:presets.group_manager.create_failed');
      if (error?.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 更新分组
  const updateGroup = useCallback(async (id: number, data: PresetGroupUpdateRequest) => {
    try {
      setLoading(true);
      const updatedGroup = await presetGroupsApi.updateGroup(id, data);
      setGroups(prev => prev.map(g => g.id === id ? updatedGroup : g));
      
      message.success(t('payroll:presets.group_manager.update_success'));
      return updatedGroup;
    } catch (error: any) {
      console.error('❌ [usePresetGroups] 更新分组失败:', error);
      
      let errorMessage = t('payroll:presets.group_manager.update_failed');
      if (error?.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 删除分组
  const deleteGroup = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await presetGroupsApi.deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      
      // 清除统计信息
      setGroupStats(prev => {
        const { [id]: removed, ...rest } = prev;
        return rest;
      });
      
      message.success(t('payroll:presets.group_manager.delete_success'));
    } catch (error: any) {
      console.error('❌ [usePresetGroups] 删除分组失败:', error);
      
      let errorMessage = t('payroll:presets.group_manager.delete_failed');
      if (error?.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 更新分组排序
  const updateGroupsOrder = useCallback(async (groupIds: number[]) => {
    try {
      await presetGroupsApi.updateGroupsOrder(groupIds);
      
      // 根据新顺序重新排序本地状态
      const reorderedGroups = groupIds.map(id => 
        groups.find(g => g.id === id)!
      ).filter(Boolean);
      
      setGroups(reorderedGroups);
      message.success(t('payroll:presets.group_manager.reorder_success'));
    } catch (error) {
      console.error('❌ [usePresetGroups] 更新排序失败:', error);
      message.error(t('payroll:presets.group_manager.reorder_failed'));
      throw error;
    }
  }, [groups, t]);

  // 获取分组的预设数量
  const getGroupPresetCount = useCallback((groupId: number) => {
    return groupStats[groupId]?.presetCount || 0;
  }, [groupStats]);

  // 获取分组的最后使用时间
  const getGroupLastUsed = useCallback((groupId: number) => {
    return groupStats[groupId]?.lastUsedAt;
  }, [groupStats]);

  // 重新加载统计信息（在预设变更后调用）
  const refreshStats = useCallback(async () => {
    try {
      const statsResponse = await presetGroupsApi.getGroupsStats();
      const statsMap = statsResponse.reduce((acc, stat) => {
        acc[stat.groupId] = {
          presetCount: stat.presetCount,
          lastUsedAt: stat.lastUsedAt
        };
        return acc;
      }, {} as GroupStats);
      
      setGroupStats(statsMap);
    } catch (error) {
      console.error('❌ [usePresetGroups] 刷新统计信息失败:', error);
    }
  }, []);

  // 初始化时加载数据
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groups,
    groupStats,
    loading,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    updateGroupsOrder,
    getGroupPresetCount,
    getGroupLastUsed,
    refreshStats
  };
};