FROM node:6-alpine
MAINTAINER Virgil <support@VirgilSecurity.com>
RUN apk add --no-cache --update ca-certificates
RUN npm install -g pm2

# Add package.json and then install dependncies
# so that `npm install` is only run if package.json changes
COPY package.json .

# Install app dependencies
RUN npm install --production

# Bundle app files
COPY bin bin/
COPY config config/
COPY controllers controllers/
COPY services services/
COPY app.js .
COPY pm2.json .

ENV PORT 3000

EXPOSE 3000

CMD [ "pm2", "start", "pm2.json", "--no-daemon" ]