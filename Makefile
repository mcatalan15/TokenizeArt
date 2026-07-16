IMAGE := tokenizeart
ENV_FILE := .env
RUN := docker run --rm -v $(CURDIR):/workspace -w /workspace/code $(IMAGE)

BONUS_COMPOSE := docker compose -f bonus/docker-compose.yml --env-file $(ENV_FILE)

.PHONY: build test anvil deploy upload mint clean bonus bonus-build bonus-down bonus-logs clean-bonus

build:
	docker build -t $(IMAGE) -f containers/Dockerfile .

test: build
	$(RUN) forge test -vvv

anvil: build
	docker run --rm -p 8545:8545 -v $(CURDIR):/workspace -w /workspace/code $(IMAGE) anvil --host 0.0.0.0

deploy: build
	docker run --rm --env-file $(ENV_FILE) -v $(CURDIR):/workspace -w /workspace/code $(IMAGE) \
		sh -c 'forge script ../deployment/Deploy.s.sol --rpc-url "$$SEPOLIA_RPC_URL" --broadcast \
			--verify --verifier-wait-timeout 15 --verifier-wait-retries 12'

upload: build
	docker run --rm --env-file $(ENV_FILE) -v $(CURDIR):/workspace -w /workspace $(IMAGE) \
		tsx mint/ipfs/upload.ts

mint: build
	docker run --rm --env-file $(ENV_FILE) -v $(CURDIR):/workspace -w /workspace/code $(IMAGE) \
		sh -c 'forge script ../mint/Mint.s.sol --rpc-url "$$SEPOLIA_RPC_URL" --broadcast'

clean:
	rm -rf code/out code/cache code/broadcast
	docker rmi $(IMAGE) 2>/dev/null || true

# Bonus: mint website (backend + Caddy/frontend), see bonus/README.md
bonus: bonus-build
	$(BONUS_COMPOSE) up -d
	@echo "Bonus site: http://localhost:$${BONUS_PORT:-8080}"

bonus-build:
	$(BONUS_COMPOSE) build

bonus-down:
	$(BONUS_COMPOSE) down

bonus-logs:
	$(BONUS_COMPOSE) logs -f

clean-bonus: bonus-down
	$(BONUS_COMPOSE) down --rmi local -v --remove-orphans
