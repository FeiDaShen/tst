function formatLastLoginTime(timestamp) {
    if (!timestamp) return '未知时间';

    const now = new Date();
    const lastLogin = new Date(timestamp);
    const diff = now - lastLogin;

    // 1分钟内
    if (diff < 60 * 1000) {
        return '刚刚';
    }

    // 1小时内
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}分钟前`;
    }

    // 1天内
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}小时前`;
    }

    // 1周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days}天前`;
    }

    // 显示具体日期
    const month = lastLogin.getMonth() + 1;
    const day = lastLogin.getDate();
    const hour = lastLogin.getHours().toString().padStart(2, '0');
    const minute = lastLogin.getMinutes().toString().padStart(2, '0');

    return `${month}月${day}日 ${hour}:${minute}`;
}

Page({
    data: {
        appName: "小程序",
        // 示例用户（当未从缓存读取到性别 / 昵称时使用）
        demoUser: {
            nickname: '小明',
            gender: 'male'
        },
        // 头像尺寸（像素），页面可自行设置
        avatarSize: 52,
        // 设置进度
        setupProgress: {
            location: false,   // 位置授权
            nickname: false,   // 昵称设置
            agreement: false   // 隐私协议
        },
        // 当前步骤
        currentStep: 1,
        // 弹窗显示状态
        showSetupModal: false,  // 默认不显示，检查缓存后决定
        showAgreementModal: false,
        // 用户数据
        nickname: '',
        randomNicknames: [],
        // 协议相关
        agreementChecked: false,
        modalTitle: '',
        modalContent: '',
        // 提交状态
        canSubmit: false,
        // 是否是老用户
        isReturningUser: false,
        // 从缓存中获取的用户信息
        cachedUserInfo: null
    },

    onLoad: function () {
        // 检查本地存储的用户数据
        this.checkLocalUserData();

        console.log("老用户, 设置界面{}", this.data.isReturningUser)
        // 根据检查结果决定是否显示设置弹窗
        if (!this.data.isReturningUser) {
            // 新用户：页面加载后显示设置向导弹窗
            setTimeout(() => {
                this.setData({
                    showSetupModal: true
                });
            }, 500);

            // 检查地理位置授权状态
            this.checkLocationAuthStatus();
        } else {
            // 老用户：已经完成设置，不需要显示弹窗
            // 自动勾选隐私协议
            this.setData({
                'setupProgress.agreement': true,
                agreementChecked: true,
                showSetupModal: false,
            });
            
            this.checkAllProgress();
        }

        // 从后端获取随机昵称列表
        this.getRandomNicknamesFromServer();
    },
    formatLastLoginTime: formatLastLoginTime,
    // 检查地理位置授权状态
    checkLocationAuthStatus: function () {
        if (this.data.isReturningUser) {
            // 老用户已经检查过了，跳过
            return;
        }

        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userLocation']) {
                    this.setData({
                        'setupProgress.location': true
                    });
                    this.checkAllProgress();
                } else {
                    this.setData({
                        'setupProgress.location': false
                    });
                }
            },
            fail: (err) => {
                console.log('检查授权状态失败:', err);
                this.setData({
                    'setupProgress.location': false
                });
            }
        });
    },

    // 检查本地用户数据 - 增强版
    checkLocalUserData: function () {
        try {
            const userInfo = wx.getStorageSync('userInfo');
            const isLogin = wx.getStorageSync('isLogin');

            if (userInfo && isLogin) {
                console.log('发现缓存用户数据:', userInfo);

                // 发现缓存，自动勾选隐私协议并允许开始使用
                this.setData({
                    'setupProgress.agreement': true,
                    agreementChecked: true,
                    canSubmit: true,
                    isReturningUser: true
                });
                
                // 检查位置权限是否已授权
                wx.getSetting({
                    success: (res) => {
                        const locationAuthorized = res.authSetting['scope.userLocation'] === true;

                        if (locationAuthorized) {
                            // 位置已授权，是老用户
                            this.setData({
                                isReturningUser: true,
                                cachedUserInfo: userInfo,
                                nickname: userInfo.nickname || '',
                                'setupProgress.location': true,
                                'setupProgress.nickname': true,
                                canSubmit:true
                            });

                            console.log('识别为老用户，位置权限已授权');
                        } else {
                            // 位置未授权，需要重新授权
                            this.setData({
                                cachedUserInfo: userInfo,
                                nickname: userInfo.nickname || '',
                                'setupProgress.nickname': true,
                                'setupProgress.location': false,
                                isReturningUser: false
                            });

                            console.log('用户缓存存在但位置权限未授权，需要重新授权');
                        }
                    },
                    fail: (err) => {
                        console.log('检查位置权限失败:', err);
                        this.setData({
                            isReturningUser: false
                        });
                    }
                });
            } else {
                console.log('未发现缓存用户数据，视为新用户');
                this.setData({
                    isReturningUser: false
                });
            }
        } catch (error) {
            console.log('检查本地数据失败:', error);
            this.setData({
                isReturningUser: false
            });
        }
    },

    // 从后端获取随机昵称列表
    getRandomNicknamesFromServer: function () {
        // 这里应替换为实际的后端接口调用
        // 使用app.js中封装的方法
        const app = getApp();
        if (app && app.getRandomNicknames) {
            app.getRandomNicknames().then(nicknames => {
                this.setData({
                    randomNicknames: nicknames || []
                });
            }).catch(error => {
                console.log('获取随机昵称失败:', error);
                // 使用模拟数据
                this.setMockNicknames();
            });
        } else {
            // 使用模拟数据
            this.setMockNicknames();
        }
    },

    // 设置模拟昵称数据
    setMockNicknames: function () {
        const mockNicknames = [
            '阳光旅者', '星空探索者', '智慧小猫', '快乐小飞侠',
            '追风少年', '月下独酌', '晨曦之光', '悠然自得',
            '旅行家', '梦想家', '探险家', '观察者'
        ];
        this.setData({
            randomNicknames: mockNicknames
        });
    },

    // 处理地理位置授权
    handleLocationAuth: function () {
        wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
                this.setData({
                    'setupProgress.location': true
                });
                this.checkAllProgress();

                // 如果是老用户，直接获取位置信息
                if (this.data.isReturningUser) {
                    this.getUserLocation();
                }

                wx.showToast({
                    title: '授权成功',
                    icon: 'success',
                    duration: 1500
                });
            },
            fail: (err) => {
                console.log('授权失败:', err);
                if (err.errMsg.includes('auth deny')) {
                    wx.showModal({
                        title: '提示',
                        content: '您拒绝了位置授权，将无法使用基于位置的功能',
                        showCancel: false
                    });
                }
            }
        });
    },


    // 获取用户地理位置
    getUserLocation: function () {
        wx.getLocation({
            type: 'wgs84',
            success: (locationRes) => {
                console.log('获取位置成功:', locationRes);

                // 更新缓存中的位置信息
                const userInfo = this.data.cachedUserInfo || {};
                userInfo.latitude = locationRes.latitude;
                userInfo.longitude = locationRes.longitude;
                userInfo.locationUpdated = Date.now();

                try {
                    wx.setStorageSync('userInfo', userInfo);
                    console.log('位置信息更新成功');
                } catch (error) {
                    console.log('更新位置信息失败:', error);
                }
            },
            fail: (err) => {
                console.log('获取位置失败:', err);
            }
        });
    },

    // 逆地理编码（可选）
    reverseGeocode: function (locationInfo) {
        // 使用腾讯地图或高德地图的逆地理编码API
        // 这里需要你申请相应的地图服务API key
        /*
        wx.request({
          url: 'https://apis.map.qq.com/ws/geocoder/v1/',
          data: {
            location: `${locationInfo.latitude},${locationInfo.longitude}`,
            key: '你的API_KEY',
            get_poi: 0
          },
          success: (res) => {
            if (res.data.status === 0) {
              const address = res.data.result.address_component;
              console.log('逆地理编码成功:', address);
              
              // 保存地址信息
              const app = getApp();
              app.globalData.addressInfo = address;
            }
          },
          fail: (err) => {
            console.log('逆地理编码失败:', err);
          }
        });
        */
    },


    // 打开位置设置
    openLocationSetting: function () {
        const app = getApp();

        app.openLocationSetting().then((granted) => {
            if (granted) {
                this.setData({
                    'setupProgress.location': true
                });
                this.checkAllProgress();

                wx.showToast({
                    title: '授权成功',
                    icon: 'success',
                    duration: 1500
                });

                // 重新获取位置
                this.getUserLocation();
            } else {
                wx.showToast({
                    title: '您仍然拒绝了位置权限',
                    icon: 'none'
                });
            }
        }).catch((err) => {
            console.log('打开设置失败:', err);
        });
    },

    // 处理昵称输入
    handleNicknameInput: function (e) {
        const nickname = e.detail.value.trim();
        this.setData({
            nickname: nickname,
            'setupProgress.nickname': nickname.length > 0
        });
        this.checkAllProgress();
    },

    // 获取随机昵称
    getRandomNickname: function () {
        if (this.data.randomNicknames.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.data.randomNicknames.length);
        const randomName = this.data.randomNicknames[randomIndex];

        this.setData({
            nickname: randomName,
            'setupProgress.nickname': true
        });
        this.checkAllProgress();
    },

    // 选择随机昵称
    selectRandomNickname: function (e) {
        const nickname = e.currentTarget.dataset.nickname;
        this.setData({
            nickname: nickname,
            'setupProgress.nickname': true
        });
        this.checkAllProgress();
    },

    // 检查所有进度
    checkAllProgress: function () {
        const { setupProgress } = this.data;
        const canSubmit = setupProgress.location && setupProgress.nickname && setupProgress.agreement;

        this.setData({
            canSubmit: canSubmit
        });
    },

    // 处理用户协议勾选
    handleAgreementChange: function (e) {
        const checked = e.detail.value.includes('agree');
        this.setData({
            agreementChecked: checked,
            'setupProgress.agreement': checked
        });
        this.checkAllProgress();
    },

    // 滑动切换事件
    onSwiperChange: function (e) {
        const current = e.detail.current + 1;
        this.setData({
            currentStep: current
        });
    },

    // 上一步
    prevStep: function () {
        if (this.data.currentStep > 1) {
            this.setData({
                currentStep: this.data.currentStep - 1
            });
        }
    },

    // 下一步
    nextStep: function () {
        // 第一步需要完成位置授权才能进入下一步
        if (this.data.currentStep === 1 && !this.data.setupProgress.location) {
            wx.showToast({
                title: '请先授权地理位置',
                icon: 'none'
            });
            return;
        }

        if (this.data.currentStep < 2) {
            this.setData({
                currentStep: this.data.currentStep + 1
            });
        }
    },

    // 完成设置
    completeSetup: function () {
        // 第二步需要设置昵称才能完成
        if (!this.data.setupProgress.nickname) {
            wx.showToast({
                title: '请设置昵称',
                icon: 'none'
            });
            return;
        }

        this.setData({
            showSetupModal: false
        });

        wx.showToast({
            title: '设置完成',
            icon: 'success',
            duration: 1500
        });
    },

    // 关闭设置弹窗（只有在完成位置和昵称设置后才能关闭）
    closeSetupModal: function () {
        const { setupProgress } = this.data;

        if (setupProgress.location && setupProgress.nickname) {
            this.setData({
                showSetupModal: false
            });
        } else {
            wx.showToast({
                title: '请先完成所有设置',
                icon: 'none'
            });
        }
    },

    // 提交登录信息 - 优化版
    handleSubmit: function () {
        if (!this.data.canSubmit) {
            wx.showToast({
                title: '请先完成所有设置',
                icon: 'none'
            });
            return;
        }

        const { nickname, setupProgress, isReturningUser, cachedUserInfo } = this.data;

        // 如果是老用户，直接跳转
        if (isReturningUser) {
            console.log('老用户直接跳转');
            this.jumpToHomePage();
            return;
        }

        // 新用户验证设置是否完成
        if (!setupProgress.location) {
            this.setData({
                showSetupModal: true,
                currentStep: 1
            });
            wx.showToast({
                title: '请先授权地理位置',
                icon: 'none'
            });
            return;
        }

        if (!setupProgress.nickname) {
            this.setData({
                showSetupModal: true,
                currentStep: 2
            });
            wx.showToast({
                title: '请设置昵称',
                icon: 'none'
            });
            return;
        }

        if (!setupProgress.agreement) {
            wx.showToast({
                title: '请同意隐私协议',
                icon: 'none'
            });
            return;
        }

        // 获取地理位置信息
        wx.getLocation({
            type: 'wgs84',
            success: (locationRes) => {
                // 创建或更新用户信息对象
                const userInfo = {
                    nickname: nickname.trim(),
                    latitude: locationRes.latitude,
                    longitude: locationRes.longitude,
                    timestamp: Date.now(),
                    isFirstLogin: !isReturningUser
                };

                console.log('用户信息:', userInfo);

                // 显示加载提示
                wx.showLoading({
                    title: '登录中...',
                    mask: true
                });

                // 模拟网络请求
                setTimeout(() => {
                    wx.hideLoading();

                    try {
                        // 保存用户信息到本地存储
                        wx.setStorageSync('userInfo', userInfo);
                        wx.setStorageSync('isLogin', true);

                        // 更新全局数据
                        const app = getApp();
                        if (app && app.globalData) {
                            app.globalData.userInfo = userInfo;
                            app.globalData.isLogin = true;
                        }

                        console.log('用户信息保存成功');
                    } catch (error) {
                        console.log('保存用户信息失败:', error);
                    }

                    // 显示登录成功提示
                    wx.showToast({
                        title: '登录成功',
                        icon: 'success',
                        duration: 1500
                    });

                    // 跳转到首页
                    setTimeout(() => {
                        this.jumpToHomePage();
                    }, 1600);

                }, 1500);
            },
            fail: (err) => {
                console.log('获取位置失败:', err);
                wx.showToast({
                    title: '获取位置失败，请重试',
                    icon: 'none'
                });
            }
        });
    },

    // 跳转到首页
    jumpToHomePage: function () {
        console.log('跳转到home页面');

        wx.switchTab({
            url: '/pages/home/home',
            success: (res) => {
                console.log('跳转成功:', res);
            },
            fail: (err) => {
                console.log('跳转失败:', err);
                // 如果switchTab失败，尝试使用reLaunch
                wx.reLaunch({
                    url: '/pages/home/home'
                });
            }
        });
    },


    // 显示用户协议
    showUserAgreement: function () {
        this.setData({
            showAgreementModal: true,
            modalTitle: '用户协议',
            modalContent: `欢迎使用本小程序！请您仔细阅读以下条款：
  
  1. 服务条款
     本小程序为您提供基于地理位置的服务，包括但不限于位置分享、附近信息查询等功能。
  
  2. 用户行为规范
     您在使用本服务时须遵守相关法律法规，不得利用本服务从事任何违法违规行为。
  
  3. 隐私保护
     我们高度重视您的隐私保护，您的地理位置信息仅用于为您提供相关服务，不会泄露给第三方。
  
  4. 免责声明
     对于因不可抗力或第三方原因导致的用户损失，我们不承担法律责任。
  
  5. 协议修改
     我们有权随时修改本协议条款，修改后的协议将在公示后生效。
  
  感谢您的使用！`
        });
    },

    // 显示隐私政策
    showPrivacyPolicy: function () {
        this.setData({
            showAgreementModal: true,
            modalTitle: '隐私政策',
            modalContent: `我们非常重视您的隐私保护，特此制定本隐私政策：
  
  1. 信息收集
     我们收集的信息包括：您的地理位置信息、设置的昵称、设备信息等。
  
  2. 信息使用
     收集的信息将用于：提供基于位置的服务、优化用户体验、保障服务安全等。
  
  3. 信息存储
     您的信息将存储于安全的服务器中，并采取加密等安全措施进行保护。
  
  4. 信息共享
     除非获得您的明确同意或法律法规要求，我们不会将您的个人信息共享给第三方。
  
  5. 信息保护
     我们采取合理的技术和管理措施保护您的个人信息安全，防止信息泄露、损毁或丢失。
  
  6. 未成年人保护
     我们非常重视未成年人的个人信息保护，如您是未成年人，请在监护人指导下使用本服务。
  
  7. 政策更新
     我们可能适时修订本隐私政策，更新后的政策将在公示后生效。
  
  如果您有任何疑问，请联系我们。`
        });
    },

    // 关闭协议弹窗
    closeAgreementModal: function () {
        this.setData({
            showAgreementModal: false
        });
    }
});