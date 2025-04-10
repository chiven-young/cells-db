import { v4 as uuidv4 } from 'uuid';
import { cellDataFormat } from '../utils/format';
import { deepQueryObject, deepUpdateObject, checkObjPropertiesIsOnlyJson, sortArrayByOrders } from '../utils/data';
import { parseTimeToTimestamp } from '../utils/time';
import { cellFieldsForCover, cellFieldsForTag, cellUserRelationTypes } from '../config/db';

export default class Cells {
    constructor(parent) {
        this.parent = parent;
        this.cellViewTimer = null;
    }
    // 细胞
    /**
     * 获取细胞列表
     * @param {Number} cid - 细胞id，如果传此值表示只精确查询此细胞
     * @param {String} partition - 分区，空则查全部
     * @param {String} typeGroup - 大类别，type的上级，空则查全部
     * @param {String} type - 类别，空则查全部
     * @param {Number} minStatus - 最小状态值，0-4，空则不设限
     * @param {Number} maxStatus - 最大状态值，0-4，空则不设限
     * @param {Array} parentIds - 父级关联细胞的cid数组，允许筛选多个cid，表示要查询这些sourceId关联的所有targetId的子级细胞
     * @param {Array} childIds - 子级关联细胞的cid数组，允许筛选多个cid，表示要查询这些targetId关联的所有sourceId的父级细胞
     * @param {String} relationshipType - 细胞与用户的关系类别，如果传值，则根据用户uid或者管理员指定的uid去查
     * @param {String} startTime - 开始时间，格式为13位时间戳或 'YYYY-MM-DD HH:mm:ss'
     * @param {String} endTime - 结束时间，格式为13位时间戳或 'YYYY-MM-DD HH:mm:ss'
     * @param {String} timeType - 检查的时间类型，createTime、updateTime、publishTime，默认是createTime
     * @param {Number} page - 分页
     * @param {Number} pageSize - 每页条数，如果传-1，则请求全部数据
     * @param {Number} showDetail - 是否显示每个细胞的详细数据，否则只是简要数据
     * @param {Number} showUsers - 是否显示用户信息
     * @param {Number} showCorrelationParents - 是否显示上级关联细胞
     * @param {Number} showCorrelationChildren - 是否显示下级关联细胞
     * @param {Array} orders // 排序，一个对象数组，每个对象属性：column：参与排序字段，order：正序还是倒序，ASC正序，DESC倒序
     * @returns {Object} 细胞列表和总数
     */
    async getCells(params) {
        if (['createTime', 'updateTime', 'publishTime'].indexOf(params.timeType) === -1) {
            params.timeType = 'createTime';
        }
        const startTime = parseTimeToTimestamp(params?.startTime);
        const endTime = parseTimeToTimestamp(params?.endTime);
        params.orders = Array.isArray(params?.orders) ? params.orders : [];
        let orders = [];
        for (const each of params.orders) {
            if (each?.column) {
                const obj = {
                    column: each.column,
                    order: each?.order === 'ASC' ? each.order : 'DESC'
                }
                orders.push(obj)
            }
        }
        const page = params?.page || 1;
        const pageSize = params?.pageSize || 20;
        const minStatus = typeof params?.minStatus === 'number' ? params.minStatus : 0;
        const maxStatus = typeof params?.maxStatus === 'number' ? params.maxStatus : 4;
        try {
            let selector = {
                status: { $gte: minStatus, $lte: maxStatus },
                createTime: { $gte: 0 },
            };
            if (startTime && endTime) {
                selector[params.timeType] = { $gte: startTime, $lte: endTime };
            } else if (startTime) {
                selector[params.timeType] = { $gte: startTime };
            } else if (endTime) {
                selector[params.timeType] = { $lte: endTime };
            }
            if (params.partition) {
                selector.partition = { $eq: params.partition };
            }
            if (params.typeGroup) {
                selector.typeGroup = { $eq: params.typeGroup };
            }
            if (params.type) {
                selector.type = { $eq: params.type };
            }
            if (params.isRoot === 0 || params.isRoot === 1) {
                selector.isRoot = { $eq: params.isRoot };
            }

            let correlationCids = []; // 关联细胞cid数组

            // 1. 如果存在关联类型，则说明是查询指定的用户的某种关联类型的细胞
            let correlationCids1 = [];
            if (params.relationshipType && cellUserRelationTypes.includes(params.relationshipType)) {
                const relationRes = await this.parent.workspace.cellUserRelationsDB.find({
                    selector: {
                        type: params.relationshipType
                    },
                    limit: 9999
                })
                const relation = relationRes.docs;
                correlationCids1 = relation.map(item => item.cid);
            }
            // 2. 如果存在parentIds或childIds，则是从关联细胞来筛选细胞
            let correlationCids2 = [];
            let isCorrelation = false; // 是否从关联细胞查询
            let correlationCidsByParentIds = []; // 由父cid查的cid数组
            let correlationCidsByChildIds = []; // 由子cid查的cid数组
            if (Array.isArray(params?.parentIds) && params.parentIds.length > 0) {
                const relationsRes = await this.parent.workspace.cellsRelationsDB.find({
                    selector: {
                        sourceId: { $in: params.parentIds },
                    },
                    limit: 9999
                })
                const relation = relationsRes.docs;
                correlationCidsByParentIds = relation.map(item => item.targetId);
            }
            if (Array.isArray(params?.childIds) && params.childIds.length > 0) {
                const relationsRes = await this.parent.workspace.cellsRelationsDB.find({
                    selector: {
                        targetId: { $in: params.childIds },
                    },
                    limit: 9999
                })
                const relation = relationsRes.docs;
                correlationCidsByChildIds = relation.map(item => item.sourceId);
            }
            if (Array.isArray(params?.parentIds) && params.parentIds.length > 0 && Array.isArray(params?.childIds) && params.childIds.length > 0) {
                // 如果同时传了父子ids，则使用它们的交集
                correlationCids2 = correlationCidsByParentIds.filter(cid => correlationCidsByChildIds.includes(cid));
                isCorrelation = true;
            } else if (Array.isArray(params?.parentIds) && params.parentIds.length > 0 && !params.childIds) {
                // 如果只传了父ids，则只查子级
                correlationCids2 = correlationCidsByParentIds;
                isCorrelation = true;
            } else if (Array.isArray(params?.childIds) && params.childIds.length > 0 && !params.parentIds) {
                // 如果只传了子ids，则只查父级
                correlationCids2 = correlationCidsByChildIds;
                isCorrelation = true;
            }
            // 将上面的查到的关联cid数组求交集
            if (params.relationshipType && !isCorrelation) {
                // 如果只从细胞-用户关联来查询
                correlationCids = correlationCids1;
            } else if (!params.relationshipType && isCorrelation) {
                // 如果只从细胞间父子关联来查询
                correlationCids = correlationCids2;
            } else if (params.relationshipType && isCorrelation) {
                // 如果两者都有，则求交集
                correlationCids = correlationCids1.filter(cid => correlationCids2.includes(cid));
            }
            if (correlationCids.length > 0) {
                selector.cid = { $in: correlationCids };
            } else if (isCorrelation || params.relationshipType) {
                return { data: [], total: 0 };
            }

            let sort = [];
            if (orders.length > 0) {
                orders.forEach(order => {
                    const { column, order: sortOrder } = order;
                    if (column && (sortOrder === 'DESC' || sortOrder === 'ASC')) {
                        sort.push({ [column]: sortOrder.toLowerCase() });
                        if (!selector[column]) {
                            selector[column] = { $gte: 0 };
                        }
                    }
                });
            }
            const skip = (page - 1) * pageSize;
            let result = null;
            if (pageSize !== -1) {
                result = await this.parent.workspace.cellsDB.find({
                    selector: selector,
                    fields: params?.showDetail ? undefined : cellFieldsForCover,
                    // sort: sort.length > 0 ? sort : undefined,
                    skip: skip,
                    limit: pageSize,
                });
            } else {
                result = await this.parent.workspace.cellsDB.find({
                    selector: selector,
                    fields: params?.showDetail ? undefined : cellFieldsForCover,
                    // sort: sort.length > 0 ? sort : undefined,
                    limit: 999999,
                });
            }
            // let list = result.docs;
            let list = sortArrayByOrders(result.docs, orders); // 排序
            const cids = list.map(cell => cell.cid); // 所有细胞的cid
            // 查询父级关联细胞
            let parentRelations = []; // 父级关系表
            let correlationParentCells = []; // 所有父级细胞
            if (params.showCorrelationParents) {
                const relationsRes = await this.parent.workspace.cellsRelationsDB.find({
                    selector: {
                        targetId: { $in: cids },
                    },
                    limit: 999
                })
                parentRelations = relationsRes.docs;
                const sourceCellCids = parentRelations.map(relation => relation.sourceId);
                const sourceCellsRes = await this.parent.workspace.cellsDB.find({
                    selector: {
                        _id: { $in: sourceCellCids },
                    },
                    fields: cellFieldsForTag,
                    limit: 999
                })
                correlationParentCells = sourceCellsRes.docs;
            }
            // 查询子级关联细胞
            let childrenRelations = []; // 子级关系表
            let correlationChildrenCells = []; // 所有子级细胞
            if (params.showCorrelationChildren) {
                const relationsRes = await this.parent.workspace.cellsRelationsDB.find({
                    selector: {
                        sourceId: { $in: cids },
                    },
                    limit: 9999
                })
                childrenRelations = relationsRes.docs;
                const targetCellCids = childrenRelations.map(relation => relation.targetId);
                const targetCellsRes = await this.parent.workspace.cellsDB.find({
                    selector: {
                        _id: { $in: targetCellCids },
                    },
                    fields: cellFieldsForTag,
                    limit: 9999
                })
                correlationChildrenCells = targetCellsRes.docs;
            }
            // 查询与用户的关系
            const relationsCURes = await this.parent.workspace.cellUserRelationsDB.find({
                selector: {
                    cid: { $in: cids },
                    limit: 9999
                }
            })
            const relationsCUArr = relationsCURes.docs;
            // 组装最终数据
            for (const cell of list) {
                cell.isStar = relationsCUArr.some(relation => relation.cid === cell.cid && relation.type === 'star');
                cell.isLike = relationsCUArr.some(relation => relation.cid === cell.cid && relation.type === 'like');
                if (params.showCorrelationParents) {
                    const arr = correlationParentCells.filter(targetCell => {
                        return parentRelations.some(relation => {
                            return relation.sourceId === targetCell.cid && relation.targetId === cell.cid
                        })
                    })
                    cell.correlationsParents = sortArrayByOrders(arr, orders);
                }
                if (params.showCorrelationChildren) {
                    const arr = correlationChildrenCells.filter(targetCell => {
                        return childrenRelations.some(relation => {
                            return relation.sourceId === cell.cid && relation.targetId === targetCell.cid
                        })
                    })
                    cell.correlationsChildren = sortArrayByOrders(arr, orders);
                }
            }
            return { data: list, total: list.length };
        } catch (err) {
            console.error('get cells error', err);
            return null;
        }
    }
    /**
     * 通过cid获取用户的细胞详细数据
     * @param {String} cid - 细胞id
     * @param {String} password - 密码
     * @param {Number} showUser - 是否显示用户信息
     * @param {Number} showCorrelationParents - 是否显示上级关联细胞
     * @param {Number} showCorrelationChildren - 是否显示下级关联细胞
     * @param {Boolean} deepQuery - 是否深度查找主属性下对应的数据，如果启用，则不会再查用户、关联细胞等附属属性
     * @param {any} deepPath - 要查询的深度数据路径，是个对象
     * @param {Object} deepQueryOptions - 深度查询的一些选项，可以用来给数组分页查询
     * @returns {Object} 细胞详情
     */
    async getCell(params) {
        const { cid } = params;
        if (!cid) return null;
        try {
            const res = await this.parent.workspace.cellsDB.get(cid);
            if (res) {
                const cell = JSON.parse(JSON.stringify(res));
                cell.statistics = cell?.statistics || {};
                cell.statistics.lastViewTime = Date.now();
                this.parent.workspace.cellsDB.put(cell);
            }
            return res;
        } catch (err) {
            console.error('get cell error', err);
            return null;
        }
    }

