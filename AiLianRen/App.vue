<script>
	/**
	 * App.vue - 应用入口组件
	 * 负责应用的全局生命周期管理和广告初始化
	 */
	import { initRewardedVideoAd, initInterstitialAd } from '@/utils/ad-manager.js'

	export default {
		onLaunch: function() {
			console.log('【AI恋人】应用启动')
			// 初始化广告SDK
			initRewardedVideoAd()
			initInterstitialAd()
		},
		onShow: function() {
			console.log('【AI恋人】应用显示')
		},
		onHide: function() {
			console.log('【AI恋人】应用隐藏')
		}
	}
</script>

<style>
	/* ==================== 全局公共样式 ==================== */

	/* 所有页面默认深色背景 */
	page {
		background-color: #0a0a1a;
		color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
			'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica,
			Arial, sans-serif;
	}

	/* 隐藏滚动条（H5端） */
	::-webkit-scrollbar {
		display: none;
		width: 0;
		height: 0;
	}

	/* 禁止文本选中（游戏体验优化） */
	view, text {
		-webkit-user-select: none;
		user-select: none;
	}

	/* 输入框允许选中 */
	input, textarea {
		-webkit-user-select: auto;
		user-select: auto;
	}
</style>
