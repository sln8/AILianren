<template>
  <view class="bubble-wrapper" :class="{ 'is-user': role === 'user' }">
    <image v-if="role === 'assistant'" :src="avatar" class="bubble-avatar" mode="aspectFill" />
    <view class="bubble" :class="role === 'user' ? 'bubble-right' : 'bubble-left'">
      <text class="bubble-text">{{ content }}</text>
      <text class="bubble-time">{{ formatTime }}</text>
    </view>
    <image v-if="role === 'user'" :src="avatar || '/static/logo.png'" class="bubble-avatar" mode="aspectFill" />
  </view>
</template>

<script>
export default {
  name: 'ChatBubble',
  props: {
    content: { type: String, default: '' },
    role: { type: String, default: 'user' },
    avatar: { type: String, default: '' },
    timestamp: { type: String, default: '' }
  },
  computed: {
    formatTime() {
      if (!this.timestamp) return ''
      const d = new Date(this.timestamp)
      const h = d.getHours().toString().padStart(2, '0')
      const m = d.getMinutes().toString().padStart(2, '0')
      return `${h}:${m}`
    }
  }
}
</script>

<style scoped>
.bubble-wrapper {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 16rpx 24rpx;
}
.bubble-wrapper.is-user {
  flex-direction: row;
  justify-content: flex-end;
}
.bubble-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.bubble {
  max-width: 65%;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  margin: 0 16rpx;
  position: relative;
}
.bubble-left {
  background: #fff;
  border-top-left-radius: 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.bubble-right {
  background: linear-gradient(135deg, #FF6B8A, #FF8FA3);
  border-top-right-radius: 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(255,107,138,0.3);
}
.bubble-right .bubble-text {
  color: #fff;
}
.bubble-right .bubble-time {
  color: rgba(255,255,255,0.7);
}
.bubble-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
  word-break: break-all;
}
.bubble-time {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
  text-align: right;
}
</style>
