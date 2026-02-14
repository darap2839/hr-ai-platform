import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Layout/Header'
import Container from '../components/Layout/Container'
import Button from '../components/UI/Button'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import Alert from '../components/UI/Alert'
import { vacancyService } from '../services/api'
import { useVacancy } from '../hooks/useVacancy'
import { motion } from 'framer-motion'

export default function UploadPage() {
  const navigate = useNavigate()
  const { saveVacancy, setLoading, loading } = useVacancy()
  const [structured, setStructured] = useState(null)
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(pdf|docx)$/i)) {
        setError('Пожалуйста, выберите файл в формате PDF или DOCX')
        return
      }
      setFile(selectedFile)
      setError(null)
      setStructured(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Пожалуйста, выберите файл')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await vacancyService.uploadVacancy(file)
      setStructured(result.structured)
      saveVacancy(result.structured)
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке файла. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleMatch = () => {
    if (structured) {
      navigate('/matches')
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header userName="Алексей" />
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Загрузка вакансии</h2>
            <p className="text-gray-600">Загрузите файл вакансии в формате PDF или DOCX</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-soft"
          >
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите файл вакансии
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Выберите файл</span>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">или перетащите сюда</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOCX до 10MB</p>
                </div>
              </div>
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  Выбран файл: <span className="font-medium">{file.name}</span>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {loading && (
              <div className="mb-4 flex items-center justify-center py-4">
                <LoadingSpinner />
                <span className="ml-3 text-gray-600">Обработка файла...</span>
              </div>
            )}

            {structured && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4"
              >
                <Alert variant="success">
                  <div className="font-semibold mb-2">Вакансия успешно обработана!</div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Роль:</span> {structured.role}</p>
                    <p>
                      <span className="font-medium">Навыки:</span>{' '}
                      {structured.skills?.length > 0 ? structured.skills.join(', ') : 'Не указаны'}
                    </p>
                  </div>
                </Alert>
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex-1"
              >
                {loading ? 'Обработка...' : 'Загрузить и обработать'}
              </Button>
              {structured && (
                <Button
                  onClick={handleMatch}
                  variant="primary"
                  className="flex-1"
                >
                  Найти кандидатов →
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  )
}