    /**
     * 创建新的细胞
     * @param {Object} ...data - 细胞数据，传什么插入什么
     * @returns {Object} 插入细胞的cid, rev
     */
    async createCell(params) {
        this.parent.emit('cell:beforeCreate', { cell: params });
        if (typeof params !== 'object' || !params) {
            console.error('Cell data format error.');
            return null;
        }
        let cell = cellDataFormat(params);
        cell.cid = uuidv4();
        const now = Date.now();
        cell.createTime = now;
        cell.updateTime = now;
        try {
            const res = await this.parent.workspace.cellsDB.put({
                _id: cell.cid,
                ...cell
            });
            this.parent.emit('cell:created', { cell });
            return cell;
        } catch (err) {
            console.error('create cell error', err);
            return null;
        }
    }

    /**
     * 更新细胞数据
     * @param {String} cid - 细胞id
     * @param {any} ...data - 细胞主属性数据，传什么更新什么
     * @param {Boolean} deepUpdate - 是否深度查找主属性下对应的数据以更新
     * @param {any} deepData - 要更新的主属性下的特定数据，会查询此处的数据，如果存在则按需更新，否则新增
     * @returns {Object} 细胞详情
     */
    async updateCell(body) {
        // this.cellViewTimer && clearTimeout(this.cellViewTimer);
        let params = Object.assign({}, body || {});
        if (!params.cid) {
            console.error('Missing cid');
            return false;
        }
        if (params.deepUpdate && !params?.deepData || !checkObjPropertiesIsOnlyJson(params.deepData)) {
            console.error('Using deep updates but the depth data does not meet the requirements.');
            return false;
        }
        try {
            const cell = await this.parent.workspace.cellsDB.get(params.cid);
            if (cell) {
                let updateData = cell;
                const now = Date.now();
                updateData.updateTime = now;
                if (params?.deepUpdate) {
                    let deepData = cell;
                    deepUpdateObject(deepData, params.deepData);
                    params = deepData;
                }
                if (params.name) {
                    updateData.name = params.name;
                }
                if (params.description) {
                    updateData.description = params.description;
                }
                if (params.icon) {
                    updateData.icon = params.icon;
                }
                if (params.typeGroup) {
                    updateData.typeGroup = params.typeGroup;
                }
                if (params.type) {
                    updateData.type = params.type;
                }
                if (typeof params.status === 'number' && params.status >= 0 && params.status <= 4) {
                    updateData.status = params.status;
                }
                if (params.data && typeof params.data === 'object') {
                    updateData.data = params.data;
                }
                if (params.config && typeof params.config === 'object') {
                    updateData.config = params.config;
                }
                if (params.style && typeof params.style === 'object') {
                    updateData.style = params.style;
                }
                if (params.encrypted === 0 || params.encrypted === 1) {
                    updateData.encrypted = params.encrypted;
                }
                if (params.password) {
                    updateData.password = params.password;
                }
                if (params.isRoot === 0 || params.isRoot === 1) {
                    updateData.isRoot = params.isRoot;
                }
                if (params.cover && Array.isArray(params.cover)) {
                    updateData.cover = params.cover;
                }
                if (params.children && Array.isArray(params.children)) {
                    updateData.children = params.children;
                }
                if (params.statistics && typeof params.statistics === 'object') {
                    updateData.statistics = params.statistics;
                }
                if (params.createTime && typeof params.createTime === 'number') {
                    updateData.createTime = params.createTime;
                }
                if (params.status >= 3 && !params.publishTime) {
                    updateData.publishTime = now;
                }
                if (params.publishTime && typeof params.publishTime === 'number') {
                    updateData.publishTime = params.publishTime;
                }
                await this.parent.workspace.cellsDB.put(updateData);
                const res = await this.parent.workspace.cellsDB.get(params.cid);
                if (res) {
                    this.parent.emit('cell:updated', { cell: res });
                    return res;
                } else {
                    return null;
                }
            } else {
                console.error('Cell not found.');
                return false;
            }
        } catch (err) {
            console.error('Error updating cell:', err);
            return false;
        }
    }

