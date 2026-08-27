include .env

# ── WASM path (stellar contract build output) ─────────────────────────────────
# Stellar CLI v20+ uses wasm32v1-none, older uses wasm32-unknown-unknown
WASM_V1   := ../../target/wasm32v1-none/release/shambachain_contract.wasm
WASM_OLD  := ../../target/wasm32-unknown-unknown/release/shambachain_contract.wasm

# Detect which target was built
WASM := $(shell [ -f $(WASM_V1) ] && echo $(WASM_V1) || echo $(WASM_OLD))

.DEFAULT_GOAL := help

# ══════════════════════════════════════════════════════════════════════════════
# BUILD & TEST
# ══════════════════════════════════════════════════════════════════════════════

## Build the WASM binary
build:
	@echo "🔨 Building ShambaChain contract..."
	stellar contract build
	@echo ""
	@echo "✅ Build complete. WASM file:"
	@ls -lh $(WASM_V1) 2>/dev/null || ls -lh $(WASM_OLD) 2>/dev/null || echo "   Check target/ directory"

## Run all unit tests
test:
	@echo "🧪 Running ShambaChain tests..."
	cargo test -- --nocapture
	@echo "✅ All tests passed!"

## Run tests with output shown even on pass
test-verbose:
	cargo test -- --nocapture --test-output immediate

## Format code
fmt:
	cargo fmt --all

## Clean build artifacts
clean:
	cargo clean

# ══════════════════════════════════════════════════════════════════════════════
# DEPLOY PIPELINE  (run in order: upload → deploy → initialize)
# ══════════════════════════════════════════════════════════════════════════════

## Step 1 — Upload WASM to Stellar network, saves hash to wasm_hash.txt
upload: build
	@echo "📦 Uploading WASM to $(NETWORK)..."
	@echo "   Source account : $(SOURCE_ACCOUNT)"
	@echo "   WASM file      : $(WASM)"
	stellar contract install \
	  --network $(NETWORK) \
	  --source  $(SOURCE_ACCOUNT) \
	  --wasm    $(WASM) | tee upload.log
	@tail -n 1 upload.log > wasm_hash.txt
	@echo ""
	@echo "✅ WASM hash saved → wasm_hash.txt:"
	@cat wasm_hash.txt

## Step 2 — Deploy contract from hash, saves Contract ID to contract_id.txt
deploy:
	@echo "🚀 Deploying ShambaChain to $(NETWORK)..."
	stellar contract deploy \
	  --wasm-hash     $$(cat wasm_hash.txt) \
	  --network       $(NETWORK) \
	  --source-account $(SOURCE_ACCOUNT) | tee contract_id.txt
	@echo ""
	@echo "✅ Contract ID saved → contract_id.txt:"
	@cat contract_id.txt
	@echo ""
	@echo "👇 NOW: paste this ID into frontend/.env as VITE_CONTRACT_ID"

## Step 3 — Initialize contract (set admin). Run once after deploy.
initialize:
	@echo "🔧 Initializing ShambaChain with admin: $(ADMIN_ADDRESS)..."
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- initialize \
	  --admin $(ADMIN_ADDRESS)
	@echo "✅ Contract initialized!"

## Full deploy pipeline in one command: build → upload → deploy → initialize
setup: upload deploy initialize
	@echo ""
	@echo "🎉 ════════════════════════════════════════════"
	@echo "🎉   ShambaChain is LIVE on $(NETWORK)!"
	@echo "🎉 ════════════════════════════════════════════"
	@echo ""
	@echo "📋 Your Contract ID:"
	@cat contract_id.txt
	@echo ""
	@echo "👇 Next steps:"
	@echo "   1. Copy the Contract ID above"
	@echo "   2. Open  frontend/.env"
	@echo "   3. Set   VITE_CONTRACT_ID=<paste here>"
	@echo "   4. Run   cd ../frontend && npm install && npm run dev"

# ══════════════════════════════════════════════════════════════════════════════
# VERIFY — check what's on chain after deploy
# ══════════════════════════════════════════════════════════════════════════════

## Print the admin address stored in the contract
get-admin:
	@echo "👤 Contract admin:"
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_admin

## List all registered farmer addresses
get-all-farmers:
	@echo "🌾 All registered farmers:"
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_all_farmers

## Get a single farmer profile
## Usage: make get-farmer FARMER=G...
get-farmer:
	@[ -n "$(FARMER)" ] || (echo "❌ Usage: make get-farmer FARMER=G..." && exit 1)
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_farmer \
	  --farmer $(FARMER)

## Get credit score for a farmer
## Usage: make get-score FARMER=G...
get-score:
	@[ -n "$(FARMER)" ] || (echo "❌ Usage: make get-score FARMER=G..." && exit 1)
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_credit_score \
	  --farmer $(FARMER)

## Get all ledger entries for a farmer
## Usage: make get-ledger FARMER=G...
get-ledger:
	@[ -n "$(FARMER)" ] || (echo "❌ Usage: make get-ledger FARMER=G..." && exit 1)
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_ledger \
	  --farmer $(FARMER)

## Get a single ledger entry
## Usage: make get-entry FARMER=G... ENTRY_ID=1
get-entry:
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_entry \
	  --farmer   $(FARMER) \
	  --entry_id $(ENTRY_ID)

## Get a loan by ID
## Usage: make get-loan LOAN_ID=1
get-loan:
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_loan \
	  --loan_id $(LOAN_ID)

## List all registered agent addresses
get-all-agents:
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- get_all_agents

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ACTIONS — run from admin account
# ══════════════════════════════════════════════════════════════════════════════

