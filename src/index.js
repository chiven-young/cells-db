import Workspace from './modules/workspace';
import Cells from './modules/cells';
import Config from './modules/config';

export default class CellsDB extends EventTarget {
    constructor(options = {
        id: '',
        name: 'new workspace',
        description: '',
        avatar: '',
        color: null,
        icon: null,
        password: null,
        after: (workspace, workspaces) => { },
    }) {
        super(); // 继承 EventTarget
        this.workspace = new Workspace(this);
        this.cells = new Cells(this);
        this.config = new Config(this);
        this.workspace.init(options);
    }
    // 触发事件
    emit(eventName, detail = {}) {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    // 监听事件
    on(eventName, callback) {
        this.addEventListener(eventName, (event) => callback(event.detail));
    }
}