
# API文档

## 工作区

### 属性
id：工作区唯一标识；

version：工作区版本；

name：工作区名称；

description：工作区描述；

icon：工作区图标；

color：工作区颜色；

avatar：工作区图像；

createTime：工作区创建时间

password：工作区密码；

user：此工作区绑定的用户信息，方便多工作区对应不同的登录账户；

appearance：工作区外观配置；

layout：工作区布局配置

config：工作区自定义配置；

pages：工作区针对每个页面的自定义配置；

### 方法

#### `getWorkspaces()`
获取所有工作区列表。

#### `createWorkspace(workspace)`
创建一个工作区。

#### `getWorkspace(id)`
获取一个指定id的工作区信息。

#### `updateWorkspace(workspace, isCurrent)`
- workspace：工作区数据，必须带有id属性，其他属性有多少则更新多少。
- isCurrent：是否是当前工作区，如果是，则会直接应用到当前已激活工作区中，如果否，则只更新对应id的工作区信息，而不对当前工作区产生影响。默认true。
更新一个工作区。

#### `deleteWorkspace(id)`
删除指定id的工作区，删除时会将此工作区对应的细胞相关数据表都删除。如果此id对应的是当前工作区，则会在删除之后，自动创建一个新的工作区并激活。

#### `switchWorkspace(id, onComplete)`
切换到指定id的工作区。
```javascript
db.workspace.switchWorkspace('id-xxx', (workspace) => {
  console.log('已切换到工作区：', workspace)
});
```

## 工作区配置

对于当前工作区的快捷配置方法，注意只对当前工作区生效，如果你想要对某个id的其他工作区进行修改，请使用`updateWorkspace(workspace, false)`。

### 方法

#### `getConfig`

获取当前工作区的配置。

#### `setConfig(config)`

设定整体配置，传入多少属性则更新多少。

#### `getUser`

获取当前工作区绑定的用户。

#### `setUser(user)`

设定当前工作区绑定的用户信息，传入多少属性则更新多少。


## 细胞

### 属性
cid：细胞唯一标识；

name：细胞名称；

description：细胞描述；

icon：细胞图标；

cover：细胞封面；

type：细胞类型；

typeGroup：细胞类型分组；

status：细胞状态，取值0~4，0：已删除，1：草稿，2：私密，3：域内，4：公开；

data；细胞主要数据；

config：细胞配置；

style：细胞样式；

isRoot：是否是根级细胞；

statistics：细胞统计信息；

### 方法

#### `getCells(params: GetCellsOptions)`

基于复合条件查询工作区中的细胞数据，支持关联关系过滤、时间范围查询、分页机制和数据聚合。该方法通过灵活的参数组合，可满足从简单到复杂的多种数据查询需求。


##### 参数说明
###### 1. 基本过滤条件
| 参数        | 类型               | 默认值       | 描述                                                                 |
|-------------|--------------------|--------------|----------------------------------------------------------------------|
| `cid`       | `string`           | -            | 精确匹配单个细胞ID（优先级最高）                                      |
| `typeGroup` | `string`           | `undefined`  | 类型分组（如 `content`/`manage`）                                   |
| `type`      | `string`           | `undefined`  | 具体类型（如 `markdown`/`folder`）                                  |
| `minStatus` | `number`           | `0`          | 状态最小值（0-4）                                                   |
| `maxStatus` | `number`           | `4`          | 状态最大值（0-4）                                                   |
| `isRoot` | `number`           | `undefined`          | 是否是根级细胞                                                   |

###### 2. 关联关系过滤
| 参数             | 类型                | 默认值       | 描述                                                                 |
|------------------|---------------------|--------------|----------------------------------------------------------------------|
| `parentIds`      | `string[]`          | `[]`         | 父级细胞ID数组（查询这些细胞的子级）                                 |
| `childIds`       | `string[]`          | `[]`         | 子级细胞ID数组（查询这些细胞的父级）                                 |
| `relationshipType` | `string`       | `undefined`  | 用户关系类型（如 `star`/`like`）                                    |

###### 3. 时间范围
| 参数        | 类型               | 默认值       | 描述                                                                 |
|-------------|--------------------|--------------|----------------------------------------------------------------------|
| `startTime` | `string`/`number`  | `undefined`  | 起始时间（时间戳或 `YYYY-MM-DD HH:mm:ss`）                          |
| `endTime`   | `string`/`number`  | `undefined`  | 结束时间（同上）                                                    |
| `timeType`  | `string`           | `createTime` | 时间类型（`createTime`/`updateTime`/`publishTime`）                 |

