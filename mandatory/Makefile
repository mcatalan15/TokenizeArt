IMAGE := tokenizeart

ENV_FILE := .env

RUN := docker run --rm -v $(CURDIR):/workspace -w /workspace/code $(IMAGE)

.PHONY: build test anvil deploy upload mint clean

build:
	docker build -t $(IMAGE) -f container/Dockerfile .

test: build
	$(RUN) forge test -vvv

anvil:
	docker run --rm -p 8545:8545 -v $(CURDIR):/workspace -w /workspace/code $(IMAGE) anvil --host 0.0.0.0

deploy: build
	docker run --rm --env-file $(ENV_FILE) -v $(CURDIR):/workspace -w /workspace/code $(IMAGE) \
		sh -c 'forge script ../deployment/Deploy.s.sol --rpc-url "$$SEPOLIA_RPC_URL" --broadcast \
			--verify --verifier-wait-timeout 15 --verifier-wait-retries 12'

upload: build
	docker run --rm --env-file $(ENV_FILE) -v $(CURDIR):/workspace -w /workspace $(IMAGE) \
		tsx mint/ipfs/upload.ts

mint: build
	docker run --rm --env-file $(ENV_FILE) -v $(CURDIR):/workspace -w /workspace $(IMAGE) \
		sh -c 'forge script ../mint/Mint.s.sol --rpc-url "$$SEPOLIA_RPC_URL" --broadcast'

clean:
	rm -rf code/out code/cache code/broadcast
	docker rmi $(IMAGE) 2>/dev/null || true
