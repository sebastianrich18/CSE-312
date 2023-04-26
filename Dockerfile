FROM node
ENV HOME /root
WORKDIR /root
COPY . .

EXPOSE 8008

ENV IN_DOCKER Yes 

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

RUN npm install

CMD /wait && npm run build && npm run start
