# Подключение заявок в Telegram

Форма сайта отправляет заявки в Netlify Function `/.netlify/functions/send-telegram`, а функция безопасно пересылает данные в Telegram. Токен бота хранится только в переменных окружения и не попадает в браузер.

## 1. Создать бота

1. Откройте Telegram и найдите `@BotFather`.
2. Отправьте команду `/newbot`.
3. Укажите имя и username бота.
4. Скопируйте токен вида `123456789:AA...` — это значение для `TELEGRAM_BOT_TOKEN`.

## 2. Получить chat_id

### Для личных сообщений

1. Напишите любое сообщение своему новому боту.
2. Откройте в браузере:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

3. Найдите `chat.id` — это значение для `TELEGRAM_CHAT_ID`.

### Для группы

1. Добавьте бота в группу.
2. Напишите сообщение в группу.
3. Откройте `getUpdates` и возьмите `chat.id` группы. Обычно он начинается с `-`.

## 3. Настроить Netlify

В панели Netlify откройте:

```text
Site settings → Environment variables
```

Добавьте переменные:

```text
TELEGRAM_BOT_TOKEN=токен_бота
TELEGRAM_CHAT_ID=chat_id
```

После этого redeploy сайта.

## 4. Локальный запуск с функцией

Для полноценной проверки отправки формы локально нужен Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

Обычно сайт откроется на:

```text
http://localhost:8888
```

Для локальной проверки создайте файл `.env` рядом с `index.html`:

```text
TELEGRAM_BOT_TOKEN=токен_бота
TELEGRAM_CHAT_ID=chat_id
```

Файл `.env` нельзя публиковать в GitHub.

## 5. Безопасность

Не вставляйте `TELEGRAM_BOT_TOKEN` в `script.js` или `index.html`. Если токен окажется на frontend, любой посетитель сможет его увидеть.
