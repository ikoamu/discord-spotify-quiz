FROM node:16

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /usr/app

COPY package*.json ./
RUN npm install

ENV NODE_ENV=production

COPY . .
RUN npm run build

CMD ["node", "./dist/index.js"]