    async deleteCell(params) {
        if (!params.cid) {
            console.error('Missing "cid" parameter in deleteCell method.')
            return false;
        }
        try {
            const cell = await this.parent.workspace.cellsDB.get(params.cid);
            if (cell) {
                await this.parent.workspace.cellsDB.remove(cell);
                this.deleteAllCellsRelations(params.cid);
                this.parent.emit('cell:deleted', { cid: params.cid });
                return true;
            } else {
                console.error('Cell not found.');
                return false;
            }
        } catch (err) {
            console.error('Error deleting cell:', err);
            return false;
        }
    }
    // 绑定两个细胞
    async connectCells(params) {
        const { sourceId, targetId } = params;
        if (!sourceId || !targetId) {
            console.error('Missing "sourceId" or "targetId" parameter in connectCells method.')
            return false;
        } else if (sourceId === targetId) {
            console.error('Cannot connect a cell to itself.')
            return false;
        }
        try {
            const sourceCell = await this.parent.workspace.cellsDB.get(sourceId);
            const targetCell = await this.parent.workspace.cellsDB.get(targetId);
            if (sourceCell && targetCell) {
                const reid = uuidv4();
                const relation = {
                    _id: reid,
                    reid: reid,
                    sourceId: sourceId,
                    targetId: targetId
                }
                await this.parent.workspace.cellsRelationsDB.put(relation);
                // 如果目标细胞为根细胞，则去除根标记
                if (targetCell.isRoot) {
                    targetCell.isRoot = 0;
                    this.parent.workspace.cellsDB.put(targetCell);
                }
                this.parent.emit('cell:connected', { sourceId, targetId, reid });
                return reid;
            } else {
                console.error('Cell not found.');
                return false;
            }
        } catch (err) {
            console.error('Error connecting cells:', err);
            return false;
        }
    }

