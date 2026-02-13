// pages/post-detail/post-detail.js
Page({
    data: {
      postId: '',
      postData: null,
      commentList: [],
      commentContent: '',
      replyingTo: null,
      showActionSheet: false,
      showRewardModal: false,
      commentSort: 'new', // 'new' 或 'hot'
      hasMoreComments: true,
      commentPage: 1,
      commentPageSize: 10,
      isInputFocus: false,
      scrollTop: 0,
    showSwipeIndicator: false,
    startX: 0,  // 触摸开始X坐标
    startY: 0,  // 触摸开始Y坐标
    },
  
    onLoad(options) {
      const postId = options.id;
      this.setData({ postId });
      this.loadPostData(postId);
      this.loadComments();
      
      // 增加浏览数
      this.incrementViewCount();
      // 监听返回键（安卓物理返回键）
    if (wx.onAppHide) {
        wx.onAppHide(() => {
          this.checkBeforeLeave();
        });
      }
      
      // 监听页面返回
      wx.onAppRoute((route) => {
        if (route.openType === 'navigateBack') {
          this.checkBeforeLeave();
        }
      });
    },

     // 执行返回操作
  navigateBack() {
    // 添加返回动画效果
    this.setData({
      showSwipeIndicator: true
    });
    
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        success: () => {
          console.log('返回成功');
        },
        fail: (err) => {
          console.error('返回失败:', err);
        }
      });
    }, 300);
  },

   // 触摸开始（用于侧滑返回）
   onTouchStart(e) {
    if (e.touches.length > 0) {
      this.setData({
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY
      });
    }
  },

   // 触摸移动（用于侧滑返回）
   onTouchMove(e) {
    if (!this.data.startX || !this.data.startY) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - this.data.startX;
    const deltaY = currentY - this.data.startY;
    
    // 判断是否为侧滑操作（水平移动距离大于垂直移动距离）
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 30) {
      // 显示侧滑返回指示器
      this.setData({
        showSwipeIndicator: true
      });
    }
  },

  // 触摸结束（用于侧滑返回）
  onTouchEnd(e) {
    if (!this.data.startX || !this.data.startY) return;
    
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    const deltaX = currentX - this.data.startX;
    const deltaY = currentY - this.data.startY;
    
    // 判断是否为有效的侧滑返回
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 100) {
      // 执行返回
      this.checkBeforeLeave();
    } else {
      // 隐藏侧滑指示器
      this.setData({
        showSwipeIndicator: false
      });
    }
    
    // 重置起始位置
    this.setData({
      startX: 0,
      startY: 0
    });
  },

    onUnload() {
        // 清理事件监听
        if (this.touchTimer) {
          clearTimeout(this.touchTimer);
        }
      },
  
    onShow() {
      // 页面显示时刷新评论
      if (this.data.postId) {
        this.refreshComments();
      }
    },
  
    // 加载帖子数据
    async loadPostData(postId) {
      try {
        wx.showLoading({ title: '加载中...' });
        
        // 模拟数据
        const mockData = {
          id: postId,
          avatar: '/images/avatar.png',
          nickname: '旅行达人小明',
          location: '西藏 · 拉萨',
          createTime: '2024-01-15 14:30',
          weather: {
            condition: '晴',
            windDirection: '西北风',
            windScale: '3-4',
            temp: '18',
            humidity: '45'
          },
          content: '今天的布达拉宫在蓝天白云的映衬下格外壮观！藏族朋友的热情招待让我感受到了最纯真的温暖。这里的气候干燥但阳光充足，要注意做好防晒哦～',
          images: [
            '/images/post1.jpg',
            '/images/post2.jpg'
          ],
          viewCount: 1234,
          likeCount: 456,
          favoriteCount: 89,
          isLiked: false,
          isFavorited: false,
          isFollowing: false,
          isOwner: true
        };
        
        this.setData({ postData: mockData });
        
        wx.hideLoading();
      } catch (error) {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    },
  
    // 加载评论
    async loadComments() {
      try {
        // 模拟评论数据
        const mockComments = [
          {
            id: 1,
            avatar: '/images/avatar2.png',
            nickname: '摄影爱好者',
            createTime: '1小时前',
            content: '照片拍得太美了！布达拉宫一直是我向往的地方。',
            likeCount: 24,
            isLiked: false,
            subComments: [
              {
                id: 11,
                nickname: '旅行达人小明',
                replyTo: { nickname: '摄影爱好者' },
                createTime: '30分钟前',
                content: '谢谢！那里的光线真的很适合拍照。',
                likeCount: 5,
                isLiked: false
              }
            ],
            totalSubComments: 3
          },
          {
            id: 2,
            avatar: '/images/avatar3.png',
            nickname: '藏地通',
            createTime: '2小时前',
            content: '欢迎来到西藏！推荐你去大昭寺转转，感受一下藏传佛教的氛围。',
            likeCount: 18,
            isLiked: true,
            subComments: []
          }
        ];
        
        this.setData({ commentList: mockComments });
      } catch (error) {
        console.error('加载评论失败:', error);
      }
    },
  
    // 刷新评论
    async refreshComments() {
      this.setData({
        commentPage: 1,
        hasMoreComments: true
      });
      await this.loadComments();
    },
  
    // 加载更多评论
    async loadMoreComments() {
      if (!this.data.hasMoreComments) return;
      
      try {
        wx.showLoading({ title: '加载中...' });
        
        // 模拟加载更多
        const newComments = [
          {
            id: 3,
            avatar: '/images/avatar4.png',
            nickname: '旅行小白',
            createTime: '3小时前',
            content: '请问去西藏需要准备什么？有什么注意事项吗？',
            likeCount: 12,
            isLiked: false,
            subComments: []
          }
        ];
        
        this.setData({
          commentList: [...this.data.commentList, ...newComments],
          commentPage: this.data.commentPage + 1,
          hasMoreComments: false // 模拟没有更多数据
        });
        
        wx.hideLoading();
      } catch (error) {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    },
  
    // 增加浏览数
    async incrementViewCount() {
      // 调用API增加浏览数
      console.log('增加浏览数:', this.data.postId);
    },
  
  
    // 显示更多操作
    showMoreOptions() {
      this.setData({ showActionSheet: true });
    },
  
    hideActionSheet() {
      this.setData({ showActionSheet: false });
    },
  
    // 关注/取消关注
    toggleFollow() {
      const { postData } = this.data;
      const newIsFollowing = !postData.isFollowing;
      
      this.setData({
        'postData.isFollowing': newIsFollowing
      });
      
      wx.showToast({
        title: newIsFollowing ? '关注成功' : '已取消关注',
        icon: 'success'
      });
    },
  
    // 点赞/取消点赞
    toggleLike() {
      const { postData } = this.data;
      const newIsLiked = !postData.isLiked;
      const increment = newIsLiked ? 1 : -1;
      
      this.setData({
        'postData.isLiked': newIsLiked,
        'postData.likeCount': Math.max(0, (postData.likeCount || 0) + increment)
      });
      
      // 调用API更新点赞状态
      console.log('更新点赞状态:', this.data.postId, newIsLiked);
    },
  
    // 收藏/取消收藏
    toggleFavorite() {
      const { postData } = this.data;
      const newIsFavorited = !postData.isFavorited;
      const increment = newIsFavorited ? 1 : -1;
      
      this.setData({
        'postData.isFavorited': newIsFavorited,
        'postData.favoriteCount': Math.max(0, (postData.favoriteCount || 0) + increment)
      });
      
      wx.showToast({
        title: newIsFavorited ? '已收藏' : '已取消收藏',
        icon: 'success'
      });
    },
  
    // 分享帖子
    sharePost() {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    },
  
    // 显示打赏弹窗
    showRewardModal() {
      this.setData({ showRewardModal: true });
    },
  
    // 评论点赞/取消点赞
    toggleCommentLike(e) {
      const { index, id } = e.currentTarget.dataset;
      const { commentList } = this.data;
      const comment = commentList[index];
      const newIsLiked = !comment.isLiked;
      const increment = newIsLiked ? 1 : -1;
      
      this.setData({
        [`commentList[${index}].isLiked`]: newIsLiked,
        [`commentList[${index}].likeCount`]: Math.max(0, (comment.likeCount || 0) + increment)
      });
    },
  
    // 子评论点赞
    toggleSubCommentLike(e) {
      const { parentIndex, subIndex } = e.currentTarget.dataset;
      const { commentList } = this.data;
      const subComment = commentList[parentIndex].subComments[subIndex];
      const newIsLiked = !subComment.isLiked;
      const increment = newIsLiked ? 1 : -1;
      
      this.setData({
        [`commentList[${parentIndex}].subComments[${subIndex}].isLiked`]: newIsLiked,
        [`commentList[${parentIndex}].subComments[${subIndex}].likeCount`]: Math.max(0, (subComment.likeCount || 0) + increment)
      });
    },
  
    // 回复评论
    replyComment(e) {
      const { id, nickname } = e.currentTarget.dataset;
      this.setData({
        replyingTo: { id, nickname }
      });
      
      // 聚焦输入框
      this.createSelectorQuery()
        .select('.comment-textarea')
        .focus()
        .exec();
    },
  
    // 取消回复
    cancelReply() {
      this.setData({
        replyingTo: null,
        commentContent: ''
      });
    },
  
    // 评论输入
    onCommentInput(e) {
      this.setData({
        commentContent: e.detail.value
      });
    },
  
    // 输入框聚焦
    onInputFocus() {
      this.setData({ isInputFocus: true });
    },
  
    // 输入框失焦
    onInputBlur() {
      this.setData({ isInputFocus: false });
    },
  
    // 提交评论
    async submitComment() {
      const { commentContent, replyingTo } = this.data;
      
      if (!commentContent.trim()) {
        wx.showToast({
          title: '评论内容不能为空',
          icon: 'error'
        });
        return;
      }
      
      try {
        wx.showLoading({ title: '发送中...' });
        
        // 模拟提交评论
        const newComment = {
          id: Date.now(),
          avatar: '/images/my-avatar.png',
          nickname: '我',
          createTime: '刚刚',
          content: commentContent,
          likeCount: 0,
          isLiked: false,
          replyTo: replyingTo,
          subComments: []
        };
        
        // 如果是回复评论，添加到子评论
        if (replyingTo) {
          // 这里需要找到对应的父评论
          // 暂时添加到第一条评论的子评论中
          const updatedComments = [...this.data.commentList];
          if (updatedComments[0]) {
            updatedComments[0].subComments = [
              ...(updatedComments[0].subComments || []),
              {
                ...newComment,
                replyTo: { nickname: replyingTo.nickname }
              }
            ];
            this.setData({ commentList: updatedComments });
          }
        } else {
          // 添加新评论
          this.setData({
            commentList: [newComment, ...this.data.commentList]
          });
        }
        
        // 重置输入
        this.setData({
          commentContent: '',
          replyingTo: null
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
      } catch (error) {
        wx.hideLoading();
        wx.showToast({
          title: '评论失败',
          icon: 'error'
        });
      }
    },
  
    // 切换评论排序
    toggleCommentSort() {
      const newSort = this.data.commentSort === 'new' ? 'hot' : 'new';
      this.setData({ commentSort: newSort });
      this.refreshComments();
    },
  
    // 加载更多子评论
    loadMoreSubComments(e) {
      const { index } = e.currentTarget.dataset;
      wx.showToast({
        title: '加载更多子评论',
        icon: 'none'
      });
    },
  
    // 预览图片
    previewImage(e) {
      const { url, index } = e.currentTarget.dataset;
      const urls = this.data.postData.images;
      wx.previewImage({
        current: url,
        urls: urls
      });
    },
  
    // 预览头像
    previewAvatar() {
      const avatar = this.data.postData.avatar;
      wx.previewImage({
        current: avatar,
        urls: [avatar]
      });
    },
  
    // 页面滚动事件
    onPageScroll(e) {
      // 可以根据滚动位置做一些效果
      this.setData({
        scrollTop: e.scrollTop
      });
    },

    // 返回上一页
  goBack() {
    this.checkBeforeLeave();
  },

  // 离开页面前的检查
  checkBeforeLeave() {
    // 如果有未提交的评论
    if (this.data.commentContent && this.data.commentContent.trim()) {
      wx.showModal({
        title: '提示',
        content: '有未提交的评论，确定要离开吗？',
        confirmText: '离开',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.navigateBack();
          }
        }
      });
    } else {
      this.navigateBack();
    }
  },
  
    // 举报帖子
    reportPost() {
      wx.showModal({
        title: '举报内容',
        content: '请选择举报原因',
        confirmText: '确认举报',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '举报已提交',
              icon: 'success'
            });
          }
        }
      });
      this.hideActionSheet();
    },
  
    // 编辑帖子
    editPost() {
      wx.navigateTo({
        url: `/pages/edit-post/edit-post?id=${this.data.postId}`
      });
      this.hideActionSheet();
    },
  
    // 删除帖子
    deletePost() {
      wx.showModal({
        title: '删除帖子',
        content: '确定要删除这条帖子吗？删除后不可恢复。',
        confirmColor: '#e54d42',
        success: (res) => {
          if (res.confirm) {
            // 调用删除API
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              complete: () => {
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              }
            });
          }
        }
      });
      this.hideActionSheet();
    },
  
    // 复制链接
    copyLink() {
      const link = `https://app.example.com/post/${this.data.postId}`;
      wx.setClipboardData({
        data: link,
        success: () => {
          wx.showToast({
            title: '链接已复制',
            icon: 'success'
          });
        }
      });
      this.hideActionSheet();
    },
  
    // 页面分享
    onShareAppMessage() {
      return {
        title: this.data.postData.content.substring(0, 30) + '...',
        path: `/pages/post-detail/post-detail?id=${this.data.postId}`
      };
    },
  
    onShareTimeline() {
      return {
        title: this.data.postData.content.substring(0, 30) + '...',
        query: `id=${this.data.postId}`
      };
    }
  });