<template>
	<view :class="['chat-bubble-wrap', message.role === 'user' ? 'chat-right' : 'chat-left']">
		<view v-if="message.role === 'assistant'" class="avatar-wrap">
			<image :src="characterAvatar" class="avatar" mode="aspectFill" />
		</view>
		<view class="bubble-content">
			<view :class="['bubble', message.role === 'user' ? 'bubble-user' : 'bubble-assistant']">
				<text class="bubble-text">{{ message.content }}</text>
			</view>
			<text class="timestamp">{{ message.timestamp }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'ChatBubble',
	props: {
		message: {
			type: Object,
			required: true
		},
		characterAvatar: {
			type: String,
			default: ''
		}
	}
}
</script>

<style scoped>
.chat-bubble-wrap {
	display: flex;
	flex-direction: row;
	margin-bottom: 24rpx;
	padding: 0 20rpx;
}

.chat-right {
	justify-content: flex-end;
}

.chat-left {
	justify-content: flex-start;
}

.avatar-wrap {
	margin-right: 16rpx;
	flex-shrink: 0;
}

.avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.bubble-content {
	display: flex;
	flex-direction: column;
	max-width: 70%;
}

.chat-right .bubble-content {
	align-items: flex-end;
}

.chat-left .bubble-content {
	align-items: flex-start;
}

.bubble {
	border-radius: 20rpx;
	padding: 20rpx 28rpx;
	word-break: break-all;
}

.bubble-user {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-bottom-right-radius: 6rpx;
}

.bubble-assistant {
	background: rgba(255, 255, 255, 0.15);
	border-bottom-left-radius: 6rpx;
}

.bubble-text {
	font-size: 28rpx;
	line-height: 42rpx;
	color: #ffffff;
}

.timestamp {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.4);
	margin-top: 8rpx;
	padding: 0 8rpx;
}
</style>