    // 解绑两个细胞
    async disconnectCells(params) {
        const { sourceId, targetId } = params;
        if (!sourceId || !targetId) {
            console.error('Missing "sourceId" or "targetId" parameter in disconnectCells method.')
            return false;
        } else if (sourceId === targetId) {
            console.error('Cannot disconnect a cell from itself.')
            return false;
        }
        try {
            const relationRes = await this.parent.workspace.cellsRelationsDB.find({
                selector: {
                    sourceId: sourceId,
                    targetId: targetId
                },
            });
            const relation = relationRes.docs.length ? relationRes.docs[0] : null;
            if (relation) {
                await this.parent.workspace.cellsRelationsDB.remove(relation);
                this.parent.emit('cell:disconnected', { sourceId, targetId });
                return true;
            } else {
                console.error('Relation not found.');
                return false;
            }
        } catch (err) {
            console.error('Error disconnecting cells:', err);
            return false;
        }
    }

    // 关联一个细胞与用户
    async connectCellAndUser(params) {
        const { cid, type } = params;
        if (!cid || !type) {
            console.error('Missing "cid" or "type" parameter in connectCellAndUser method.')
            return false;
        }
        try {
            const cell = await this.parent.workspace.cellsDB.get(cid);
            if (cell) {
                const relationRes = await this.parent.workspace.cellUserRelationsDB.find({
                    selector: {
                        cid: cid,
                        type: type
                    },
                })
                if (relationRes.docs.length === 0) {
                    const reid = uuidv4();
                    const relation = {
                        _id: reid,
                        reid: reid,
                        cid: cid,
                        type: type
                    }
                    await this.parent.workspace.cellUserRelationsDB.put(relation);
                    this.parent.emit('cell:connectedUser', { cid, type, reid });
                    return reid;
                } else {
                    console.error('Relation already exists.')
                    return false;
                }
            } else {
                console.error('Cell not found.');
                return false;
            }
        } catch (err) {
            console.error('Error connecting cell and user:', err);
            return false;
        }
    }

