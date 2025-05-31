import type { Employee } from '../pages/HRManagement/types';

const CACHE_KEY = 'employee_cache_v1';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24小时

interface CacheEntry {
  data: Employee;
  timestamp: number;
}

interface EmployeeCache {
  [id: string]: CacheEntry;
}

/**
 * 员工信息缓存服务
 * 使用LocalStorage存储员工信息以减少API请求
 */
export const employeeCacheService = {
  /**
   * 获取当前缓存内容
   */
  getCache(): EmployeeCache {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      return cacheStr ? JSON.parse(cacheStr) : {};
    } catch (error) {
      return {};
    }
  },

  /**
   * 保存缓存到LocalStorage
   */
  saveCache(cache: EmployeeCache): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
    }
  },

  /**
   * 从缓存中获取员工信息
   * @param id 员工ID
   * @returns 员工信息对象或null (如果缓存不存在或已过期)
   */
  getEmployee(id: string | number): Employee | null {
    if (!id) return null;
    const strId = String(id);
    const cache = this.getCache();
    const entry = cache[strId];

    // 检查缓存是否存在且未过期
    if (entry && Date.now() - entry.timestamp < CACHE_EXPIRY_MS) {
      return entry.data;
    }

    return null;
  },

  /**
   * 批量获取员工缓存信息
   * @param ids 员工ID数组
   * @returns 缓存了的员工信息映射
   */
  getEmployees(ids: (string | number)[]): Record<string, Employee> {
    if (!ids || ids.length === 0) return {};

    const result: Record<string, Employee> = {};
    const cache = this.getCache();
    const now = Date.now();

    ids.forEach(id => {
      const strId = String(id);
      const entry = cache[strId];
      if (entry && now - entry.timestamp < CACHE_EXPIRY_MS) {
        result[strId] = entry.data;
      }
    });

    return result;
  },

  /**
   * 保存一条员工信息缓存
   * @param employee 员工信息对象
   */
  saveEmployee(employee: Employee): void {
    if (!employee || !employee.id) return;

    const strId = String(employee.id);
    const cache = this.getCache();
    cache[strId] = {
      data: employee,
      timestamp: Date.now()
    };
    this.saveCache(cache);
  },

  /**
   * 批量保存员工信息缓存
   * @param employees 员工信息对象数组或映射
   */
  saveEmployees(employees: Employee[] | Record<string, Employee>): void {
    if (!employees) return;

    const cache = this.getCache();
    const timestamp = Date.now();

    if (Array.isArray(employees)) {
      employees.forEach(emp => {
        if (emp && emp.id) {
          cache[String(emp.id)] = { data: emp, timestamp };
        }
      });
    } else {
      Object.entries(employees).forEach(([id, emp]) => {
        if (emp) {
          cache[id] = { data: emp, timestamp };
        }
      });
    }

    this.saveCache(cache);
  },

  /**
   * 清除指定员工的缓存
   * @param id 员工ID
   */
  removeEmployee(id: string | number): void {
    if (!id) return;

    const strId = String(id);
    const cache = this.getCache();
    if (cache[strId]) {
      delete cache[strId];
      this.saveCache(cache);
    }
  },

  /**
   * 清空所有员工缓存
   */
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  },

  /**
   * 获取员工全名
   * @param employee 员工对象
   * @returns 员工全名 (姓+名)
   */
  getEmployeeFullName(employee: Employee | null): string {
    if (!employee) return '';
    const lastName = employee.last_name || '';
    const firstName = employee.first_name || '';
    return `${lastName}${firstName}`.trim();
  },

  /**
   * 根据ID获取员工全名，支持缓存
   * @param id 员工ID
   * @returns 员工全名
   */
  getEmployeeNameById(id: string | number): string {
    if (!id) return '';
    const employee = this.getEmployee(id);
    return this.getEmployeeFullName(employee);
  }
};

export default employeeCacheService; 