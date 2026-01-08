FROM oven/bun:latest

WORKDIR /zerobot

COPY tsconfig.json ./
COPY package.json ./
COPY src ./

RUN bun install --production

RUN date +%s > ./BUILD_ID

COPY . .

CMD ["bun", "./src/shard.ts"]