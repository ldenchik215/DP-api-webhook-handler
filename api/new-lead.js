import express from 'express'
import dotenv from 'dotenv'
import getFieldsFromComment from './services/get-fields-from-comment.js'
import updateFields from './services/update-fields.js'

// Загружаем переменные окружения из .env файла
dotenv.config()

// Создаем Express приложение
const app = express()
const port = process.env.PORT || 3000

// Middleware для парсинга JSON
app.use(express.json())

// Основная логика обработчика (без изменений)
async function webhookHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    // 2. Получаем данные из тела запроса
    const objectId = req.body.lead_id
    console.log('Получен вебхук:', req.body)
    console.log('objectId:', objectId)

    if (!objectId) {
      console.error('Ошибка валидации: отсутствуют необходимые поля.')
      return res.status(400).json({ error: 'Invalid data received' })
    }

    const customFields = await getFieldsFromComment(objectId, res)

    console.log(customFields)

    if (customFields.length === 0) {
      console.warn('Не найдено целевых кастомных полей в поле text. Обновление не требуется.')
      // Отвечаем 200, чтобы CRM не повторяла запрос.
      // Это не ошибка, просто в данном вебхуке не было нужных данных.
      return res.status(200).json({ success: true, message: 'Webhook received, but no target fields found to update.' })
    }

    await updateFields(objectId, customFields, res)
    // 6. Отправляем успешный ответ
    // CRM получит статус 200 и поймет, что вебхук успешно обработан.
    res.status(200).json({ success: true, message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Внутренняя ошибка сервера:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

// Регистрируем наш обработчик как POST-эндпоинт
app.post('/api/new-lead', webhookHandler)

// Запускаем сервер
app.listen(port, () => {
  console.log(`🚀 Сервер запущен локально на http://localhost:${port}`)
})

// Экспорт для Vercel (оставляем, чтобы работало при развертывании)
export default app
