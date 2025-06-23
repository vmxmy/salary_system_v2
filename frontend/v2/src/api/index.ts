/**
 * This file re-exports the single, authoritative apiClient instance.
 * All services should import apiClient from this file (or directly from './apiClient').
 */
import apiClient from './apiClient';

// 导出新的系统管理API
export { default as systemApi } from './system';
export * from './system';

// 导出其他API模块
export { default as optimizedApi } from './optimizedApi';

export default apiClient; 