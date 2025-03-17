
<h1 align="center">CellsDB</h1>
<p align="center">基于PouchDB的模块化本地数据管理解决方案</p>
<p align="center"><a href="README.md">English</a> | 中文</p>

### 简介
CellsDB是一个轻量级、可扩展的浏览器本地数据管理框架，采用**细胞模型**（Cell-Based Architecture）设计，将数据单元抽象为具有生物特性的"细胞"。通过灵活的关系网络和模块化工作区隔离，CellsDB为Web应用提供了高度定制化的本地数据存储方案。

### 核心特性
- **生物模型抽象**：数据单元具有细胞特性（类型、状态、生命周期等）
- **动态关系网络**：支持任意复杂度的双向关联关系
- **工作区隔离**：独立的数据空间管理，支持多环境切换
- **查询引擎**：强大的复合条件查询与分页机制
- **可扩展架构**：自定义数据类型、关系类型和扩展属性

### 快速开始

```bash
npm install cells-db
```

```javascript
import CellsDB from 'cells-db';

// 初始化/切换工作区
const db = new CellsDB({
  name: '笔记系统',
  version: 1,
  after: (workspace) => {
    console.log('工作区已激活:', workspace.name);
  }
});

// 创建一个文件夹
const folderCell = await db.cells.createCell({
  type: 'folder',
  typeGroup: 'content',
  data: {
    title: 'CellsDB入门指南',
    content: '...'
  }
});

// 创建一个笔记
const noteCell = await db.cells.createCell({
  type: 'markdown',
  typeGroup: 'content',
  data: {
    title: '第一篇',
    content: '...'
  }
});

// 建立关系
await db.cells.connectCells({
  sourceId: folderCell.cid,
  targetId: noteCell.cid
});

// 查询此文件夹下所有笔记

const cells = await db.cells.getCells({
    parentId: [folderCell.cid],
    type: 'markdown'
})
```


### 文档
[API参考](src/docs/api.md)

### 核心组件
- **工作区管理器**：独立的数据空间管理
- **细胞引擎**：数据单元的创建/更新/查询
- **关系图谱**：动态关联管理系统
- **查询构建器**：复合条件查询处理器


### 数据结构

#### 工作区元数据
```typescript
interface Workspace {
  id: string;
  version: number;
  name: string;
  description?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  config: Record<string, any>;
  // ...其他属性
}
```

#### 细胞结构
```typescript
interface Cell {
  cid: string;
  name: string;
  type: string;
  typeGroup: string;
  status: number; // 0-4状态码
  data: Record<string, any>;
  // ...生命周期属性
}
```

### 贡献
我们欢迎代码贡献、文档完善和使用反馈。

### 本项目依赖以下开源软件：
- PouchDB (Apache-2.0 License)
- pouchdb-find (Apache-2.0 License)
- uuidv4 (MIT License)

### 许可证
MIT License | Copyright (c) 2025-present Chiven Young
