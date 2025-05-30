import apiClient from '../../../../../api/apiClient';
import { dataSourceAPI } from '../../../../../api/reports';
import type { DataSource, ReportConfig, FieldItem, DataSourceRelationship, ForeignKeyInfo, DataSourceJoin, ReportTemplateListItem, ReportTemplate, ReportTemplateCreatePayload, ReportTemplateUpdatePayload, ReportDesignerConfig } from './types';
import type { DataSource as BackendDataSource, DataSourceField } from '../../../../../api/reports';

interface PreviewDataParams {
  dataSource: string;
  fields: string[];
  filters?: any;
  sorter?: any;
  current?: number;
  pageSize?: number;
  dataSources?: string[];
  joins?: DataSourceJoin[];
}

interface PreviewDataResponse {
  data: any[];
  total: number;
  success: boolean;
}

class ReportDesignerService {
  // 获取可用的数据源列表
  async getDataSources(): Promise<DataSource[]> {
    try {
      // 调用后端 API 获取数据源列表
      const response = await dataSourceAPI.getDataSources({
        is_active: true,
        limit: 100
      });
      
      // 转换后端数据格式为前端需要的格式
      const dataSources: DataSource[] = [];
      
      for (const backendSource of response.data) {
        // 获取数据源的字段信息
        let fields: FieldItem[] = [];
        try {
          const fieldsResponse = await dataSourceAPI.getDataSourceFields(backendSource.id);
          fields = fieldsResponse.data.map(field => this.convertBackendFieldToFrontend(field, backendSource.id.toString()));
        } catch (error) {
          console.warn(`Failed to load fields for data source ${backendSource.id}:`, error);
        }
        
        const dataSource: DataSource = {
          id: backendSource.id.toString(),
          name: backendSource.name,
          description: backendSource.description,
          type: backendSource.source_type as 'table' | 'view' | 'query',
          fields: fields,
          // 根据字段自动生成分组
          fieldGroups: this.generateFieldGroups(fields),
          // 获取关联关系
          relationships: await this.detectDataSourceRelationships(backendSource.id.toString(), response.data)
        };
        
        dataSources.push(dataSource);
      }
      
      return dataSources;
    } catch (error) {
      console.error('Failed to load data sources:', error);
      // 如果 API 调用失败，返回空数组而不是模拟数据
      return [];
    }
  }

  // 转换后端字段格式为前端格式
  private convertBackendFieldToFrontend(backendField: DataSourceField, dataSourceId: string): FieldItem {
    return {
      field_name: backendField.field_name,
      field_alias: backendField.field_alias || backendField.display_name_zh || backendField.field_name,
      field_type: this.mapBackendFieldType(backendField.field_type),
      description: backendField.description,
      is_calculated: false, // 后端字段暂时没有计算字段标识
      group: backendField.field_group,
      // 新增字段
      is_foreign_key: backendField.is_foreign_key,
      source_data_source_id: dataSourceId,
      qualified_name: `${dataSourceId}.${backendField.field_name}`,
      foreign_key_info: backendField.is_foreign_key ? this.extractForeignKeyInfo(backendField) : undefined
    };
  }

  // 提取外键信息
  private extractForeignKeyInfo(field: DataSourceField): ForeignKeyInfo | undefined {
    // 这里需要根据字段的 lookup_config 或其他配置来提取外键信息
    // 暂时返回基于命名约定的推测
    if (field.field_name.endsWith('_id') && field.field_name !== 'id') {
      const referencedTable = field.field_name.replace(/_id$/, '');
      return {
        referenced_table_schema: 'hr', // 默认模式，实际应该从配置中获取
        referenced_table_name: referencedTable,
        referenced_column_name: 'id'
      };
    }
    return undefined;
  }

