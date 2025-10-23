import fetch from 'node-fetch'

async function updateFields(objectId, customFields, res) {
  try {
    // 4. Подготовка и отправка PUT-запроса в CRM
    const crmApiUrl = process.env.CRM_SERVER_URL
    const crmApiToken = process.env.CRM_API_TOKEN // Секретный токен для аутентификации

    console.log(`Отправка PUT-запроса на: ${crmApiUrl}/custom-fields/1/${objectId}`)

    const response = await fetch(`${crmApiUrl}/custom-fields/1/${objectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Добавляем заголовок авторизации, если требуется
        Authorization: `Bearer ${crmApiToken}`,
      },
      body: JSON.stringify({ custom_fields: customFields }), // Отправляем только кастомные поля
    })

    // 5. Обработка ответа от CRM API
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Ошибка от CRM API: ${response.status} ${response.statusText}`, errorText)
      // Важно вернуть ошибку, чтобы CRM, возможно, попробовала отправить вебхук еще раз
      return res.status(502).json({ error: 'Failed to update CRM', details: errorText })
    }

    const responseData = await response.json()
    console.log('CRM успешно обновлена:', responseData)
  } catch (error) {
    console.error('Ошибка запроса к CRM:', error)
    res.status(500).json({ error: 'Error receiving comment' })
  }
}

export default updateFields
