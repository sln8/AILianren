'use strict'
/**
 * 云函数：ai-proxy
 * AI API代理云函数
 * 
 * 功能：
 * 将客户端的AI对话请求转发到豆包大模型API
 * 避免客户端直接调用外部API导致的域名限制和API Key暴露问题
 */

// 【上线前请设置uniCloud环境变量 DOUBAO_API_KEY】
// 在uniCloud Web控制台 → 云函数 → 环境变量中配置
const DOUBAO_API_URL = 'https://ml-api-cn-beijing.volces.com/api/v1/chat/completions'
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || 'd3d95f0e-717b-41cf-b08c-5ac1c23dac43'
const DOUBAO_MODEL = 'doubao-seed-2-0-mini-260215'

exports.main = async (event, context) => {
  const { messages, maxTokens, temperature, top_p } = event

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { code: -1, msg: '消息参数无效' }
  }

  try {
    const response = await uniCloud.httpclient.request(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: DOUBAO_MODEL,
        messages: messages,
        max_tokens: maxTokens || 300,
        temperature: temperature || 0.8,
        top_p: top_p || 0.9
      },
      dataType: 'json',
      timeout: 30000
    })

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return { code: 0, reply: response.data.choices[0].message.content }
    }

    return { code: -1, msg: 'AI API返回异常' }
  } catch (error) {
    console.error('ai-proxy 云函数错误:', error)
    return { code: -1, msg: '服务器内部错误: ' + error.message }
  }
}