## Register a field agent
## Usage: make register-agent AGENT=G... AGENT_NAME="James Mwangi" ORG="KCC" COUNTRY=Kenya
register-agent:
	@[ -n "$(AGENT)" ] || (echo "❌ Usage: make register-agent AGENT=G... AGENT_NAME='...' ORG='...' COUNTRY=Kenya" && exit 1)
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- register_agent \
	  --admin        $(ADMIN_ADDRESS) \
	  --agent        $(AGENT) \
	  --name         "$(AGENT_NAME)" \
	  --organisation "$(ORG)" \
	  --country      "$(COUNTRY)"
	@echo "✅ Agent $(AGENT_NAME) registered!"

## Deactivate an agent
## Usage: make deactivate-agent AGENT=G...
deactivate-agent:
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- deactivate_agent \
	  --admin $(ADMIN_ADDRESS) \
	  --agent $(AGENT)

## Mark a loan as overdue (admin only, after 30-day grace period)
## Usage: make mark-overdue LOAN_ID=1
mark-overdue:
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- mark_overdue \
	  --caller  $(ADMIN_ADDRESS) \
	  --loan_id $(LOAN_ID)
	@echo "⚠️  Loan #$(LOAN_ID) marked as overdue. Farmer score reduced by 100."

## Set satellite confidence score for an entry (oracle/admin only)
## Usage: make set-satellite FARMER=G... ENTRY_ID=1 SAT_SCORE=85
set-satellite:
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- set_satellite_score \
	  --oracle          $(ADMIN_ADDRESS) \
	  --farmer          $(FARMER) \
	  --entry_id        $(ENTRY_ID) \
	  --satellite_score $(SAT_SCORE)
	@echo "🛰️  Satellite score $(SAT_SCORE) set for entry #$(ENTRY_ID)"

## Flag a suspicious entry (admin only)
## Usage: make flag-entry FARMER=G... ENTRY_ID=2 REASON=suspicious_qty
flag-entry:
	stellar contract invoke \
	  --id      $$(cat contract_id.txt) \
	  --source  $(SOURCE_ACCOUNT) \
	  --network $(NETWORK) \
	  -- flag_entry \
	  --caller   $(ADMIN_ADDRESS) \
	  --farmer   $(FARMER) \
	  --entry_id $(ENTRY_ID) \
	  --reason   "$(REASON)"
	@echo "🔴 Entry #$(ENTRY_ID) flagged as: $(REASON)"

# ══════════════════════════════════════════════════════════════════════════════
# UTILS
# ══════════════════════════════════════════════════════════════════════════════

## Show the deployed contract ID
show-contract:
	@echo "📄 Contract ID:"; cat contract_id.txt

## Show the uploaded WASM hash
show-hash:
	@echo "🔑 WASM Hash:"; cat wasm_hash.txt

## Print your admin wallet address
get-address:
	@stellar keys address $(SOURCE_ACCOUNT)

## Fund your account from testnet faucet (testnet only)
fund:
	@echo "💧 Funding $(SOURCE_ACCOUNT) from Friendbot..."
	stellar keys fund $(SOURCE_ACCOUNT) --network testnet
	@echo "✅ Done!"

## Show help
help:
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║              ShambaChain — Makefile Commands                 ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║  SETUP (run in this order)                                   ║"
	@echo "║    make build            Build WASM binary                   ║"
	@echo "║    make test             Run all 15 unit tests               ║"
	@echo "║    make upload           Upload WASM → get hash              ║"
	@echo "║    make deploy           Deploy contract → get ID            ║"
	@echo "║    make initialize       Set admin (run once)                ║"
	@echo "║    make setup            All 3 above in sequence             ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║  READ (no signing required)                                  ║"
	@echo "║    make get-admin                                            ║"
	@echo "║    make get-all-farmers                                      ║"
	@echo "║    make get-farmer    FARMER=G...                            ║"
	@echo "║    make get-score     FARMER=G...                            ║"
	@echo "║    make get-ledger    FARMER=G...                            ║"
	@echo "║    make get-entry     FARMER=G... ENTRY_ID=1                 ║"
	@echo "║    make get-loan      LOAN_ID=1                              ║"
	@echo "║    make get-all-agents                                       ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║  ADMIN ACTIONS (require SOURCE_ACCOUNT = admin)              ║"
	@echo "║    make register-agent  AGENT=G... AGENT_NAME='Name'        ║"
	@echo "║                         ORG='Org'  COUNTRY=Kenya            ║"
	@echo "║    make deactivate-agent AGENT=G...                          ║"
	@echo "║    make mark-overdue    LOAN_ID=1                            ║"
	@echo "║    make set-satellite   FARMER=G... ENTRY_ID=1 SAT_SCORE=85  ║"
	@echo "║    make flag-entry      FARMER=G... ENTRY_ID=1 REASON=...    ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║  UTILS                                                       ║"
	@echo "║    make show-contract   Print contract ID                    ║"
	@echo "║    make show-hash       Print WASM hash                      ║"
	@echo "║    make get-address     Print your wallet address            ║"
	@echo "║    make fund            Fund from testnet faucet             ║"
	@echo "║    make fmt             Format Rust code                     ║"
	@echo "║    make clean           Clean build artifacts                ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""

.PHONY: build test test-verbose fmt clean \
        upload deploy initialize setup \
        get-admin get-all-farmers get-farmer get-score \
        get-ledger get-entry get-loan get-all-agents \
        register-agent deactivate-agent mark-overdue \
        set-satellite flag-entry \
        show-contract show-hash get-address fund help