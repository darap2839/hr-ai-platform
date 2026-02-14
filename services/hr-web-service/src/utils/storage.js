const STORAGE_KEYS = {
  STRUCTURED_VACANCY: 'structuredVacancy',
}

export const storage = {
  /**
   * Сохраняет структурированную вакансию
   */
  saveVacancy(vacancy) {
    localStorage.setItem(STORAGE_KEYS.STRUCTURED_VACANCY, JSON.stringify(vacancy))
  },

  /**
   * Получает сохраненную вакансию
   */
  getVacancy() {
    const saved = localStorage.getItem(STORAGE_KEYS.STRUCTURED_VACANCY)
    return saved ? JSON.parse(saved) : null
  },

  /**
   * Удаляет сохраненную вакансию
   */
  clearVacancy() {
    localStorage.removeItem(STORAGE_KEYS.STRUCTURED_VACANCY)
  },
}


