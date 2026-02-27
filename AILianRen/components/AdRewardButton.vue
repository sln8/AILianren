<template>
	<view :class="['ad-reward-btn', disabled ? 'ad-reward-disabled' : '']" @tap="handleTap">
		<text class="ad-icon">🎬</text>
		<text class="ad-text">看广告 +800字</text>
	</view>
</template>

<script>
export default {
	name: 'AdRewardButton',
	props: {
		disabled: {
			type: Boolean,
			default: false
		}
	},
	emits: ['watch'],
	methods: {
		handleTap() {
			if (!this.disabled) {
				this.$emit('watch');
			}
		}
	}
}
</script>

<style scoped>
.ad-reward-btn {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 16rpx 36rpx;
	border-radius: 40rpx;
	background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
	box-shadow: 0 4rpx 16rpx rgba(253, 160, 133, 0.4);
}

.ad-reward-disabled {
	background: linear-gradient(135deg, #636e72 0%, #b2bec3 100%);
	box-shadow: none;
	opacity: 0.6;
}

.ad-icon {
	font-size: 32rpx;
	margin-right: 10rpx;
}

.ad-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #1a1a2e;
}

.ad-reward-disabled .ad-text {
	color: rgba(255, 255, 255, 0.5);
}
</style>
