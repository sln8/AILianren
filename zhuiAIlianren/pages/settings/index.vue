<template>
  <view class="settings-page">
    <view class="settings-group">
      <text class="group-title">游戏设置</text>
      
      <view class="setting-item">
        <text class="setting-label">音效</text>
        <switch :checked="settings.sound" @change="toggleSound" color="#FF6B8A" />
      </view>
      
      <view class="setting-item">
        <text class="setting-label">背景音乐</text>
        <switch :checked="settings.music" @change="toggleMusic" color="#FF6B8A" />
      </view>
      
      <view class="setting-item">
        <text class="setting-label">消息通知</text>
        <switch :checked="settings.notification" @change="toggleNotification" color="#FF6B8A" />
      </view>
    </view>
    
    <view class="settings-group">
      <text class="group-title">关于</text>
      
      <view class="setting-item" @click="showPrivacy">
        <text class="setting-label">隐私政策</text>
        <text class="setting-arrow">›</text>
      </view>
      
      <view class="setting-item" @click="showTerms">
        <text class="setting-label">用户协议</text>
        <text class="setting-arrow">›</text>
      </view>
      
      <view class="setting-item">
        <text class="setting-label">版本</text>
        <text class="setting-value">v1.0.0</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getSettings, saveSettings } from '@/common/storage.js'

export default {
  data() {
    return {
      settings: { sound: true, music: true, notification: true }
    }
  },
  onLoad() {
    this.settings = getSettings()
  },
  methods: {
    toggleSound(e) {
      this.settings.sound = e.detail.value
      saveSettings(this.settings)
    },
    toggleMusic(e) {
      this.settings.music = e.detail.value
      saveSettings(this.settings)
    },
    toggleNotification(e) {
      this.settings.notification = e.detail.value
      saveSettings(this.settings)
    },
    showPrivacy() {
      uni.showModal({
        title: '隐私政策',
        content: '我们重视您的隐私。本游戏仅收集必要的游戏数据用于提供服务，不会将您的个人信息分享给第三方。对话数据仅用于游戏体验优化。您有权随时申请删除您的所有数据。',
        showCancel: false
      })
    },
    showTerms() {
      uni.showModal({
        title: '用户协议',
        content: '欢迎使用《这些年我们追过的AI恋人》。使用本游戏即表示您同意遵守以下条款：\n1. 本游戏仅供娱乐目的\n2. 游戏中的AI角色为虚拟角色\n3. 请勿发送违规内容\n4. 我们保留修改游戏规则的权利',
        showCancel: false
      })
    }
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.settings-group {
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
}
.group-title {
  font-size: 26rpx;
  color: #999;
  padding: 24rpx 32rpx 8rpx;
  display: block;
}
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.setting-item:last-child {
  border-bottom: none;
}
.setting-label {
  font-size: 30rpx;
  color: #333;
}
.setting-arrow {
  font-size: 36rpx;
  color: #ccc;
}
.setting-value {
  font-size: 26rpx;
  color: #999;
}
</style>
