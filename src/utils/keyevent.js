// 批量注册和注销键盘事件
export function useShortcuts({
    defaultShortcutTable = [],
    userShortcutTable = [],
    shortcutHandlers = {},
}) {
    const shortcuts = new Map();
    let currentShortcutTable = []; // 当前解析后的快捷键表

    const handleKeydown = (event) => {
        shortcuts.forEach((callback, keys) => {
            const keyCombination = keys.split('+');
            const isMatch = keyCombination.every((key) => {
                if (key === 'Ctrl') return event.ctrlKey;
                if (key === 'Alt') return event.altKey;
                if (key === 'Shift') return event.shiftKey;
                if (key === 'Meta') return event.metaKey;
                return event.key.toLowerCase() === key.toLowerCase();
            });
            if (isMatch) {
                event.preventDefault();
                callback();
            }
        });
    };

    const resolveShortcutTable = () => {
        // 根据用户自定义快捷键表覆盖默认快捷键表
        const resolvedTable = defaultShortcutTable.map((defaultShortcut) => {
            const userShortcut = userShortcutTable.find(
                (customShortcut) => customShortcut.name === defaultShortcut.name
            );
            return userShortcut || defaultShortcut;
        });
        return resolvedTable;
    };

    const registerShortcuts = () => {
        clearShortcuts(); // 清除现有快捷键

        // 解析快捷键表
        currentShortcutTable = resolveShortcutTable();

        // 注册快捷键
        currentShortcutTable.forEach(({ name, keys }) => {
            if (shortcutHandlers[name]) {
                shortcuts.set(keys, shortcutHandlers[name]);
            }
        });

        // 添加事件监听
        if (shortcuts.size > 0) {
            window.addEventListener('keydown', handleKeydown);
        }
    };

    const updateShortcuts = (newUserShortcutTable) => {
        userShortcutTable = newUserShortcutTable; // 更新用户自定义表
        registerShortcuts(); // 重新注册快捷键
    };

    const clearShortcuts = () => {
        shortcuts.clear();
        window.removeEventListener('keydown', handleKeydown);
    };

    return {
        registerShortcuts,  // 注册快捷键
        updateShortcuts,    // 动态更新快捷键
        clearShortcuts,     // 清理快捷键
        getCurrentShortcuts: () => currentShortcutTable, // 获取当前快捷键表
    };
}

// 监听是否有操作，如果有操作则重置定时器
export function useAutoAction(initialTimeout = 60000, onAction) {
    let timer;
    let inactivityTimeout = initialTimeout; // 当前的延时时间

    // 重置计时器
    const resetTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            onAction(); // 调用锁屏函数
        }, inactivityTimeout);
    };

    // 更新延时时间
    const updateTimeout = (newTimeout) => {
        inactivityTimeout = newTimeout;
        resetTimer(); // 立即应用新的延时
    };

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'mousedown', 'scroll'];

    // 绑定所有活动监听
    activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimer);
    });

    // 初始化计时器
    resetTimer();

    // 清理监听的函数
    const cleanup = () => {
        activityEvents.forEach((event) => {
            window.removeEventListener(event, resetTimer);
        });
        clearTimeout(timer);
    };

    return { updateTimeout, cleanup };
}