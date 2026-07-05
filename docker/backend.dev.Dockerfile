FROM node:20-alpine

WORKDIR /app

# Instala dependências de build
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

# O código-fonte é montado via volume em dev (./backend/src:/app/src)
COPY . .

EXPOSE 3001
# Porta de debug Node.js
EXPOSE 9229

CMD ["npm", "run", "start:dev"]
