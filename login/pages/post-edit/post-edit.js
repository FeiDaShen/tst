const app = getApp()

Page({
  data: {
    title: '',
    content: '',
    imageList: [],
    categoryIndex: 0,
    categoryList: ['生活分享', '技术讨论', '问题求助', '其他'],
    isAnonymous: false,
    isSubmitting: false,
    showMessage: false,
    message: ''
  },

  onLoad: function() {
    // 检查登录状态
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/index/index'
        })
      }, 1500)
    }
  },

  // 标题输入
  onTitleInput: function(e) {
    this.setData({
      title: e.detail.value
    })
  },

  // 内容输入
  onContentInput: function(e) {
    this.setData({
      content: e.detail.value
    })
  },

  // 选择图片
  ChooseImage() {
    const that = this;
    const count = 3 - that.data.imageList.length;
    
    wx.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const newImageList = that.data.imageList.concat(tempFilePaths);
        
        // 限制最多3张
        if (newImageList.length > 3) {
          newImageList = newImageList.slice(0, 3);
        }
        
        that.setData({
          imageList: newImageList
        });
      }
    });
  },

  // 查看图片
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imageList,
      current: e.currentTarget.dataset.url
    });
  },

  // 删除图片
  DelImg(e) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.imageList;
    imageList.splice(index, 1);
    this.setData({
      imageList: imageList
    })
  },

  // 分类选择
  onCategoryChange: function(e) {
    this.setData({
      categoryIndex: e.detail.value
    })
  },

  // 匿名切换
  onAnonymousChange: function(e) {
    this.setData({
      isAnonymous: e.detail.value
    })
  },

  // 提交表单
  formSubmit: function(e) {
    const formData = e.detail.value;
    const { title, content } = formData;
    
    if (!title.trim()) {
      this.showMessage('请输入标题');
      return;
    }
    
    if (!content.trim()) {
      this.showMessage('请输入内容');
      return;
    }
    
    this.setData({
      isSubmitting: true
    });
    
    // 模拟上传图片
    const uploadTasks = this.data.imageList.map((imagePath, index) => {
      return new Promise((resolve, reject) => {
        // 这里应该是实际上传到服务器的代码
        setTimeout(() => {
          resolve(`uploaded_image_${index}.jpg`);
        }, 500);
      });
    });
    
    // 处理上传
    Promise.all(uploadTasks)
      .then((uploadedImages) => {
        // 构建帖子数据
        const postData = {
          title: title.trim(),
          content: content.trim(),
          images: uploadedImages,
          category: this.data.categoryList[this.data.categoryIndex],
          isAnonymous: this.data.isAnonymous,
          author: this.data.isAnonymous ? '匿名用户' : app.globalData.userInfo.nickName,
          createTime: new Date().toISOString(),
          likes: 0,
          comments: 0,
          views: 0
        };
        
        // 这里应该是提交到服务器的代码
        console.log('提交帖子数据:', postData);
        
        // 模拟网络请求延迟
        setTimeout(() => {
          this.setData({
            isSubmitting: false
          });
          
          // 显示成功提示
          wx.showToast({
            title: '发布成功',
            icon: 'success',
            duration: 2000
          });
          
          // 返回首页并刷新
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2]; // 获取上一个页面（home页面）
            
            if (prevPage && prevPage.route === 'pages/home/home') {
              // 触发首页刷新
              prevPage.onLoad();
            }
            
            wx.navigateBack({
              delta: 1
            });
          }, 1500);
          
        }, 1000);
      })
      .catch((error) => {
        console.error('上传失败:', error);
        this.setData({
          isSubmitting: false
        });
        this.showMessage('图片上传失败，请重试');
      });
  },

  // 重置表单
  formReset: function() {
    this.setData({
      title: '',
      content: '',
      imageList: [],
      categoryIndex: 0,
      isAnonymous: false
    });
  },

  // 取消发布
  onCancel: function() {
    wx.showModal({
      title: '提示',
      content: '确定要放弃发布吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack({
            delta: 1
          });
        }
      }
    });
  },

  // 显示消息
  showMessage: function(msg) {
    this.setData({
      showMessage: true,
      message: msg
    });
  },

  // 隐藏消息
  hideMessage: function() {
    this.setData({
      showMessage: false
    });
  }
});