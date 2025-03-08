// 一些关于数据的操作方法

// 将数组按照某字段进行重新分组
export function formattingData(arr, group_key) {
    let map = {}
    let res = []

    for (let i = 0; i < arr.length; i++) {
        let ai = arr[i]
        if (!map[ai[group_key]]) {
            map[ai[group_key]] = [ai]
        } else {
            map[ai[group_key]].push(ai)
        }
    }
    Object.keys(map).forEach(key => {
        res.push({
            [group_key]: key,
            list: map[key],
        })
    })
    return res
}

// 将一个数组替换到另一个数组的指定位置的前面或后面
export function replaceArray(arr1, arr2, index, direction) {
    if (direction !== 'before' && direction !== 'after') {
        console.error("Invalid direction. Must be 'before' or 'after'.");
        return arr2;
    }

    const n = arr2.length;
    const m = arr1.length;

    let start, end;

    if (direction === 'before') {
        start = index - m;
        end = index;
    } else if (direction === 'after') {
        start = index + 1;
        end = start + m;
    }

    if (start < 0) {
        const pad = -start;
        const insertArr = arr1.slice(pad);
        const prefix = arr1.slice(0, pad);
        const newArr2 = [...prefix, ...insertArr, ...arr2.slice(end)];
        return newArr2;
    }

    if (end > n) {
        const pad = end - n;
        const insertArr = arr1.slice(0, m - pad);
        const suffix = arr1.slice(m - pad);
        const newArr2 = [...arr2.slice(0, start), ...insertArr, ...suffix];
        return newArr2;
    }

    const newArr2 = [...arr2.slice(0, start), ...arr1, ...arr2.slice(end)];
    return newArr2;
}

// 检查一个对象的属性中是否只有json，如果包含非对象（不是object或array），则false
export function checkObjPropertiesIsOnlyJson(obj) {
    for (var key in obj) {
        if (typeof obj[key] !== 'object' && !Array.isArray(obj[key])) {
            return false;
        }
    }
    return true;
}

// 排序参数格式化
export function ordersFormat(orders) {
    const list = Array.isArray(orders) ? orders : [];
    let result = [];
    for (const each of list) {
        if (each?.column) {
            const obj = {
                column: each.column,
                order: each?.order === 'ASC' ? each.order : 'DESC'
            }
            result.push(obj)
        }
    }
    return result;
}

// 从数组中删除字符串
export function removeStringFromArray(array, stringToRemove) {
    const index = array.indexOf(stringToRemove);
    if (index !== -1) {
        array.splice(index, 1);
        console.log(`Removed: ${stringToRemove}`);
    } else {
        console.log(`String not found: ${stringToRemove}`);
    }
    return array;
}


// 深度更新，将obj2更新到obj1，obj1是原始对象，obj2是要修改的部分，有多少属性就改多少，不传的属性则不管，obj1没有的属性则新增
export function deepUpdateObject(obj1, obj2) {
    for (var key in obj2) {
        if (obj1?.hasOwnProperty(key)) {
            // 如果obj1中已有这个属性，则更新
            if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key])) {
                // 如果新属性是纯对象
                if (obj2[key]?.remove) {
                    // 如果有删除标记，则删除此属性
                    delete obj1[key];
                } else if (Array.isArray(obj1[key])) {
                    // 如果原属性是数组，则转为对象
                    obj1[key] = obj2[key]
                    deepUpdateObject(obj1[key], obj2[key]);
                } else {
                    // 否则，更新此属性
                    if (obj1[key] === null) {
                        // 如果是空，但是目标属性是对象，则初始化为空对象
                        obj1[key] = {}
                    }
                    deepUpdateObject(obj1[key], obj2[key]);
                }
            } else if (Array.isArray(obj2[key])) {
                // 如果新属性是数组
                if (!obj1[key] || !Array.isArray(obj1[key])) {
                    // 如果原属性没有这个属性，或者不是数组，则转为空数组
                    obj1[key] = [];
                }
                for (let i = 0; i < obj2[key].length; i++) {
                    const index = obj1[key].findIndex((item) => item.id === obj2[key][i]?.id);
                    if (index === -1 && !obj2[key][i]?.remove) {
                        // 如果没有，且没有删除标记，则push
                        obj1[key].push(obj2[key][i]);
                    } else if (obj2[key][i]?.remove) {
                        // 如果存在，但有删除标记，则删除
                        obj1[key].splice(index, 1);
                    } else {
                        // 否则，针对性更新
                        deepUpdateObject(obj1[key][index], obj2[key][i]);
                    }
                }
            } else {
                // 如果新属性不是对象，也不是数组，则根据目标类型而初始化
                obj1[key] = obj2[key];
            }
        } else {
            // 如果没有，则新增
            obj1[key] = obj2[key];
        }
    }
}

// 根据深度路径，来定向的获取对象的属性值
export function deepQueryObject(obj, path, options = {}) {
    const keys = path.split('.');
    let currentObj = obj;

    for (const key of keys) {
        const isArrayIndex = /^\d+$/.test(key);

        if (currentObj && typeof currentObj === 'object') {
            if (isArrayIndex) {
                const index = parseInt(key, 10);
                currentObj = currentObj[index];
            } else {
                currentObj = currentObj[key];
            }
        } else {
            return undefined; // 如果路径中的某个键找不到，返回 undefined
        }
    }

    if (options.page && Array.isArray(currentObj)) {
        let filteredData = [...currentObj];

        // 过滤
        if (options.filter) {
            const filterKey = Object.keys(options.filter)[0];
            const filterValue = options.filter[filterKey];

            filteredData = filteredData.filter(item => item[filterKey] === filterValue);
        }

        let sortedData = [...filteredData];

        // 排序
        if (options.sortField && options.sortOrder) {
            sortedData = sortedData.sort((a, b) => {
                const fieldA = a[options.sortField];
                const fieldB = b[options.sortField];

                if (fieldA === undefined || fieldB === undefined) {
                    return 0; // 如果指定的字段不存在，则不进行排序
                }

                if (options.sortOrder.toLowerCase() === 'asc') {
                    return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
                } else {
                    return fieldB < fieldA ? -1 : fieldB > fieldA ? 1 : 0;
                }
            });
        }

        const pageSize = options.pageSize || 10;
        const total = sortedData.length;

        // 计算 pageIndex
        const pageIndex = Math.max(1, Math.min(Math.ceil(total / pageSize), options.pageIndex || 1));

        const startIndex = (pageIndex - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const slicedData = sortedData.slice(startIndex, endIndex);

        return {
            total,
            data: slicedData,
            pageIndex
        };
    }

    return currentObj;
}

// 从localstorage中获取数组
export function getLocalStorageArray(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
}

// 添加到localstorage数组并重排
export function reorderLocalStorageArray(key, value) {
    let list = getLocalStorageArray(key);
    const index = list.indexOf(value);
    if (index > -1) {
        list.splice(index, 1);
    }
    list.unshift(value);
    localStorage.setItem(key, JSON.stringify(list));
}

// 从localstorage数组中移除
export function removeFromLocalStorageArray(key, value) {
    let list = getLocalStorageArray(key);
    const index = list.indexOf(value);
    if (index > -1) {
        list.splice(index, 1);
    }
    localStorage.setItem(key, JSON.stringify(list));
}

// 将富文本转化为纯文本
export function html2text(html) {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(html, 'text/html');
    const plainText = doc.body.textContent || '';

    // 去除多余空格和换行符
    return plainText.replace(/\s+/g, ' ').trim();
}