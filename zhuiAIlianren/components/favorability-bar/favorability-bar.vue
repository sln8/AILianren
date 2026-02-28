<template>
  <view class="fav-bar-container">
    <view class="fav-info">
      <text class="fav-stage">{{ stageEmoji }} {{ stageLabel }}</text>
      <text class="fav-value">好感度 {{ value }}</text>
    </view>
    <view class="fav-bar-bg">
      <view class="fav-bar-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>
    <text class="fav-next">下一阶段: {{ nextStageThreshold }}</text>
  </view>
</template>

<script>
import { STAGES, STAGE_LABELS, getNextThreshold } from '@/common/game-config.js'

export default {
  name: 'FavorabilityBar',
  props: {
    value: { type: Number, default: 0 },
    stage: { type: String, default: 'stranger' },
    nextStageThreshold: { type: Number, default: 100 }
  },
  computed: {
    stageInfo() {
      return STAGES[this.stage] || STAGES.stranger
    },
    stageLabel() {
      return STAGE_LABELS[this.stage] || '陌生人'
    },
    stageEmoji() {
      const emojis = {
        stranger: '🔴', acquaintance: '🟠', familiar: '🟡',
        friend: '🟢', ambiguous: '🔵', confessed: '💜',
        lover: '❤️', passionate: '💕', married: '💍',
        parent: '👶', growing_old: '🏠', finale: '🌅'
      }
      return emojis[this.stage] || '🔴'
    },
    progressPercent() {
      const stageMin = this.stageInfo.min
      const range = this.nextStageThreshold - stageMin
      if (range <= 0) return 100
      const progress = ((this.value - stageMin) / range) * 100
      return Math.min(100, Math.max(0, progress))
    }
  }
}
</script>

<style scoped>
.fav-bar-container {
  padding: 12rpx 24rpx;
  background: rgba(255,255,255,0.95);
}
.fav-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.fav-stage {
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
}
.fav-value {
  font-size: 22rpx;
  color: #FF6B8A;
  font-weight: 500;
}
.fav-bar-bg {
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}
.fav-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B8A, #FF8FA3);
  border-radius: 6rpx;
  transition: width 0.5s ease;
}
.fav-next {
  font-size: 20rpx;
  color: #bbb;
  margin-top: 4rpx;
  text-align: right;
  display: block;
}
</style>
