import DashboardHeader from '../components/DashboardHeader'
import JobCard from '../components/JobCard'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function EmployerDashboard() {
  const [vacancy, setVacancy] = useState(null)
  const navigate = useNavigate()

  // Эмуляция загрузки текущей вакансии (в будущем — из API)
  useEffect(() => {
    // Можно получить из localStorage после загрузки PDF
    const saved = localStorage.getItem('structuredVacancy')
    if (saved) {
      setVacancy(JSON.parse(saved))
    }
  }, [])

  return (
    <div>
      <DashboardHeader name="Алексей" />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Ваши вакансии</h2>
          {vacancy ? (
            <JobCard
              title={vacancy.role || "Инженер радиоэлектроники"}
              skills={vacancy.skills || ["Altium", "ГОСТ РВ"]}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Загрузите вакансию, чтобы начать подбор</p>
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Загрузить вакансию
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}