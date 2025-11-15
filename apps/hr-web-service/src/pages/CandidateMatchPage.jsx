import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CandidateCard from '../components/CandidateCard'
import DashboardHeader from '../components/DashboardHeader'

export default function CandidateMatchPage() {
  const [candidates, setCandidates] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchMatches = async () => {
      const res = await fetch('http://localhost:8000/api/v1/matches')
      const data = await res.json()
      setCandidates(data.candidates || [])
    }
    fetchMatches()
  }, [])

  return (
    <div>
      <DashboardHeader name="Алексей" />
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 mb-4"
        >
          ← Назад к вакансиям
        </button>
        <h2 className="text-xl font-semibold mb-4">Подходящие кандидаты</h2>
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <CandidateCard
              key={i}
              name={c.name}
              match={`${c.match_score}%`}
              explanation={c.gap}
            />
          ))}
        </div>
      </div>
    </div>
  )
}