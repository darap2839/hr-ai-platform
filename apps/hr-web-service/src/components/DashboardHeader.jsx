export default function DashboardHeader({ name = "HR-менеджер" }) {
  return (
    <div className="p-6 border-b bg-white">
      <h1 className="text-2xl font-bold text-gray-800">Привет, {name}!</h1>
      <p className="text-gray-600">Платформа подбора инженеров для радиоэлектронной отрасли</p>
    </div>
  )
}           