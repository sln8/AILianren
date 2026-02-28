<template>
  <view class="gallery-page">
    <view class="gallery-header">
      <text class="gallery-title">选择你的{{ playerGender === 'male' ? '恋人' : '恋人' }}</text>
      <text class="gallery-sub">选择一位开始你的恋爱故事</text>
    </view>
    
    <scroll-view scroll-y class="lover-list">
      <lover-card
        v-for="lover in lovers"
        :key="lover._id"
        :lover="lover"
        @click="selectLover"
      />
    </scroll-view>
  </view>
</template>

<script>
import { getLoversByGender } from '@/common/lovers-data.js'
import LoverCard from '@/components/lover-card/lover-card.vue'

export default {
  components: { LoverCard },
  data() {
    return {
      playerGender: 'male',
      lovers: []
    }
  },
  onLoad(options) {
    this.playerGender = options.gender || 'male'
    this.lovers = getLoversByGender(this.playerGender)
  },
  methods: {
    selectLover(lover) {
      uni.navigateTo({
        url: '/pages/lover-detail/index?loverId=' + lover._id
      })
    }
  }
}
</script>

<style scoped>
.gallery-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F7 0%, #FFF0F3 100%);
  padding: 0 24rpx;
}
.gallery-header {
  text-align: center;
  padding: 40rpx 0 30rpx;
}
.gallery-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  display: block;
}
.gallery-sub {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}
.lover-list {
  height: calc(100vh - 160rpx);
  padding: 0 8rpx;
}
</style>
