import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'

/**
 * Хук для работы с вакансией
 */
export const useVacancy = () => {
  const [vacancy, setVacancy] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = storage.getVacancy()
    if (saved) {
      setVacancy(saved)
    }
  }, [])

  const saveVacancy = (vacancyData) => {
    setVacancy(vacancyData)
    storage.saveVacancy(vacancyData)
  }

  const clearVacancy = () => {
    setVacancy(null)
    storage.clearVacancy()
  }

  return {
    vacancy,
    loading,
    setLoading,
    saveVacancy,
    clearVacancy,
  }
}


