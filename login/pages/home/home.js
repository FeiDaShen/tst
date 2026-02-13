Page({
    data: {
        // 当前选中的标签页
        currentTab: 0,

        // 跑马灯数据
        marqueeList: [
            { id: 1, content: '欢迎来到社区，请遵守社区规范' },
            { id: 2, content: '新用户注册即可获得100积分奖励' },
            { id: 3, content: '优质内容有机会获得官方推荐' }
        ],

        // 帖子列表数据
        postList: [],

        // 分页相关
        page: 1,
        pageSize: 10,
        hasMore: true,
        loading: false,
        isInitialLoading: true, // 初始加载状态

        // 排序相关
        currentSortType: 'time', // time: 按时间, upvote: 按好评
        showSortMenu: false,
        sortButtonPosition: '30rpx', // 浮动按钮位置

        // 打赏相关
        showRewardModal: false,
        selectedReward: 5,
        customReward: '',
        currentRewardPostId: null
    },

    onLoad: function (options) {
        console.log("home onLoad");
        // 获取当前页面实例
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];

        // 获取当前 tabBar 页面索引
        if (typeof currentPage.getTabBar === 'function' && currentPage.getTabBar()) {
            currentPage.getTabBar().setData({
                selected: 0 // 设置第一个tab为选中状态
            });
        }
        // 从登录页跳转过来
        this.checkLoginStatus();

        // 检查是否有位置信息
        const app = getApp();
        if (app.globalData.locationInfo) {
            console.log('已有位置信息:', app.globalData.locationInfo);
            // 可以根据位置信息加载附近帖子
        }

        // 初始化数据
        this.loadMarqueeData();
        this.loadPosts();

        // 监听页面显示/隐藏
        this.pageScrollToTop = 0;
    },

    onTabItemTap(item) {
        console.log('点击tab:', item);
        const index = item.index;

        // 根据不同的tab索引处理不同逻辑
        switch (index) {
            case 0: // 信息圈
                this.setData({ currentTab: 0 });
                this.refreshData();
                break;
            case 1: // 同城
                this.setData({ currentTab: 1 });
                this.refreshData();
                break;
            case 2: // 我的
                this.setData({ currentTab: 2 });
                // 跳转到个人中心页面
                wx.navigateTo({
                    url: '/pages/profile/profile'
                });
                break;
        }
    },


    onShow: function () {
        // 检查是否需要刷新数据
        const needRefresh = wx.getStorageSync('needRefresh');
        if (needRefresh) {
            this.refreshData();
            wx.removeStorageSync('needRefresh');
        }
    },

    // 检查登录状态
    checkLoginStatus: function () {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo) {
            wx.showModal({
                title: '提示',
                content: '您还没有登录，请先登录',
                success: (res) => {
                    if (res.confirm) {
                        wx.navigateTo({
                            url: '/pages/index/index'
                        });
                    }
                }
            });
        }
    },

    // 加载跑马灯数据
    loadMarqueeData: function () {
        // 这里应该从后端获取跑马灯数据
        // 暂时使用模拟数据
        const mockData = [
            { id: 1, content: '欢迎来到社区，请遵守社区规范' },
            { id: 2, content: '新用户注册即可获得100积分奖励' },
            { id: 3, content: '优质内容有机会获得官方推荐' },
            { id: 4, content: '举报不良信息，共同维护社区环境' },
            { id: 5, content: '每日签到可领取积分奖励' }
        ];

        this.setData({
            marqueeList: mockData
        });
    },

    // 加载帖子列表
    // 加载帖子列表
    loadPosts: function (refresh = false) {
        // 防止重复加载
        if (this.data.loading) {
            return Promise.resolve();
        }

        const page = refresh ? 1 : this.data.page;

        this.setData({
            loading: true
        });

        return new Promise((resolve) => {
            // 模拟网络请求延迟
            setTimeout(() => {
                const mockPosts = this.generateMockPosts(page);
                const hasMoreData = mockPosts.length === this.data.pageSize;

                if (refresh) {
                    // 刷新数据
                    this.setData({
                        postList: mockPosts,
                        page: 2,
                        hasMore: hasMoreData,
                        loading: false,
                        isInitialLoading: false
                    });
                } else {
                    // 加载更多数据
                    this.setData({
                        postList: [...this.data.postList, ...mockPosts],
                        page: page + 1,
                        hasMore: hasMoreData,
                        loading: false,
                        isInitialLoading: false
                    });
                }

                // 根据排序类型排序
                this.sortPosts();

                resolve();
            }, 800);
        });
    },

    // 生成模拟帖子数据
    generateMockPosts: function (page) {
        // 模拟无更多数据的情况
        if (page > 3) {
            return [];
        }

        const posts = [];
        const startIndex = (page - 1) * this.data.pageSize;

        const nicknames = ['阳光旅者', '星空探索者', '智慧小猫', '快乐小飞侠', '追风少年', '月下独酌', '晨曦之光', '悠然自得'];
        const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '武汉'];
        const contents = [
            '今天发现了一家超棒的咖啡馆，环境优雅，咖啡香醇，强烈推荐给大家！',
            '分享一个学习编程的好方法：每天坚持写代码，从简单的项目开始，逐步增加难度。',
            '周末去爬山了，山顶的风景太美了，所有的疲惫都值得了！',
            '最近在读《人类简史》，对人类的演化有了全新的认识，推荐给大家。',
            '学会了一道新菜：宫保鸡丁，味道还不错，下次可以尝试更复杂的菜式。',
            '跑步真的能让人快乐，每天5公里，坚持一个月，精神状态好了很多。',
            '分享一个摄影技巧：早晨和傍晚的光线最适合拍照，光线柔和，色彩丰富。',
            '最近在学吉他，虽然手指很痛，但能弹出一首简单的曲子很有成就感。',
            '陌上人玉如,君子待花开。'
        ];

        for (let i = 0; i < this.data.pageSize; i++) {
            const index = startIndex + i;
            const nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            const content = contents[Math.floor(Math.random() * contents.length)];

            posts.push({
                id: index + 1,
                nickname: nickname,
                avatar: `/images/avatar${Math.floor(Math.random() * 5) + 1}.png`,
                time: this.formatTime(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)),
                location: location,
                content: content,
                images: Math.random() > 0.7 ? [
                    '/images/1111.png',
                    '/images/2222.png'
                ] : [],
                upVotes: Math.floor(Math.random() * 100),
                downVotes: Math.floor(Math.random() * 30),
                rewardCount: Math.floor(Math.random() * 50),
                rewardAmount: (Math.random() * 100).toFixed(1),
                voteStatus: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'up' : 'down') : null
            });
        }

        return posts;
    },


    // 格式化时间
    formatTime: function (date) {
        const now = new Date();
        const diff = now - date;

        // 1分钟内
        if (diff < 60 * 1000) {
            return '刚刚';
        }

        // 1小时内
        if (diff < 60 * 60 * 1000) {
            return Math.floor(diff / (60 * 1000)) + '分钟前';
        }

        // 1天内
        if (diff < 24 * 60 * 60 * 1000) {
            return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
        }

        // 1周内
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
        }

        // 显示具体日期
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    },

    // 切换标签页
    switchTab: function (e) {
        const tab = parseInt(e.currentTarget.dataset.tab);

        if (tab === this.data.currentTab) {
            // 点击当前标签，滚动到顶部
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 300
            });
            return;
        }

        this.setData({
            currentTab: tab
        });

        // 根据不同标签页加载不同数据
        this.refreshData();

        // 滚动到顶部
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 300
        });
    },

    // 刷新数据
    refreshData: function () {
        // 显示加载动画
        this.setData({
            isInitialLoading: true
        });

        // 延迟加载，确保动画显示
        setTimeout(() => {
            this.loadPosts(true).then(() => {
                wx.stopPullDownRefresh();
                wx.showToast({
                    title: '刷新成功',
                    icon: 'success',
                    duration: 1500
                });
            });
        }, 300);
    },

    // 加载更多帖子 - 优化版本
    loadMorePosts: function () {
        // 如果正在加载或没有更多数据，直接返回
        if (this.data.loading || !this.data.hasMore) {
            return;
        }

        // 显示加载动画
        this.setData({
            loading: true,
            loadingIcon: true
        });

        // 加载数据
        this.loadPosts(false).then(() => {
            // 如果没有更多数据，隐藏加载图标
            if (!this.data.hasMore) {
                setTimeout(() => {
                    this.setData({
                        loadingIcon: false
                    });
                }, 500);
            }
        });
    },

    // 跳转到帖子详情页
    navigateToPostDetail(e) {
        const postId = e.currentTarget.dataset.id;
        const title = e.currentTarget.dataset.title || '';
        const nickname = e.currentTarget.dataset.nickname || '';
        try {
            const raw = wx.getStorageSync('viewHistory') || [];
            const normId = (/^\d+$/.test(String(postId)) ? Number(postId) : String(postId));
            // 去重: 使用字符串比较以兼容历史数据类型
            const filtered = (raw || []).filter(item => String(item.id) !== String(normId));
            filtered.unshift({ id: normId, title: title, viewTime: Date.now(), nickname: nickname });
            // 保持最大长度 50
            filtered.splice(50);
            wx.setStorageSync('viewHistory', filtered);
        } catch (err) {
            console.warn('写入浏览记录失败', err);
        }

        wx.navigateTo({
            url: `/pages/post-detail/post-detail?id=${postId}`
        });
    },

    navigateToCreatePost() {
        wx.navigateTo({
            url: '/pages/create-post/create-post'
        });
    },

    // 处理跑马灯点击
    handleMarqueeTap: function (e) {
        const id = e.currentTarget.dataset.id;
        wx.showToast({
            title: `查看公告 ${id}`,
            icon: 'none'
        });
    },

    // 处理好评
    handleUpVote: function (e) {
        const index = e.currentTarget.dataset.index;
        const id = e.currentTarget.dataset.id;
        const postList = this.data.postList;

        // 检查是否已经投过票
        const currentVote = postList[index].voteStatus;

        if (currentVote === 'up') {
            // 取消好评
            postList[index].upVotes--;
            postList[index].voteStatus = null;
        } else {
            // 如果是差评，先取消差评
            if (currentVote === 'down') {
                postList[index].downVotes--;
            }
            // 添加好评
            postList[index].upVotes++;
            postList[index].voteStatus = 'up';
        }

        this.setData({
            postList: postList
        });
    },

    // 处理差评
    handleDownVote: function (e) {
        const index = e.currentTarget.dataset.index;
        const id = e.currentTarget.dataset.id;
        const postList = this.data.postList;

        // 检查是否已经投过票
        const currentVote = postList[index].voteStatus;

        if (currentVote === 'down') {
            // 取消差评
            postList[index].downVotes--;
            postList[index].voteStatus = null;
        } else {
            // 如果是好评，先取消好评
            if (currentVote === 'up') {
                postList[index].upVotes--;
            }
            // 添加差评
            postList[index].downVotes++;
            postList[index].voteStatus = 'down';
        }

        this.setData({
            postList: postList
        });
    },

    // 确认打赏
    confirmReward: function () {
        const amount = this.data.customReward ? parseFloat(this.data.customReward) : this.data.selectedReward;

        if (amount <= 0) {
            wx.showToast({
                title: '请输入有效金额',
                icon: 'none'
            });
            return;
        }

        // 这里应该调用后端API进行打赏
        console.log(`打赏帖子 ${this.data.currentRewardPostId} 金额 ${amount} 元`);

        wx.showToast({
            title: `打赏成功 ${amount}元`,
            icon: 'success'
        });

        // 关闭弹窗
        this.closeRewardModal();

        // 更新帖子列表中的打赏信息
        const postList = this.data.postList;
        const postIndex = postList.findIndex(item => item.id === this.data.currentRewardPostId);

        if (postIndex !== -1) {
            postList[postIndex].rewardCount++;
            postList[postIndex].rewardAmount = (parseFloat(postList[postIndex].rewardAmount) + amount).toFixed(1);

            this.setData({
                postList: postList
            });
        }
    },

    // 关闭打赏弹窗
    closeRewardModal: function () {
        this.setData({
            showRewardModal: false,
            currentRewardPostId: null
        });
    },

    // 切换排序菜单显示
    toggleSortMenu: function () {
        this.setData({
            showSortMenu: !this.data.showSortMenu
        });

        // 切换浮动按钮位置
        if (this.data.sortButtonPosition === '30rpx') {
            this.setData({
                sortButtonPosition: '350rpx'
            });
        } else {
            this.setData({
                sortButtonPosition: '30rpx'
            });
        }
    },

    // 改变排序类型
    changeSortType: function (e) {
        const type = e.currentTarget.dataset.type;

        if (type === this.data.currentSortType) {
            this.toggleSortMenu();
            return;
        }

        this.setData({
            currentSortType: type,
            showSortMenu: false,
            sortButtonPosition: '30rpx',
            isInitialLoading: true // 显示骨架屏
        });

        // 延迟重新排序帖子
        setTimeout(() => {
            this.sortPosts();
            this.setData({
                isInitialLoading: false
            });
        }, 500);
    },


    // 排序帖子
    sortPosts: function () {
        const postList = [...this.data.postList];

        if (this.data.currentSortType === 'time') {
            // 按时间排序（这里模拟按ID排序，实际应该按发布时间）
            postList.sort((a, b) => b.id - a.id);
        } else if (this.data.currentSortType === 'upvote') {
            // 按好评数排序
            postList.sort((a, b) => b.upVotes - a.upVotes);
        }

        this.setData({
            postList: postList
        });
    },

    // 预览图片
    previewImage: function (e) {
        const index = e.currentTarget.dataset.index;
        const images = e.currentTarget.dataset.images;

        wx.previewImage({
            current: images[index],
            urls: images
        });
    },
    // 下拉刷新
    onPullDownRefresh: function () {
        this.refreshData();
    },

    // 监听页面滚动
    onPageScroll: function (e) {
        this.pageScrollToTop = e.scrollTop;
    },

    // 处理打赏相关方法保持不变...
    handleReward: function (e) {
        const id = e.currentTarget.dataset.id;

        this.setData({
            showRewardModal: true,
            currentRewardPostId: id,
            selectedReward: 5,
            customReward: ''
        });
    },

    // 选择打赏金额
    selectReward: function (e) {
        const amount = parseInt(e.currentTarget.dataset.amount);

        this.setData({
            selectedReward: amount,
            customReward: ''
        });
    },


    // 处理自定义打赏输入
    handleCustomRewardInput: function (e) {
        const value = e.detail.value;

        if (value) {
            this.setData({
                selectedReward: 0,
                customReward: value
            });
        }
    },
    // 跳转到发帖页面
    goToPostEdit: function () {
        // 检查登录状态
        // if (!app.globalData.userInfo) {
        //     wx.navigateTo({
        //         url: '/pages/index/index'
        //     });
        //     return;
        // }

        wx.navigateTo({
            url: '/pages/post-edit/post-edit'
        });
    }
})