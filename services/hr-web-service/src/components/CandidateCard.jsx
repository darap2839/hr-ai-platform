
export default function CandidateCard({ name = "Иван Петров", match = "85%", explanation = "Имеет опыт с Python..." }) {
  return (
    <div className="bg-white p-4 rounded-lg border flex justify-between items-center">
      <div>
        <h4 className="font-semibold text-gray-800">{name}</h4>
        <p className="text-sm text-gray-600 mt-1">{explanation}</p>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-blue-600">{match}</div>
        <div className="text-xs text-gray-500">соответствие</div>
      </div>
    </div>
  )
}