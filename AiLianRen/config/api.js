/**
 * API配置文件
 * 包含大模型API地址、广告位ID等关键配置
 * 上线前只需替换这里的ID和Key即可
 * 
 * ⚠️ 安全提示：
 * 生产环境建议将AI API调用迁移到云函数(chat-send)中，
 * 避免API Key暴露在客户端代码中。
 * 客户端直接调用仅用于开发测试阶段。
 */

// ==================== 大模型API配置 ====================
// 火山引擎·豆包大模型 Doubao-Seed-2.0-mini
export const AI_CONFIG = {
  // API请求地址（火山引擎）
  API_URL: 'https://ml-api-cn-beijing.volces.com/api/v1/chat/completions',
  // API密钥 - 【上线前请替换为你的真实API Key】
  // ⚠️ 生产环境应通过云函数调用，不要在客户端暴露Key
  API_KEY: 'YOUR_DOUBAO_API_KEY_HERE',
  // 模型名称
  MODEL: 'doubao-seed-2-0-mini-260215',
  // 生成参数
  TEMPERATURE: 0.8,
  TOP_P: 0.9
}

// ==================== 广告配置 ====================
// uni-ad 广告位ID配置
export const AD_CONFIG = {
  // 激励视频广告位ID - 【上线前请替换为你的真实广告位ID】
  REWARDED_VIDEO_ADPID: 'YOUR_REWARDED_VIDEO_ADPID',
  // 插屏广告位ID - 【上线前请替换】
  INTERSTITIAL_ADPID: 'YOUR_INTERSTITIAL_ADPID',
  // 微信小程序激励视频广告单元ID - 【上线前请替换】
  WX_REWARDED_AD_UNIT_ID: 'YOUR_WX_REWARDED_AD_UNIT_ID',
  // 微信小程序插屏广告单元ID - 【上线前请替换】
  WX_INTERSTITIAL_AD_UNIT_ID: 'YOUR_WX_INTERSTITIAL_AD_UNIT_ID',
  // 抖音小程序激励视频广告单元ID - 【上线前请替换】
  TT_REWARDED_AD_UNIT_ID: 'YOUR_TT_REWARDED_AD_UNIT_ID',
  // 抖音小程序插屏广告单元ID - 【上线前请替换】
  TT_INTERSTITIAL_AD_UNIT_ID: 'YOUR_TT_INTERSTITIAL_AD_UNIT_ID',
  // 每日广告观看次数上限
  DAILY_AD_LIMIT: 10,
  // 每次广告奖励字数
  AD_REWARD_WORDS: 1000,
  // 分享奖励字数
  SHARE_REWARD_WORDS: 300,
  // 每日分享次数上限
  DAILY_SHARE_LIMIT: 2,
  // 换人需要看广告次数
  CHANGE_LOVER_AD_COUNT: 3
}

// ==================== 游戏数值配置 ====================
export const GAME_CONFIG = {
  // 新用户初始字数
  INITIAL_WORDS: 1000,
  // 每日免费字数
  DAILY_FREE_WORDS: 100,
  // 好感度范围
  FAVOR_MIN: 0,
  FAVOR_MAX: 500,
  // 亲密度范围
  INTIMACY_MIN: 0,
  INTIMACY_MAX: 100,
  // 信任值范围
  TRUST_MIN: 0,
  TRUST_MAX: 100,
  // 浪漫值范围
  ROMANCE_MIN: 0,
  ROMANCE_MAX: 100,
  // 默契值范围
  RAPPORT_MIN: 0,
  RAPPORT_MAX: 100,
  // 查看恋人日记消耗字数
  DIARY_COST: 50
}

export default {
  AI_CONFIG,
  AD_CONFIG,
  GAME_CONFIG
}
