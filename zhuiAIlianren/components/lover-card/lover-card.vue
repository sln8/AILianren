<template>
  <view class="lover-card" @click="$emit('click', lover)">
    <view class="card-image-wrap">
      <image :src="lover.avatar_image" class="card-avatar" mode="aspectFill" />
      <view class="card-age">{{ lover.age }}岁</view>
    </view>
    <view class="card-info">
      <text class="card-name">{{ lover.name }}</text>
      <text class="card-persona">{{ lover.persona }}</text>
      <view class="card-tags">
        <text class="tag" v-for="(tag, i) in lover.personality_tags" :key="i">#{{ tag }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LoverCard',
  props: {
    lover: { type: Object, default: () => ({}) }
  },
  emits: ['click']
}
</script>

<style scoped>
.lover-card {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.08);
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx;
  transition: all 0.3s;
}
.lover-card:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.12);
}
.card-image-wrap {
  position: relative;
  flex-shrink: 0;
}
.card-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 20rpx;
}
.card-age {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(255,107,138,0.9);
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 10rpx 0 20rpx 0;
}
.card-info {
  flex: 1;
  margin-left: 24rpx;
}
.card-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  display: block;
}
.card-persona {
  font-size: 26rpx;
  color: #888;
  margin-top: 6rpx;
  display: block;
}
.card-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 12rpx;
  gap: 8rpx;
}
.tag {
  font-size: 22rpx;
  color: #FF6B8A;
  background: rgba(255,107,138,0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
</style>
