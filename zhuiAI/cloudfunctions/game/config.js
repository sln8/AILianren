/**
 * 共享配置 - 云函数端使用的常量
 */

// 关系阶段定义
const STAGES = [
  { id: 0, name: '陌生人', minFavor: 0, maxFavor: 99 },
  { id: 1, name: '认识', minFavor: 100, maxFavor: 249 },
  { id: 2, name: '熟悉', minFavor: 250, maxFavor: 449 },
  { id: 3, name: '好友', minFavor: 450, maxFavor: 649 },
  { id: 4, name: '暧昧', minFavor: 650, maxFavor: 799 },
  { id: 5, name: '表白/恋人', minFavor: 800, maxFavor: 999 },
  { id: 6, name: '热恋', minFavor: 1000, maxFavor: 1299 },
  { id: 7, name: '求婚', minFavor: 1300, maxFavor: 1499 },
  { id: 8, name: '结婚', minFavor: 1500, maxFavor: 1799 },
  { id: 9, name: '生子', minFavor: 1800, maxFavor: 2099 },
  { id: 10, name: '10年婚姻', minFavor: 2100, maxFavor: 2599 },
  { id: 11, name: '20年婚姻', minFavor: 2600, maxFavor: 3099 },
  { id: 12, name: '30年婚姻', minFavor: 3100, maxFavor: 3599 },
  { id: 13, name: '晚年/结局', minFavor: 3600, maxFavor: 99999 },
];

// 角色信息（云端仅需关键数据）
const LOVERS = {
  M1: { name: '陆辰逸', tag: '温柔学长', gender: 'male', profile: '大学学长，温柔细腻，喜欢文学。中文系研究生，说话轻声细语，总是耐心倾听。' },
  M2: { name: '顾北川', tag: '霸道总裁', gender: 'male', profile: '商业精英，外冷内热，占有欲强。年少有为，表面冷漠不近人情，实则内心柔软。' },
  M3: { name: '林屿', tag: '阳光运动男', gender: 'male', profile: '篮球队长，开朗热情，直球型。笑容灿烂，喜欢一个人就会直说。' },
  M4: { name: '苏墨白', tag: '文艺音乐人', gender: 'male', profile: '独立音乐人，感性浪漫，有艺术气质。会为喜欢的人写歌。' },
  M5: { name: '江予安', tag: '邻家青梅', gender: 'male', profile: '从小一起长大的邻居，熟悉又陌生。性格温和体贴，在关键时刻默默守护。' },
  M6: { name: '沈夜', tag: '神秘学者', gender: 'male', profile: '大学教授，知识渊博，难以捉摸。对万物充满好奇，唯独对感情保持距离。' },
  F1: { name: '苏晚晴', tag: '温柔学姐', gender: 'female', profile: '文学系学姐，温柔知性，善解人意。笑起来温暖如春风。' },
  F2: { name: '沈清歌', tag: '冷艳御姐', gender: 'female', profile: '律师事务所合伙人，理性强势但内心柔软。气场强大但私下温柔。' },
  F3: { name: '林小鹿', tag: '活泼可爱', gender: 'female', profile: '邻家少女，活力满满，爱撒娇。性格活泼爱笑，生气时会鼓起腮帮子。' },
  F4: { name: '叶知秋', tag: '文艺才女', gender: 'female', profile: '插画师，安静内敛，感性细腻。画里藏着千言万语。' },
  F5: { name: '姜柠', tag: '运动女孩', gender: 'female', profile: '舞蹈系校花，阳光自信，大大咧咧。跳舞时优雅动人。' },
  F6: { name: '白芷', tag: '神秘学妹', gender: 'female', profile: '心理学系学妹，洞察力强，话少但精准。靠近后会发现她的细腻与温暖。' },
};

// 字数经济常量
const WORD_ECONOMY = {
  INITIAL_GIFT: 800,
  DAILY_GIFT: 150,
  AD_REWARD: 500,
  DAILY_AD_LIMIT: 15,
  SHARE_REWARD: 200,
  LOGIN_BONUS: { 3: 100, 5: 200, 7: 500 },
  SWITCH_LOVER_AD_COST: 3,
  STAGE_ROUND_LIMIT: 50,          // 每个阶段最多停留轮次
};

// 大模型配置（需替换为真实值）
const AI_CONFIG = {
  API_ENDPOINT: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  MODEL: 'Doubao-Seed-2.0-mini',
  API_KEY: 'YOUR_VOLC_API_KEY',
  MAX_CONTEXT_ROUNDS: 20,
};

function getStageByFavor(favor) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (favor >= STAGES[i].minFavor) return STAGES[i];
  }
  return STAGES[0];
}

module.exports = {
  STAGES, LOVERS, WORD_ECONOMY, AI_CONFIG, getStageByFavor,
};
