SHELL := /bin/sh

ROOT_DIR := $(abspath $(CURDIR)/..)
ADMIN_DIR := $(CURDIR)
NPM ?= npm
WRANGLER ?= npx wrangler

.PHONY: help install dev build test test-e2e typecheck check deploy db-migrate-local db-migrate-remote

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_.-]+:.*## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install root and admin dependencies
	$(NPM) --prefix "$(ROOT_DIR)" ci
	$(NPM) --prefix "$(ADMIN_DIR)" ci

dev: ## Start the admin Vite development server
	$(NPM) run dev

build: ## Build admin assets into dist/
	$(NPM) run build

test: ## Run unit tests
	$(NPM) test

test-e2e: ## Run admin Playwright tests
	cd "$(ROOT_DIR)" && $(NPM) run test:e2e -- --config playwright.admin.config.ts

typecheck: ## Run TypeScript checks
	$(NPM) exec tsc -- --noEmit

check: typecheck test build ## Run typecheck, tests, and production build

deploy: build ## Build and deploy the Worker and static assets
	@if [ -z "$$CLOUDFLARE_API_TOKEN" ]; then echo 'Using the Wrangler login session (or set CLOUDFLARE_API_TOKEN for CI).'; fi
	$(WRANGLER) deploy

db-migrate-local: ## Apply pending D1 migrations to the local database
	$(WRANGLER) d1 migrations apply DB --local

db-migrate-remote: ## Apply pending D1 migrations to the remote database
	$(WRANGLER) d1 migrations apply DB --remote