###### 4. 分页参数
| 参数       | 类型    | 默认值 | 描述                                                                 |
|------------|---------|--------|----------------------------------------------------------------------|
| `page`     | `number`| `1`    | 当前页码                                                             |
| `pageSize` | `number`| `20`   | 每页数据量（`-1` 表示获取全部）                                      |

###### 5. 展示选项
| 参数                  | 类型    | 默认值  | 描述                                                                 |
|-----------------------|---------|---------|----------------------------------------------------------------------|
| `showDetail`          | `boolean`| `false` | 是否返回完整细胞数据（否则返回精简版）                               |
| `showUsers`           | `boolean`| `false` | 是否包含用户信息                                                    |
| `showCorrelationParents` | `boolean`| `false` | 是否包含父级关联细胞                                                |
| `showCorrelationChildren` | `boolean`| `false` | 是否包含子级关联细胞                                                |

###### 6. 排序规则
| 参数    | 类型                | 默认值 | 描述                                                                 |
|---------|---------------------|--------|----------------------------------------------------------------------|
| `orders`| `Order[]`           | `[]`   | 排序规则数组（`{ column, order }`）                                 |

```typescript
interface Order {
  column: string; // 排序字段（如 'updateTime'）
  order: 'ASC' | 'DESC'; // 排序方向
}
```


##### 返回值说明
```typescript
interface GetCellsResult {
  data: Cell[]; // 细胞数据数组
  total: number; // 符合条件的总记录数
}

interface Cell {
  cid: string;
  name: string;
  type: string;
  // ...其他字段
  // 扩展字段（根据展示选项）
  correlationsParents?: Cell[]; // 父级关联细胞
  correlationsChildren?: Cell[]; // 子级关联细胞
  isStar?: boolean; // 用户关系标记
  // ...
}
```


##### 使用示例
###### 1. 基础查询
```javascript
// 查询所有类型为 'markdown' 的内容细胞（精简模式）
const result = await db.cells.getCells({
  typeGroup: 'content',
  type: 'markdown',
  showDetail: false
});
```

###### 2. 关联关系查询
```javascript
// 查询属于某个文件夹的笔记（带父级信息）
const result = await db.cells.getCells({
  parentIds: ['folderId-123'],
  showCorrelationParents: true
});
```

###### 3. 复杂组合查询
```javascript
// 查询最近7天更新的已发布文章（按更新时间倒序）
const result = await db.cells.getCells({
  typeGroup: 'article',
  status: 3, // 已发布
  startTime: Date.now() - 7 * 864e5,
  timeType: 'updateTime',
  orders: [{ column: 'updateTime', order: 'DESC' }]
});
```


##### 实现细节说明
###### 1. 查询逻辑优先级
1. **精确匹配**：`cid` 参数优先于其他过滤条件
2. **关联关系**：
   - `parentIds` 和 `childIds` 联合使用时取交集
   - `relationshipType` 与关联关系参数联合使用时取交集
3. **时间范围**：支持 `createTime`/`updateTime`/`publishTime` 三选一

###### 2. 数据聚合策略
- **父子关系**：通过 `cellsRelations` 表关联查询
- **用户关系**：通过 `cellUserRelations` 表批量标记（如 `isStar`）
- **性能优化**：使用 `PouchDB` 的 `find` 方法配合索引加速查询

###### 3. 分页机制
- 支持无限滚动（`pageSize: -1`）
- 自动计算总记录数（`total` 字段）

##### 查询选项示例
```javascript
db.cells.getCells({
  typeGroup: 'content',
  type: ['markdown', 'todo'],
  parentIds: ['folder-123'],
  orders: [{ column: 'updateTime', order: 'DESC' }]
});
```

#### `getCell({ cid })`

查询细胞详情。

#### `createCell(cell)`

创建一个细胞。

#### `updateCell(cell)`

更新细胞。

#### `deleteCell({ cid })`

删除细胞。

#### `connectCells({ sourceId, targetId })`

关联两个细胞，其中 sourceId 和 targetId 为关系箭头的起点和终点两个细胞的cid。

#### `disconnectCells({ sourceId, targetId })`

解除两个细胞的关系。

#### `connectCellAndUser({ cid, type })`

创建一个细胞与用户之间的关系，type可自定义，例如star、like等。

#### `disconnectCellAndUser({ cid, type })`

解除一个细胞与用户之间的关系。


## 最佳实践

### 笔记系统实现
```javascript
// 创建分类结构
const categoryCell = await db.cells.createCell({
  type: 'category',
  typeGroup: 'system',
  data: { name: '技术笔记' }
});

// 创建笔记并关联
const noteCell = await db.cells.createCell({
  type: 'markdown',
  typeGroup: 'content',
  data: { title: 'PouchDB优化指南' },
  relations: { parents: [categoryCell.cid] }
});
```
