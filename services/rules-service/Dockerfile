FROM node:22

WORKDIR /app

COPY ../../tsconfig.json ./tsconfig.base.json
COPY package*.json ./

RUN npm install

COPY . .

RUN mv tsconfig.base.json tsconfig.json
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/server.js"]
