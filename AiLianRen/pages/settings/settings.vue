<template>
  <!-- 设置页面 - 游戏设置、角色信息、操作选项 -->
  <view class="settings-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="nav-back-icon">←</text>
      </view>
      <text class="nav-title">设置</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view class="settings-content" scroll-y>
      <!-- ===== 当前恋人信息卡片 ===== -->
      <view class="section-card">
        <text class="section-title">💕 当前恋人</text>
        <view class="lover-info" v-if="currentCharacter">
          <image class="lover-avatar" :src="currentCharacter.avatar" mode="aspectFill"></image>
          <view class="lover-details">
            <text class="lover-name">{{ currentCharacter.name }}</text>
            <text class="lover-personality">{{ currentCharacter.personality }}</text>
            <view class="lover-stats">
              <text class="stat-item">❤️ 好感度: {{ loverData.favorScore || 0 }}</text>
              <text class="stat-item">📊 阶段: {{ loverData.stageName || '陌生人' }}</text>
              <text class="stat-item">📅 在一起: {{ loverData.daysTogether || 1 }}天</text>
              <text class="stat-item">💬 对话: {{ loverData.totalRounds || 0 }}轮</text>
            </view>
          </view>
        </view>
      </view>

      <!-- ===== 字数信息 ===== -->
      <view class="section-card">
        <text class="section-title">📝 字数信息</text>
        <view class="info-row">
          <text class="info-label">当前字数余额</text>
          <text class="info-value highlight">{{ userInfo.wordsBalance || 0 }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">累计使用字数</text>
          <text class="info-value">{{ userInfo.wordsTotalUsed || 0 }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">今日已看广告</text>
          <text class="info-value">{{ dailyData.adsWatched || 0 }} / {{ adLimit }}</text>
        </view>
      </view>

      <!-- ===== 游戏设置 ===== -->
      <view class="section-card">
        <text class="section-title">⚙️ 游戏设置</text>
        <view class="setting-row" @tap="toggleTypingEffect">
          <text class="setting-label">打字效果</text>
          <view class="setting-switch" :class="{ on: settings.typingEffect }">
            <view class="switch-thumb"></view>
          </view>
        </view>
      </view>

      <!-- ===== 操作选项 ===== -->
      <view class="section-card">
        <text class="section-title">🎮 操作</text>
        <view class="action-row" @tap="changeLover">
          <text class="action-text">💔 更换恋人</text>
          <text class="action-hint">需观看3次广告</text>
        </view>
        <view class="action-row" @tap="viewAllMemories">
          <text class="action-text">📖 回忆录</text>
          <text class="action-hint">查看关键回忆</text>
        </view>
        <view class="action-row danger" @tap="confirmReset">
          <text class="action-text danger-text">🗑️ 重置游戏</text>
          <text class="action-hint">清除所有数据</text>
        </view>
      </view>

      <!-- ===== 关于 ===== -->
      <view class="section-card">
        <text class="section-title">ℹ️ 关于</text>
        <view class="info-row">
          <text class="info-label">游戏名称</text>
          <text class="info-value">这些年我们追过的AI恋人</text>
        </view>
        <view class="info-row">
          <text class="info-label">版本</text>
          <text class="info-value">v1.0.0</text>
        </view>
        <view class="info-row">
          <text class="info-label">技术栈</text>
          <text class="info-value">uni-app + Vue3</text>
        </view>
      </view>

      <!-- 底部间距 -->
      <view style="height: 60rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
/**
 * 设置页面组件
 * 提供游戏设置、角色信息查看、操作选项等功能
 * 包括：打字效果开关、更换恋人、重置游戏等
 */
import { getCharacterById } from '@/config/characters.js'
import { AD_CONFIG } from '@/config/api.js'
import {
  getUserInfo, saveUserInfo,
  getCurrentLover, saveCurrentLover,
  getGameSettings, saveGameSettings,
  getDailyData, clearAllData
} from '@/utils/storage.js'
import { showRewardedVideoAd } from '@/utils/ad-manager.js'

export default {
  data() {
    return {
      userInfo: {},            // 用户信息
      loverData: {},           // 恋人数据
      currentCharacter: null,  // 当前角色信息
      settings: {},            // 游戏设置
      dailyData: {},           // 每日数据
      adLimit: AD_CONFIG.DAILY_AD_LIMIT  // 每日广告上限
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  methods: {
    /**
     * 加载所有数据
     */
    loadData() {
      this.userInfo = getUserInfo() || {}
      this.loverData = getCurrentLover() || {}
      this.settings = getGameSettings()
      this.dailyData = getDailyData()

      if (this.loverData.characterId) {
        this.currentCharacter = getCharacterById(this.loverData.characterId)
      }
    },

    /**
     * 返回对话页面
     */
    goBack() {
      uni.navigateBack()
    },

    /**
     * 切换打字效果开关
     */
    toggleTypingEffect() {
      this.settings.typingEffect = !this.settings.typingEffect
      saveGameSettings(this.settings)
      uni.showToast({
        title: this.settings.typingEffect ? '已开启打字效果' : '已关闭打字效果',
        icon: 'none'
      })
    },

    /**
     * 更换恋人
     * 需要观看3次广告才能更换
     */
    async changeLover() {
      // 确认提示
      uni.showModal({
        title: '更换恋人',
        content: `确定要离开${this.currentCharacter ? this.currentCharacter.name : '当前恋人'}吗？需要观看${AD_CONFIG.CHANGE_LOVER_AD_COUNT}次广告才能更换。`,
        success: async (res) => {
          if (res.confirm) {
            // 观看广告
            let adsWatched = 0
            for (let i = 0; i < AD_CONFIG.CHANGE_LOVER_AD_COUNT; i++) {
              const adResult = await showRewardedVideoAd()
              if (adResult.success) {
                adsWatched++
                if (adsWatched < AD_CONFIG.CHANGE_LOVER_AD_COUNT) {
                  uni.showToast({
                    title: `已完成 ${adsWatched}/${AD_CONFIG.CHANGE_LOVER_AD_COUNT}`,
                    icon: 'none'
                  })
                  // 等待一下再弹下一个广告
                  await new Promise(resolve => setTimeout(resolve, 1500))
                }
              } else {
                uni.showToast({
                  title: '需要完整观看所有广告才能更换',
                  icon: 'none'
                })
                return
              }
            }

            // 广告全部看完，清除当前恋人并跳转选人页
            this.loverData.status = 'archived'
            saveCurrentLover(this.loverData)
            this.userInfo.currentLoverId = null
            saveUserInfo(this.userInfo)

            uni.reLaunch({
              url: '/pages/select-lover/select-lover'
            })
          }
        }
      })
    },

    /**
     * 查看回忆录
     */
    viewAllMemories() {
      const memories = this.loverData.eventsCompleted || []
      if (memories.length === 0) {
        uni.showToast({
          title: '还没有特别的回忆呢，继续聊天吧~',
          icon: 'none'
        })
        return
      }

      const memoryText = memories.join('、')
      uni.showModal({
        title: '📖 回忆录',
        content: `你和${this.currentCharacter ? this.currentCharacter.name : 'TA'}一起经历了：${memoryText}`,
        showCancel: false,
        confirmText: '珍藏'
      })
    },

    /**
     * 确认重置游戏
     */
    confirmReset() {
      uni.showModal({
        title: '⚠️ 重置游戏',
        content: '确定要重置所有游戏数据吗？这个操作不可恢复！',
        confirmColor: '#ff4444',
        success: (res) => {
          if (res.confirm) {
            // 二次确认
            uni.showModal({
              title: '最后确认',
              content: '真的要删除所有数据吗？包括你和恋人的所有回忆...',
              confirmColor: '#ff4444',
              confirmText: '确认删除',
              success: (res2) => {
                if (res2.confirm) {
                  clearAllData()
                  uni.reLaunch({
                    url: '/pages/welcome/welcome'
                  })
                }
              }
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
/* ==================== 页面整体 ==================== */
.settings-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d1b3e 0%, #1a0533 100%);
}

/* ==================== 导航栏 ==================== */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 30rpx 20rpx;
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.nav-back-icon {
  font-size: 36rpx;
  color: #ffffff;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.nav-placeholder {
  width: 64rpx;
}

/* ==================== 内容区域 ==================== */
.settings-content {
  height: calc(100vh - 144rpx);
  padding: 20rpx 24rpx;
}

/* ==================== 区块卡片 ==================== */
.section-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #ffffff;
  display: block;
  margin-bottom: 20rpx;
}

/* ==================== 恋人信息 ==================== */
.lover-info {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.lover-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 107, 157, 0.4);
  flex-shrink: 0;
}

.lover-details {
  flex: 1;
}

.lover-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
  display: block;
  margin-bottom: 4rpx;
}

.lover-personality {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 12rpx;
}

.lover-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.stat-item {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

/* ==================== 信息行 ==================== */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}

.info-value {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.info-value.highlight {
  color: #ff9dbd;
  font-weight: bold;
  font-size: 30rpx;
}

/* ==================== 设置行 ==================== */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}

.setting-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 自定义开关 */
.setting-switch {
  width: 88rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24rpx;
  position: relative;
  transition: background 0.3s ease;
}

.setting-switch.on {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
}

.switch-thumb {
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: 36rpx;
  height: 36rpx;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.setting-switch.on .switch-thumb {
  transform: translateX(40rpx);
}

/* ==================== 操作行 ==================== */
.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
}

.action-row:last-child {
  border-bottom: none;
}

.action-row:active {
  opacity: 0.6;
}

.action-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.action-hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.3);
}

.action-row.danger .action-text {
  color: #ff6b6b;
}

.danger-text {
  color: #ff6b6b;
}
</style>
