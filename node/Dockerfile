FROM node:18-alpine3.15

WORKDIR /app

COPY package*.json ./

RUN npm install

#RUN npm ci --only=production


COPY . .

#COPY --chown=node:node . ./

ENV PORT=3000

EXPOSE 3000

CMD [ "npm", "start" ]
#CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]

