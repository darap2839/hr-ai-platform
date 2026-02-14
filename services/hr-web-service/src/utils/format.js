/**
 * Форматирует процент соответствия
 */
export const formatMatchScore = (score) => {
  return `${score}%`
}

/**
 * Получает цвет для оценки соответствия
 */
export const getMatchColor = (score) => {
  if (score >= 85) return 'text-green-600 bg-green-50'
  if (score >= 70) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

/**
 * Получает цвет для прогресс-бара
 */
export const getMatchBarColor = (score) => {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}


