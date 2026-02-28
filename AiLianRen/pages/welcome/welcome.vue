<template>
  <!-- 欢迎页 - 游戏入口，选择性别和昵称 -->
  <view class="welcome-page">
    <!-- 背景装饰粒子效果 -->
    <view class="bg-particles">
      <view v-for="i in 20" :key="i" class="particle" :class="'particle-' + i"></view>
    </view>

    <!-- 主内容区域 -->
    <view class="content-wrapper">
      <!-- Logo区域 -->
      <view class="logo-section">
        <image class="game-logo" src="/static/logo.png" mode="aspectFit"></image>
        <text class="game-title">这些年我们追过的</text>
        <text class="game-title-highlight">AI恋人</text>
        <text class="game-subtitle">一场跨越一生的AI恋爱之旅</text>
      </view>

      <!-- 昵称输入 -->
      <view class="nickname-section">
        <text class="section-label">你的名字</text>
        <input
          class="nickname-input"
          v-model="nickname"
          placeholder="请输入你的昵称"
          maxlength="8"
          :focus="false"
        />
      </view>

      <!-- 性别选择 -->
      <view class="gender-section">
        <text class="section-label">选择你的性别</text>
        <view class="gender-options">
          <view
            class="gender-card"
            :class="{ active: gender === 'male' }"
            @tap="selectGender('male')"
          >
            <text class="gender-icon">👨</text>
            <text class="gender-text">男生</text>
            <view v-if="gender === 'male'" class="check-mark">✓</view>
          </view>
          <view
            class="gender-card"
            :class="{ active: gender === 'female' }"
            @tap="selectGender('female')"
          >
            <text class="gender-icon">👩</text>
            <text class="gender-text">女生</text>
            <view v-if="gender === 'female'" class="check-mark">✓</view>
          </view>
        </view>
      </view>

      <!-- 开始按钮 -->
      <view class="start-section">
        <view
          class="start-btn"
          :class="{ disabled: !canStart }"
          @tap="startGame"
        >
          <text class="start-btn-text">开始旅程 ❤️</text>
        </view>
        <text class="version-text">v1.0</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 欢迎页面组件
 * 游戏的第一个页面，负责：
 * 1. 展示游戏品牌和介绍
 * 2. 让玩家输入昵称
 * 3. 让玩家选择性别
 * 4. 保存玩家基础信息后跳转到选择恋人页面
 */
import { saveUserInfo, getUserInfo } from '@/utils/storage.js'
import { GAME_CONFIG } from '@/config/api.js'

export default {
  data() {
    return {
      // 玩家昵称，默认"旅人"
      nickname: '旅人',
      // 玩家性别，null表示未选择
      gender: null
    }
  },

  computed: {
    /**
     * 判断是否可以开始游戏
     * 需要昵称不为空且已选择性别
     */
    canStart() {
      return this.nickname.trim().length > 0 && this.gender !== null
    }
  },

  onLoad() {
    // 检查是否已有用户数据，如有则直接跳转
    const userInfo = getUserInfo()
    if (userInfo && userInfo.gender && userInfo.currentLoverId) {
      // 已有恋人，直接进入对话页
      uni.reLaunch({
        url: '/pages/chat/chat'
      })
    } else if (userInfo && userInfo.gender) {
      // 已选性别但未选恋人，跳转选人页
      uni.reLaunch({
        url: '/pages/select-lover/select-lover'
      })
    }
  },

  methods: {
    /**
     * 选择性别
     * @param {string} g - 性别 'male' | 'female'
     */
    selectGender(g) {
      this.gender = g
      // 轻触反馈
      uni.vibrateShort({ type: 'light' })
    },

    /**
     * 开始游戏
     * 保存用户信息并跳转到选择恋人页面
     */
    startGame() {
      if (!this.canStart) {
        uni.showToast({
          title: '请选择性别并输入昵称',
          icon: 'none'
        })
        return
      }

      // 构建用户信息对象
      const userInfo = {
        nickname: this.nickname.trim(),
        gender: this.gender,
        wordsBalance: GAME_CONFIG.INITIAL_WORDS,
        wordsTotalUsed: 0,
        currentLoverId: null,
        totalLoversPlayed: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }

      // 保存到本地存储
      saveUserInfo(userInfo)

      // 跳转到选择恋人页面
      uni.navigateTo({
        url: '/pages/select-lover/select-lover'
      })
    }
  }
}
</script>

