<template>
  <view class="gender-page">
    <view class="header">
      <text class="header-title">选择你的性别</text>
      <text class="header-sub">我们将为你匹配最适合的恋人</text>
    </view>
    
    <view class="gender-cards">
      <view class="gender-card male-card" :class="{ active: selected === 'male' }" @click="selected = 'male'">
        <text class="gender-emoji">👨</text>
        <text class="gender-label">男生</text>
        <text class="gender-desc">遇见温柔的她</text>
        <view class="check-mark" v-if="selected === 'male'">✓</view>
      </view>
      
      <view class="gender-card female-card" :class="{ active: selected === 'female' }" @click="selected = 'female'">
        <text class="gender-emoji">👩</text>
        <text class="gender-label">女生</text>
        <text class="gender-desc">遇见心动的他</text>
        <view class="check-mark" v-if="selected === 'female'">✓</view>
      </view>
    </view>
    
    <button class="confirm-btn" :disabled="!selected" @click="confirmGender">
      确认选择
    </button>
  </view>
</template>

<script>
import { getUser, initUser, saveUser } from '@/common/storage.js'

export default {
  data() {
    return {
      selected: ''
    }
  },
  methods: {
    confirmGender() {
      if (!this.selected) return
      
      let user = getUser()
      if (user) {
        user.gender = this.selected
        saveUser(user)
      } else {
        user = initUser(this.selected)
      }
      
      uni.navigateTo({
        url: '/pages/lover-gallery/index?gender=' + this.selected
      })
    }
  }
}
</script>

<style scoped>
.gender-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F7 0%, #FFE8EE 100%);
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  text-align: center;
  margin-bottom: 80rpx;
  margin-top: 60rpx;
}
.header-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #333;
  display: block;
}
.header-sub {
  font-size: 26rpx;
  color: #999;
  margin-top: 16rpx;
  display: block;
}
.gender-cards {
  display: flex;
  gap: 32rpx;
  margin-bottom: 80rpx;
}
.gender-card {
  width: 300rpx;
  padding: 60rpx 0;
  border-radius: 32rpx;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.06);
  position: relative;
  transition: all 0.3s;
  border: 4rpx solid transparent;
}
.gender-card.active {
  border-color: #FF6B8A;
  box-shadow: 0 8rpx 30rpx rgba(255,107,138,0.2);
  transform: scale(1.02);
}
.gender-emoji {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}
.gender-label {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}
.gender-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
.check-mark {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 44rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  background: #FF6B8A;
  color: #fff;
  border-radius: 50%;
  font-size: 28rpx;
  font-weight: 700;
}
.confirm-btn {
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
}
.confirm-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}
</style>
