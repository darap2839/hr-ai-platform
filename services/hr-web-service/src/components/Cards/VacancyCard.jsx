import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function VacancyCard({ 
  title = "Инженер радиоэлектроники", 
  skills = [], 
  matchScore = null 
}) {
  const navigate = useNavigate()

  const handleMatch = () => {
    navigate('/matches')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        {matchScore !== null && (
          <div className="ml-4 flex-shrink-0">
            <div className={`px-4 py-2 rounded-lg text-center ${
              matchScore >= 85 ? 'bg-green-50 text-green-700' :
              matchScore >= 70 ? 'bg-yellow-50 text-yellow-700' :
              'bg-red-50 text-red-700'
            }`}>
              <div className="text-2xl font-bold">{matchScore}%</div>
              <div className="text-xs">соответствие</div>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleMatch}
        className="w-full mt-4 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Найти кандидатов
      </button>
    </motion.div>
  )
}


