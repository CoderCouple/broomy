FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    curl git nodejs npm python3 pip build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code

ARG UID=1000
ARG GID=1000
RUN groupadd -g $GID broomy && useradd -m -u $UID -g $GID broomy

USER broomy
WORKDIR /home/broomy

CMD ["sleep", "infinity"]
