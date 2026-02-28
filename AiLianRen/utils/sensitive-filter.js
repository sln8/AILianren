/**
 * 敏感词过滤模块
 * 对用户输入和AI回复进行敏感词检测与过滤
 */

// ==================== 敏感词库 ====================
// 分类管理，便于维护和扩展
const SENSITIVE_WORDS = {
  // 色情相关
  pornographic: [
    '做爱', '性交', '口交', '肛交', '自慰', '手淫',
    '裸体', '裸照', '色情', '黄片', '成人片', 'AV',
    '嫖娼', '卖淫', '援交', '约炮', '一夜情',
    '乳房', '阴茎', '阴道', '生殖器', '下体',
    '调教', 'SM', '捆绑', '恋童', '萝莉控',
    '潮吹', '高潮', '射精', '勃起'
  ],

  // 暴力相关
  violence: [
    '杀人', '砍人', '捅人', '打死', '弄死', '去死',
    '自杀', '割腕', '跳楼', '上吊', '服毒',
    '炸弹', '枪支', '刀具', '凶器',
    '虐待', '施暴', '殴打', '强奸',
    '恐怖袭击', '爆炸', '纵火'
  ],

  // 政治敏感
  political: [
    '颠覆政权', '反党', '反政府', '分裂国家',
    '邪教', '法轮功', '全能神',
    '暴动', '游行示威', '政变'
  ],

  // 违法犯罪
  illegal: [
    '毒品', '吸毒', '贩毒', '大麻', '冰毒', '海洛因',
    '赌博', '网赌', '赌场',
    '洗钱', '诈骗', '传销',
    '偷拍', '偷窥', '跟踪'
  ],

  // 歧视侮辱
  discrimination: [
    '废物', '垃圾人', '贱人', '荡妇', '婊子',
    '智障', '弱智', '脑残', '白痴',
    '滚蛋', '去死吧', '该死'
  ]
}

// 扁平化敏感词列表缓存（用于快速匹配）
let flatWordListCache = null

/**
 * 获取扁平化的敏感词列表（懒加载+缓存）
 * @returns {string[]} 敏感词数组
 */
function getFlatWordList() {
  if (!flatWordListCache) {
    flatWordListCache = Object.values(SENSITIVE_WORDS).flat()
  }
  return flatWordListCache
}

/**
 * 检测文本中是否包含敏感词
 * @param {string} text - 待检测文本
 * @returns {Object} { hasSensitive: boolean, matchedWords: string[] }
 */
export function detectSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return { hasSensitive: false, matchedWords: [] }
  }

  const normalizedText = text.toLowerCase()
  const wordList = getFlatWordList()
  const matchedWords = []

  for (const word of wordList) {
    if (normalizedText.includes(word.toLowerCase())) {
      matchedWords.push(word)
    }
  }

  return {
    hasSensitive: matchedWords.length > 0,
    matchedWords
  }
}

/**
 * 过滤敏感词（用*替换）
 * @param {string} text - 待过滤文本
 * @returns {string} 过滤后的文本
 */
export function filterSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return text
  }

  let filtered = text
  const wordList = getFlatWordList()

  for (const word of wordList) {
    const regex = new RegExp(escapeRegExp(word), 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  }

  return filtered
}

/**
 * 转义正则表达式特殊字符
 * @param {string} string - 待转义字符串
 * @returns {string} 转义后字符串
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 获取敏感词被拦截时的提示消息
 * @returns {string} 提示消息
 */
export function getSensitiveWarningMessage() {
  return '你的消息包含不适当的内容，请修改后重新发送哦～'
}

export default {
  detectSensitiveWords,
  filterSensitiveWords,
  getSensitiveWarningMessage
}
