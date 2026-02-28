<template>
  <view class="event-container" v-if="event">
    <view class="event-badge">
      <text class="event-icon">🎭</text>
      <text class="event-text">{{ eventLabel }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'EventPopup',
  props: {
    event: { type: String, default: null }
  },
  computed: {
    eventLabel() {
      const labels = {
        rain_no_umbrella: '🌧 下雨了，忘带伞',
        exam_stress: '📚 考试压力大',
        new_cafe: '☕ 发现新咖啡店',
        share_book: '📖 分享一本好书',
        birthday: '🎂 生日惊喜',
        first_date: '💕 第一次约会',
        confession: '💝 表白时刻',
        proposal: '💍 求婚',
        wedding: '👰 婚礼',
        baby_born: '👶 宝宝出生',
        anniversary: '🎉 纪念日',
        argument: '⚡ 争吵事件',
        reconcile: '🤝 和好如初'
      }
      return labels[this.event] || '📌 特殊事件'
    }
  }
}
</script>

<style scoped>
.event-container {
  display: flex;
  justify-content: center;
  padding: 12rpx 24rpx;
}
.event-badge {
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  border-radius: 32rpx;
  padding: 12rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(255,152,0,0.15);
}
.event-icon {
  font-size: 28rpx;
}
.event-text {
  font-size: 24rpx;
  color: #E65100;
  font-weight: 500;
}
</style>
