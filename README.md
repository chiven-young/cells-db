
<h1 align="center">CellsDB</h1>
<p align="center">Lightweight Local Data Management Framework</p>
<p align="center">English | <a href="README.zh-CN.md">中文</a></p>

## Introduction
CellsDB is a lightweight and scalable browser-based local data management framework built on a **Cell-Based Architecture**. It abstracts data units into biological-inspired "cells" with dynamic relationships and modular workspace isolation, providing a highly customizable local storage solution for web applications.

## Key Features
- **Biological Model Abstraction**: Data units with cellular characteristics (type, status, lifecycle, etc.)
- **Dynamic Relationship Network**: Supports bidirectional associations of any complexity
- **Workspace Isolation**: Independent data spaces with multi-environment switching
- **Query Engine**: Powerful compound query and pagination capabilities
- **Extensible Architecture**: Customizable data types, relationship types, and extended properties

## Quick Start

```bash
npm install cells-db
```

```javascript
import CellsDB from 'cells-db';

// Initialize/switch workspace
const db = new CellsDB({
  name: 'Note System',
  version: 1,
  after: (workspace) => {
    console.log('Workspace activated:', workspace.name);
  }
});

// Create folder cell
const folderCell = await db.cells.createCell({
  type: 'folder',
  typeGroup: 'content',
  data: {
    title: 'CellsDB Quick Guide',
    content: '...'
  }
});

// Create note cell
const noteCell = await db.cells.createCell({
  type: 'markdown',
  typeGroup: 'content',
  data: {
    title: 'First Article',
    content: '...'
  }
});

// Establish relationship
await db.cells.connectCells({
  sourceId: folderCell.cid,
  targetId: noteCell.cid
});

// Query notes in folder
const cells = await db.cells.getCells({
  parentIds: [folderCell.cid],
  type: 'markdown'
});
```

## Documentation
[API Reference](src/docs/api.md)

## Core Components
- **Workspace Manager**: Isolated data space management
- **Cell Engine**: Data unit creation/updating/querying
- **Relationship Graph**: Dynamic association management system
- **Query Builder**: Compound condition query processor

## Data Structure

### Workspace Metadata
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
  // ...additional properties
}
```

### Cell Structure
```typescript
interface Cell {
  cid: string;
  name: string;
  type: string;
  typeGroup: string;
  status: number; // 0-4 status codes
  data: Record<string, any>;
  // ...lifecycle properties
}
```

## Contributing
We welcome code contributions, documentation improvements, and usage feedback.

## This project relies on the following open-source software:
- PouchDB (Apache-2.0 License)
- pouchdb-find (Apache-2.0 License)
- uuidv4 (MIT License)

## License
MIT License | Copyright (c) 2025-present Chiven Young