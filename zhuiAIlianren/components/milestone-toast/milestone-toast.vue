<template>
  <view class="toast-container" v-if="visible">
    <view class="toast-content">
      <text class="toast-icon">🏆</text>
      <text class="toast-text">{{ message }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'MilestoneToast',
  props: {
    message: { type: String, default: '' },
    visible: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 200rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 998;
  animation: slideDown 0.4s ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-40rpx); }
  to { opacity: 1; transform: translateY(0); }
}
.toast-content {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 48rpx;
  padding: 16rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(255,165,0,0.3);
}
.toast-icon {
  font-size: 32rpx;
}
.toast-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}
</style>
