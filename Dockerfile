FROM node:24-slim
WORKDIR /course
COPY package*.json ./
RUN npm install
COPY . .
CMD ["bash"]
