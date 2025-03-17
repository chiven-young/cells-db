
/**
 * 根细胞类格式化
 * 描述：使用兼容性更新，修复错误和补齐缺失字段，原先有的多余属性不会被删除
 */

// 用户数据格式化
export const userDataFormat = (user) => {
    let data = Object.assign({}, user || {});
    // 基础数据
    data.uid = user?.uid || null;
    data.name = user?.name || '';
    data.realName = user?.realName || '';
    data.role = user?.role || '';
    data.gender = typeof user?.gender === 'number' ? user.gender : null;
    data.avatar = user?.avatar || '';
    data.introduce = user?.introduce || ''; // 简介
    data.birthday = user?.birthday || null;
    data.ip = user?.ip || '';

    // 登录凭证
    data.email = user?.email || '';
    data.phone = user?.phone || '';
    data.wechat = user?.wechat || '';
    data.qq = user?.qq || '';

    // 功能数据
    data.data = (typeof user?.data === "object" && user?.data !== null) ? user.data : {};
    data.data.address = user?.data?.address || ''; // 地址
    data.data.vocation = user?.data?.vocation || ''; // 职业
    data.data.signature = user?.data?.signature || ''; // 签名
    data.data.backgroundImage = user?.data?.backgroundImage || ''; // 背景图片

    // 资产，重要数据，需要特定接口更新
    data.property = (typeof user?.property === "object" && user?.property !== null) ? user.property : {};
    data.property.coin = typeof user?.property?.coin === 'number' ? user.property.coin : 0; // 星币，最基础的货币
    data.property.level = typeof user?.property?.level === 'number' ? user.property.level : 0; // 等级
    data.property.badges = user?.property?.badges ? (Array.isArray(user.property.badges) ? user.property.badges : []) : []; // 徽章的id数组
    data.property.meritPoints = typeof user?.property?.meritPoints === 'number' ? user.property.meritPoints : 0; // 功德点
    data.property.stamps = user?.property?.stamps ? (Array.isArray(user.property.stamps) ? user.property.stamps : []) : []; // 印章、邮票的id数组

    // 时间记录
    data.registerTime = user?.registerTime || 0;
    data.lastActiveTime = user?.lastActiveTime || 0;

    // 用户偏好设置
    let preferences = [];
    const preferenceList = (user?.preference && Array.isArray(user.preference)) ? user.preference : [];
    for (const each of preferenceList) {
        let app = each || {};
        app.id = each?.id || '';
        app.nickname = each?.nickname || '';
        app.avatar = each?.avatar || '';
        app.introduce = each?.introduce || '';
        app.signature = each?.signature || '';
        app.theme = each?.theme || '';
        app.language = each?.language || '';
        let navMap = [];
        const navMapList = (each?.navMap && Array.isArray(each.navMap)) ? each.navMap : [];
        for (const eachNav of navMapList) {
            let item = navFormat(eachNav);
            navMap.push(item);
        }
        app.navMap = navMap;
        preferences.push(app);
    }
    data.preference = preferences;
    return data
}

