<template>
	<view v-if="show" class="event-overlay" @tap.stop>
		<view class="event-card">
			<view class="event-header">
				<text class="event-title">{{ event.name }}</text>
			</view>
			<view class="event-body">
				<text class="event-description">{{ event.description }}</text>
			</view>
			<view class="event-footer">
				<view class="continue-btn" @tap="handleClose">
					<text class="continue-text">继续</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'EventPopup',
	props: {
		show: {
			type: Boolean,
			default: false
		},
		event: {
			type: Object,
			default: () => ({ name: '', description: '' })
		}
	},
	emits: ['close'],
	methods: {
		handleClose() {
			this.$emit('close');
		}
	}
}
</script>

<style scoped>
.event-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.event-card {
	width: 600rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: #1e1e3a;
	animation: popIn 0.3s ease-out;
}

@keyframes popIn {
	0% {
		transform: scale(0.8);
		opacity: 0;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

.event-header {
	padding: 36rpx 32rpx 28rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	text-align: center;
}

.event-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #ffffff;
}

.event-body {
	padding: 36rpx 32rpx;
}

.event-description {
	font-size: 28rpx;
	line-height: 44rpx;
	color: rgba(255, 255, 255, 0.85);
}

.event-footer {
	padding: 16rpx 32rpx 36rpx;
	display: flex;
	justify-content: center;
}

.continue-btn {
	width: 400rpx;
	height: 80rpx;
	border-radius: 40rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
}

.continue-text {
	font-size: 30rpx;
	font-weight: 600;
	color: #ffffff;
}
</style>
