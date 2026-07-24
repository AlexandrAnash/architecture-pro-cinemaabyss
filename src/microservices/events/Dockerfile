FROM node:20-alpine

RUN apk upgrade --no-cache

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

USER node

EXPOSE 8082

CMD ["npm", "run", "server"]