import { v4 as uuidv4 } from 'uuid';

export const formatWorkspace = (workspace) => {
    let data = {};
    data.id = workspace?.id || uuidv4();
    data.version = workspace?.version || 1;
    data.name = workspace?.name || 'UntitledWorkspace';
    data.description = workspace?.description || '';
    data.password = workspace?.password || '';
    data.color = workspace?.color || getRandomColor();
    data.avatar = workspace?.avatar || '';
    data.icon = workspace?.icon;
    data.createTime = workspace?.createTime || Date.now();
    data.verifyText = workspace?.verifyText || '';

    data.user = (workspace?.user && typeof workspace.user === 'object') ? workspace.user : {};

    data.appearance = (workspace?.appearance && typeof workspace.appearance === 'object') ? workspace.appearance : {};
    data.appearance.theme = workspace?.appearance?.theme || 'system';
    data.appearance.primaryColor = workspace?.appearance?.primaryColor;
    data.appearance.lockscreenBg = workspace?.appearance?.lockscreenBg || '';

    data.electron = (workspace?.electron && typeof workspace.electron === 'object') ? workspace.electron : {};
    data.android = (workspace?.android && typeof workspace.android === 'object') ? workspace.android : {};
    data.ios = (workspace?.ios && typeof workspace.ios === 'object') ? workspace.ios : {};
    data.ipados = (workspace?.ipados && typeof workspace.ipados === 'object') ? workspace.ipados : {};

    data.layout = (workspace?.layout && typeof workspace.layout === 'object') ? workspace.layout : {};

    data.config = (workspace?.config && typeof workspace.config === 'object') ? workspace.config : {};
    data.config.language = workspace?.config?.language || 'zh-CN';
    data.config.autoLockTimeout = typeof workspace?.config?.autoLockTimeout === 'number' ? workspace.config.autoLockTimeout : 5;
    data.config.shortcutKeys = Array.isArray(workspace?.config?.shortcutKeys) ? workspace.config.shortcutKeys : [];

    data.pages = Array.isArray(workspace?.pages) ? workspace.pages : [];
    data.pages.forEach((page) => {
        page.path = page.path || '';
    })

    return data;
}

// 细胞索引（仅用于pouchdb）
export const cellIndexs = {
    fields: ['typeGroup', 'type', 'status', 'isRoot', 'createTime', 'updateTime', 'publishTime', 'name'],
    name: 'cellIndexs',
    ddoc: 'evolver_cells_doc',
    type: 'json',
    partial_filter_selector: {
        status: { $gte: 0, $lte: 4 },
        isRoot: { $gte: 0, $lte: 1 },
    }
};

export const cellRelationsIndexs = {
    fields: ['sourceId', 'targetId'],
    name: 'cellRelationsIndexs',
    ddoc: 'evolver_cells_doc',
}

export const cellUserRelationsIndexs = {
    fields: ['cid', 'type'],
    name: 'cellUserRelationsIndexs',
    ddoc: 'evolver_cells_doc',
}

export const cellFieldsForCover = ['cid', 'name', 'description', 'typeGroup', 'type', 'icon', 'cover', 'status', 'encrypted', 'isRoot', 'style', 'config', 'statistics', 'createTime', 'updateTime', 'publishTime'];

export const cellFieldsForTag = ['cid', 'name', 'description', 'typeGroup', 'type', 'icon', 'cover', 'status'];

// 用户和细胞的关联类型
export const cellUserRelationTypes = [
    'star', // 星标收藏
    'like', // 喜欢点赞
    'cooperation', // 协作成员
    'contactsTag', // 联系人标签
]

const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF'];
export function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}

// 默认工作区文件夹结构
export const defaultWorkspaceFiles = {
    '.evolver': {
        'themes': {},
        'plugins': {},
        'workspace.json': JSON.stringify(formatWorkspace({}), null, 2),
    },
    'database': {},
    'assets': {
        'images': {},
        'audios': {},
        'videos': {},
    },
    'notes': {},
    'templates': {},
    'stream': {},
    'PKM': {},
}