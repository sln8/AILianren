<template>
  <view class="transition-mask" @click="$emit('complete')">
    <view class="transition-content">
      <view class="transition-emoji">{{ toEmoji }}</view>
      <text class="transition-title">关系升级！</text>
      <text class="transition-from">{{ fromLabel }}</text>
      <text class="transition-arrow">▼</text>
      <text class="transition-to">{{ toLabel }}</text>
      <text class="transition-msg">与{{ loverName }}的关系更近了一步</text>
      <text class="transition-tap">点击任意位置继续</text>
    </view>
  </view>
</template>

<script>
import { STAGE_LABELS } from '@/common/game-config.js'

export default {
  name: 'StageTransition',
  props: {
    fromStage: { type: String, default: 'stranger' },
    toStage: { type: String, default: 'acquaintance' },
    loverName: { type: String, default: '' }
  },
  emits: ['complete'],
  computed: {
    fromLabel() {
      return STAGE_LABELS[this.fromStage] || '陌生人'
    },
    toLabel() {
      return STAGE_LABELS[this.toStage] || '认识'
    },
    toEmoji() {
      const emojis = {
        stranger: '🔴', acquaintance: '🟠', familiar: '🟡',
        friend: '🟢', ambiguous: '🔵', confessed: '💜',
        lover: '❤️', passionate: '💕', married: '💍',
        parent: '👶', growing_old: '🏠', finale: '🌅'
      }
      return emojis[this.toStage] || '🎉'
    }
  }
}
</script>

<style scoped>
.transition-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.transition-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInScale 0.5s ease;
}
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
.transition-emoji {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}
.transition-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 32rpx;
}
.transition-from {
  font-size: 32rpx;
  color: rgba(255,255,255,0.7);
}
.transition-arrow {
  font-size: 36rpx;
  color: #FF6B8A;
  margin: 12rpx 0;
}
.transition-to {
  font-size: 40rpx;
  font-weight: 700;
  color: #FF6B8A;
  margin-bottom: 24rpx;
}
.transition-msg {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  margin-bottom: 48rpx;
}
.transition-tap {
  font-size: 24rpx;
  color: rgba(255,255,255,0.4);
}
</style>
