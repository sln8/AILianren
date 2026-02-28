<script>
	import { handleDailyLogin } from '@/common/storage.js'
	
	export default {
		onLaunch: function() {
			console.log('App Launch - AI恋人')
			handleDailyLogin()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		font-size: 28rpx;
		color: #333;
		background-color: #FFF5F7;
	}
	
	view, text {
		box-sizing: border-box;
	}
	
	button {
		margin: 0;
		padding: 0;
	}
	
	button::after {
		border: none;
	}
	
	image {
		display: block;
	}
</style>
