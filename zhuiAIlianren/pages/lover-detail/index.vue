<template>
  <view class="detail-page" v-if="lover">
    <view class="detail-header">
      <image :src="lover.avatar_image" class="detail-avatar" mode="aspectFill" />
      <view class="detail-overlay">
        <text class="detail-name">{{ lover.name }}</text>
        <text class="detail-persona">{{ lover.persona }} · {{ lover.age }}岁</text>
      </view>
    </view>
    
    <view class="detail-card">
      <view class="info-section">
        <text class="section-title">基本信息</text>
        <view class="info-row">
          <text class="info-label">职业</text>
          <text class="info-value">{{ lover.occupation }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">身高</text>
          <text class="info-value">{{ lover.height }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">爱好</text>
          <text class="info-value">{{ lover.hobbies.join('、') }}</text>
        </view>
      </view>
      
      <view class="info-section">
        <text class="section-title">性格标签</text>
        <view class="tags-wrap">
          <text class="tag" v-for="(tag, i) in lover.personality_tags" :key="i">#{{ tag }}</text>
        </view>
      </view>
      
      <view class="info-section">
        <text class="section-title">关于{{ lover.gender === 'female' ? '她' : '他' }}</text>
        <text class="desc-text">{{ lover.description }}</text>
      </view>
      
      <view class="info-section">
        <text class="section-title">喜欢</text>
        <view class="like-tags">
          <text class="like-tag" v-for="(item, i) in lover.likes" :key="i">❤️ {{ item }}</text>
        </view>
      </view>
      
      <view class="info-section">
        <text class="section-title">讨厌</text>
        <view class="like-tags">
          <text class="dislike-tag" v-for="(item, i) in lover.dislikes" :key="i">💔 {{ item }}</text>
        </view>
      </view>
    </view>
    
    <button class="choose-btn" @click="chooseLover">
      选择{{ lover.name }}，开始恋爱
    </button>
  </view>
</template>

<script>
import { getLoverById } from '@/common/lovers-data.js'
import { getUser, saveUser, getProgress, initProgress } from '@/common/storage.js'

export default {
  data() {
    return {
      lover: null
    }
  },
  onLoad(options) {
    if (options.loverId) {
      this.lover = getLoverById(options.loverId)
    }
  },
  methods: {
    chooseLover() {
      if (!this.lover) return
      
      const user = getUser()
      if (!user) {
        uni.showToast({ title: '请先选择性别', icon: 'none' })
        return
      }
      
      user.current_lover_id = this.lover._id
      if (!user.lover_history.includes(this.lover._id)) {
        user.lover_history.push(this.lover._id)
      }
      saveUser(user)
      
      // Initialize progress if not exists
      let progress = getProgress(this.lover._id)
      if (!progress) {
        progress = initProgress(user._id, this.lover._id)
      }
      
      uni.redirectTo({
        url: '/pages/chat/index?loverId=' + this.lover._id
      })
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 140rpx;
}
.detail-header {
  width: 100%;
  height: 500rpx;
  position: relative;
}
.detail-avatar {
  width: 100%;
  height: 100%;
}
.detail-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx 32rpx;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
}
.detail-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}
.detail-persona {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  margin-top: 8rpx;
  display: block;
}
.detail-card {
  margin: -40rpx 24rpx 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  position: relative;
  z-index: 1;
  box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.06);
}
.info-section {
  margin-bottom: 32rpx;
}
.info-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
  padding-left: 16rpx;
  border-left: 6rpx solid #FF6B8A;
}
.info-row {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.info-label {
  width: 120rpx;
  font-size: 26rpx;
  color: #999;
}
.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.tag {
  font-size: 24rpx;
  color: #FF6B8A;
  background: rgba(255,107,138,0.1);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}
.desc-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}
.like-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.like-tag {
  font-size: 24rpx;
  color: #4CAF50;
  background: rgba(76,175,80,0.1);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}
.dislike-tag {
  font-size: 24rpx;
  color: #F44336;
  background: rgba(244,67,54,0.1);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}
.choose-btn {
  position: fixed;
  bottom: 60rpx;
  left: 60rpx;
  right: 60rpx;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #FF6B8A, #D63384);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 12rpx 30rpx rgba(255,107,138,0.4);
  z-index: 10;
}
</style>
