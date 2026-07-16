# Single image for the whole toolchain: Foundry (forge/cast/anvil) + Node/TS
# tooling (IPFS upload, mint helpers). node:lts-slim is the base because the
# Node/TS side does real work (IPFS pinning script), not just glue.
FROM node:20-slim

# curl/git: required by foundryup and by forge's own submodule dependency installs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV FOUNDRY_DIR=/root/.foundry
ENV PATH="${FOUNDRY_DIR}/bin:${PATH}"

RUN curl -L https://foundry.paradigm.xyz | bash \
    && foundryup

# tsx: runs the mint/ipfs/upload.ts script directly, no build step or
# per-project node_modules needed.
RUN npm install -g tsx@4

WORKDIR /workspace

CMD ["bash"]
