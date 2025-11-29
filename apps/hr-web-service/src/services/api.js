import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api'

// === СОЗДАНИЕ КЛИЕНТА ===
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error)
      return Promise.reject(error)
    }
)

// ❗ УДАЛЁН ТОП-ЛЕВЕЛ AWAIT
// Если тебе действительно нужно выполнить запрос при загрузке —
// оберни его в функцию:
// async function initCandidate(candidateData) {
//   return apiClient.post(API_ENDPOINTS.CANDIDATE, candidateData)
// }

// === ТВОИ СУЩЕСТВУЮЩИЕ СЕРВИСЫ ===
export const vacancyService = {
  /**
   * Загружает вакансию (PDF или DOCX)
   */
  async uploadVacancy(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(API_ENDPOINTS.UPLOAD_VACANCY, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },
}

export const matchesService = {
  /**
   * Получает список подходящих кандидатов
   */
  async getMatches() {
    const response = await apiClient.get(API_ENDPOINTS.MATCHES)
    return response.data
  },
}

// === НОВЫЙ СЕРВИС: КАНДИДАТ ===
export const candidateService = {
  /**
   * Создаёт кандидата
   */
  async createCandidate(candidateData) {
    const response = await apiClient.post(API_ENDPOINTS.CANDIDATE, candidateData)
    return response.data
  },

  /**
   * Получает кандидата по ID
   */
  async getCandidate(id) {
    const response = await apiClient.get(`${API_ENDPOINTS.CANDIDATE}/${id}`)
    return response.data
  },
}

export default apiClient
