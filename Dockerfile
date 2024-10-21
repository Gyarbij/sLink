FROM node:23

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 36

CMD ["node", "index.js"]