<template>
  <view class="wb-container" @click="$emit('click')">
    <text class="wb-icon">✏️</text>
    <text class="wb-count">{{ balance }}字</text>
  </view>
</template>

<script>
export default {
  name: 'WordBalance',
  props: {
    balance: { type: Number, default: 0 }
  },
  emits: ['click']
}
</script>

<style scoped>
.wb-container {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: rgba(255,107,138,0.1);
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}
.wb-icon {
  font-size: 24rpx;
}
.wb-count {
  font-size: 24rpx;
  color: #FF6B8A;
  font-weight: 600;
}
</style>
