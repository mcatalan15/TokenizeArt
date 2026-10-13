FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV FOUNDRY_DIR=/root/.foundry
ENV PATH="${FOUNDRY_DIR}/bin:${PATH}"

RUN curl -L https://foundry.paradigm.xyz | bash \
    && foundryup

RUN npm install -g tsx@4

WORKDIR /workspace

CMD ["bash"]