// 全属性细胞数据格式化，所有支持的属性都有
export const cellDataFormat = (cell, options = {}) => {
    let data = {};
    if (options.standard) {
        data = {};
    } else {
        data = Object.assign({}, cell || {});
    }
    // 基础属性
    data.cid = cell?.cid || '';
    data.name = cell?.name || ''; // 细胞名，主体名
    data.partition = cell?.partition || ''; // 分区
    data.typeGroup = cell?.typeGroup || 'CONTENT'; // 类型组
    data.type = cell?.type || 'document'; // 细胞类型（模块）
    data.description = cell?.description || ''; // 简略描述
    data.icon = cell?.icon ? decodeURI(String(cell.icon)) : ''; // 图标
    let covers = []; // 封面图组（如果使用单图封面，则取第一个），部分形态下会作为封面、背景图、题图
    const coverList = cell?.cover ? (Array.isArray(cell.cover) ? cell.cover : []) : [];
    for (const each of coverList) {
        let item = each && typeof each === 'object' ? each : {};
        item.image = item?.image || '';
        item.thumbnail = item?.thumbnail || '';
        item.text = item?.text || '';
        item.html = item?.html || '';
        covers.push(item);
    }
    data.cover = covers;
    data.status = typeof cell?.status === 'number' ? cell.status : 2; // 细胞状态
    data.heat = typeof cell?.heat === 'number' ? cell.heat : 0; // 热度
    data.isStar = cell?.isStar || false; // 是否被当前用户收藏
    data.isLike = cell?.isLike || false; // 是否被当前用户点赞
    data.isRoot = cell?.isRoot === 0 ? 0 : 1; // 是否为顶级细胞
    data.encrypted = cell?.encrypted || 0; // 是否加密
    data.createTime = cell?.createTime || Date.parse(new Date()); // 创建时间
    data.updateTime = cell?.updateTime || Date.parse(new Date()); // 更新时间
    data.publishTime = cell?.publishTime || null; // 发布时间
    data.data = (cell?.data && typeof cell?.data === "object") ? cell.data : {}; // 细胞功能数据
    data.data.format = cell?.data?.format || 'markdown'; // 具体取用哪种格式，和细胞主体的type配合使用，算是type的下级分类，用于明确取用哪个字段的数据
    data.data.text = cell?.data?.text || '';
    data.data.image = cell?.data?.image || '';
    data.data.video = cell?.data?.video || '';
    data.data.audio = cell?.data?.audio || '';
    data.data.json = cell?.data?.json || null;
    data.data.blocks = cell?.data?.blocks || [];

    // 配置项
    data.config = (typeof cell?.config === "object" && cell?.config !== null) ? cell.config : {};
    data.config.shareStatus = cell?.config?.shareStatus === 0 ? 0 : 1; // 是否允许分享
    data.config.likeStatus = cell?.config?.likeStatus === 0 ? 0 : 1; // 是否允许点赞
    data.config.commentStatus = cell?.config?.commentStatus === 0 ? 0 : 1; // 是否允许评论
    data.config.commentByVisitorStatus = cell?.config?.commentByVisitorStatus === 0 ? 0 : 1; // 是否允许未登录游客评论
    data.config.bulletStatus = cell?.config?.bulletStatus === 0 ? 0 : 1; // 是否允许弹幕
    data.config.price = cell?.config?.price || 0; // 价格

    data.statistics = (typeof cell?.statistics === "object" && cell?.statistics !== null) ? cell.statistics : {};
    data.statistics.viewCount = cell?.statistics?.viewCount || 0; // 阅读数
    data.statistics.lastViewTime = cell?.statistics?.lastViewTime; // 最后访问的时间
    data.statistics.viewTime = cell?.statistics?.viewTime || 0; // 阅读时长(s)
    data.statistics.likeCount = cell?.statistics?.likeCount || 0; // 点赞数
    data.statistics.starCount = cell?.statistics?.starCount || 0; // 收藏数
    data.statistics.shareCount = cell?.statistics?.shareCount || 0; // 分享数
    data.statistics.commentCount = cell?.statistics?.commentCount || 0; // 评论数
    data.statistics.bulletCount = cell?.statistics?.bulletCount || 0; // 弹幕数
    data.statistics.downloadCount = cell?.statistics?.downloadCount || 0; // 下载数
    data.statistics.ratings = Array.isArray(cell?.statistics?.ratings) ? cell?.statistics?.ratings : []; // 评分数组

    // 细胞全部样式配置项
    data.style = (typeof cell?.style === "object" && cell?.style !== null) ? cell.style : {}; // 细胞样式对象
    data.style.theme = cell?.style?.theme || 'default'; // 主题
    data.style.color = cell?.style?.color || ''; // 主题颜色
    data.style.background = cell?.style?.background && typeof cell.style?.background === 'object' ? cell.style?.background : {}; // 背景
    data.style.background.show = cell?.style?.background?.show ? cell.style.background.show : 'none'; // 是否显示背景，以及背景的类型
    data.style.background.image = cell?.style?.background?.image || ''; // 背景图片
    data.style.background.color = cell?.style?.background?.color || ''; // 背景颜色
    data.style.background.blur = cell?.style?.background?.blur || ''; // 背景模糊
    data.style.background.opacity = cell?.style?.background?.opacity || ''; // 背景透明度
    data.style.background.repeat = cell?.style?.background?.repeat || ''; // 背景重复方式
    data.style.font = cell?.style?.font && typeof cell.style?.font === 'object' ? cell.style?.font : {}; // 字体
    data.style.font.fontFamily = cell?.style?.font?.fontFamily || ''; // 字体系列
    data.style.font.fontSize = cell?.style?.font?.fontSize || ''; // 字体大小
    data.style.font.fontWeight = cell?.style?.font?.fontWeight || ''; // 字体粗细
    data.style.font.color = cell?.style?.font?.color || ''; // 字体颜色
    data.style.title = cell?.style?.title && typeof cell.style?.title === 'object' ? cell.style?.title : {}; // 标题
    data.style.title.show = cell?.style?.title?.show === false ? false : true; // 是否显示标题
    data.style.cover = cell?.style?.cover && typeof cell?.style?.cover === 'object' ? cell?.style?.cover : {}; // 封面
    data.style.cover.show = cell?.style?.cover?.show === false ? false : true; // 是否显示封面（控制详情页里的封面是否显示，外部的封面会一直显示）
    data.style.cover.type = cell?.style?.cover?.type || 'single'; // 封面类型
    data.style.cover.theme = cell?.style?.cover?.theme || ''; // 封面主题
    data.style.cover.size = cell?.style?.cover?.size || ''; // 封面大小
    data.style.desc = cell?.style?.desc && typeof cell.style.desc === 'object' ? cell.style.desc : {}; // 描述
    data.style.desc.show = cell?.style?.desc?.show === false ? false : true; // 是否显示描述
    data.style.icon = cell?.style?.icon && typeof cell.style.icon === 'object' ? cell.style.icon : {}; // 图标
    data.style.icon.show = cell?.style?.icon?.show === false ? false : true; // 是否显示图标

    // 根据类型格式化
    if (cell?.type === 'book') {
        data.style.cover.theme = cell?.style?.cover?.theme || 'book';
    } else {
        data.style.cover.show = cell?.style?.cover?.show === false ? false : true;
        data.style.cover.theme = cell?.style?.cover?.theme || 'listitem';
    }

    // 作者信息
    // data.user = userDataFormat(cell?.user);

    data.children = cell?.children ? (Array.isArray(cell.children) ? cell.children : []) : []; // 子级内容，在离散模式下这里默认为空，在构建项目时往里面填充子级细胞；在单细胞模式下，子级内容直接写在这里

    return data
}