  // 检测数据源之间的关联关系
  private async detectDataSourceRelationships(dataSourceId: string, allDataSources: BackendDataSource[]): Promise<DataSourceRelationship[]> {
    const relationships: DataSourceRelationship[] = [];
    
    try {
      // 获取当前数据源的字段信息
      const fieldsResponse = await dataSourceAPI.getDataSourceFields(parseInt(dataSourceId));
      const fields = fieldsResponse.data;
      
      // 查找外键字段
      const foreignKeyFields = fields.filter(field => field.is_foreign_key);
      
      for (const fkField of foreignKeyFields) {
        const fkInfo = this.extractForeignKeyInfo(fkField);
        if (fkInfo) {
          // 查找目标数据源
          const targetDataSource = allDataSources.find(ds => 
            ds.table_name === fkInfo.referenced_table_name && 
            ds.schema_name === fkInfo.referenced_table_schema
          );
          
          if (targetDataSource) {
            relationships.push({
              id: `${dataSourceId}_${fkField.field_name}_${targetDataSource.id}`,
              source_data_source_id: dataSourceId,
              source_field_name: fkField.field_name,
              target_data_source_id: targetDataSource.id.toString(),
              target_field_name: fkInfo.referenced_column_name,
              relationship_type: 'many_to_one',
              join_type: 'left',
              description: `${fkField.field_alias || fkField.field_name} 关联到 ${targetDataSource.name}`
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to detect relationships for data source ${dataSourceId}:`, error);
    }
    
    return relationships;
  }

  // 映射后端字段类型到前端类型
  private mapBackendFieldType(backendType: string): 'string' | 'number' | 'date' | 'boolean' | 'json' {
    const typeMap: Record<string, 'string' | 'number' | 'date' | 'boolean' | 'json'> = {
      'VARCHAR': 'string',
      'TEXT': 'string',
      'CHAR': 'string',
      'INTEGER': 'number',
      'BIGINT': 'number',
      'DECIMAL': 'number',
      'NUMERIC': 'number',
      'FLOAT': 'number',
      'DOUBLE': 'number',
      'DATE': 'date',
      'TIMESTAMP': 'date',
      'DATETIME': 'date',
      'BOOLEAN': 'boolean',
      'JSON': 'json',
      'JSONB': 'json'
    };
    
    return typeMap[backendType.toUpperCase()] || 'string';
  }

  // 根据字段自动生成分组
  private generateFieldGroups(fields: FieldItem[]) {
    const groups: { [key: string]: FieldItem[] } = {};
    
    fields.forEach(field => {
      // 如果字段已经有分组，使用现有分组
      if (field.group) {
        if (!groups[field.group]) {
          groups[field.group] = [];
        }
        groups[field.group].push(field);
        return;
      }
      
      // 否则根据字段名智能分组
      let groupName = '其他字段';
      const name = field.field_name.toLowerCase();
      const alias = (field.field_alias || '').toLowerCase();
      
      if (name.includes('employee') || name.includes('user') || alias.includes('员工') || alias.includes('人员')) {
        groupName = '员工信息';
      } else if (name.includes('salary') || name.includes('pay') || name.includes('bonus') || 
                 alias.includes('工资') || alias.includes('薪资') || alias.includes('奖金')) {
        groupName = '薪资字段';
      } else if (name.includes('department') || name.includes('position') || 
                 alias.includes('部门') || alias.includes('职位')) {
        groupName = '组织信息';
      } else if (name.includes('date') || name.includes('time') || alias.includes('日期')) {
        groupName = '时间字段';
      } else if (name.includes('id') || name.includes('code') || alias.includes('编号')) {
        groupName = '标识字段';
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(field);
    });

    // 转换为前端需要的格式
    const groupOrder = ['员工信息', '组织信息', '薪资字段', '时间字段', '标识字段', '其他字段'];
    return groupOrder
      .filter(name => groups[name])
      .map((name, index) => ({
        id: `group_${index}`,
        name,
        order: index + 1,
        fields: groups[name].map(f => f.field_name)
      }));
  }

  // 获取数据源之间的可用关联关系
  async getAvailableJoins(dataSourceIds: string[]): Promise<DataSourceJoin[]> {
    const joins: DataSourceJoin[] = [];
    
    try {
      // 获取所有数据源信息
      const dataSources = await this.getDataSources();
      const selectedDataSources = dataSources.filter(ds => dataSourceIds.includes(ds.id));
      
      // 查找数据源之间的关联关系
      for (let i = 0; i < selectedDataSources.length; i++) {
        for (let j = i + 1; j < selectedDataSources.length; j++) {
          const leftDS = selectedDataSources[i];
          const rightDS = selectedDataSources[j];
          
          // 查找左数据源到右数据源的关联
          const leftToRightJoins = this.findJoinsBetweenDataSources(leftDS, rightDS);
          joins.push(...leftToRightJoins);
          
          // 查找右数据源到左数据源的关联
          const rightToLeftJoins = this.findJoinsBetweenDataSources(rightDS, leftDS);
          joins.push(...rightToLeftJoins);
        }
      }
    } catch (error) {
      console.error('Failed to get available joins:', error);
    }
    
    return joins;
  }

  // 查找两个数据源之间的连接关系
  private findJoinsBetweenDataSources(leftDS: DataSource, rightDS: DataSource): DataSourceJoin[] {
    const joins: DataSourceJoin[] = [];
    
    // 查找左数据源中的外键字段
    const foreignKeyFields = leftDS.fields.filter(field => field.is_foreign_key && field.foreign_key_info);
    
    for (const fkField of foreignKeyFields) {
      const fkInfo = fkField.foreign_key_info!;
      
      // 检查是否指向右数据源
      if (fkInfo.referenced_data_source_id === rightDS.id) {
        joins.push({
          id: `${leftDS.id}_${fkField.field_name}_${rightDS.id}_${fkInfo.referenced_column_name}`,
          left_data_source_id: leftDS.id,
          left_field_name: fkField.field_name,
          right_data_source_id: rightDS.id,
          right_field_name: fkInfo.referenced_column_name,
          join_type: 'left'
        });
      }
    }
    
    return joins;
  }

  // --- Report Template Management --- 

  async listReportTemplates(): Promise<ReportTemplateListItem[]> {
    try {
      const response = await apiClient.get<ReportTemplateListItem[]>('/reports/templates');
      return response.data;
    } catch (error) {
      console.error('Failed to list report templates:', error);
      throw error;
    }
  }

  async getReportTemplate(id: number): Promise<ReportTemplate> {
    try {
      const response = await apiClient.get<ReportTemplate>(`/reports/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get report template ${id}:`, error);
      throw error;
    }
  }

  async createReportTemplate(payload: ReportTemplateCreatePayload): Promise<ReportTemplate> {
    try {
      const response = await apiClient.post<ReportTemplate>('/reports/templates', payload);
      return response.data;
    } catch (error) {
      console.error('Failed to create report template:', error);
      // Consider more specific error handling or re-throwing for the UI to catch
      throw error;
    }
  }

  async updateReportTemplate(id: number, payload: ReportTemplateUpdatePayload): Promise<ReportTemplate> {
    try {
      const response = await apiClient.put<ReportTemplate>(`/reports/templates/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Failed to update report template ${id}:`, error);
      throw error;
    }
  }

  async deleteReportTemplate(id: number): Promise<void> {
    try {
      await apiClient.delete(`/reports/templates/${id}`);
    } catch (error) {
      console.error(`Failed to delete report template ${id}:`, error);
      throw error;
    }
  }

  // 预览数据（支持多数据源）
  async previewData(params: PreviewDataParams): Promise<PreviewDataResponse> {
    console.log('=== ReportDesignerService.previewData ===');
    console.log('Input params:', params);
    
    try {
      if (params.dataSources && params.dataSources.length > 1 && params.joins) {
        console.log('🔀 Multi-datasource query detected');
        console.log('DataSources count:', params.dataSources.length);
        console.log('Joins count:', params.joins.length);
        // 多数据源查询
        return await this.previewMultiDataSourceData(params);
      } else {
        console.log('📊 Single datasource query');
        // 单数据源查询
        const dataSourceId = parseInt(params.dataSource);
        console.log('DataSource ID:', dataSourceId);
        
        const response = await dataSourceAPI.previewData(dataSourceId, {
          limit: params.pageSize || 20,
          filters: params.filters
        });
        
        console.log('Single datasource response:', response);
    
    return {
          data: response.data.data || [],
          total: response.data.total_count || 0,
      success: true
    };
  }
    } catch (error) {
      console.error('❌ Preview data failed:', error);
      return {
        data: [],
        total: 0,
        success: false
      };
    }
  }

  // 预览多数据源关联数据
  private async previewMultiDataSourceData(params: PreviewDataParams): Promise<PreviewDataResponse> {
    try {
      console.log('=== Frontend Multi-datasource Query Parameters ===');
      console.log('dataSources:', params.dataSources);
      console.log('joins:', params.joins);
      console.log('fields:', params.fields);
      console.log('filters:', params.filters);
      console.log('pageSize:', params.pageSize);
      console.log('offset:', ((params.current || 1) - 1) * (params.pageSize || 20));
      
      const requestData = {
        dataSources: params.dataSources,
        joins: params.joins,
        fields: params.fields,
        filters: params.filters,
        pageSize: params.pageSize || 20,
        offset: ((params.current || 1) - 1) * (params.pageSize || 20)
      };
      
      console.log('Request data to backend:', JSON.stringify(requestData, null, 2));
      
      // 调用后端的多数据源查询 API
      const response = await apiClient.post('/reports/data-sources/preview-multi', requestData);
      
      console.log('Backend response:', response.data);
      
      return {
        data: response.data.data || [],
        total: response.data.total_count || 0,
        success: response.data.success || false
      };
    } catch (error) {
      console.error('Multi-datasource preview failed:', error);
      
      // 如果失败，显示生成的SQL供调试
      const query = this.buildMultiDataSourceQuery(params);
      console.log('Generated SQL (for debugging):', query);
      
      return {
        data: [],
        total: 0,
        success: false
      };
    }
  }

  // 构建多数据源查询 SQL
  private buildMultiDataSourceQuery(params: PreviewDataParams): string {
    if (!params.dataSources || !params.joins) {
      return '';
    }

    // 这是一个简化的 SQL 构建示例
    // 实际实现需要更复杂的逻辑来处理字段选择、连接条件等
    const selectedFields = params.fields.map(field => {
      // 如果字段包含数据源前缀，直接使用；否则添加主数据源前缀
      if (field.includes('.')) {
        return field;
      } else {
        return `${params.dataSource}.${field}`;
      }
    }).join(', ');

    let query = `SELECT ${selectedFields}\nFROM ${params.dataSource}`;
    
    // 添加 JOIN 子句
    for (const join of params.joins) {
      const joinType = join.join_type.toUpperCase();
      query += `\n${joinType} JOIN ${join.right_data_source_id} ON ${join.left_data_source_id}.${join.left_field_name} = ${join.right_data_source_id}.${join.right_field_name}`;
      
      if (join.condition) {
        query += ` AND ${join.condition}`;
      }
    }
    
    // 添加限制
    if (params.pageSize) {
      query += `\nLIMIT ${params.pageSize}`;
    }
    
    return query;
  }
}

export const reportDesignerService = new ReportDesignerService(); 