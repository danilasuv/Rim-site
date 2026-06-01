const TELEGRAM_API = 'https://api.telegram.org/bot';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

const normalizeText = (value, maxLength = 1200) => String(value || '').trim().slice(0, maxLength);

const isValidPhone = (phone) => /^[+0-9()\s-]{10,}$/.test(phone);

const buildMessage = ({ name, phone, message, pageUrl }, headers) => {
  const createdAt = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return [
    '🔔 Новая заявка с сайта ООО «РИМ»',
    '',
    `👤 Имя: ${name}`,
    `📞 Телефон: ${phone}`,
    `💬 Сообщение: ${message}`,
    pageUrl ? `🌐 Страница: ${pageUrl}` : '',
    `🕒 Время: ${createdAt} МСК`,
    headers['user-agent'] ? `🧭 Браузер: ${normalizeText(headers['user-agent'], 180)}` : '',
  ].filter(Boolean).join('\n');
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Метод не поддерживается.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return json(500, {
      ok: false,
      message: 'Telegram-отправка не настроена. Укажите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.',
    });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { ok: false, message: 'Некорректный JSON в запросе.' });
  }

  const lead = {
    name: normalizeText(payload.name, 120),
    phone: normalizeText(payload.phone, 80),
    message: normalizeText(payload.message, 1600),
    pageUrl: normalizeText(payload.pageUrl, 240),
  };

  if (lead.name.length < 2) {
    return json(400, { ok: false, message: 'Введите имя не короче 2 символов.' });
  }

  if (!isValidPhone(lead.phone)) {
    return json(400, { ok: false, message: 'Введите корректный телефон.' });
  }

  if (lead.message.length < 10) {
    return json(400, { ok: false, message: 'Опишите задачу минимум в 10 символах.' });
  }

  const telegramResponse = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildMessage(lead, event.headers || {}),
      disable_web_page_preview: true,
    }),
  });

  if (!telegramResponse.ok) {
    const details = await telegramResponse.text();
    console.error('Telegram API error:', details);
    return json(502, {
      ok: false,
      message: 'Telegram временно не принял заявку. Позвоните нам или попробуйте позже.',
    });
  }

  return json(200, { ok: true, message: 'Заявка отправлена в Telegram.' });
};
