// app.js
App({
    // 全局数据
    globalData: {
        userInfo: null,
        locationInfo: null,
        systemInfo: null,
        isLogin: false,
        apiBaseUrl: 'https://your-api-domain.com/api', // 替换为实际的后端API地址
        // 开发环境配置
        env: 'dev', // dev: 开发环境, prod: 生产环境
        debug: true
    },

    // 小程序初始化完成时触发
    onLaunch: function (options) {
        console.log('小程序初始化完成', options);

        // 获取系统信息
        this.getSystemInfo();

        // 检查登录状态
        this.checkLoginStatus();

        // 初始化云开发（如果使用云开发）
        // this.initCloud();

        // 检查更新
        this.checkUpdate();

        // 性能监控初始化
        this.initPerformance();
    },

    // 小程序显示时触发
    onShow: function (options) {
        console.log('小程序显示', options);

        // 处理场景值
        this.handleScene(options.scene);

        // 统计页面访问
        this.trackPageView();
    },

    // 小程序隐藏时触发
    onHide: function () {
        console.log('小程序隐藏');
    },

    // 小程序出错时触发
    onError: function (error) {
        console.error('小程序错误:', error);

        // 错误上报
        this.reportError(error);
    },

    // 页面不存在时触发
    onPageNotFound: function (res) {
        console.warn('页面不存在:', res);

        // 重定向到首页
        wx.redirectTo({
            url: '/pages/index/index'
        });
    },

    // 获取系统信息
    getSystemInfo: function () {
        try {
            const systemInfo = wx.getSystemInfoSync();
            this.globalData.systemInfo = systemInfo;
            console.log('系统信息:', systemInfo);

            // 设置全局样式适配（如iPhoneX底部安全区）
            this.setGlobalStyle(systemInfo);

            return systemInfo;
        } catch (error) {
            console.error('获取系统信息失败:', error);
            return null;
        }
    },

    // 设置全局样式
    setGlobalStyle: function (systemInfo) {
        // 适配iPhoneX等有安全区域的设备
        const { model, screenHeight, windowHeight } = systemInfo;
        const isIPhoneX = /iPhone X|iPhone11|iPhone12|iPhone13|iPhone14/i.test(model);
        const isIOS = systemInfo.platform === 'ios';

        if (isIOS && isIPhoneX) {
            this.globalData.isIPhoneX = true;
            this.globalData.safeAreaBottom = 34; // iPhoneX底部安全区域高度
        } else {
            this.globalData.isIPhoneX = false;
            this.globalData.safeAreaBottom = 0;
        }

        // 计算导航栏高度
        const { statusBarHeight } = systemInfo;
        let navBarHeight = 44; // 导航栏标准高度
        if (systemInfo.platform === 'android') {
            navBarHeight = 48;
        }
        this.globalData.navBarHeight = statusBarHeight + navBarHeight;
        this.globalData.statusBarHeight = statusBarHeight;
    },

    // 检查登录状态
    checkLoginStatus: function () {
        try {
            // 从本地存储获取用户信息
            const userInfo = wx.getStorageSync('userInfo');
            const token = wx.getStorageSync('token');

            if (userInfo && token) {
                this.globalData.userInfo = userInfo;
                this.globalData.isLogin = true;

                // 验证token是否有效
                this.verifyToken(token);

                console.log('用户已登录:', userInfo);
            } else {
                console.log('用户未登录');
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
        }
    },

    // 验证token有效性
    verifyToken: function (token) {
        // 这里应该调用后端接口验证token
        // 暂时模拟验证成功
        return true;
    },

    // 用户登录方法
    login: function (userData) {
        return new Promise((resolve, reject) => {
            // 模拟登录请求
            wx.request({
                url: `${this.globalData.apiBaseUrl}/user/login`,
                method: 'POST',
                data: userData,
                success: (res) => {
                    if (res.data.code === 0) {
                        // 登录成功
                        const { userInfo, token } = res.data.data;

                        // 保存到全局数据
                        this.globalData.userInfo = userInfo;
                        this.globalData.isLogin = true;

                        // 保存到本地存储
                        wx.setStorageSync('userInfo', userInfo);
                        wx.setStorageSync('token', token);

                        console.log('登录成功:', userInfo);

                        // 触发登录成功事件
                        this.emitLoginSuccess(userInfo);

                        resolve(userInfo);
                    } else {
                        reject(new Error(res.data.message || '登录失败'));
                    }
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    },

    // 用户登出方法
    logout: function () {
        return new Promise((resolve, reject) => {
            try {
                // 清除本地存储
                wx.removeStorageSync('userInfo');
                wx.removeStorageSync('isLogin');

                // 清除全局数据
                this.globalData.userInfo = null;
                this.globalData.isLogin = false;
                this.globalData.isReturningUser = false;

                // 触发登出事件
                this.emitLogout();

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },

    // 清除用户数据
    clearUserData: function () {
        // 清除全局数据
        this.globalData.userInfo = null;
        this.globalData.isLogin = false;

        // 清除本地存储
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('token');

        // 触发登出事件
        this.emitLogout();

        console.log('用户已登出');
    },

    // 获取随机昵称列表（从后端）
    getRandomNicknames: function () {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${this.globalData.apiBaseUrl}/user/random-nicknames`,
                method: 'GET',
                success: (res) => {
                    if (res.data.code === 0) {
                        resolve(res.data.data);
                    } else {
                        reject(new Error(res.data.message || '获取昵称失败'));
                    }
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    },

    // 检查小程序更新
    checkUpdate: function () {
        if (wx.canIUse('getUpdateManager')) {
            const updateManager = wx.getUpdateManager();

            updateManager.onCheckForUpdate(function (res) {
                console.log('检查更新结果:', res.hasUpdate);
            });

            updateManager.onUpdateReady(function () {
                wx.showModal({
                    title: '更新提示',
                    content: '新版本已经准备好，是否重启应用？',
                    success: function (res) {
                        if (res.confirm) {
                            updateManager.applyUpdate();
                        }
                    }
                });
            });

            updateManager.onUpdateFailed(function () {
                wx.showToast({
                    title: '更新失败',
                    icon: 'none'
                });
            });
        } else {
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法使用更新功能，请升级到最新微信版本后重试。',
                showCancel: false
            });
        }
    },

    // 初始化云开发（如果使用微信云开发）
    initCloud: function () {
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力');
            return;
        }

        wx.cloud.init({
            env: 'your-cloud-env-id', // 替换为你的云环境ID
            traceUser: true
        });

        console.log('云开发初始化完成');
    },

    // 处理场景值
    handleScene: function (scene) {
        console.log('场景值:', scene);

        // 根据不同的场景值进行不同的处理
        switch (scene) {
            case 1001: // 发现栏小程序主入口
                break;
            case 1011: // 扫描二维码
                break;
            case 1044: // 小程序 profile 页
                break;
            default:
                break;
        }
    },

    // 事件总线（简单的发布订阅模式）
    events: {},

    // 监听事件
    on: function (eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    },

    // 取消监听
    off: function (eventName, callback) {
        if (!this.events[eventName]) return;

        const index = this.events[eventName].indexOf(callback);
        if (index > -1) {
            this.events[eventName].splice(index, 1);
        }
    },

    // 触发事件
    emit: function (eventName, data) {
        if (!this.events[eventName]) return;

        this.events[eventName].forEach(callback => {
            callback(data);
        });
    },

    // 登录成功事件
    emitLoginSuccess: function (userInfo) {
        this.emit('loginSuccess', userInfo);
    },

    // 登出事件
    emitLogout: function () {
        this.emit('logout');
    },

    // 网络请求封装
    request: function (options) {
        const { url, method = 'GET', data = {}, header = {} } = options;

        // 添加token到请求头（如果已登录）
        const token = wx.getStorageSync('token');
        if (token) {
            header['Authorization'] = `Bearer ${token}`;
        }

        // 添加公共请求头
        header['Content-Type'] = 'application/json';
        header['X-Client-Type'] = 'mini-program';
        header['X-Client-Version'] = this.globalData.systemInfo ? this.globalData.systemInfo.version : 'unknown';

        return new Promise((resolve, reject) => {
            wx.request({
                url: `${this.globalData.apiBaseUrl}${url}`,
                method,
                data,
                header,
                success: (res) => {
                    // 统一处理响应
                    if (res.statusCode === 200) {
                        if (res.data.code === 0) {
                            resolve(res.data.data);
                        } else if (res.data.code === 401) {
                            // token失效，跳转到登录页
                            this.clearUserData();
                            wx.redirectTo({
                                url: '/pages/index/index'
                            });
                            reject(new Error('登录已过期，请重新登录'));
                        } else {
                            reject(new Error(res.data.message || '请求失败'));
                        }
                    } else {
                        reject(new Error(`网络错误: ${res.statusCode}`));
                    }
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    },

    // 错误上报
    reportError: function (error) {
        // 这里可以集成错误监控平台，如Sentry、Fundebug等
        console.error('错误上报:', error);

        // 简单的错误记录到本地
        try {
            const errorLogs = wx.getStorageSync('errorLogs') || [];
            errorLogs.push({
                time: new Date().toISOString(),
                error: error.message || error.toString(),
                stack: error.stack
            });

            // 只保留最近100条错误日志
            if (errorLogs.length > 100) {
                errorLogs.splice(0, errorLogs.length - 100);
            }

            wx.setStorageSync('errorLogs', errorLogs);
        } catch (e) {
            console.error('保存错误日志失败:', e);
        }
    },

    // 性能监控初始化
    initPerformance: function () {
        if (wx.getPerformance) {
            const performance = wx.getPerformance();
            const observer = performance.createObserver((entryList) => {
                console.log('性能数据:', entryList.getEntries());
            });
            observer.observe({ entryTypes: ['render', 'script', 'navigation'] });
        }
    },

    // 页面访问统计
    trackPageView: function () {
        // 这里可以集成统计平台，如腾讯移动分析、Google Analytics等
        console.log('页面访问统计');
    },

    // 显示加载提示
    showLoading: function (title = '加载中') {
        wx.showLoading({
            title: title,
            mask: true
        });
    },

    // 隐藏加载提示
    hideLoading: function () {
        wx.hideLoading();
    },

    // 显示提示消息
    showToast: function (title, icon = 'none', duration = 2000) {
        wx.showToast({
            title: title,
            icon: icon,
            duration: duration
        });
    },

    // 显示模态对话框
    showModal: function (title, content, showCancel = true) {
        return new Promise((resolve) => {
            wx.showModal({
                title: title,
                content: content,
                showCancel: showCancel,
                success: (res) => {
                    resolve(res.confirm);
                }
            });
        });
    },

    checkLocationPermission: function () {
        return new Promise((resolve, reject) => {
            wx.getSetting({
                success: (res) => {
                    if (res.authSetting['scope.userLocation'] === undefined) {
                        // 未询问过授权
                        resolve('neverAsked');
                    } else if (res.authSetting['scope.userLocation'] === false) {
                        // 已拒绝授权
                        resolve('denied');
                    } else if (res.authSetting['scope.userLocation'] === true) {
                        // 已授权
                        resolve('authorized');
                    }
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    },

    // 获取用户地理位置
    getUserLocation: function () {
        return new Promise((resolve, reject) => {
            wx.getLocation({
                type: 'wgs84',
                altitude: true,
                success: (res) => {
                    const locationInfo = {
                        latitude: res.latitude,
                        longitude: res.longitude,
                        speed: res.speed,
                        accuracy: res.accuracy,
                        altitude: res.altitude,
                        verticalAccuracy: res.verticalAccuracy,
                        horizontalAccuracy: res.horizontalAccuracy
                    };
                    resolve(locationInfo);
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    },

    // 打开位置设置页面
    openLocationSetting: function () {
        return new Promise((resolve, reject) => {
            wx.openSetting({
                success: (res) => {
                    if (res.authSetting['scope.userLocation']) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    },

    // 申请地理位置权限
    requestLocationPermission: function () {
        return new Promise((resolve, reject) => {
            wx.authorize({
                scope: 'scope.userLocation',
                success: () => {
                    resolve(true);
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    },

    // 检查用户登录状态
    checkUserLoginStatus: function () {
        return new Promise((resolve, reject) => {
            try {
                const userInfo = wx.getStorageSync('userInfo');
                const isLogin = wx.getStorageSync('isLogin');

                if (userInfo && isLogin) {
                    // 检查位置权限
                    wx.getSetting({
                        success: (res) => {
                            const locationAuthorized = res.authSetting['scope.userLocation'] === true;

                            if (locationAuthorized) {
                                // 用户已登录且位置已授权
                                this.globalData.userInfo = userInfo;
                                this.globalData.isLogin = true;
                                this.globalData.isReturningUser = true;
                                resolve({
                                    isLoggedIn: true,
                                    userInfo: userInfo,
                                    locationAuthorized: true
                                });
                            } else {
                                // 用户已登录但位置未授权
                                resolve({
                                    isLoggedIn: true,
                                    userInfo: userInfo,
                                    locationAuthorized: false
                                });
                            }
                        },
                        fail: (err) => {
                            reject(err);
                        }
                    });
                } else {
                    // 用户未登录
                    resolve({
                        isLoggedIn: false,
                        userInfo: null,
                        locationAuthorized: false
                    });
                }
            } catch (error) {
                reject(error);
            }
        });
    },
});