
// 将时间统一转化为时间戳形式返回
export function parseTimeToTimestamp(time) {
    if (!time) {
        return 0
    }
    // 判断是否为常规时间格式（如：2021-07-01 14:11:54）
    const isRegularFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time);

    if (isRegularFormat) {
        // 转化为时间戳
        const timestamp = new Date(time).getTime();
        return timestamp;
    } else {
        // 时间已经是时间戳，直接返回
        return time;
    }
}

// 将秒数转化为可读格式
export function secondsToReadable(seconds) {
    // 计算天数
    const days = Math.floor(seconds / (3600 * 24));
    // 计算小时数
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    // 计算分钟数
    const minutes = Math.floor((seconds % 3600) / 60);
    // 计算秒数
    const secs = seconds % 60;

    let result = '';
    if (days > 0) result += `${days}天 `;
    if (hours > 0) result += `${hours}小时 `;
    if (minutes > 0) result += `${minutes}分钟 `;
    if (secs > 0 || result === '') result += `${secs}秒`; // 如果没有天、小时、分钟，至少显示秒数

    return result.trim(); // 去除可能的首尾空格
}

export function timeAgo(time) {
    const timestamp = parseTimeToTimestamp(time);
    const currentTime = Date.now(); // 获取当前时间的时间戳
    const timeDiff = currentTime - timestamp; // 计算时间差
    const seconds = timeDiff / 1000; // 转换成秒
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const months = days / 30;
    const years = days / 365;

    let result = '';
    if (seconds < 60) {
        result = `${Math.floor(seconds)}秒前`;
    } else if (minutes < 60) {
        result = `${Math.floor(minutes)}分钟前`;
    } else if (hours < 24) {
        result = `${Math.floor(hours)}小时前`;
    } else if (days < 30) {
        result = `${Math.floor(days)}天前`;
    } else if (months < 12) {
        result = `${Math.floor(months)}月前`;
    } else {
        result = `${Math.floor(years)}年前`;
    }

    return result;
}

// 年月日数字转日期字符串
export function number2date(year, month, day) {
    if ((typeof year !== 'number' && !year) || (typeof month !== 'number' && !month) || (typeof day !== 'number' && !day)) return ''
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    return `${year}/${formattedMonth}/${formattedDay}`;
}
// 将日期转换为年月日数字
export function date2number(dateString) {
    let obj = {
        year: 0,
        month: 0,
        day: 0
    }
    const parts = dateString?.split("/");
    if (parts.length === 3) {
        obj.year = Number(parts[0]);
        obj.month = Number(parts[1]);
        obj.day = Number(parts[2]);
    }
    return obj;
}