    // 解除一个细胞与用户的关系
    async disconnectCellAndUser(params) {
        const { cid, type } = params;
        if (!cid || !type) {
            console.error('Missing "cid" or "type" parameter in disconnectCellAndUser method.')
            return false;
        }
        try {
            const relationRes = await this.parent.workspace.cellUserRelationsDB.find({
                selector: {
                    cid: cid,
                    type: type
                },
            });
            const relation = relationRes.docs.length ? relationRes.docs[0] : null;
            if (relation) {
                await this.parent.workspace.cellUserRelationsDB.remove(relation);
                this.parent.emit('cell:disconnectedUser', { cid, type });
                return true;
            } else {
                console.error('Relation not found.');
                return false;
            }
        } catch (err) {
            console.error('Error disconnecting cell and user:', err);
            return false;
        }
    }

    // 删除一个cid所有相关的关系数据
    async deleteAllCellsRelations(cid) {
        const relation1 = await this.parent.workspace.cellsRelationsDB.find({
            selector: {
                sourceId: cid,
            },
            limit: 9999
        });
        const relation2 = await this.parent.workspace.cellsRelationsDB.find({
            selector: {
                targetId: cid,
            },
            limit: 9999
        });
        const relation3 = await this.parent.workspace.cellUserRelationsDB.find({
            selector: {
                cid: cid,
            },
            limit: 9999
        })
        const list = [...relation1.docs, ...relation2.docs, ...relation3.docs];
        const docsToDelete = list.map(row => {
            return {
                _id: row._id,
                _rev: row._rev, // 每个文档必须包含 _rev
                _deleted: true      // 标记为删除
            };
        });
        this.parent.workspace.cellsRelationsDB.bulkDocs(docsToDelete);
    }
    // 开始阅读计时
    async startCellReading(cell) {
        cell.statistics = cell.statistics || {};
        cell.statistics.viewTime = Math.floor(cell.statistics?.viewTime || 0);
        const now = Date.now();
        window.localStorage.setItem(`reading-${cell.cid}`, now);
        this.cellViewTimer = setInterval(() => {
            cell.statistics.viewTime += 1;
        }, 1000);
    }
    // 结束阅读计时
    async endCellReading(cid) {
        this.cellViewTimer && clearTimeout(this.cellViewTimer);
        const startTime = window.localStorage.getItem(`reading-${cid}`);
        if (!startTime) {
            console.error('No time found to start reading')
            return false;
        }
        const readingTime = Math.floor(Math.abs(Date.now() - startTime) / 1000);
        window.localStorage.removeItem(`reading-${cid}`);
        try {
            let res = await this.parent.workspace.cellsDB.get(cid);
            res.statistics = res?.statistics || {};
            res.statistics.viewTime = Math.floor((res.statistics?.viewTime || 0) + readingTime);
            await this.parent.workspace.cellsDB.put(res);
            return readingTime;
        } catch (err) {
            console.error('Error updating cell reading time:', err);
            return false;
        }
    }
    // 移动细胞
    async moveCell(sourcePath, destPath) {

    }
}