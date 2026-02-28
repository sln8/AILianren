<template>
	<!-- 默认首页 - 自动跳转到欢迎页 -->
	<view class="content">
		<text class="title">正在加载...</text>
	</view>
</template>

<script>
	/**
	 * 默认首页
	 * 该页面仅作为备用入口，正常流程从welcome页面开始
	 * onLoad时自动跳转到欢迎页
	 */
	export default {
		data() {
			return {
				title: '正在加载...'
			}
		},
		onLoad() {
			// 自动跳转到欢迎页
			uni.reLaunch({
				url: '/pages/welcome/welcome'
			})
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: #0a0a1a;
	}

	.title {
		font-size: 32rpx;
		color: rgba(255, 255, 255, 0.5);
	}
</style>
