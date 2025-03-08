import Workspace from './modules/workspace';
import Cells from './modules/cells';
import Config from './modules/config';
import { v4 as uuidv4 } from 'uuid';

export default class CellsDB extends EventTarget {
    constructor(options = {
        id: uuidv4(),
        name: 'new workspace',
        description: '',
        avatar: '',
        color: null,
        icon: null,
        password: null,
        createdAt: Date.now(),
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