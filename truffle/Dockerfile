# NOTE: cloned from ajmay/truffle:5.0.9
FROM node:11.12.0

# NOTE: https://github.com/nodejs/docker-node/issues/740#issuecomment-462196213
USER node
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
WORKDIR /home/node/truffle

# NOTE: this version works well with light geth node
ENV TRUFFLE_VERSION=5.0.19

RUN npm install -g \
  truffle@${TRUFFLE_VERSION}

COPY ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY ./truffle.js ./truffle.js

ENTRYPOINT ["docker-entrypoint.sh"]
