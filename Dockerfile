FROM node:12-alpine

RUN apk add git && git clone https://github.com/sipcapture/homer-ui /app
WORKDIR /app
RUN npm install && npm install -g @angular/cli
CMD ["ng","build"]

