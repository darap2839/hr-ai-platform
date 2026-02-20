export default function MatchScoreBar({ score }) {
  let color = 'bg-green-500'
  if (score < 70) color = 'bg-red-500'
  else if (score < 85) color = 'bg-yellow-500'

  return (
    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${score}%` }}
      ></div>
    </div>
  )
}