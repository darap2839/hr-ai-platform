import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api'


const response = await apiClient.post(API_ENDPOINTS.CANDIDATE, candidateData)
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

// === ТВОИ СУЩЕСТВУЮЩИЕ СЕРВИСЫ ===
export const vacancyService = {
  /**
   * Загружает вакансию (PDF или DOCX)
   * @param {File} file - Файл вакансии
   * @returns {Promise<{status: string, structured: {skills: string[], role: string}}>}
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
   * @returns {Promise<{candidates: Array, recommendation: string}>}
   */
  async getMatches() {
    const response = await apiClient.get(API_ENDPOINTS.MATCHES)
    return response.data
  },
}

// === НОВЫЙ СЕРВИС: КАНДИДАТ ===
export const candidateService = {
  /**
   * Сохраняет анкету кандидата
   * @param {Object} candidateData - Данные кандидата
   * @param {string} candidateData.name
   * @param {string} candidateData.email
   * @param {string} candidateData.experience
   * @param {string} candidateData.goals
   * @param {string[]} candidateData.skills
   * @param {Object} candidateData.learning_progress
   * @returns {Promise<Object>} - Сохранённый кандидат с id
   */
  async createCandidate(candidateData) {
    const response = await apiClient.post(API_ENDPOINTS.CANDIDATE, candidateData)
    return response.data
  },

  /**
   * Получает кандидата по ID (опционально)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getCandidate(id) {
    const response = await apiClient.get(`${API_ENDPOINTS.CANDIDATE}/${id}`)
    return response.data
  },
}

export default apiClient
