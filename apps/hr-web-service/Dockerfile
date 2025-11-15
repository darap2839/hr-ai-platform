# Этап 1: сборка
FROM node:20 AS builder

WORKDIR /app

# Копируем только package-файлы для эффективного кэширования
COPY package.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код и конфигурационные файлы
COPY src/ ./src/
COPY index.html ./index.html
COPY postcss.config.js ./postcss.config.js
COPY tailwind.config.js ./tailwind.config.js
COPY vite.config.js ./vite.config.js

# Собираем приложение
RUN npm run build

# Этап 2: финальный образ (легковесный)
FROM builder

EXPOSE 3000

# Запуск
CMD ["npm", "run", "preview"]