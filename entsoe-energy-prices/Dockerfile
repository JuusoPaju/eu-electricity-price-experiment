FROM node:20-alpine

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .

VOLUME /app/cache
ENV CACHE_DURATION=3600000
ENV DOCUMENT_TYPE=A44
ENV PROCESS_TYPE=A16
ENV DOMAIN=10Y1001A1001A82H
ENV TIME_ZONE=UTC

CMD ["node", "server.js"]