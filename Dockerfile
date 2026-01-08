FROM oven/bun:latest

RUN apt-get update && apt-get install -y \
    fonts-nanum \
    fonts-noto-cjk \
    libc6 \
    libvips \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /zerobot

COPY tsconfig.json ./
COPY package.json ./
COPY src ./

RUN bun install --production

RUN date +%s > ./BUILD_ID

COPY . .

CMD ["bun", "./src/shard.ts"]