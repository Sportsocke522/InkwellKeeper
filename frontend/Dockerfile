# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY ./ ./

RUN yarn build

CMD ["yarn", "dev", "--host"]
