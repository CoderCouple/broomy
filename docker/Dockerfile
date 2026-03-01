FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates build-essential python3 python3-pip \
    nodejs npm bash \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code @openai/codex-cli
RUN pip3 install --break-system-packages aider-chat

RUN useradd -m -s /bin/bash broomy
USER broomy
WORKDIR /home/broomy

CMD ["sleep", "infinity"]
