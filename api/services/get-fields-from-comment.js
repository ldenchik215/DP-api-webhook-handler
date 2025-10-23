import fetch from 'node-fetch'

const FIELD_ID_MAP = {
  consult: 1444,
  inform: 1445,
  bron: 1446,
  dogovor: 1447,
  'Checkbox 2': 1444,
  'Checkbox 3': 1445,
  'Checkbox 4': 1446,
  'Checkbox 5': 1447,
}

async function getFieldsFromComment(objectId, res) {
  try {
    const crmApiUrl = process.env.CRM_SERVER_URL
    const crmApiToken = process.env.CRM_API_TOKEN // Секретный токен для аутентификации

    console.log(`Отправка GET-запроса на: ${crmApiUrl}/comments?object_id=${objectId}`)

    const response = await fetch(`${crmApiUrl}/comments?object_id=${objectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Добавляем заголовок авторизации, если требуется
        Authorization: `Bearer ${crmApiToken}`,
      },
    })

    // 5. Обработка ответа от CRM API
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Ошибка от CRM API: ${response.status} ${response.statusText}`, errorText)
      // Важно вернуть ошибку, чтобы CRM, возможно, попробовала отправить вебхук еще раз
      return res.status(502).json({ error: 'Failed to update CRM', details: errorText })
    }

    const responseData = await response.json()
    console.log('Комментарии получены:', responseData)

    // Парсим комментарий
    const text = responseData.tasks[0].text
    const parsedFields = []

    if (typeof text !== 'string' || text.length === 0) {
      return []
    }

    // Разбиваем весь текст на отдельные строки
    const lines = text.split('\n')

    for (const line of lines) {
      // Разбиваем строку по первому двоеточию
      const parts = line.split(':', 2)

      if (parts.length === 2) {
        const key = parts[0].trim()
        const valueStr = parts[1].trim()

        // 1. Проверяем, есть ли такой ключ в нашем словаре
        if (FIELD_ID_MAP.hasOwnProperty(key)) {
          // 2. Получаем ID из словаря
          const fieldId = FIELD_ID_MAP[key]

          // 3. Конвертируем значение в число
          const value = Number(valueStr)

          if (!isNaN(value)) {
            // 4. Добавляем в результат в новом формате {id, value}
            parsedFields.push({
              id: fieldId,
              value: value,
            })
          }
        }
      }
    }

    return parsedFields
  } catch (error) {
    console.error('Ошибка запроса к CRM:', error)
    res.status(500).json({ error: 'Error receiving comment' })
  }
}

export default getFieldsFromComment
