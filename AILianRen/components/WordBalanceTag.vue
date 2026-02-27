<template>
	<view class="word-balance-tag">
		<text class="pen-icon">✏️</text>
		<text :class="['balance-number', balance < 500 ? 'balance-low' : 'balance-normal']">{{ balance }}</text>
	</view>
</template>

<script>
export default {
	name: 'WordBalanceTag',
	props: {
		balance: {
			type: Number,
			default: 0
		}
	}
}
</script>

<style scoped>
.word-balance-tag {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.12);
}

.pen-icon {
	font-size: 28rpx;
	margin-right: 8rpx;
}

.balance-number {
	font-size: 26rpx;
	font-weight: 600;
}

.balance-normal {
	color: #ffffff;
}

.balance-low {
	color: #ff4757;
	animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}
</style>
