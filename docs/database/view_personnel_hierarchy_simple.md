# reports.v_personnel_hierarchy_simple 视图分析

## 概述

**视图名称**: `reports.v_personnel_hierarchy_simple`  
**Schema**: reports  
**类型**: 递归视图 (Recursive CTE)  
**记录数**: 18 条  
**状态**: ⚠️ 未在 Alembic 迁移中记录  

## 视图定义

```sql
WITH RECURSIVE category_tree AS (
    -- 根节点：查找所有顶级人员分类（parent_category_id IS NULL）
    SELECT 
        personnel_categories.id,
        personnel_categories.name,
        personnel_categories.parent_category_id,
        personnel_categories.id AS root_id,
        personnel_categories.name AS root_name,
        0 AS level
    FROM hr.personnel_categories
    WHERE personnel_categories.parent_category_id IS NULL
    
    UNION ALL
    
    -- 递归部分：查找所有子分类
    SELECT 
        pc.id,
        pc.name,
        pc.parent_category_id,
        ct.root_id,
        ct.root_name,
        (ct.level + 1)
    FROM hr.personnel_categories pc
    JOIN category_tree ct ON pc.parent_category_id = ct.id
)
SELECT 
    id AS category_id,
    root_id,
    root_name,
    level
FROM category_tree;
```

## 视图字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| category_id | bigint | 人员分类ID |
| root_id | bigint | 根分类ID |
| root_name | varchar | 根分类名称 |
| level | integer | 层级深度 (0=根节点, 1=一级子节点, 2=二级子节点) |

## 数据结构分析

### 层级分布

| 层级 | 记录数 | 根分类 |
|------|--------|--------|
| 0 (根节点) | 2 | 正编, 聘用 |
| 1 (一级子节点) | 8 | 正编, 聘用 |
| 2 (二级子节点) | 8 | 正编, 聘用 |

### 完整层级结构

#### 正编系统 (root_id: 69)

```
正编 (Level 0)
├── 公务员 (Level 1)
├── 参照公务员管理 (Level 1)
├── 机关工勤 (Level 1)
└── 事业编制 (Level 1)
    ├── 事业管理人员 (Level 2)
    ├── 事业工勤人员 (Level 2)
    └── 事业技术工人 (Level 2)
```

#### 聘用系统 (root_id: 73)

```
聘用 (Level 0)
├── 原投资服务局聘用人员 (Level 1)
│   └── 项目经理 (Level 2)
├── 专项人员 (Level 1)
│   └── 项目服务专员 (Level 2)
├── 区聘人员 (Level 1)
│   └── 综合类 (Level 2)
└── 专技人员 (Level 1)
    ├── 执业类专技人员 (Level 2)
    └── 管理类专技人员 (Level 2)
```

## 详细数据列表

### 正编系统 (9条记录)

| category_id | 分类名称 | 层级 | 父分类 |
|-------------|----------|------|--------|
| 69 | 正编 | 0 | - |
| 75 | 公务员 | 1 | 正编 |
| 71 | 参照公务员管理 | 1 | 正编 |
| 81 | 机关工勤 | 1 | 正编 |
| 91 | 事业编制 | 1 | 正编 |
| 70 | 事业管理人员 | 2 | 事业编制 |
| 82 | 事业工勤人员 | 2 | 事业编制 |
| 90 | 事业技术工人 | 2 | 事业编制 |

### 聘用系统 (9条记录)

| category_id | 分类名称 | 层级 | 父分类 |
|-------------|----------|------|--------|
| 73 | 聘用 | 0 | - |
| 74 | 原投资服务局聘用人员 | 1 | 聘用 |
| 79 | 专项人员 | 1 | 聘用 |
| 80 | 区聘人员 | 1 | 聘用 |
| 92 | 专技人员 | 1 | 聘用 |
| 85 | 项目经理 | 2 | 原投资服务局聘用人员 |
| 86 | 项目服务专员 | 2 | 专项人员 |
| 84 | 综合类 | 2 | 区聘人员 |
| 78 | 执业类专技人员 | 2 | 专技人员 |
| 83 | 管理类专技人员 | 2 | 专技人员 |

## 视图用途

### 主要功能
1. **人员分类层级展示**: 提供人员分类的树形结构视图
2. **根分类归属**: 快速识别每个分类属于哪个根分类系统
3. **层级深度标识**: 明确每个分类在层级中的位置
4. **简化查询**: 为报表和分析提供扁平化的层级数据

### 应用场景
- 人员分类报表生成
- 组织架构分析
- 薪资政策按分类应用
- 权限管理按分类设置

## 性能特点

### 优势
- **递归查询**: 自动处理多层级关系
- **扁平化输出**: 便于报表和分析使用
- **根分类标识**: 快速分组和筛选

### 注意事项
- **数据量**: 当前18条记录，性能良好
- **层级深度**: 最大3层，复杂度可控
- **更新频率**: 人员分类变更不频繁，缓存友好

## 与其他表的关系

### 依赖表
- `hr.personnel_categories` - 人员分类主表

### 被引用情况
- 可能被其他报表视图引用
- 用于员工分类统计和分析

## 建议

### 迁移记录
建议为此视图创建 Alembic 迁移记录，确保版本控制：

```sql
-- 建议的迁移操作
CREATE OR REPLACE VIEW reports.v_personnel_hierarchy_simple AS
WITH RECURSIVE category_tree AS (
    -- 视图定义...
);
```

### 优化建议
1. **索引优化**: 确保 `hr.personnel_categories` 表的 `parent_category_id` 字段有索引
2. **缓存策略**: 考虑对视图结果进行缓存，减少递归查询频率
3. **监控使用**: 跟踪视图的使用频率和性能表现

---

**分析时间**: 2025-01-27  
**数据状态**: 活跃使用中  
**建议优先级**: 中等 (需要迁移记录) 