import { useNavigate } from 'react-router-dom'
import Header from '../components/Layout/Header'
import Container from '../components/Layout/Container'
import VacancyCard from '../components/Cards/VacancyCard'
import Button from '../components/UI/Button'
import { useVacancy } from '../hooks/useVacancy'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { vacancy } = useVacancy()

  return (
    <div className="min-h-screen bg-surface">
      <Header userName="Алексей" />
      <Container>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ваши вакансии</h2>
          <p className="text-gray-600">Управляйте вакансиями и находите подходящих кандидатов</p>
        </div>

        {vacancy ? (
          <VacancyCard
            title={vacancy.role || "Инженер радиоэлектроники"}
            skills={vacancy.skills || []}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-soft">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                У вас пока нет вакансий
              </h3>
              <p className="text-gray-600 mb-6">
                Загрузите вакансию, чтобы начать подбор кандидатов
              </p>
              <Button
                onClick={() => navigate('/upload')}
                size="lg"
              >
                Загрузить вакансию
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}


