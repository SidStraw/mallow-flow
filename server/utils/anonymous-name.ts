const adjectives = [
  '快樂的', '勇敢的', '可愛的', '聰明的', '溫柔的',
  '活潑的', '開朗的', '熱情的', '善良的', '機智的',
  '調皮的', '認真的', '優雅的', '神秘的', '帥氣的',
]

const animals = [
  '企鵝', '貓咪', '狗狗', '兔子', '熊貓',
  '狐狸', '老虎', '獅子', '小鹿', '海豚',
  '松鼠', '貓頭鷹', '小熊', '浣熊', '水獺',
]

export function generateAnonymousName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${adjective}${animal}`
}
