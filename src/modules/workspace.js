import { formatWorkspace, cellIndexs, cellRelationsIndexs, cellUserRelationsIndexs, getRandomColor } from '../config/db';
import { getLocalStorageArray, reorderLocalStorageArray, removeFromLocalStorageArray } from '../utils/data';
import { openDB, deleteDB, wrap, unwrap } from 'idb';

export default class Workspace {
    constructor(parent) {
        this.parent = parent;
        this.currentWorkspace = null;
        this.workspaceDB = null;
    }
    static workspaceManagerDB = null;
    static workspaces = [];
    async init(options) {
        if (!Workspace.workspaceManagerDB) {
            Workspace.workspaceManagerDB = await openDB('workspaceManager', 1, {
                upgrade(db) {
                    // 创建数据表
                    if (!db.objectStoreNames.contains('workspaces')) {
                      const store = db.createObjectStore('workspaces', { keyPath: 'id' });
                      store.createIndex('name', 'name', { unique: false });
                    }
                },
            });
        }
        Workspace.workspaces = await this.getWorkspaces();
        const workspace = Workspace.workspaces.find((w) => w.id === options?.id);
        if (workspace) {
            this.currentWorkspace = workspace;
        } else if (Workspace.workspaces.length > 0) {
            const firstWorkspace = Workspace.workspaces[0];
            this.currentWorkspace = firstWorkspace;
        } else {
            this.currentWorkspace = await this.createWorkspace(options);
        }
        options.after(this.currentWorkspace, Workspace.workspaces);
        this.parent.emit('after', { workspace: this.currentWorkspace, workspaces: Workspace.workspaces });
        return { workspace: this.currentWorkspace, workspaces: Workspace.workspaces };
    }

    // 获取工作区列表
    async getWorkspaces() {
        try {
            const tx = Workspace.workspaceManagerDB.transaction('workspaces', 'readonly');
            const store = tx.objectStore('workspaces');
            return await store.getAll();
        } catch (err) {
            const errorMessage = err.message ? err.message : String(err);
            console.log('getWorkspaces error:', errorMessage);
            return [];
        }
    }

    // 创建工作区
    async createWorkspace(data) {
        let workspace = formatWorkspace(data);
        try {
            const tx = Workspace.workspaceManagerDB.transaction('workspaces', 'readwrite');
            const store = tx.objectStore('workspaces');
            await store.put(workspace);
            this.parent.emit('workspaceCreated', { workspace });
            Workspace.workspaces = await store.getAll();
            this.parent.emit('workspacesChanged', { workspaces: Workspace.workspaces });
            return workspace;
        } catch (err) {
            const errorMessage = err.message ? err.message : String(err);
            console.log('createWorkspace error:', errorMessage);
            return null;
        }
    }

    // 获取某个工作区的详情
    async getWorkspace(id) {
        try {
            const tx = Workspace.workspaceManagerDB.transaction('workspaces', 'readonly');
            const store = tx.objectStore('workspaces');
            return await store.get(id);
        } catch (err) {
            const errorMessage = err.message ? err.message : String(err);
            console.log('getWorkspace error:', errorMessage);
            return null;
        }
    }

    // 更新某个工作区
    async updateWorkspace(data, isCurrent = true) {
        if (!data.id) return null;
        let workspace = JSON.parse(JSON.stringify(data));
        try {
            workspace.version++;
            // 检查是否存在
            const tx = Workspace.workspaceManagerDB.transaction('workspaces', 'readwrite');
            const store = tx.objectStore('workspaces');
            const existingData = await store.get(workspace.id);
            if (existingData) {
                const fullWorkspace = {
                    ...existingData,
                    ...workspace
                }
                await store.put(fullWorkspace);
                this.parent.emit('workspaceUpdated', { workspace: fullWorkspace });
                if (isCurrent) {
                    this.currentWorkspace = fullWorkspace;
                }
                return fullWorkspace;
            } else {
                console.warn(`Workspace with id ${workspace.id} not found.`);
                return null;
            }
        } catch (err) {
            const errorMessage = err.message ? err.message : String(err);
            console.log('updateWorkspace error:', errorMessage);
            return null;
        }
    }

    // 删除某个工作区
    async deleteWorkspace(id) {
        try {
            const tx = Workspace.workspaceManagerDB.transaction('workspaces', 'readwrite');
            const store = tx.objectStore('workspaces');
            const existingData = await store.get(id);
            if (existingData) {
                await store.delete(id);
                removeFromLocalStorageArray('recentWorkspaces', id);
                this.parent.emit('workspaceDeleted', { id });
                Workspace.workspaces = await store.getAll();
                this.parent.emit('workspacesChanged', { workspaces: Workspace.workspaces });
                const dbName = `workspace_${id}`;
                await deleteDB(dbName);
                if (id !== this.currentWorkspace?.id) {
                    return true;
                }
                if (Workspace.workspaces.length > 0) {
                    const firstWorkspace = Workspace.workspaces[0];
                    await this.switchWorkspace(firstWorkspace.id);
                } else {
                    const res = await this.createWorkspace({});
                    await this.switchWorkspace(res.id);
                }
                return true;
            } else {
                console.warn(`Workspace with id ${id} not found.`);
                return false;
            }
        } catch (err) {
            const errorMessage = err.message ? err.message : String(err);
            console.log('deleteWorkspace error:', errorMessage);
            return false;
        }
    }

    // 切换到某个工作区
    async switchWorkspace(id, callback) {
        try {
            let workspace = await this.getWorkspace(id);
            if (workspace) {
                workspace = formatWorkspace(workspace);
                this.workspaceDB = await openDB(`workspace_${id}`, 1, {
                    upgrade(db) {
                        // 创建 cells 数据表
                        if (!db.objectStoreNames.contains('cells')) {
                            const store = db.createObjectStore('cells', { keyPath: 'cid' });
    
                            // 创建索引
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('typeGroup', 'typeGroup', { unique: false });
                            store.createIndex('type', 'type', { unique: false });
                            store.createIndex('status', 'status', { unique: false });
                            store.createIndex('isRoot', 'isRoot', { unique: false });
                            store.createIndex('createTime', 'createTime', { unique: false });
                            store.createIndex('updateTime', 'updateTime', { unique: false });
                            store.createIndex('publishTime', 'publishTime', { unique: false });
                        }
    
                        // 创建 cellRelations 数据表
                        if (!db.objectStoreNames.contains('cellRelations')) {
                            const store = db.createObjectStore('cellRelations', { keyPath: 'id' });
    
                            // 创建索引
                            store.createIndex('sourceId', 'sourceId', { unique: false });
                            store.createIndex('targetId', 'targetId', { unique: false });
                        }
    
                        // 创建 cellUserRelations 数据表
                        if (!db.objectStoreNames.contains('cellUserRelations')) {
                            const store = db.createObjectStore('cellUserRelations', { keyPath: 'id' });
    
                            // 创建索引
                            store.createIndex('cid', 'cid', { unique: false });
                            store.createIndex('type', 'type', { unique: false });
                        }
                    },
                });
    
                this.currentWorkspace = workspace;
                this.parent.emit('workspaceSwitched', { workspace });
                reorderLocalStorageArray('recentWorkspaces', id);
                callback?.(workspace);
                return workspace;
            } else {
                callback?.(null);
                return null;
            }
        } catch (err) {
            console.log('switchWorkspace error', err.message || err);
            callback?.(null);
            return null;
        }
    }
}