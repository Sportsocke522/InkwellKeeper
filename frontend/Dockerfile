FROM node:19

WORKDIR /app

# Kopiere nur die package.json und das Lockfile
COPY package*.json ./
COPY yarn.lock ./

# Installiere Abhängigkeiten
RUN yarn install

# Kopiere den Rest der Anwendung
COPY . .

# Starte die Anwendung
CMD ["yarn", "start"]
