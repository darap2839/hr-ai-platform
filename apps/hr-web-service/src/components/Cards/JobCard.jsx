import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function JobCard({ title = "Middle DevOps Engineer", skills = ["Docker", "Kubernetes"] }) {
  const [score] = useState(72)
  const navigate = useNavigate()

  const handleMatch = () => {
    // Можно сохранить ID вакансии, но пока — просто переход
    navigate('/match')
  }

  return (
    <div className="bg-white rounded-lg border p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <div className="flex flex-wrap gap-1 mt-2">
            {skills.map((skill, i) => (
              <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
          {score}%
        </span>
      </div>
      <button
        onClick={handleMatch}
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
      >
        Найти кандидатов
      </button>
    </div>
  )
}