// 功能细胞格式化

// 导航项目
const navFormat = (item) => {
    let data = item || {};
    data.show = item.show ? true : false;
    data.id = item.id || '';
    data.name = item.name || '';
    data.desc = item.desc || '';
    data.icon = item.icon || '';
    data.activeIcon = item.activeIcon || '';
    data.anicon = item.anicon || '';
    data.image = item.image || '';
    data.path = item.path || '';
    data.url = item.url || '';
    data.target = item.target || '';
    data.color = item.color || '';
    data.bgColor = item.bgColor || '';
    return data;
}

// 消息细胞数据格式化（功能细胞）
export const messageFormat = (cell) => {
    let data = Object.assign({}, cell || {});
    data.msid = cell?.msid || null
    data.uid = cell?.uid || null;
    data.from = (typeof cell?.from === "object" && cell?.from !== null) ? cell.from : {};
    data.from.uid = cell?.from?.uid || cell?.uid || null;
    data.touid = cell?.touid || null;
    data.to = (typeof cell?.to === "object" && cell?.to !== null) ? cell.to : {};
    data.to.uid = cell?.to?.uid || cell?.touid || null;

    data.name = cell?.name || '';
    data.description = cell?.description || '';
    data.icon = cell?.icon || '';
    let covers = [];
    const coverList = cell?.cover ? (Array.isArray(cell.cover) ? cell.cover : []) : [];
    for (const each of coverList) {
        let item = {
            image: each?.image || '',
            thumbnail: each?.thumbnail || '',
        }
        covers.push(item);
    }
    data.cover = covers;
    data.type = 'message';
    data.status = typeof (cell?.status) === 'number' ? cell.status : 2;
    data.isStar = cell?.isStar || false;
    data.createTime = cell?.createTime || Date.parse(new Date()); // 创建时间
    data.updateTime = cell?.updateTime || Date.parse(new Date()); // 更新时间
    data.publishTime = cell?.publishTime || null; // 发布时间
    data.data = (typeof cell?.data === "object" && cell?.data !== null) ? cell.data : {};
    data.data.text = cell?.data?.text || '';
    data.config = (typeof cell?.config === "object" && cell?.config !== null) ? cell.config : {};
    data.config.stamp = cell?.config?.stamp || {};
    data.style = (typeof cell?.style === "object" && cell?.style !== null) ? cell.style : {};
    data.style.backgroundColor = cell?.style?.backgroundColor || '';
    data.style.fontFamily = cell?.style?.fontFamily || '';
    data.style.backgroundImage = cell?.style?.backgroundImage || '';
    return data;
}

