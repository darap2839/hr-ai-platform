
import { motion } from 'framer-motion'
import { formatMatchScore, getMatchColor, getMatchBarColor } from '../../utils/format'

export default function CandidateCard({ 
  name = "Иван Петров", 
  matchScore = 85, 
  explanation = "Имеет опыт с Python..." 
}) {
  const colorClass = getMatchColor(matchScore)
  const barColor = getMatchBarColor(matchScore)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-soft hover:shadow-medium transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{name}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
        </div>
        <div className="ml-6 flex-shrink-0">
          <div className={`px-4 py-3 rounded-lg text-center min-w-[80px] ${colorClass}`}>
            <div className="text-2xl font-bold">{formatMatchScore(matchScore)}</div>
            <div className="text-xs mt-1 opacity-75">соответствие</div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchScore}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-2 rounded-full ${barColor}`}
          />
        </div>
      </div>
    </motion.div>
  )
}


