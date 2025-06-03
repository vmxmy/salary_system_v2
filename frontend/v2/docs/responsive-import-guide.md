# 响应式批量导入界面指南

本指南展示如何使用响应式样式模板和工具钩子，构建适配各种设备的批量导入界面。

## 📱 设计理念

### 移动优先
- 从小屏幕开始设计，逐步适配大屏幕
- 确保核心功能在移动设备上可用
- 渐进式增强用户体验

### 断点设计
```typescript
// 断点定义
const breakpoints = {
  xs: 480px,   // 超小屏手机
  sm: 576px,   // 小屏手机/横屏
  md: 768px,   // 平板竖屏
  lg: 992px,   // 平板横屏/小桌面
  xl: 1200px,  // 桌面
  xxl: 1600px  // 大桌面
}
```

## 🔧 核心工具

### 1. 样式模板
```less
// 引入响应式样式模板
import styles from '../../../../styles/responsive-import.module.less';
```

### 2. 响应式钩子
```typescript
import { useResponsive, useIsMobile, useBreakpoint } from '../../../hooks/useResponsive';

// 获取完整响应式信息
const responsive = useResponsive();

// 检测设备类型
const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();

// 检测特定断点
const isMd = useBreakpoint('md');
```

## 🎯 应用示例

### 员工批量导入组件

```tsx
import React from 'react';
import { ProCard, ProTable } from '@ant-design/pro-components';
import { Row, Col, Button, Tabs } from 'antd';
import { useResponsive, useResponsiveColumns } from '../../../hooks/useResponsive';
import styles from '../../../../styles/responsive-import.module.less';

const EmployeeBulkImportPage: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const columns = useResponsiveColumns(1, 2, 4); // 移动端1列，平板2列，桌面4列

  return (
    <ProCard className={styles.importContainer}>
      {/* 页面标题和说明 */}
      <ProCard 
        title="员工批量导入"
        className={styles.importMainCard}
        headerBordered
      >
        <div className={styles.importHelp}>
          <Alert
            type="info"
            message="批量导入说明"
            description="支持Excel文件和CSV格式，请确保数据格式正确。"
          />
        </div>
      </ProCard>

      {/* 数据输入区域 */}
      <ProCard className={styles.importInputSection}>
        <Tabs 
          size={isMobile ? "small" : "default"}
          className={styles.inputTabs}
        >
          <Tabs.TabPane 
            tab={
              <span>
                <FileOutlined />
                <span className="hide-xs"> 文件上传</span>
              </span>
            } 
            key="file"
          >
            <Upload.Dragger>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {isMobile ? "点击上传" : "点击或拖拽文件到此区域上传"}
              </p>
            </Upload.Dragger>
          </Tabs.TabPane>
          
          <Tabs.TabPane 
            tab={
              <span>
                <TableOutlined />
                <span className="hide-xs"> 手动输入</span>
              </span>
            } 
            key="manual"
          >
            <TextArea
              className={styles.inputTextarea}
              placeholder="请输入员工信息..."
            />
          </Tabs.TabPane>
        </Tabs>
      </ProCard>

      {/* 数据预览 */}
      <ProCard 
        title="数据预览"
        className={styles.previewSection}
        headerBordered
      >
        {/* 统计信息 - 响应式网格 */}
        <Row gutter={[16, 16]} className={styles.statisticsGrid}>
          <Col xs={12} sm={6} md={6} lg={3}>
            <ProCard className={styles.statisticCard}>
              <Statistic title="总数" value={100} />
            </ProCard>
          </Col>
          <Col xs={12} sm={6} md={6} lg={3}>
            <ProCard className={styles.statisticCard}>
              <Statistic title="有效" value={95} />
            </ProCard>
          </Col>
          <Col xs={12} sm={6} md={6} lg={3}>
            <ProCard className={styles.statisticCard}>
              <Statistic title="错误" value={5} />
            </ProCard>
          </Col>
          <Col xs={12} sm={6} md={6} lg={3}>
            <ProCard className={styles.statisticCard}>
              <Statistic title="成功率" value={95} suffix="%" />
            </ProCard>
          </Col>
        </Row>

        {/* 数据表格 - 响应式列配置 */}
        <div className={styles.dataPreviewTable}>
          <ProTable
            columns={getResponsiveColumns(isMobile, isTablet)}
            dataSource={data}
            size="small"
            pagination={{
              pageSize: isMobile ? 5 : 10,
              simple: isMobile,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile
            }}
            scroll={{ x: isMobile ? 300 : 800 }}
            options={{
              density: !isMobile,
              fullScreen: !isMobile,
              setting: !isMobile
            }}
          />
        </div>
      </ProCard>

      {/* 操作按钮 */}
      <ProCard>
        <div className={styles.importActions}>
          <div className="action-left">
            <Button onClick={handleBack}>
              {isMobile ? "返回" : "返回上一步"}
            </Button>
          </div>
          <div className="action-right">
            <Button type="primary" size="large">
              {isMobile ? "导入" : `导入 ${validCount} 条记录`}
            </Button>
          </div>
        </div>
      </ProCard>
    </ProCard>
  );
};

// 响应式表格列配置
const getResponsiveColumns = (isMobile: boolean, isTablet: boolean) => {
  const baseColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      className: 'table-col-primary'
    },
    {
      title: '身份证号',
      dataIndex: 'idNumber',
      className: 'table-col-primary hide-xs'
    },
    {
      title: '部门',
      dataIndex: 'department',
      className: 'table-col-secondary'
    },
    {
      title: '职位',
      dataIndex: 'position',
      className: 'table-col-optional hide-md'
    },
    {
      title: '入职日期',
      dataIndex: 'hireDate',
      className: 'table-col-optional hide-lg'
    },
    {
      title: '状态',
      dataIndex: 'status',
      className: 'table-col-secondary'
    }
  ];

  // 根据设备类型过滤列
  if (isMobile) {
    return baseColumns.filter(col => 
      col.className.includes('table-col-primary')
    );
  }

  if (isTablet) {
    return baseColumns.filter(col => 
      !col.className.includes('hide-md')
    );
  }

  return baseColumns;
};
```

