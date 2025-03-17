import { formatWorkspace, cellIndexs, cellRelationsIndexs, cellUserRelationsIndexs, getRandomColor } from '../config/db';
import { getLocalStorageArray, reorderLocalStorageArray, removeFromLocalStorageArray } from '../utils/data';
import PouchDB from 'pouchdb/dist/pouchdb';
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind);

export default class Workspace {
    constructor(parent) {
        this.parent = parent;
        
        this.cellsDB = null;
        this.cellsRelationsDB = null;
        this.cellUserRelationsDB = null;

        this.currentWorkspace = null;
    }
    static workspaceManagerDB = null;
    static workspaces = [];
    async init(options) {
        if (!Workspace.workspaceManagerDB) {
            Workspace.workspaceManagerDB = new PouchDB('workspaceManager');
        }
        Workspace.workspaces = await this.getWorkspaces();
        if (Workspace.workspaces.length > 0) {
            const activeId = sessionStorage.getItem('activeWorkspaceId');
            const list = getLocalStorageArray('recentWorkspaces');
            const recentId = list.length > 0 ? list[0] : null;
            const workspace = Workspace.workspaces.find((w) => w.id === (options?.id || activeId || recentId));
            if (workspace) {
                this.currentWorkspace = workspace;
            } else if (Workspace.workspaces.length > 0) {
                const firstWorkspace = Workspace.workspaces[0];
                this.currentWorkspace = firstWorkspace;
            }
        } else {
            this.currentWorkspace = await this.createWorkspace(options);
        }
        await this.switchWorkspace(this.currentWorkspace.id);
        options.after(this.currentWorkspace, Workspace.workspaces);
        this.parent.emit('after', { workspace: this.currentWorkspace, workspaces: Workspace.workspaces });
        return { workspace: this.currentWorkspace, workspaces: Workspace.workspaces };
    }

    // 获取工作区列表
    async getWorkspaces() {
        try {
            const res = await Workspace.workspaceManagerDB.allDocs({ include_docs: true });
            return res.rows.map(row => row.doc);
        } catch (err) {
            console.error('getWorkspaces error:', err);
            return [];
        }
    }

    // 创建工作区
    async createWorkspace(data) {
        this.parent.emit('workspace:beforeCreate', { workspace: data });
        let workspace = formatWorkspace(data);
        console.log('createWorkspace:', data, workspace)
        try {
            const res = await Workspace.workspaceManagerDB.put({
                _id: workspace.id,
                ...workspace
            });
            this.parent.emit('workspace:created', { workspace });
            Workspace.workspaces = await this.getWorkspaces();
            this.parent.emit('workspaces:changed', { workspaces: Workspace.workspaces });
            return workspace;
        } catch (err) {
            console.error('createWorkspace error:', err);
            return null;
        }
    }

    // 获取某个工作区的详情
    async getWorkspace(id) {
        try {
            const res = await Workspace.workspaceManagerDB.get(id);
            return res;
        } catch (err) {
            console.error('getWorkspace error:', err);
            return null;
        }
    }

    // 更新某个工作区
    async updateWorkspace(data, isCurrent = true) {
        if (!data.id) return null;
        let workspace = JSON.parse(JSON.stringify(data));
        try {
            workspace.version++;
            delete workspace._rev;
            // 检查是否存在
            const existingData = await Workspace.workspaceManagerDB.get(workspace.id);
            if (existingData) {
                const fullWorkspace = {
                    ...existingData,
                    ...workspace
                }
                await Workspace.workspaceManagerDB.put(fullWorkspace);
                this.parent.emit('workspace:updated', { workspace: fullWorkspace });
                if (isCurrent) {
                    this.currentWorkspace = fullWorkspace;
                }
                return fullWorkspace;
            } else {
                console.warn(`Workspace with id ${workspace.id} not found.`);
                return null;
            }
        } catch (err) {
            console.error('updateWorkspace error:', err);
            return null;
        }
    }

    // 删除某个工作区
    async deleteWorkspace(id) {
        try {
            const existingData = await Workspace.workspaceManagerDB.get(id);
            if (existingData) {
                await Workspace.workspaceManagerDB.remove(existingData);
                const cellsName = `cells_${id}`;
                const cellRelationsName = `cellRelations_${id}`;
                const cellUserRelationsName = `cellUserRelations_${id}`;
                const db1 = new PouchDB(cellsName);
                const db2 = new PouchDB(cellRelationsName);
                const db3 = new PouchDB(cellUserRelationsName);
                db1.destroy();
                db2.destroy();
                db3.destroy();
                removeFromLocalStorageArray('recentWorkspaces', id);
                this.parent.emit('workspace:deleted', { id });
                Workspace.workspaces = await this.getWorkspaces();
                this.parent.emit('workspaces:changed', { workspaces: Workspace.workspaces });
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
            console.error('deleteWorkspace error:', err);
            return false;
        }
    }

    // 创建、获取数据库，并创建索引
    async getDB (name, indexsName, indexs) {
        try {
            const db = new PouchDB(name);

            // 等待获取索引
            const result = await db.getIndexes();
            const indexes = result.indexes;

            // 查找是否已有指定的索引
            const existingIndex = indexes.find(index => index.name === indexsName);
            // console.log(existingIndex, 'indexs', indexs);

            if (!existingIndex) {
                // 如果索引不存在，创建索引并等待完成
                await db.createIndex({
                    index: indexs
                });
            }

            // 在索引检查/创建完成后返回数据库实例
            return db;

        } catch (err) {
            console.error('处理索引时出错', err);

            // 如果出错，仍然返回数据库实例
            return new PouchDB(name);
        }
    }

    // 切换到某个工作区
    async switchWorkspace(id, callback) {
        this.parent.emit('workspace:beforeSwitch');
        try {
            let workspace = await Workspace.workspaceManagerDB.get(id);
            if (workspace) {
                workspace = formatWorkspace(workspace);
                const cellsName = `cells_${id}`;
                const cellRelationsName = `cellRelations_${id}`;
                const cellUserRelationsName = `cellUserRelations_${id}`;
                this.cellsDB = await this.getDB(cellsName, 'cellIndexs', cellIndexs);
                this.cellsRelationsDB = await this.getDB(cellRelationsName, 'cellRelationsIndexs', cellRelationsIndexs);
                this.cellUserRelationsDB = await this.getDB(cellUserRelationsName, 'cellUserRelationsIndexs', cellUserRelationsIndexs);
    
                this.currentWorkspace = workspace;
                sessionStorage.setItem('activeWorkspaceId', id);
                reorderLocalStorageArray('recentWorkspaces', id);
                this.parent.emit('workspace:switched', { workspace });
                callback?.(workspace);
                return workspace;
            } else {
                callback?.(null);
                return null;
            }
        } catch (err) {
            console.error('switchWorkspace error', err);
            callback?.(null);
            return null;
        }
    }
}