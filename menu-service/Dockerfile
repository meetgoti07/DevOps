FROM node:25-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
EXPOSE 8082
CMD ["pnpm", "start"]