<template>
  <view class="profile-page">
    <view class="profile-header">
      <view class="user-info">
        <image src="/static/logo.png" class="user-avatar" mode="aspectFill" />
        <view class="user-text">
          <text class="user-name">{{ user.nickname || '玩家' }}</text>
          <text class="user-id">ID: {{ user._id ? user._id.slice(-8) : '' }}</text>
        </view>
      </view>
    </view>
    
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ user.word_balance || 0 }}</text>
        <text class="stat-label">剩余字数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ user.total_words_used || 0 }}</text>
        <text class="stat-label">已用字数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ user.consecutive_login_days || 0 }}</text>
        <text class="stat-label">连续登录</text>
      </view>
    </view>
    
    <view class="menu-list">
      <view class="menu-item" @click="goToChat" v-if="user.current_lover_id">
        <text class="menu-icon">💬</text>
        <text class="menu-text">继续对话</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="changeLover">
        <text class="menu-icon">💕</text>
        <text class="menu-text">更换恋人</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToSettings">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="showAbout">
        <text class="menu-icon">ℹ️</text>
        <text class="menu-text">关于游戏</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item danger" @click="resetGame">
        <text class="menu-icon">🗑️</text>
        <text class="menu-text">重置游戏</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getUser, clearAllData } from '@/common/storage.js'

export default {
  data() {
    return {
      user: {}
    }
  },
  onShow() {
    this.user = getUser() || {}
  },
  methods: {
    goToChat() {
      if (this.user.current_lover_id) {
        uni.navigateTo({ url: '/pages/chat/index?loverId=' + this.user.current_lover_id })
      }
    },
    changeLover() {
      const gender = this.user.gender || 'male'
      uni.navigateTo({ url: '/pages/lover-gallery/index?gender=' + gender })
    },
    goToSettings() {
      uni.navigateTo({ url: '/pages/settings/index' })
    },
    showAbout() {
      uni.showModal({
        title: '关于游戏',
        content: '《这些年我们追过的AI恋人》\n版本 1.0.0\n\n一款AI互动恋爱养成游戏，通过自由对话，体验完整的恋爱人生。',
        showCancel: false
      })
    },
    resetGame() {
      uni.showModal({
        title: '确认重置',
        content: '重置将清除所有游戏数据，包括对话记录和游戏进度，此操作不可恢复！',
        success: (res) => {
          if (res.confirm) {
            clearAllData()
            uni.reLaunch({ url: '/pages/index/index' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
}
.profile-header {
  background: linear-gradient(135deg, #FF6B8A, #D63384);
  padding: 80rpx 40rpx 60rpx;
}
.user-info {
  display: flex;
  align-items: center;
}
.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.5);
}
.user-text {
  margin-left: 24rpx;
}
.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  display: block;
}
.user-id {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 8rpx;
  display: block;
}
.stats-card {
  margin: -30rpx 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #FF6B8A;
  display: block;
}
.stat-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}
.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
}
.menu-list {
  margin: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item.danger .menu-text {
  color: #F44336;
}
.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}
.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}
.menu-arrow {
  font-size: 36rpx;
  color: #ccc;
}
</style>
