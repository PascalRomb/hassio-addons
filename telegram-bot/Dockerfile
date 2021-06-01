ARG BUILD_FROM
FROM $BUILD_FROM

# Add env
ENV LANG C.UTF-8


#copy resources
COPY rootfs ./

#install dependencies
RUN npm install

EXPOSE 8080
CMD [ "node", "app.js" ]