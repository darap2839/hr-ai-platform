FROM node:20 AS builder

WORKDIR /app

COPY package.json ./

RUN npm install

COPY src/ ./src/
COPY index.html ./index.html
COPY postcss.config.js ./postcss.config.js
COPY tailwind.config.js ./tailwind.config.js
COPY vite.config.js ./vite.config.js

RUN npm run build

FROM builder

EXPOSE 3000 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]