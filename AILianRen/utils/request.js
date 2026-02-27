export function callCloud(name, data = {}) {
  return uniCloud.callFunction({
    name,
    data
  }).then(res => {
    if (res.result && res.result.code === 0) {
      return res.result
    }
    throw new Error(res.result ? res.result.msg || '请求失败' : '请求失败')
  })
}