## 📐 布局模式

### 1. 移动端布局（< 768px）
- 单列布局
- 垂直导航
- 简化操作
- 最小信息密度

```less
@media (max-width: 767px) {
  .import-container {
    padding: 12px;
  }
  
  .statistics-grid {
    .ant-col {
      margin-bottom: 12px;
    }
  }
  
  .import-actions {
    flex-direction: column;
    gap: 12px;
    
    .ant-btn {
      width: 100%;
    }
  }
}
```

### 2. 平板端布局（768px - 991px）
- 两列布局
- 混合导航
- 适中操作密度
- 平衡信息展示

```less
@media (min-width: 768px) and (max-width: 991px) {
  .statistics-grid {
    .ant-col {
      margin-bottom: 16px;
    }
  }
  
  .data-preview-table {
    .table-col-optional {
      display: none;
    }
  }
}
```

### 3. 桌面端布局（≥ 992px）
- 多列布局
- 水平导航
- 丰富操作选项
- 高信息密度

```less
@media (min-width: 992px) {
  .import-container {
    padding: 24px 32px;
  }
  
  .import-actions {
    justify-content: space-between;
  }
}
```

## 🎨 样式类使用

### 容器类
```tsx
// 主容器
<div className={styles.importContainer}>
  
// 主卡片
<ProCard className={styles.importMainCard}>

// 输入区域
<div className={styles.importInputSection}>

// 预览区域  
<div className={styles.previewSection}>
```

### 响应式显示/隐藏
```tsx
// 仅在小屏显示
<span className="show-xs">移动端内容</span>

// 隐藏特定屏幕尺寸
<div className="hide-xs">桌面端内容</div>
<div className="hide-md">大屏显示</div>

// 表格列响应式隐藏
<ProTable
  columns={[
    {
      title: '重要信息',
      className: 'table-col-primary' // 始终显示
    },
    {
      title: '次要信息', 
      className: 'table-col-secondary' // 中屏以上显示
    },
    {
      title: '可选信息',
      className: 'table-col-optional hide-md' // 大屏显示
    }
  ]}
/>
```

### 状态样式
```tsx
// 表格行状态
<Table 
  rowClassName={(record) => {
    if (record.hasError) return 'table-row-error';
    if (record.hasWarning) return 'table-row-warning'; 
    return 'table-row-success';
  }}
/>

// 状态标签
<Tag className="tag-success">成功</Tag>
<Tag className="tag-error">错误</Tag>
<Tag className="tag-warning">警告</Tag>
```

