Page({
  data: {
    userInfo: {},
    activeSection: 'history',
    posts: [],
    postsPreview: [],
    history: [],
    historyPreview: [],
    favorites: [],
    favoritesPreview: [],
    showFeedback: false,
    showHistory: false,
    showFavorites: false,
    showPosts: false,
    feedbackText: '',
    listModalBodyHeight: 300
  },
  onLoad: function () {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({ userInfo });
      this.loadPosts();
      this.loadHistory();
      this.loadFavorites();
      // 计算弹窗内部 scroll-view 的高度，便于滚动
      try {
        const sys = wx.getSystemInfoSync();
        const windowH = sys.windowHeight || 667;
        // 弹窗高度采用窗口高度的70%（与 list-modal top/bottom 配置一致）
        const modalH = Math.floor(windowH * 0.7);
        const headerH = 48; // 预估头部高度（px）
        const bodyH = modalH - headerH - 20; // 预留内边距
        this.setData({ listModalBodyHeight: bodyH });
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error('读取用户信息失败', e);
    }
  },

  onShow: function () {
    // 每次页面显示时刷新数据，确保外部页面写入的浏览记录能被读取
    this.loadPosts();
    this.loadHistory();
    this.loadFavorites();
  },

  openSettings: function () {
    wx.showToast({ title: '设置（占位）', icon: 'none' });
  },

  logout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('isLogin');
          } catch (e) {
            console.warn('清除本地存储失败', e);
          }
          wx.showToast({ title: '已退出', icon: 'success' });
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 700);
        }
      }
    });
  },

  openSection: function (e) {
    const section = e.currentTarget.dataset.section;
    this.setData({ activeSection: section, showHistory: false });
  },

  loadPosts: function () {
    try {
      const posts = wx.getStorageSync('myPosts') || [
        { id: 1, title: '示例帖子 1', time: '2026-02-10' },
        { id: 2, title: '示例帖子 2', time: '2026-02-11' }
      ];
      this.setData({ posts, postsPreview: (posts || []).slice(0,2) });
    } catch (e) {
      console.warn('读取帖子失败', e);
      this.setData({ posts: [] });
    }
  },

  loadHistory: function () {
    try {
      const raw = wx.getStorageSync('viewHistory') || [];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = (raw || []).filter(item => (item.viewTime || 0) >= weekAgo).map(item => ({
        ...item,
        viewTimeStr: new Date(item.viewTime).toLocaleString()
      }));
      this.setData({ history: recent, historyPreview: (recent || []).slice(0,2) });
    } catch (e) {
      console.warn('读取浏览记录失败', e);
      this.setData({ history: [] });
    }
  },

  loadFavorites: function () {
    try {
      const fav = wx.getStorageSync('favorites') || [];
      const list = (fav || []).map(item => ({ ...item, addedStr: item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '' }));
      this.setData({ favorites: list, favoritesPreview: (list || []).slice(0,2) });
    } catch (e) {
      console.warn('读取收藏失败', e);
      this.setData({ favorites: [] });
    }
  },

  /* history modal controls */
  showHistoryModal: function () {
    this.setData({ showHistory: true });
  },

  closeHistoryModal: function () {
    this.setData({ showHistory: false });
  },

  /* generic 'more' handler for sections */
  showMore: function (e) {
    const section = e.currentTarget.dataset.section;
    if (section === 'history') {
      this.showHistoryModal();
      return;
    }
    if (section === 'favorites') {
      this.setData({ showFavorites: true });
      return;
    }
    if (section === 'posts') {
      this.setData({ showPosts: true });
      return;
    }
  },

  closeFavoritesModal: function () {
    this.setData({ showFavorites: false });
  },

  closePostsModal: function () {
    this.setData({ showPosts: false });
  },

  /* open post detail */
  openPost: function (e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: '帖子 ID 不存在', icon: 'none' });
      return;
    }
    // 记录一次浏览（更新 viewHistory），并立即更新页面 history 显示
    const title = e.currentTarget.dataset.title || '';
    const nickname = e.currentTarget.dataset.nickname || '';
    try {
      const raw = wx.getStorageSync('viewHistory') || [];
      // 规范化 id：纯数字字符串转为 Number，否则保留字符串
      const normId = (/^\d+$/.test(String(id)) ? Number(id) : String(id));
      // 去重并把最新放前面（使用字符串比较以兼容历史数据类型）
      const filtered = (raw || []).filter(item => String(item.id) !== String(normId));
      filtered.unshift({ id: normId, title, viewTime: Date.now(), nickname });
      // 保持一定长度（例如 50 条）
      filtered.splice(50);
      wx.setStorageSync('viewHistory', filtered);

      // 同步更新页面上的 history（只保留近7天），并格式化时间显示
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = (filtered || []).filter(item => (item.viewTime || 0) >= weekAgo).map(item => ({
        ...item,
        viewTimeStr: new Date(item.viewTime).toLocaleString()
      }));
      this.setData({ history: recent, historyPreview: (recent || []).slice(0,2) });
    } catch (err) {
      console.warn('写入浏览记录失败', err);
    }

    // 跳转到帖子详情页（假设 post-detail 接受 id 参数）
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  },

  showFeedbackModal: function () {
    this.setData({ showFeedback: true });
  },

  closeFeedbackModal: function () {
    this.setData({ showFeedback: false, feedbackText: '' });
  },

  onFeedbackInput: function (e) {
    this.setData({ feedbackText: e.detail.value });
  },

  submitFeedback: function () {
    const text = (this.data.feedbackText || '').trim();
    if (!text) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    try {
      const arr = wx.getStorageSync('feedbacks') || [];
      arr.unshift({ text, time: Date.now() });
      wx.setStorageSync('feedbacks', arr);
      wx.showToast({ title: '感谢反馈', icon: 'success' });
      this.setData({ showFeedback: false, feedbackText: '' });
    } catch (e) {
      console.warn('保存反馈失败', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  clearHistory: function () {
    const that = this;
    wx.showModal({
      title: '清空浏览记录',
      content: '确定要清空最近的浏览记录吗？此操作不可恢复。',
      success(res) {
        if (res.confirm) {
            try {
            wx.removeStorageSync('viewHistory');
            that.setData({ history: [], historyPreview: [], showHistory:false});
            wx.showToast({ title: '已清空', icon: 'success' });
          } catch (e) {
            console.warn('清空浏览记录失败', e);
            wx.showToast({ title: '清空失败', icon: 'none' });
          }
        }
      }
    });
  }
});