// 页面数据格式化
export const pageFormat = (data) => {
    data.with = data?.with || 'auto'; // 页面宽度：auto自适应页面容器宽度，full占满页面宽度，如果是数字则是指定像素，也可以是百分比
    data.banner = (typeof data?.banner === 'object' && data.banner !== null) ? data.banner : {};
    data.banner.show = data.banner?.show || false;
    data.banner.autoplay = data.banner?.autoplay || false; // 自动播放
    data.banner.direction = data.banner?.direction || 'horizontal'; // 方向:horizontal,vertical
    data.banner.loop = data.banner?.loop || false; // 是否循环播放
    data.banner.ratio = data.banner.ratio || 2.35;
    data.banner.list = data.banner?.list ? (Array.isArray(data.banner.list) ? data.banner.list : []) : [];
    data.banner.list.forEach((item) => {
        item.image = item.image || '';
        item.url = item.url || '';
        item.name = item.name || '';
        item.desc = item.desc || '';
        item.type = item.type || '';
        item.path = item.path || '';
        item.target = item.target || '_blank';
        item.color = item.color || 'unset';
        item.bgColor = item.bgColor || 'unset';
    })
    return data
}

// 通用数据格式化
export const commonDataFormat = (cd) => {
    let data = Object.assign({}, cd || {});
    // 基础属性
    data.id = (cd?.id || cd?.id === 0) ? cd.id : null;
    data.name = cd?.name || 'Untitled'; // 数据名
    data.description = cd?.description || ''; // 简略描述
    if (typeof cd?.data === "object" && cd?.data !== null) {
        data.data = cd.data;
    } else if (typeof cd?.data === "string") {
        try {
            data.data = JSON.parse(cd.data);
        } catch (e) { }
    } else {
        data.data = {};
    }
    data.encrypted = cd?.encrypted || 0; // 是否加密
    data.createTime = cd?.createTime || Date.parse(new Date()); // 创建时间
    data.updateTime = cd?.updateTime || Date.parse(new Date()); // 更新时间
    // 配置项
    data.config = (typeof cd?.config === "object" && cd?.config !== null) ? cd.config : {};
    data.statistics = (typeof cd?.statistics === "object" && cd?.statistics !== null) ? cd.statistics : {};
    // 作者信息
    data.user = userDataFormat(cd?.user);
    return data
}
