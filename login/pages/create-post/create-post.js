// pages/create-post/create-post.js
Page({
    data: {
      // 帖子内容
      postContent: '',
      
      // 图片相关
      selectedImages: [],
      
      // 地理位置
      selectedRegion: [],
      detailAddress: '',
      
      // 天气信息
      weatherOptions: ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '雪', '雾', '沙尘暴'],
      selectedWeather: null,
      
      temperatureOptions: Array.from({length: 51}, (_, i) => i - 10), // -10°C 到 40°C
      selectedTemperature: null,
      
      windDirectionOptions: ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风', '无风'],
      selectedWindDirection: null,
      
      windScaleOptions: ['0级', '1级', '2级', '3级', '4级', '5级', '6级', '7级', '8级', '9级', '10级以上'],
      selectedWindScale: null,
      
      // 标签
      availableTags: ['旅行', '美食', '摄影', '运动', '生活', '科技', '娱乐', '学习', '工作', '心情'],
      selectedTags: [],
      
      // 发布设置
      visibilityOptions: ['公开', '仅好友可见', '仅自己可见'],
      selectedVisibility: 0,
      allowComments: true,
      showLocation: true,
      
      // 验证状态
      isValidPost: false,
      
      // 页面滚动
      scrollTop: 0
    },
  
    onLoad() {
      this.checkPostValidity();
    },
  
    // 检查帖子是否有效
    checkPostValidity() {
      const { postContent, selectedImages, selectedRegion } = this.data;
      const isValid = postContent.trim().length > 0 || selectedImages.length > 0;
      
      this.setData({
        isValidPost: isValid
      });
    },
  
    // 内容输入
    onContentInput(e) {
      this.setData({
        postContent: e.detail.value
      }, () => {
        this.checkPostValidity();
      });
    },
  
    // 选择图片
    selectImages() {
      const { selectedImages } = this.data;
      const remaining = 9 - selectedImages.length;
      
      wx.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = [...selectedImages, ...res.tempFilePaths].slice(0, 9);
          this.setData({
            selectedImages: newImages
          }, () => {
            this.checkPostValidity();
          });
        }
      });
    },
  
    // 预览图片
    previewImage(e) {
      const { index } = e.currentTarget.dataset;
      const { selectedImages } = this.data;
      
      wx.previewImage({
        current: selectedImages[index],
        urls: selectedImages
      });
    },
  
    // 移除图片
    removeImage(e) {
      const { index } = e.currentTarget.dataset;
      const { selectedImages } = this.data;
      
      wx.showModal({
        title: '删除图片',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            selectedImages.splice(index, 1);
            this.setData({
              selectedImages: [...selectedImages]
            }, () => {
              this.checkPostValidity();
            });
          }
        }
      });
    },
  
    // 地理位置选择
    onRegionChange(e) {
      this.setData({
        selectedRegion: e.detail.value
      });
    },
  
    // 详细地址输入
    onDetailAddressInput(e) {
      this.setData({
        detailAddress: e.detail.value
      });
    },
  
    // 天气选择
    onWeatherChange(e) {
      this.setData({
        selectedWeather: e.detail.value
      });
    },
  
    // 温度选择
    onTemperatureChange(e) {
      this.setData({
        selectedTemperature: e.detail.value
      });
    },
  
    // 风向选择
    onWindDirectionChange(e) {
      this.setData({
        selectedWindDirection: e.detail.value
      });
    },
  
    // 风力选择
    onWindScaleChange(e) {
      this.setData({
        selectedWindScale: e.detail.value
      });
    },
  
    // 标签选择
    toggleTag(e) {
      const { tag } = e.currentTarget.dataset;
      const { selectedTags } = this.data;
      
      if (selectedTags.includes(tag)) {
        // 如果已选中，移除
        const index = selectedTags.indexOf(tag);
        selectedTags.splice(index, 1);
      } else {
        // 如果未选中且未超过限制，添加
        if (selectedTags.length < 3) {
          selectedTags.push(tag);
        } else {
          wx.showToast({
            title: '最多选择3个标签',
            icon: 'none'
          });
          return;
        }
      }
      
      this.setData({
        selectedTags: [...selectedTags]
      });
    },
  
    // 公开范围选择
    onVisibilityChange(e) {
      this.setData({
        selectedVisibility: e.detail.value
      });
    },
  
    // 允许评论开关
    onAllowCommentsChange(e) {
      this.setData({
        allowComments: e.detail.value
      });
    },
  
    // 显示位置开关
    onShowLocationChange(e) {
      this.setData({
        showLocation: e.detail.value
      });
    },
  
    // 页面滚动
    onPageScroll(e) {
      this.setData({
        scrollTop: e.scrollTop
      });
    },
  
    // 返回上一页
    goBack() {
      this.checkUnsavedChanges();
    },
  
    // 检查未保存的更改
    checkUnsavedChanges() {
      const { postContent, selectedImages } = this.data;
      
      if (postContent.trim() || selectedImages.length > 0) {
        wx.showModal({
          title: '提示',
          content: '有未保存的内容，确定要离开吗？',
          confirmText: '离开',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              wx.navigateBack();
            }
          }
        });
      } else {
        wx.navigateBack();
      }
    },
  
    // 提交帖子
    async submitPost() {
      const { 
        postContent, 
        selectedImages, 
        selectedRegion,
        detailAddress,
        selectedWeather,
        selectedTemperature,
        selectedWindDirection,
        selectedWindScale,
        selectedTags,
        selectedVisibility,
        allowComments,
        showLocation 
      } = this.data;
      
      // 验证必要内容
      if (!postContent.trim() && selectedImages.length === 0) {
        wx.showToast({
          title: '请填写内容或添加图片',
          icon: 'none'
        });
        return;
      }
      
      // 显示加载中
      wx.showLoading({
        title: '发布中...',
        mask: true
      });
      
      try {
        // 上传图片
        const uploadedImages = await this.uploadImages(selectedImages);
        
        // 构建帖子数据
        const postData = {
          content: postContent,
          images: uploadedImages,
          location: {
            region: selectedRegion,
            detail: detailAddress,
            show: showLocation
          },
          weather: selectedWeather !== null ? {
            condition: this.data.weatherOptions[selectedWeather],
            temperature: this.data.temperatureOptions[selectedTemperature],
            windDirection: this.data.windDirectionOptions[selectedWindDirection],
            windScale: this.data.windScaleOptions[selectedWindScale]
          } : null,
          tags: selectedTags,
          visibility: selectedVisibility,
          allowComments: allowComments,
          createTime: new Date().toISOString()
        };
        
        // 保存到本地（模拟API调用）
        this.savePostToLocal(postData);
        
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        wx.hideLoading();
        
        // 发布成功
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 2000,
          complete: () => {
            // 返回上一页并刷新
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            
            if (prevPage && prevPage.onPullDownRefresh) {
              prevPage.onPullDownRefresh();
            }
            
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
        
      } catch (error) {
        wx.hideLoading();
        wx.showToast({
          title: '发布失败',
          icon: 'error'
        });
        console.error('发布失败:', error);
      }
    },
  
    // 上传图片
    async uploadImages(images) {
      if (images.length === 0) return [];
      
      const uploadedUrls = [];
      
      for (const imagePath of images) {
        // 模拟上传过程
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 这里应该调用微信的云存储或自己的服务器上传
        // const uploadResult = await wx.cloud.uploadFile(...)
        // uploadedUrls.push(uploadResult.fileID);
        
        // 模拟返回的URL
        uploadedUrls.push(imagePath);
      }
      
      return uploadedUrls;
    },
  
    // 保存到本地
    savePostToLocal(postData) {
      try {
        // 从本地存储获取帖子列表
        const posts = wx.getStorageSync('userPosts') || [];
        
        // 添加新帖子
        const newPost = {
          id: Date.now().toString(),
          ...postData,
          nickname: '当前用户',
          avatar: '/images/my-avatar.png',
          time: '刚刚',
          upVotes: 0,
          downVotes: 0,
          comments: 0
        };
        
        posts.unshift(newPost);
        
        // 保存回本地存储
        wx.setStorageSync('userPosts', posts);
        
      } catch (error) {
        console.error('保存帖子失败:', error);
      }
    },
  
    // 页面卸载时清理
    onUnload() {
      // 清理临时文件
      // 这里可以根据需要清理临时图片文件
    }
  });