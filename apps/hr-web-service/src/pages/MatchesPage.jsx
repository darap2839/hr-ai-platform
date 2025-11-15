import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Layout/Header'
import Container from '../components/Layout/Container'
import CandidateCard from '../components/Cards/CandidateCard'
import Button from '../components/UI/Button'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import Alert from '../components/UI/Alert'
import { matchesService } from '../services/api'

export default function MatchesPage() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await matchesService.getMatches()
        setMatches(data)
      } catch (err) {
        setError(err.message || 'Ошибка при загрузке кандидатов')
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      <Header userName="Алексей" />
      <Container>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            ← Назад к вакансиям
          </Button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Результаты подбора</h2>
          <p className="text-gray-600">Найденные кандидаты, отсортированные по соответствию</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Загрузка кандидатов...</span>
          </div>
        )}

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {matches && !loading && (
          <div className="space-y-4">
            {matches.candidates && matches.candidates.length > 0 ? (
              <>
                {matches.candidates.map((candidate, i) => (
                  <CandidateCard
                    key={i}
                    name={candidate.name}
                    matchScore={candidate.match_score}
                    explanation={candidate.gap || 'Нет дополнительной информации'}
                  />
                ))}
                {matches.recommendation && (
                  <Alert variant="info" className="mt-6">
                    <div className="font-semibold mb-1">💡 Рекомендация</div>
                    <p>{matches.recommendation}</p>
                  </Alert>
                )}
              </>
            ) : (
              <Alert variant="warning">
                Кандидаты не найдены. Попробуйте изменить параметры поиска.
              </Alert>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}


