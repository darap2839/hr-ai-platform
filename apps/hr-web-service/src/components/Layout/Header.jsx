import { Link } from 'react-router-dom'

export default function Header({ userName = "HR-менеджер" }) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              JobMatch <span className="text-primary-600">AI</span>
            </h1>
            <p className="text-sm text-gray-600">Платформа подбора инженеров</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Привет, <span className="font-semibold">{userName}</span>!</span>
          </div>
        </div>
      </div>
    </header>
  )
}


