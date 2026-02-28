<template>
  <view class="modal-mask" @click.stop>
    <view class="modal-content">
      <view class="modal-icon">✨</view>
      <text class="modal-title">字数不足</text>
      <text class="modal-desc">{{ loverName }}还有话想对你说…</text>
      <text class="modal-desc2">观看广告继续对话？</text>
      <view class="modal-buttons">
        <button class="btn-ad" @click="$emit('watch-ad')">
          🎬 看广告获得500字
        </button>
        <button class="btn-later" @click="$emit('close')">
          明天再来（每日赠送80字）
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AdModal',
  props: {
    loverName: { type: String, default: '' }
  },
  emits: ['watch-ad', 'close']
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-content {
  width: 80%;
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  text-align: center;
}
.modal-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}
.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}
.modal-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}
.modal-desc2 {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 32rpx;
}
.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.btn-ad {
  background: linear-gradient(135deg, #FF6B8A, #FF8FA3);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  padding: 20rpx 0;
  font-size: 30rpx;
  font-weight: 600;
}
.btn-later {
  background: #f5f5f5;
  color: #999;
  border: none;
  border-radius: 48rpx;
  padding: 20rpx 0;
  font-size: 26rpx;
}
</style>
