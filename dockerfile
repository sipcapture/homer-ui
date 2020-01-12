##### Stage 1

FROM node:10.15.0 as builder

# WORKDIR /app

# Copy project files to the docker image
COPY . .

# install angular/cli globally (latest version, change this to the version you are using)
RUN yarn global add @angular/cli@latest

# if you prefer npm, replace the above command with
# RUN npm install @angular/cli@latest -g

# install packages
# RUN yarn install

# FOR NPM
RUN npm install

# SET ENVIRONMENT VARIABLES
ENV ENVIRONMENT=production1
ENV apiUrl="apiUrl"

# Build Angular Application in Production
RUN ng build --prod