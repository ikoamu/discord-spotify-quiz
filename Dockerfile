FROM node:16

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /usr/app
