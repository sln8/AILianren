/**
 * 广告管理器 - 管理激励视频广告、插屏广告、Banner广告
 */
const config = require('../config');

class AdManager {
  constructor() {
    this.rewardedVideoAd = null;
    this.interstitialAd = null;
    this.bannerAd = null;
    this.isRewardedVideoReady = false;
    this.adLoadRetryCount = 0;
  }

  /** 初始化所有广告 */
  init() {
    this.initRewardedVideo();
    this.initInterstitial();
  }

  /** 初始化激励视频广告 */
  initRewardedVideo() {
    if (typeof tt.createRewardedVideoAd !== 'function') return;
    try {
      this.rewardedVideoAd = tt.createRewardedVideoAd({
        adUnitId: config.AD_CONFIG.REWARDED_VIDEO_ID,
      });

      this.rewardedVideoAd.onLoad(() => {
        this.isRewardedVideoReady = true;
        this.adLoadRetryCount = 0;
      });

      this.rewardedVideoAd.onError((err) => {
        this.isRewardedVideoReady = false;
        console.error('激励视频广告加载失败:', err);
        // 重试逻辑
        if (this.adLoadRetryCount < 3) {
          this.adLoadRetryCount++;
          setTimeout(() => {
            this.rewardedVideoAd && this.rewardedVideoAd.load();
          }, 3000 * this.adLoadRetryCount);
        }
      });
    } catch (e) {
      console.error('创建激励视频广告失败:', e);
    }
  }

  /** 初始化插屏广告 */
  initInterstitial() {
    if (typeof tt.createInterstitialAd !== 'function') return;
    try {
      this.interstitialAd = tt.createInterstitialAd({
        adUnitId: config.AD_CONFIG.INTERSTITIAL_ID,
      });
      this.interstitialAd.onError((err) => {
        console.error('插屏广告加载失败:', err);
      });
    } catch (e) {
      console.error('创建插屏广告失败:', e);
    }
  }

  /** 展示激励视频广告 */
  showRewardedVideo() {
    return new Promise((resolve, reject) => {
      if (!this.rewardedVideoAd) {
        reject(new Error('广告组件未初始化'));
        return;
      }

      const onClose = (res) => {
        this.rewardedVideoAd.offClose(onClose);
        if (res && res.isEnded) {
          resolve(true);
        } else {
          reject(new Error('广告未看完'));
        }
        // 预加载下一次广告
        this.rewardedVideoAd.load();
      };

      this.rewardedVideoAd.onClose(onClose);

      this.rewardedVideoAd.show().catch(() => {
        // 如果展示失败，先重新加载
        this.rewardedVideoAd.load().then(() => {
          this.rewardedVideoAd.show().catch((err) => {
            this.rewardedVideoAd.offClose(onClose);
            reject(err);
          });
        }).catch((err) => {
          this.rewardedVideoAd.offClose(onClose);
          reject(err);
        });
      });
    });
  }

  /** 展示插屏广告（每10轮对话自然触发） */
  showInterstitial() {
    if (!this.interstitialAd) return;
    this.interstitialAd.show().catch(() => {
      // 插屏广告展示失败不影响游戏流程
    });
  }

  /** 创建Banner广告 */
  createBanner(style) {
    if (typeof tt.createBannerAd !== 'function') return null;
    try {
      this.bannerAd = tt.createBannerAd({
        adUnitId: config.AD_CONFIG.BANNER_ID,
        style: style || { left: 0, top: 0, width: 320 },
      });
      this.bannerAd.onError((err) => {
        console.error('Banner广告加载失败:', err);
      });
      return this.bannerAd;
    } catch (e) {
      console.error('创建Banner广告失败:', e);
      return null;
    }
  }

  /** 显示Banner */
  showBanner() {
    if (this.bannerAd) {
      this.bannerAd.show();
    }
  }

  /** 隐藏Banner */
  hideBanner() {
    if (this.bannerAd) {
      this.bannerAd.hide();
    }
  }

  /** 销毁Banner */
  destroyBanner() {
    if (this.bannerAd) {
      this.bannerAd.destroy();
      this.bannerAd = null;
    }
  }
}

module.exports = new AdManager();
