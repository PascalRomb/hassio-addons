FROM node:14

#copy resources
COPY rootfs ./

#install dependencies
RUN npm install

CMD [ "node", "app.js" ]