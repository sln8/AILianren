<template>
  <view class="welcome-page">
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <view class="content">
      <view class="logo-area">
        <image src="/static/logo.png" class="logo" mode="aspectFit" />
      </view>
      
      <text class="title">这些年我们追过的</text>
      <text class="title-highlight">AI恋人</text>
      <text class="subtitle">用心对话，用爱书写你的恋爱故事</text>
      
      <view class="start-area">
        <button class="start-btn" @click="startGame">
          {{ hasUser ? '继续游戏' : '开始游戏' }}
        </button>
        
        <view v-if="dailyReward" class="daily-reward">
          <text class="reward-text">🎁 每日登录奖励: +{{ dailyReward.daily }}字</text>
          <text v-if="dailyReward.bonus > 0" class="reward-bonus">
            🔥 连续登录{{ dailyReward.consecutive_days }}天额外奖励: +{{ dailyReward.bonus }}字
          </text>
        </view>
      </view>
      
      <text class="version">v1.0.0</text>
    </view>
  </view>
</template>

<script>
import { getUser, handleDailyLogin, claimDailyFree } from '@/common/storage.js'

export default {
  data() {
    return {
      hasUser: false,
      dailyReward: null
    }
  },
  onShow() {
    const user = getUser()
    this.hasUser = !!user
    
    if (user) {
      handleDailyLogin()
      if (!user.daily_free_claimed) {
        this.dailyReward = claimDailyFree()
      }
    }
  },
  methods: {
    startGame() {
      const user = getUser()
      if (user && user.current_lover_id) {
        uni.navigateTo({ url: '/pages/chat/index?loverId=' + user.current_lover_id })
      } else if (user) {
        uni.navigateTo({ url: '/pages/gender-select/index' })
      } else {
        uni.navigateTo({ url: '/pages/gender-select/index' })
      }
    }
  }
}
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F7 0%, #FFE8EE 50%, #FFD6E0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.bg-decoration {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
}
.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}
.circle-1 {
  width: 400rpx; height: 400rpx;
  background: #FF6B8A;
  top: -100rpx; right: -100rpx;
}
.circle-2 {
  width: 300rpx; height: 300rpx;
  background: #FF8FA3;
  bottom: 200rpx; left: -80rpx;
}
.circle-3 {
  width: 200rpx; height: 200rpx;
  background: #FFB3C1;
  top: 300rpx; right: 50rpx;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  padding: 0 60rpx;
}
.logo-area {
  margin-bottom: 40rpx;
}
.logo {
  width: 180rpx;
  height: 180rpx;
  border-radius: 40rpx;
  box-shadow: 0 12rpx 40rpx rgba(255,107,138,0.3);
}
.title {
  font-size: 40rpx;
  color: #666;
  font-weight: 300;
}
.title-highlight {
  font-size: 56rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #FF6B8A, #D63384);
  -webkit-background-clip: text;
  color: transparent;
  margin-top: 8rpx;
}
.subtitle {
  font-size: 26rpx;
  color: #999;
  margin-top: 20rpx;
  letter-spacing: 2rpx;
}
.start-area {
  margin-top: 80rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.start-btn {
  width: 400rpx;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #FF6B8A, #D63384);
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 12rpx 30rpx rgba(255,107,138,0.4);
  letter-spacing: 4rpx;
}
.start-btn:active {
  transform: scale(0.95);
  box-shadow: 0 6rpx 15rpx rgba(255,107,138,0.4);
}
.daily-reward {
  margin-top: 32rpx;
  background: rgba(255,255,255,0.8);
  border-radius: 20rpx;
  padding: 20rpx 32rpx;
  text-align: center;
}
.reward-text {
  font-size: 26rpx;
  color: #FF6B8A;
  display: block;
}
.reward-bonus {
  font-size: 24rpx;
  color: #E65100;
  margin-top: 8rpx;
  display: block;
}
.version {
  margin-top: 80rpx;
  font-size: 22rpx;
  color: #ccc;
}
</style>
