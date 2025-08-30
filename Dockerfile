FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN apk add --no-cache netcat-openbsd

RUN chmod +x ./scripts/pgsql.sh

EXPOSE 3000

CMD ["sh", "./scripts/pgsql.sh", "db", "5432", "--", "npm", "run", "start:dev"]
