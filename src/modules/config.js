
export default class Config {
    constructor(parent) {
        this.parent = parent;
    }

    async setConfig(data) {
        const config = this.parent.workspace.currentWorkspace.config;
        const newConfig = { ...config, ...data };
        if (JSON.stringify(config) === JSON.stringify(newConfig)) return false;
        await this.parent.workspace.updateWorkspace({ config: newConfig, id: this.parent.workspace.currentWorkspace?.id }, true);
        this.parent.emit('config:updated', { config: newConfig });
        return true;
    }
    async getConfig() {
        return this.parent.workspace.currentWorkspace?.config || null;
    }
    async setUser(data) {
        const user = this.parent.workspace.currentWorkspace?.user || {};
        const newUser = { ...user, ...data };
        if (JSON.stringify(user) === JSON.stringify(newUser)) return false;
        await this.parent.workspace.updateWorkspace({ user: newUser, id: this.parent.workspace.currentWorkspace?.id }, true);
        this.parent.emit('user:updated', { user: newUser });
        return true;
    }
    async getUser() {
        return this.parent.workspace.currentWorkspace?.user || null;
    }
}