<style scoped>
/* ==================== 页面整体样式 ==================== */
.welcome-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0533 0%, #0d1b3e 50%, #0a1628 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* ==================== 背景粒子装饰 ==================== */
.bg-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 6rpx;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

/* 生成多个粒子的位置和动画延迟 */
.particle-1 { top: 10%; left: 20%; animation-delay: 0s; }
.particle-2 { top: 20%; left: 80%; animation-delay: 1s; }
.particle-3 { top: 30%; left: 40%; animation-delay: 2s; }
.particle-4 { top: 40%; left: 60%; animation-delay: 0.5s; }
.particle-5 { top: 50%; left: 10%; animation-delay: 1.5s; }
.particle-6 { top: 60%; left: 90%; animation-delay: 2.5s; }
.particle-7 { top: 70%; left: 30%; animation-delay: 3s; }
.particle-8 { top: 80%; left: 70%; animation-delay: 0.8s; }
.particle-9 { top: 15%; left: 50%; animation-delay: 1.8s; }
.particle-10 { top: 85%; left: 15%; animation-delay: 2.8s; }
.particle-11 { top: 25%; left: 65%; animation-delay: 3.5s; }
.particle-12 { top: 45%; left: 85%; animation-delay: 0.3s; }
.particle-13 { top: 55%; left: 25%; animation-delay: 1.3s; }
.particle-14 { top: 65%; left: 55%; animation-delay: 2.3s; }
.particle-15 { top: 75%; left: 45%; animation-delay: 3.3s; }
.particle-16 { top: 35%; left: 15%; animation-delay: 4s; }
.particle-17 { top: 90%; left: 50%; animation-delay: 0.6s; }
.particle-18 { top: 5%; left: 35%; animation-delay: 1.6s; }
.particle-19 { top: 95%; left: 75%; animation-delay: 2.6s; }
.particle-20 { top: 50%; left: 50%; animation-delay: 3.6s; }

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-30rpx) scale(1.5); opacity: 0.8; }
}

/* ==================== 主内容区域 ==================== */
.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 60rpx 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ==================== Logo区域 ==================== */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.game-logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 30rpx;
  border-radius: 30rpx;
  box-shadow: 0 8rpx 40rpx rgba(255, 107, 157, 0.3);
}

.game-title {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 4rpx;
  margin-bottom: 8rpx;
}

.game-title-highlight {
  font-size: 56rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #ff6b9d, #c084fc, #60a5fa);
  -webkit-background-clip: text;
  color: transparent;
  letter-spacing: 8rpx;
  margin-bottom: 16rpx;
}

.game-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2rpx;
}

/* ==================== 昵称输入区域 ==================== */
.nickname-section {
  width: 100%;
  margin-bottom: 50rpx;
}

.section-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16rpx;
  display: block;
  padding-left: 10rpx;
}

.nickname-input {
  width: 100%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
  color: #ffffff;
  box-sizing: border-box;
}

/* ==================== 性别选择区域 ==================== */
.gender-section {
  width: 100%;
  margin-bottom: 60rpx;
}

.gender-options {
  display: flex;
  justify-content: space-between;
  gap: 30rpx;
}

.gender-card {
  flex: 1;
  height: 180rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.gender-card.active {
  background: rgba(255, 107, 157, 0.15);
  border-color: #ff6b9d;
  box-shadow: 0 4rpx 30rpx rgba(255, 107, 157, 0.25);
  transform: scale(1.02);
}

.gender-icon {
  font-size: 60rpx;
  margin-bottom: 12rpx;
}

.gender-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.gender-card.active .gender-text {
  color: #ff6b9d;
  font-weight: bold;
}

.check-mark {
  position: absolute;
  top: 12rpx;
  right: 16rpx;
  width: 36rpx;
  height: 36rpx;
  background: #ff6b9d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22rpx;
  font-weight: bold;
}

/* ==================== 开始按钮 ==================== */
.start-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.start-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 40rpx rgba(255, 107, 157, 0.4);
  transition: all 0.3s ease;
}

.start-btn:active {
  transform: scale(0.96);
  box-shadow: 0 4rpx 20rpx rgba(255, 107, 157, 0.3);
}

.start-btn.disabled {
  opacity: 0.4;
  box-shadow: none;
}

.start-btn-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
  letter-spacing: 4rpx;
}

.version-text {
  margin-top: 30rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.2);
}
</style>