## 🔄 组件适配示例

### 按钮适配
```tsx
const ImportButton: React.FC = () => {
  const { isMobile } = useResponsive();
  
  return (
    <Button 
      type="primary"
      size={isMobile ? "default" : "large"}
      block={isMobile}
    >
      {isMobile ? "导入" : "开始批量导入"}
    </Button>
  );
};
```

### 表单适配
```tsx
const ImportForm: React.FC = () => {
  const columns = useResponsiveColumns(1, 2, 3);
  
  return (
    <ProForm layout="horizontal">
      <Row gutter={[16, 16]}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Col 
            key={index}
            xs={24} 
            sm={24 / Math.min(columns, 2)} 
            md={24 / columns}
          >
            <ProFormText name={`field_${index}`} />
          </Col>
        ))}
      </Row>
    </ProForm>
  );
};
```

### 表格适配
```tsx
const ImportTable: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  
  return (
    <ProTable
      size={isMobile ? "small" : "default"}
      pagination={{
        pageSize: isMobile ? 5 : isTablet ? 8 : 10,
        simple: isMobile,
        showSizeChanger: !isMobile,
        showQuickJumper: !isMobile,
        showTotal: (total, range) => 
          isMobile 
            ? `${range[0]}-${range[1]}/${total}`
            : `第 ${range[0]}-${range[1]} 条/共 ${total} 条记录`
      }}
      scroll={{
        x: isMobile ? 300 : isTablet ? 600 : 1000,
        y: isMobile ? 300 : 400
      }}
      options={{
        density: !isMobile,
        fullScreen: !isMobile,
        reload: !isMobile,
        setting: !isMobile
      }}
    />
  );
};
```

## 🎯 最佳实践

### 1. 渐进式增强
```tsx
// 基础功能确保在所有设备可用
const BasicImportView = () => (
  <div>
    <input type="file" />
    <button>导入</button>
  </div>
);

// 高级功能在大屏设备增强
const EnhancedImportView = () => {
  const { isDesktop } = useResponsive();
  
  return (
    <div>
      <BasicImportView />
      {isDesktop && (
        <AdvancedFeatures />
      )}
    </div>
  );
};
```

### 2. 性能优化
```tsx
// 懒加载非关键组件
const HeavyChart = lazy(() => import('./HeavyChart'));

const ImportPage = () => {
  const { isDesktop } = useResponsive();
  
  return (
    <div>
      <ImportForm />
      {isDesktop && (
        <Suspense fallback={<Spin />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
};
```

### 3. 可访问性
```tsx
// 确保触摸目标足够大
const MobileButton = styled(Button)`
  @media (max-width: 767px) {
    min-height: 44px;
    min-width: 44px;
  }
`;

// 提供替代文本
<Button icon={<UploadOutlined />}>
  <span className="hide-xs">上传文件</span>
  <span className="show-xs sr-only">上传</span>
</Button>
```

## 📝 检查清单

### 移动端适配
- [ ] 触摸目标 ≥ 44px
- [ ] 文字大小 ≥ 16px  
- [ ] 简化导航和操作
- [ ] 优化表单输入
- [ ] 减少网络请求

### 平板端适配
- [ ] 合理利用屏幕空间
- [ ] 混合导航模式
- [ ] 适中的信息密度
- [ ] 手势友好

### 桌面端适配
- [ ] 充分利用大屏空间
- [ ] 键盘导航支持
- [ ] 丰富的交互功能
- [ ] 高效的批量操作

### 通用要求
- [ ] 性能优化
- [ ] 可访问性支持
- [ ] 跨浏览器兼容
- [ ] 错误处理
- [ ] 加载状态反馈

## 🚀 部署建议

1. **资源优化**：按需加载样式和组件
2. **缓存策略**：合理设置CSS和JS缓存
3. **CDN配置**：静态资源使用CDN加速
4. **监控指标**：收集各设备性能数据
5. **用户反馈**：建立设备适配问题反馈机制

通过以上指南，您可以构建出在各种设备上都有良好用户体验的批量导入界面。 