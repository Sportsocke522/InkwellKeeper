FROM node:16
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .

# Führe die App als Hintergrundprozess aus
CMD ["node", "index.js"]

EXPOSE 5000
