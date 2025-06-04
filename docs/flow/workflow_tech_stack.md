# 工资审批工作流前端技术栈文档

## 📋 目录

1. [技术栈概述](#技术栈概述)
2. [核心框架](#核心框架)
3. [工作流专用库](#工作流专用库)
4. [UI组件和样式](#ui组件和样式)
5. [状态管理](#状态管理)
6. [数据处理](#数据处理)
7. [通知和交互](#通知和交互)
8. [开发工具](#开发工具)
9. [性能优化](#性能优化)
10. [推荐配置](#推荐配置)
11. [实施指南](#实施指南)

---

## 🎯 技术栈概述

### 📝 文档目的
本文档定义了高新区工资信息管理系统工资审批工作流前端开发的完整技术栈，确保技术选型的一致性和项目的可维护性。

### 🏗️ 架构原则
- **现代化**：采用最新稳定版本的主流技术
- **可维护性**：选择社区活跃、文档完善的库
- **性能优先**：注重用户体验和系统性能
- **渐进式**：支持逐步迁移和功能扩展
- **类型安全**：全面使用TypeScript确保代码质量

### 📊 技术复杂度评估
- **学习成本**：⭐⭐⭐ (3/5) - 基于现有React技术栈扩展
- **开发效率**：⭐⭐⭐⭐⭐ (5/5) - 丰富的组件库和工具支持
- **维护成本**：⭐⭐⭐⭐ (4/5) - 成熟稳定的技术选型
- **扩展性**：⭐⭐⭐⭐⭐ (5/5) - 模块化设计，易于扩展

---

## 🏗️ 核心框架

### 1. **React 18** ⭐⭐⭐⭐⭐
```json
{
  "package": "react",
  "version": "^18.2.0",
  "category": "UI框架",
  "priority": "核心依赖"
}
```

**选择理由：**
- ✅ 项目已采用，技术栈一致性
- ✅ 并发特性支持，提升用户体验
- ✅ 强大的生态系统和社区支持
- ✅ 优秀的开发者工具和调试体验

**关键特性：**
- 🔄 Concurrent Features：并发渲染
- 🎣 Hooks API：函数式组件开发
- ⚡ Suspense：异步组件加载
- 🔧 Error Boundaries：错误边界处理

### 2. **TypeScript 5.7+** ⭐⭐⭐⭐⭐
```json
{
  "package": "typescript",
  "version": "~5.7.2",
  "category": "编程语言",
  "priority": "核心依赖"
}
```

**选择理由：**
- ✅ 项目已采用，保持一致性
- ✅ 强类型系统，减少运行时错误
- ✅ 优秀的IDE支持和代码提示
- ✅ 便于大型项目的维护和重构

**工作流类型定义示例：**
```typescript
// 工作流核心类型
interface WorkflowInstance {
  id: string;
  type: 'payroll_approval';
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  createdAt: Date;
  updatedAt: Date;
  assignee?: User;
  metadata: WorkflowMetadata;
}

interface WorkflowStep {
  id: string;
  name: string;
  status: StepStatus;
  assignee: User;
  startTime?: Date;
  endTime?: Date;
  comments?: string;
  attachments?: Attachment[];
}

type WorkflowStatus = 
  | 'draft' 
  | 'in_progress' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'completed';
```

### 3. **Vite 6.3+** ⭐⭐⭐⭐⭐
```json
{
  "package": "vite",
  "version": "^6.3.1",
  "category": "构建工具",
  "priority": "核心依赖"
}
```

**选择理由：**
- ✅ 项目已采用，快速的开发服务器
- ✅ 优化的生产构建
- ✅ 原生ES模块支持
- ✅ 丰富的插件生态

**工作流相关配置：**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    // 工作流图表优化
    {
      name: 'workflow-charts',
      config(config) {
        config.optimizeDeps = {
          ...config.optimizeDeps,
          include: ['echarts', 'reactflow']
        };
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'workflow-core': ['reactflow', 'react-vertical-timeline-component'],
          'charts': ['echarts', 'echarts-for-react'],
          'forms': ['react-hook-form', '@hookform/resolvers']
        }
      }
    }
  }
});
```

---

## 🔄 工作流专用库

### 1. **React Flow** ⭐⭐⭐⭐⭐
```json
{
  "package": "reactflow",
  "version": "^11.10.0",
  "category": "工作流可视化",
  "priority": "高优先级"
}
```

**功能特性：**
- 🎨 专业的流程图和工作流可视化
- 🔄 拖拽式流程设计
- 🎯 自定义节点和边
- 📱 响应式设计支持

**使用场景：**
- 工作流状态图展示
- 审批流程可视化
- 流程设计器
- 状态转换图

**实现示例：**
```typescript
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background 
} from 'reactflow';

const WorkflowDiagram: React.FC<{ workflow: WorkflowInstance }> = ({ workflow }) => {
  const nodes: Node[] = workflow.steps.map((step, index) => ({
    id: step.id,
    type: 'custom',
    position: { x: index * 200, y: 100 },
    data: {
      label: step.name,
      status: step.status,
      assignee: step.assignee
    }
  }));

  const edges: Edge[] = workflow.steps.slice(0, -1).map((step, index) => ({
    id: `${step.id}-${workflow.steps[index + 1].id}`,
    source: step.id,
    target: workflow.steps[index + 1].id,
    type: 'smoothstep'
  }));

  return (
    <div style={{ height: '400px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
```

### 2. **React Vertical Timeline** ⭐⭐⭐⭐⭐
```json
{
  "package": "react-vertical-timeline-component",
  "version": "^3.6.0",
  "category": "时间线组件",
  "priority": "高优先级"
}
```

**功能特性：**
- ⏰ 专业的垂直时间线组件
- 🎨 美观的默认样式
- 📱 移动端友好
- 🔧 高度可定制

**使用场景：**
- 审批历史展示
- 工作流进度跟踪
- 操作日志时间线
- 里程碑展示

**实现示例：**
```typescript
import { 
  VerticalTimeline, 
  VerticalTimelineElement 
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

const WorkflowTimeline: React.FC<{ steps: WorkflowStep[] }> = ({ steps }) => (
  <VerticalTimeline>
    {steps.map(step => (
      <VerticalTimelineElement
        key={step.id}
        date={step.endTime ? dayjs(step.endTime).format('YYYY-MM-DD HH:mm') : '进行中'}
        iconStyle={{ 
          background: getStatusColor(step.status),
          color: '#fff'
        }}
        icon={getStatusIcon(step.status)}
      >
        <h3 className="vertical-timeline-element-title">{step.name}</h3>
        <h4 className="vertical-timeline-element-subtitle">
          执行人：{step.assignee.name}
        </h4>
        {step.comments && (
          <p>{step.comments}</p>
        )}
      </VerticalTimelineElement>
    ))}
  </VerticalTimeline>
);
```

### 3. **React Step Wizard** ⭐⭐⭐⭐
```json
{
  "package": "react-step-wizard",
  "version": "^5.3.11",
  "category": "步骤向导",
  "priority": "中优先级"
}
```

**功能特性：**
- 🔄 多步骤流程管理
- ✅ 内置验证支持
- 🎯 简单易用的API
- 🔧 自定义样式支持

**使用场景：**
- 工资数据导入向导
- 审批流程向导
- 设置配置向导
- 多步骤表单

---

## 🎨 UI组件和样式

### 1. **Ant Design 5** ⭐⭐⭐⭐⭐
```json
{
  "package": "antd",
  "version": "^5.12.0",
  "category": "UI组件库",
  "priority": "核心依赖"
}
```

**选择理由：**
- ✅ 项目已采用，保持一致性
- ✅ 企业级UI设计语言
- ✅ 丰富的组件生态
- ✅ 优秀的TypeScript支持

**工作流相关组件：**
- `Steps`：步骤条组件
- `Timeline`：时间线组件
- `Card`：卡片容器
- `Modal`：弹窗组件
- `Form`：表单组件
- `Table`：数据表格
- `Badge`：状态徽章
- `Tag`：标签组件

### 2. **Styled Components** ⭐⭐⭐⭐
```json
{
  "package": "styled-components",
  "version": "^6.1.0",
  "category": "CSS-in-JS",
  "priority": "中优先级"
}
```

**功能特性：**
- 🎨 组件级样式隔离
- 🔧 动态样式支持
- 📱 主题系统
- ⚡ 运行时样式优化

**工作流样式示例：**
```typescript
import styled from 'styled-components';

export const WorkflowCard = styled.div<{ status: WorkflowStatus }>`
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: ${props => getStatusBackground(props.status)};
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const StatusIndicator = styled.span<{ status: WorkflowStatus }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => getStatusColor(props.status)};
  margin-right: 8px;
`;
```

---

## 🗄️ 状态管理

### 1. **Zustand** ⭐⭐⭐⭐⭐
```json
{
  "package": "zustand",
  "version": "^4.4.0",
  "category": "状态管理",
  "priority": "核心依赖"
}
```

**选择理由：**
- ✅ 项目已采用，保持一致性
- ✅ 轻量级，学习成本低
- ✅ 优秀的TypeScript支持
- ✅ 无需Provider包装

**工作流状态管理示例：**
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface WorkflowStore {
  // 状态数据
  workflows: WorkflowInstance[];
  currentWorkflow: WorkflowInstance | null;
  pendingApprovals: ApprovalTask[];
  notifications: WorkflowNotification[];
  
  // 加载状态
  loading: {
    workflows: boolean;
    approvals: boolean;
    notifications: boolean;
  };
  
  // 操作方法
  fetchWorkflows: () => Promise<void>;
  fetchPendingApprovals: () => Promise<void>;
  approveWorkflow: (workflowId: string, comment: string) => Promise<void>;
  rejectWorkflow: (workflowId: string, reason: string) => Promise<void>;
  updateWorkflowStatus: (workflowId: string, status: WorkflowStatus) => void;
  
  // 通知管理
  addNotification: (notification: WorkflowNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    (set, get) => ({
      workflows: [],
      currentWorkflow: null,
      pendingApprovals: [],
      notifications: [],
      
      loading: {
        workflows: false,
        approvals: false,
        notifications: false
      },
      
      fetchWorkflows: async () => {
        set(state => ({ loading: { ...state.loading, workflows: true } }));
        try {
          const workflows = await workflowApi.getWorkflows();
          set({ workflows });
        } finally {
          set(state => ({ loading: { ...state.loading, workflows: false } }));
        }
      },
      
      approveWorkflow: async (workflowId, comment) => {
        await workflowApi.approve(workflowId, comment);
        // 更新本地状态
        set(state => ({
          workflows: state.workflows.map(w => 
            w.id === workflowId 
              ? { ...w, status: 'approved' }
              : w
          )
        }));
      }
    }),
    { name: 'workflow-store' }
  )
);
```

### 2. **TanStack Query** ⭐⭐⭐⭐⭐
```json
{
  "package": "@tanstack/react-query",
  "version": "^5.0.0",
  "category": "数据获取",
  "priority": "高优先级"
}
```

**功能特性：**
- 🔄 强大的数据获取和缓存
- ⚡ 实时数据同步
- 🔧 乐观更新支持
- 📊 加载状态管理

**工作流数据查询示例：**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 工作流列表查询
export const useWorkflows = (filters?: WorkflowFilters) => {
  return useQuery({
    queryKey: ['workflows', filters],
    queryFn: () => workflowApi.getWorkflows(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
    refetchInterval: 30 * 1000, // 30秒自动刷新
  });
};

// 审批操作
export const useApproveWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ workflowId, comment }: { workflowId: string; comment: string }) =>
      workflowApi.approve(workflowId, comment),
    onSuccess: (data, variables) => {
      // 乐观更新
      queryClient.setQueryData(['workflows'], (old: WorkflowInstance[]) =>
        old?.map(w => 
          w.id === variables.workflowId 
            ? { ...w, status: 'approved' }
            : w
        )
      );
      // 重新获取相关数据
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    }
  });
};
```

---

## 📊 数据处理

### 1. **Apache ECharts** ⭐⭐⭐⭐⭐
```json
{
  "package": "echarts",
  "version": "^5.4.0",
  "category": "数据可视化",
  "priority": "高优先级"
}
```

```json
{
  "package": "echarts-for-react",
  "version": "^3.0.2",
  "category": "React集成",
  "priority": "高优先级"
}
```

**功能特性：**
- 📈 丰富的图表类型
- 🎨 专业的数据可视化
- 📱 响应式图表
- 🔧 高度可定制

**工作流监控图表示例：**
```typescript
import ReactECharts from 'echarts-for-react';

const WorkflowMetricsChart: React.FC<{ data: WorkflowMetrics }> = ({ data }) => {
  const option = {
    title: {
      text: '工作流处理效率',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['已完成', '进行中', '超时'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '已完成',
        type: 'line',
        data: data.completed,
        smooth: true,
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '进行中',
        type: 'line',
        data: data.inProgress,
        smooth: true,
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '超时',
        type: 'line',
        data: data.overdue,
        smooth: true,
        itemStyle: { color: '#ff4d4f' }
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '400px' }}
      opts={{ renderer: 'svg' }}
    />
  );
};
```

### 2. **React Hook Form** ⭐⭐⭐⭐⭐
```json
{
  "package": "react-hook-form",
  "version": "^7.48.0",
  "category": "表单处理",
  "priority": "高优先级"
}
```

```json
{
  "package": "@hookform/resolvers",
  "version": "^3.3.0",
  "category": "表单验证",
  "priority": "高优先级"
}
```

**功能特性：**
- 🚀 高性能表单处理
- ✅ 强大的验证功能
- 🔧 与Ant Design完美集成
- 📝 TypeScript支持

**审批表单示例：**
```typescript
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const approvalSchema = yup.object({
  action: yup.string().required('请选择审批动作'),
  comment: yup.string().when('action', {
    is: 'reject',
    then: yup.string().required('拒绝时必须填写原因'),
    otherwise: yup.string()
  }),
  attachments: yup.array().of(yup.mixed())
});

const ApprovalForm: React.FC<{ onSubmit: (data: ApprovalData) => void }> = ({ onSubmit }) => {
  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(approvalSchema),
    defaultValues: {
      action: '',
      comment: '',
      attachments: []
    }
  });

  const watchedAction = watch('action');

  return (
    <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
      <Form.Item label="审批动作" validateStatus={errors.action ? 'error' : ''}>
        <Controller
          name="action"
          control={control}
          render={({ field }) => (
            <Select {...field} placeholder="选择审批动作">
              <Option value="approve">批准</Option>
              <Option value="reject">拒绝</Option>
              <Option value="return">退回</Option>
              <Option value="delegate">委托</Option>
            </Select>
          )}
        />
        {errors.action && <div style={{ color: 'red' }}>{errors.action.message}</div>}
      </Form.Item>

      <Form.Item label="审批意见" validateStatus={errors.comment ? 'error' : ''}>
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <Input.TextArea 
              {...field} 
              rows={4} 
              placeholder={watchedAction === 'reject' ? '请填写拒绝原因' : '审批意见（可选）'}
            />
          )}
        />
        {errors.comment && <div style={{ color: 'red' }}>{errors.comment.message}</div>}
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          提交审批
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### 3. **Day.js** ⭐⭐⭐⭐⭐
```json
{
  "package": "dayjs",
  "version": "^1.11.0",
  "category": "日期处理",
  "priority": "核心依赖"
}
```

**功能特性：**
- 📅 轻量级日期库
- 🌍 国际化支持
- 🔧 与Ant Design完美集成
- ⚡ 高性能

**工作流时间处理示例：**
```typescript
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('zh-cn');

// 工作流时间工具函数
export const workflowTimeUtils = {
  // 格式化时间
  formatTime: (date: Date | string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
  
  // 相对时间
  fromNow: (date: Date | string) => dayjs(date).fromNow(),
  
  // 计算处理时长
  calculateDuration: (startTime: Date | string, endTime?: Date | string) => {
    const start = dayjs(startTime);
    const end = endTime ? dayjs(endTime) : dayjs();
    return dayjs.duration(end.diff(start)).humanize();
  },
  
  // 判断是否超时
  isOverdue: (deadline: Date | string) => dayjs().isAfter(dayjs(deadline)),
  
  // 计算剩余时间
  timeRemaining: (deadline: Date | string) => {
    const now = dayjs();
    const target = dayjs(deadline);
    if (now.isAfter(target)) return '已超时';
    return target.from(now, true) + '后到期';
  }
};
``` 

---

## 🔔 通知和交互

### 1. **React Toastify** ⭐⭐⭐⭐⭐
```json
{
  "package": "react-toastify",
  "version": "^9.1.0",
  "category": "通知系统",
  "priority": "高优先级"
}
```

**功能特性：**
- 🎨 美观的通知样式
- 🔧 高度可定制
- 📱 移动端支持
- 🔄 丰富的配置选项

**工作流通知示例：**
```typescript
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 全局通知配置
export const GlobalToastContainer = () => (
  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="colored"
  />
);

// 工作流通知服务
export const notificationService = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warn: (message: string) => toast.warn(message),

  // 审批提醒
  approvalRequired: (workflowName: string, taskId: string) => {
    // Assuming navigateToTask is a function to navigate to the task
    // const navigateToTask = (id: string) => console.log('Navigating to task:', id);
    toast.info(
      <div>
        <strong>审批提醒:</strong> {workflowName} 有新的审批任务。
        {/* <button onClick={() => navigateToTask(taskId)}>立即处理</button> */}
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  },
  
  // 流程完成通知
  workflowCompleted: (workflowName: string) => {
    toast.success(`流程 "${workflowName}" 已成功完成！`);
  }
};
```

### 2. **Framer Motion** ⭐⭐⭐⭐⭐
```json
{
  "package": "framer-motion",
  "version": "^10.0.0",
  "category": "动画库",
  "priority": "中优先级"
}
```

**功能特性：**
- 🎬 流畅的动画效果
- 🔄 页面切换动画
- 📱 手势支持
- 🔧 简单易用的API

**工作流卡片动画示例：**
```typescript
import { motion, AnimatePresence } from 'framer-motion';

// Assuming WorkflowItem and handleItemClick are defined elsewhere
// interface WorkflowItem { id: string; name: string; status: string; }
// const handleItemClick = (id: string) => console.log('Item clicked:', id);

const WorkflowCardMotion: React.FC<{ item: any; onClick: () => void }> = ({ item, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      style={{
        padding: '20px',
        margin: '10px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer'
      }}
    >
      <h3>{item.name}</h3>
      <p>状态: {item.status}</p>
    </motion.div>
  );
};

const WorkflowListMotion: React.FC<{ items: any[] }> = ({ items }) => (
  <AnimatePresence>
    {items.map(item => (
      // <WorkflowCardMotion key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
      <WorkflowCardMotion key={item.id} item={item} onClick={() => { /* Placeholder */ }} />
    ))}
  </AnimatePresence>
);
```

### 3. **React Use** ⭐⭐⭐⭐⭐
```json
{
  "package": "react-use",
  "version": "^17.4.0",
  "category": "工具Hooks",
  "priority": "中优先级"
}
```

**功能特性：**
- 🛠️ 丰富的自定义Hooks
- 📊 状态管理工具
- 🔄 异步操作支持
- 👂 事件监听Hooks

**工作流相关Hooks：**
- `useDebounce`: 防抖用户输入
- `useLocalStorage`: 存储用户偏好设置
- `useNetworkState`: 监控网络状态
- `useIdle`: 检测用户是否空闲，可用于自动登出或提醒
- `useInterval`: 定时刷新工作流状态

**使用示例：**
```typescript
import { useState } from 'react'; // Added for useState
import { Input } from 'antd'; // Assuming Ant Design Input
import { useDebounce, useNetworkState, useInterval } from 'react-use';

// Assuming queryClient is defined elsewhere (e.g., from @tanstack/react-query)
// const queryClient = { invalidateQueries: (options: any) => console.log('Invalidating queries:', options) };


const WorkflowSearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  
  useDebounce(
    () => {
      onSearch(query);
    },
    500, // 500ms 防抖
    [query]
  );

  return <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索工作流..." />;
};

const WorkflowStatusRefresher: React.FC = () => {
  const networkState = useNetworkState();
  
  useInterval(
    () => {
      if (networkState.online) {
        // queryClient.invalidateQueries({ queryKey: ['workflows'] });
      }
    },
    30000 // 每30秒刷新一次
  );
  
  return null; // UI无关组件
};
```

---

## 🛠️ 开发工具

### 1. **ESLint & Prettier** ⭐⭐⭐⭐⭐
```json
{
  "package": "eslint",
  "version": "^8.50.0",
  "category": "代码检查",
  "priority": "核心依赖"
}
```
```json
{
  "package": "prettier",
  "version": "^3.0.0",
  "category": "代码格式化",
  "priority": "核心依赖"
}
```
**选择理由：**
- ✅ 保证代码风格一致性
- ✅ 减少低级错误
- ✅ 提升代码可读性
- ✅ 自动化代码规范

**工作流相关ESLint规则：**
```javascript
// .eslintrc.js
module.exports = {
  // ... other configurations
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_|' }],
    // 工作流特定规则
    'no-restricted-imports': ['error', {
      paths: [{
        name: 'lodash',
        message: '请使用 lodash-es 或具体函数导入。',
      }],
    }],
    'max-lines-per-function': ['warn', { max: 100, skipComments: true, skipBlankLines: true }], // Relaxed from 80
  },
};
```

### 2. **Husky & lint-staged** ⭐⭐⭐⭐
```json
{
  "package": "husky",
  "version": "^8.0.0",
  "category": "Git Hooks",
  "priority": "高优先级"
}
```
```json
{
  "package": "lint-staged",
  "version": "^15.0.0",
  "category": "Git Hooks",
  "priority": "高优先级"
}
```
**选择理由：**
- ✅ 提交前自动检查和格式化代码
- ✅ 保证入库代码质量
- ✅ 提升团队协作效率

**配置示例：**
```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,less}": [ // Added css, less
      "prettier --write"
    ]
  }
}
```

### 3. **React Query Devtools** ⭐⭐⭐⭐⭐
```json
{
  "package": "@tanstack/react-query-devtools",
  "version": "^5.0.0",
  "category": "调试工具",
  "priority": "高优先级"
}
```
**选择理由：**
- ✅ 可视化TanStack Query缓存状态
- ✅ 方便调试数据获取逻辑
- ✅ 提升开发效率

**集成示例：**
```typescript
// App.tsx or main layout component
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

function App() { // Or your main application component
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... 其他组件 ... */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

### 4. **Storybook** ⭐⭐⭐⭐
```json
{
  "package": "storybook",
  "version": "^7.5.0", // Consider using a more recent 7.x or 8.x version
  "category": "组件开发",
  "priority": "中优先级"
}
```
**选择理由：**
- ✅ 独立开发和测试UI组件
- ✅ 组件文档化
- ✅ 提升组件复用性

**工作流组件Story示例：**
```typescript
// WorkflowStatusBadge.stories.tsx
import React from 'react'; // Added React import
import { Meta, StoryObj } from '@storybook/react';
// Assuming WorkflowStatusBadge is defined elsewhere
// import { WorkflowStatusBadge } from './WorkflowStatusBadge'; 

// Placeholder component if WorkflowStatusBadge is not defined
const WorkflowStatusBadge: React.FC<{ status: string; text: string }> = ({ status, text }) => (
  <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
    <span style={{ 
      display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', 
      backgroundColor: status === 'approved' ? 'green' : status === 'in_progress' ? 'orange' : 'grey', 
      marginRight: '8px' 
    }}></span>
    {text} ({status})
  </div>
);


const meta: Meta<typeof WorkflowStatusBadge> = {
  title: 'Workflow/WorkflowStatusBadge',
  component: WorkflowStatusBadge,
  argTypes: {
    status: {
      control: 'select',
      options: ['draft', 'in_progress', 'approved', 'rejected', 'pending_approval'], // Added more options
    },
    text: { control: 'text'}, // Added text control
  },
  tags: ['autodocs'], // Added autodocs tag for automatic documentation
};
export default meta;

type Story = StoryObj<typeof WorkflowStatusBadge>;

export const Approved: Story = {
  args: {
    status: 'approved',
    text: '已批准',
  },
};

export const InProgress: Story = {
  args: {
    status: 'in_progress',
    text: '进行中',
  },
};

export const Rejected: Story = { // Added a new story
  args: {
    status: 'rejected',
    text: '已拒绝',
  },
};
``` 

---

## 🚀 性能优化

### 1. **代码分割 (Code Splitting)**
**策略：**
- 使用 `React.lazy` 和 `Suspense` 按需加载路由和大型组件。
- Vite的 `manualChunks` 配置，将不常用的库或模块分离到单独的chunk。

**示例 (React.lazy)：**
```typescript
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom'; // Assuming react-router-dom

const LazyWorkflowDesigner = lazy(() => import('./components/WorkflowDesigner'));
const LazyReportingModule = lazy(() => import('./pages/ReportingModule'));

const AppRoutes = () => (
  <Suspense fallback={<div>加载中...</div>}>
    <Routes>
      <Route path="/design" element={<LazyWorkflowDesigner />} />
      <Route path="/reports" element={<LazyReportingModule />} />
      {/* ...其他路由 */}
    </Routes>
  </Suspense>
);
```

### 2. **Memoization**
**策略：**
- 使用 `React.memo` 优化函数组件的重渲染。
- 使用 `useMemo` 缓存计算结果。
- 使用 `useCallback` 缓存事件处理函数。

**示例 (React.memo)：**
```typescript
// WorkflowStepItem.tsx
import React from 'react';

// Assuming WorkflowStep is defined
// interface WorkflowStep { id: string; name: string; status: string; }

interface WorkflowStepItemProps {
  step: any; // Replace 'any' with actual WorkflowStep type
  onSelect: (stepId: string) => void;
}

const WorkflowStepItem: React.FC<WorkflowStepItemProps> = React.memo(({ step, onSelect }) => {
  // console.log(`Rendering WorkflowStepItem: ${step.name}`); // 监控渲染
  return (
    <div onClick={() => onSelect(step.id)} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
      <h4>{step.name}</h4>
      <p>状态: {step.status}</p>
    </div>
  );
});

export default WorkflowStepItem;
```

### 3. **虚拟化列表 (List Virtualization)**
**策略：**
- 对于长列表（如审批历史、任务列表），使用虚拟化库（如 `react-window` 或 `react-virtualized`）来提高渲染性能。

**示例 (react-window)：**
```typescript
import { FixedSizeList as List } from 'react-window';

// Assuming ApprovalEventCard and ApprovalEvent are defined
// interface ApprovalEvent { id: string; /* ... other properties ... */ }
// const ApprovalEventCard: React.FC<{ event: ApprovalEvent }> = ({ event }) => <div style={{padding: '10px'}}>Event: {event.id}</div>;

const ApprovalHistoryList: React.FC<{ items: any[] }> = ({ items }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {/* <ApprovalEventCard event={items[index]} /> */}
      <div>Event ID: {items[index].id}</div>
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={120} // 每个审批条目的高度
      width={'100%'}
    >
      {Row}
    </List>
  );
};
```

### 4. **图片优化**
**策略：**
- 使用现代图片格式（如WebP）。
- 压缩图片资源。
- 使用图片懒加载。

### 5. **Bundle分析**
**策略：**
- 使用 `rollup-plugin-visualizer` (Vite) 或 `webpack-bundle-analyzer` 分析打包产物，找出过大的模块并进行优化。

**Vite配置示例：**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'; // Ensure defineConfig is imported
import react from '@vitejs/plugin-react'; // Ensure react plugin is imported
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true, brotliSize: true }), // 打包后自动打开分析报告
  ],
  // ...
});
```

---

## 🎯 推荐配置 (Package Versions)

| 类别             | 包名                             | 推荐版本    | 备注                       |
|------------------|----------------------------------|-------------|----------------------------|
| **核心框架**     | `react`                          | `^18.2.0`   |                            |
|                  | `react-dom`                      | `^18.2.0`   |                            |
|                  | `typescript`                     | `~5.7.2`    | 项目已用版本                 |
|                  | `vite`                           | `^6.3.1`    | 项目已用版本                 |
| **工作流库**     | `reactflow`                      | `^11.10.0`  | 工作流可视化               |
|                  | `react-vertical-timeline-component` | `^3.6.0`    | 时间线展示                 |
|                  | `react-step-wizard`              | `^5.3.11`   | 步骤向导 (可选)            |
| **UI与样式**     | `antd`                           | `^5.12.0`   | UI组件库 (项目已用)        |
|                  | `styled-components`              | `^6.1.0`    | CSS-in-JS (可选)           |
|                  | `@ant-design/icons`              | `^5.2.0`    | Ant Design 图标           |
| **状态管理**     | `zustand`                        | `^4.4.0`    | 轻量级状态管理 (项目已用)  |
|                  | `@tanstack/react-query`          | `^5.0.0`    | 数据获取与缓存             |
| **数据处理**     | `echarts`                        | `^5.4.0`    | 图表库                     |
|                  | `echarts-for-react`              | `^3.0.2`    | ECharts React封装          |
|                  | `react-hook-form`                | `^7.48.0`   | 表单处理                   |
|                  | `@hookform/resolvers`            | `^3.3.0`    | 表单验证适配器 (Yup等)     |
|                  | `yup`                            | `^1.3.0`    | Schema验证                 |
|                  | `dayjs`                          | `^1.11.0`   | 日期时间处理               |
| **通知与交互**   | `react-toastify`                 | `^9.1.0`    | 通知组件                   |
|                  | `framer-motion`                  | `^10.0.0`   | 动画库                     |
|                  | `react-use`                      | `^17.4.0`   | 工具Hooks集                |
| **开发工具**     | `eslint`                         | `^8.50.0`   | 代码检查                   |
|                  | `prettier`                       | `^3.0.0`    | 代码格式化                 |
|                  | `husky`                          | `^8.0.0`    | Git Hooks                  |
|                  | `lint-staged`                    | `^15.0.0`   | Git Hooks工具              |
|                  | `@tanstack/react-query-devtools` | `^5.0.0`    | React Query调试           |
|                  | `storybook`                      | `^7.6.0`    | UI组件开发与测试 (更新版本)  |
| **性能优化**     | `react-window`                   | `^1.8.9`    | 列表虚拟化 (可选)          |
|                  | `rollup-plugin-visualizer`       | `^5.9.0`    | Vite Bundle分析            |

---

## 🚀 实施指南

1.  **环境搭建**：
    *   确保Node.js版本 >= 18.x。
    *   使用 `pnpm` 或 `npm` 初始化项目并安装依赖。
    *   配置Vite、TypeScript、ESLint、Prettier。

2.  **核心模块开发**：
    *   **状态管理 (`Zustand`, `TanStack Query`)**：优先建立全局的工作流状态管理store，配置好API请求和缓存策略。
    *   **UI基础 (`Ant Design`)**：封装通用的工作流相关UI组件，如状态徽章、操作按钮组等。
    *   **路由 (`React Router`)**：规划工作流相关的页面路由，配置好权限控制。

3.  **工作流功能实现**：
    *   **可视化 (`React Flow`)**：开发工作流图谱展示组件，根据后端数据动态生成节点和边。
    *   **时间线 (`React Vertical Timeline`)**：实现审批历史、操作日志等时间线展示。
    *   **表单 (`React Hook Form`)**：构建审批表单、数据录入表单，集成Yup进行校验。

4.  **交互与体验优化**：
    *   **通知 (`React Toastify`)**：集成全局通知系统，对关键操作和状态变更进行反馈。
    *   **动画 (`Framer Motion`)**：适度添加过渡动画，提升用户体验。
    *   **工具Hooks (`React Use`)**：利用`useDebounce`等优化用户输入体验。

5.  **性能调优**：
    *   定期使用`rollup-plugin-visualizer`分析打包体积，进行代码分割。
    *   对复杂组件和列表进行`React.memo`和虚拟化处理。
    *   图片资源进行压缩和懒加载。

6.  **测试与质量保障**：
    *   编写单元测试 (Jest, React Testing Library)。
    *   使用Storybook进行组件隔离测试和文档化。
    *   集成测试和E2E测试 (Cypress/Playwright - 可选)。
    *   严格执行代码Review和ESLint规范。

7.  **文档编写**：
    *   同步更新技术文档、API文档、组件文档。
    *   编写用户操作手册。

---
**文档状态：** ✅ 初稿完成  
**编制日期：** {{CURRENT_DATE}}  
**版本号：** v1.0