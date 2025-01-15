# Verwende ein Node.js-Image
FROM node:18

# Setze das Arbeitsverzeichnis
WORKDIR /app

# Kopiere package.json und yarn.lock
COPY package.json yarn.lock ./

# Installiere alle Abhängigkeiten
RUN yarn install

# Kopiere den Rest des Codes
COPY . .

# Starte die Anwendung
CMD ["node", "index.js"]
