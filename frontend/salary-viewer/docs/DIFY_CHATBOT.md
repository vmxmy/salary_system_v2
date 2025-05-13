# Dify Chatbot 集成文档

## 概述

本文档介绍了如何在薪资信息管理系统中配置和使用 Dify 聊天机器人。Dify 聊天机器人是一个可嵌入的聊天界面，可以帮助用户解答问题和提供支持。

> **重要提示**：聊天机器人只在用户登录且为超级管理员（Super Admin）时才会加载。其他用户将看不到聊天机器人。
>
> 聊天机器人组件被放置在 `MainLayout` 组件内部，确保只在用户已登录的情况下渲染。

## 集成方式

我们提供了多种集成 Dify 聊天机器人的方式，以适应不同的需求：

1. **DifyChatbot** - 标准组件，支持环境变量和属性配置
2. **DifyChatbotEmbed** - 嵌入式组件，更直接地加载脚本
3. **DifyChatbotSimple** - 最简单的组件，直接使用提供的嵌入代码

当前使用的是 **DifyChatbotSimple** 组件，它是最直接和可靠的集成方式。

## 配置方法

### 1. 环境变量配置

Dify 聊天机器人可以通过环境变量进行配置，这使得在不同环境中更换 token 和 baseUrl 变得简单。

在 `.env` 文件中添加以下配置：

```env
# Dify Chatbot Configuration
VITE_DIFY_TOKEN=your_dify_token_here
VITE_DIFY_BASE_URL=your_dify_base_url_here
```

当前配置：

- Token: `jsPqTK9jkG42gNSr`
- Base URL: `http://dify.atx.ziikoo.com`

### 2. 组件属性配置

除了通过环境变量配置外，还可以通过组件属性直接配置 Dify 聊天机器人：

```tsx
<DifyChatbot
  token="your_dify_token_here"
  baseUrl="your_dify_base_url_here"
  customStyles={{
    buttonColor: '#1C64F2',
    windowWidth: '24rem',
    windowHeight: '40rem'
  }}
/>
```

### 3. DifyChatbotSimple 组件配置

DifyChatbotSimple 组件现在使用环境变量来配置 token 和 baseUrl：

```tsx
// 从环境变量获取配置
const token = import.meta.env.VITE_DIFY_TOKEN || 'jsPqTK9jkG42gNSr';
const baseUrl = import.meta.env.VITE_DIFY_BASE_URL || 'http://dify.atx.ziikoo.com';
```

这样，您可以通过修改 `.env` 文件中的环境变量来更改配置，而不需要修改代码：

```env
VITE_DIFY_TOKEN=your_dify_token_here
VITE_DIFY_BASE_URL=your_dify_base_url_here
```

如果环境变量不存在，组件会使用默认值。

## 样式自定义

可以通过自定义样式来调整聊天机器人的外观：

- `buttonColor`: 聊天按钮的背景颜色
- `windowWidth`: 聊天窗口的宽度
- `windowHeight`: 聊天窗口的高度

对于 DifyChatbotSimple 组件，样式是直接在组件内部定义的：

```css
#dify-chatbot-bubble-button {
  background-color: #1C64F2 !important;
}
#dify-chatbot-bubble-window {
  width: 24rem !important;
  height: 40rem !important;
}
```

## 用户信息集成

聊天机器人可以集成当前登录用户的信息，这样在聊天过程中可以识别用户身份：

```tsx
window.difyChatbotConfig.systemVariables = {
  user_id: user.id ? String(user.id) : user.username,
  // 可以在这里添加更多用户相关变量
};
```

DifyChatbotSimple 组件现在已经支持用户信息集成，会自动将当前登录用户的ID添加到聊天机器人配置中。

## 权限控制

聊天机器人只在超级管理员（Super Admin）登录时才会加载。组件会检查当前用户的角色：

```tsx
// 检查用户是否为超级管理员
let isSuperAdmin = false;

// 只检查用户角色是否为"Super Admin"
if (isAuthenticated && user && user.role) {
  // 如果role是字符串类型
  if (typeof user.role === 'string') {
    isSuperAdmin = user.role === 'Super Admin';
  }
  // 如果role是对象类型
  else if (typeof user.role === 'object' && user.role !== null) {
    // 使用类型断言访问name属性
    const roleObj = user.role as any;
    isSuperAdmin = roleObj.name === 'Super Admin';
  }
}

// 如果不是超级管理员，不加载聊天机器人
if (!isSuperAdmin) {
  return;
}
```

这确保了只有具有"Super Admin"角色的用户才能看到和使用聊天机器人。

## 域名限制

为了安全起见，聊天机器人可以设置只在允许的域名上初始化。当前允许的域名有：

- `localhost`
- `127.0.0.1`

如果需要在生产环境中使用，请在相应组件文件中的 `allowedHostnames` 数组中添加生产环境的域名。

## 故障排除

### 聊天机器人没有显示

1. 检查浏览器控制台是否有错误信息
2. 确认当前域名是否在允许列表中
3. 验证 token 和 baseUrl 是否正确
4. 检查网络请求是否成功加载了 Dify 脚本
5. 尝试使用不同的集成方式（DifyChatbot、DifyChatbotEmbed 或 DifyChatbotSimple）

### 样式问题

如果聊天机器人的样式不符合预期，可以尝试：

1. 检查自定义样式是否正确设置
2. 查看浏览器开发者工具中的样式是否被其他样式覆盖
3. 确认 Dify 脚本是否正确加载

## 更新配置

### 更新 DifyChatbot 或 DifyChatbotEmbed 配置

如需更新这些组件的配置，修改 `.env` 文件中的相关环境变量，然后重新启动应用即可。

### 更新 DifyChatbotSimple 配置

如需更新 DifyChatbotSimple 组件的配置，可以通过修改 `.env` 文件中的环境变量来实现，无需修改代码：

```env
# 修改 .env 文件中的这些变量
VITE_DIFY_TOKEN=your_new_token_here
VITE_DIFY_BASE_URL=your_new_base_url_here
```

修改后重新启动应用即可生效。
