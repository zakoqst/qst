FROM node:16
WORKDIR /qst
COPY package*.json app.js ./
RUN npm install
EXPOSE 5000
CMD ["node", "app.js"]
