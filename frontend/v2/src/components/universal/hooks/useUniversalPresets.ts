import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import type { UniversalPreset } from '../DataBrowser/ConfigPresetManager';

// Preset storage configuration
interface PresetStorageConfig {
  storageKey: string;
  enableLocalStorage: boolean;
  enableRemoteSync: boolean;
  maxPresets: number;
}

// Preset metadata for saving
interface PresetMetadata {
  description?: string;
  category?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  [key: string]: any;
}

// Default storage configuration
const defaultStorageConfig: PresetStorageConfig = {
  storageKey: 'universal_data_presets',
  enableLocalStorage: true,
  enableRemoteSync: false,
  maxPresets: 50,
};

/**
 * Universal presets management hook
 * Provides preset save/load/delete functionality with local storage support
 */
export const useUniversalPresets = (
  namespace: string = 'default',
  config: Partial<PresetStorageConfig> = {}
) => {
  const storageConfig = { ...defaultStorageConfig, ...config };
  const fullStorageKey = `${storageConfig.storageKey}_${namespace}`;
  
  // State management
  const [presets, setPresets] = useState<UniversalPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load presets from storage
  const loadPresets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (storageConfig.enableLocalStorage) {
        const stored = localStorage.getItem(fullStorageKey);
        if (stored) {
          const parsedPresets = JSON.parse(stored);
          
          // Validate and migrate presets if needed
          const validatedPresets = parsedPresets.map((preset: any) => ({
            id: preset.id || generatePresetId(),
            name: preset.name,
            description: preset.description || '',
            category: preset.category || 'default',
            isDefault: preset.isDefault || false,
            isFavorite: preset.isFavorite || false,
            isPublic: preset.isPublic || false,
            createdAt: preset.createdAt || dayjs().toISOString(),
            updatedAt: preset.updatedAt || dayjs().toISOString(),
            usageCount: preset.usageCount || 0,
            lastUsedAt: preset.lastUsedAt,
            creator: preset.creator || 'unknown',
            config: preset.config || {}
          }));

          setPresets(validatedPresets);
        }
      }

      // TODO: Add remote sync support
      if (storageConfig.enableRemoteSync) {
        // Load from remote API
        console.log('🔄 [UniversalPresets] Remote sync not implemented yet');
      }
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to load presets:', err);
      setError('Failed to load presets');
    } finally {
      setLoading(false);
    }
  }, [fullStorageKey, storageConfig]);

  // Save presets to storage
  const savePresetsToStorage = useCallback(async (presetsToSave: UniversalPreset[]) => {
    try {
      if (storageConfig.enableLocalStorage) {
        // Limit number of presets
        const limitedPresets = presetsToSave.slice(0, storageConfig.maxPresets);
        localStorage.setItem(fullStorageKey, JSON.stringify(limitedPresets));
      }

      // TODO: Add remote sync support
      if (storageConfig.enableRemoteSync) {
        // Save to remote API
        console.log('🔄 [UniversalPresets] Remote sync not implemented yet');
      }
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to save presets:', err);
      throw new Error('Failed to save presets');
    }
  }, [fullStorageKey, storageConfig]);

  // Generate unique preset ID
  const generatePresetId = useCallback(() => {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Save a new preset
  const savePreset = useCallback(async (
    name: string,
    config: any,
    metadata: PresetMetadata = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Check for duplicate names
      const existingPreset = presets.find(p => p.name === name);
      if (existingPreset) {
        throw new Error(`Preset with name "${name}" already exists`);
      }

      const newPreset: UniversalPreset = {
        id: generatePresetId(),
        name,
        description: metadata.description || '',
        category: metadata.category || 'default',
        isDefault: metadata.isDefault || false,
        isFavorite: false,
        isPublic: metadata.isPublic || false,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        usageCount: 0,
        creator: 'user', // TODO: Get from user context
        config
      };

      // If this is set as default, remove default from others
      let updatedPresets = [...presets];
      if (newPreset.isDefault) {
        updatedPresets = updatedPresets.map(p => ({ ...p, isDefault: false }));
      }

      updatedPresets.push(newPreset);
      
      await savePresetsToStorage(updatedPresets);
      setPresets(updatedPresets);

      console.log('✅ [UniversalPresets] Preset saved successfully:', newPreset.name);
      return newPreset;
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to save preset:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [presets, generatePresetId, savePresetsToStorage]);

  // Update an existing preset
  const updatePreset = useCallback(async (updatedPreset: UniversalPreset) => {
    try {
      setLoading(true);
      setError(null);

      const updatedPresets = presets.map(preset => 
        preset.id === updatedPreset.id 
          ? { 
              ...updatedPreset, 
              updatedAt: dayjs().toISOString() 
            }
          : preset
      );

      // If this is set as default, remove default from others
      if (updatedPreset.isDefault) {
        updatedPresets.forEach(p => {
          if (p.id !== updatedPreset.id) {
            p.isDefault = false;
          }
        });
      }

      await savePresetsToStorage(updatedPresets);
      setPresets(updatedPresets);

      console.log('✅ [UniversalPresets] Preset updated successfully:', updatedPreset.name);
      return updatedPreset;
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to update preset:', err);
      setError('Failed to update preset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [presets, savePresetsToStorage]);

  // Delete a preset
  const deletePreset = useCallback(async (presetId: string) => {
    try {
      setLoading(true);
      setError(null);

      const presetToDelete = presets.find(p => p.id === presetId);
      if (!presetToDelete) {
        throw new Error('Preset not found');
      }

      const updatedPresets = presets.filter(preset => preset.id !== presetId);
      
      await savePresetsToStorage(updatedPresets);
      setPresets(updatedPresets);

      console.log('✅ [UniversalPresets] Preset deleted successfully:', presetToDelete.name);
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to delete preset:', err);
      setError('Failed to delete preset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [presets, savePresetsToStorage]);

  // Apply a preset (increment usage count)
  const applyPreset = useCallback(async (preset: UniversalPreset) => {
    try {
      const updatedPresets = presets.map(p => 
        p.id === preset.id 
          ? { 
              ...p, 
              usageCount: (p.usageCount || 0) + 1,
              lastUsedAt: dayjs().toISOString()
            }
          : p
      );

      await savePresetsToStorage(updatedPresets);
      setPresets(updatedPresets);

      console.log('✅ [UniversalPresets] Preset applied:', preset.name);
      return preset;
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to apply preset:', err);
      // Don't throw error for usage tracking failure
    }
  }, [presets, savePresetsToStorage]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (presetId: string) => {
    try {
      const updatedPresets = presets.map(preset => 
        preset.id === presetId 
          ? { 
              ...preset, 
              isFavorite: !preset.isFavorite,
              updatedAt: dayjs().toISOString()
            }
          : preset
      );

      await savePresetsToStorage(updatedPresets);
      setPresets(updatedPresets);

      const preset = updatedPresets.find(p => p.id === presetId);
      console.log('✅ [UniversalPresets] Favorite toggled:', preset?.name, preset?.isFavorite);
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to toggle favorite:', err);
      setError('Failed to toggle favorite');
    }
  }, [presets, savePresetsToStorage]);

  // Get preset by ID
  const getPreset = useCallback((presetId: string): UniversalPreset | undefined => {
    return presets.find(preset => preset.id === presetId);
  }, [presets]);

  // Get presets by category
  const getPresetsByCategory = useCallback((category: string): UniversalPreset[] => {
    return presets.filter(preset => preset.category === category);
  }, [presets]);

  // Get default preset
  const getDefaultPreset = useCallback((): UniversalPreset | undefined => {
    return presets.find(preset => preset.isDefault);
  }, [presets]);

  // Export presets
  const exportPresets = useCallback(async (presetIds?: string[]) => {
    try {
      const presetsToExport = presetIds 
        ? presets.filter(p => presetIds.includes(p.id))
        : presets;

      const exportData = {
        version: '1.0',
        namespace,
        exportedAt: dayjs().toISOString(),
        presets: presetsToExport
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${namespace}_presets_${dayjs().format('YYYY-MM-DD')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ [UniversalPresets] Presets exported successfully');
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to export presets:', err);
      throw new Error('Failed to export presets');
    }
  }, [presets, namespace]);

  // Import presets
  const importPresets = useCallback(async (file: File, merge: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.presets || !Array.isArray(importData.presets)) {
        throw new Error('Invalid preset file format');
      }

      const importedPresets: UniversalPreset[] = importData.presets.map((preset: any) => ({
        ...preset,
        id: generatePresetId(), // Generate new IDs to avoid conflicts
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        usageCount: 0,
        lastUsedAt: undefined
      }));

      let finalPresets: UniversalPreset[];
      if (merge) {
        // Merge with existing presets, avoiding name conflicts
        const existingNames = new Set(presets.map(p => p.name));
        const uniqueImported = importedPresets.map(preset => {
          let finalName = preset.name;
          let counter = 1;
          while (existingNames.has(finalName)) {
            finalName = `${preset.name} (${counter})`;
            counter++;
          }
          return { ...preset, name: finalName };
        });
        
        finalPresets = [...presets, ...uniqueImported];
      } else {
        // Replace all presets
        finalPresets = importedPresets;
      }

      await savePresetsToStorage(finalPresets);
      setPresets(finalPresets);

      console.log('✅ [UniversalPresets] Presets imported successfully:', importedPresets.length);
      message.success(`Successfully imported ${importedPresets.length} presets`);
    } catch (err) {
      console.error('❌ [UniversalPresets] Failed to import presets:', err);
      setError('Failed to import presets');
      message.error('Failed to import presets');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [presets, generatePresetId, savePresetsToStorage]);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return {
    // State
    presets,
    loading,
    error,
    
    // Actions
    savePreset,
    updatePreset,
    deletePreset,
    applyPreset,
    toggleFavorite,
    
    // Queries
    getPreset,
    getPresetsByCategory,
    getDefaultPreset,
    
    // Import/Export
    exportPresets,
    importPresets,
    
    // Utilities
    loadPresets,
    generatePresetId
  };
};

export default useUniversalPresets;