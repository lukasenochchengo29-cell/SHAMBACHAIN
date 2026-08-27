use soroban_sdk::{Address, Env, String, Vec};
use crate::error::ContractError;
use crate::types::{FarmerProfile, LedgerEntry, EntryType, LoanApplication, AgentProfile, VerificationStatus};

pub trait ShambaChainInterface {

    // one time initialization. Sets the admin adddress.
    fn initialize(env: Env, admin: Address) -> Result<(), ContractError>;

    // Farmer
    // Register a new famer. Caller must be the farmer
    fn register_farmer(
        env: Env, 
        farmer: Address,
        name: String,
        country: String,
        region: String,
        primary_crop: String,
        farm_size_acres: u32,
    ) -> Result<FarmerProfile, ContractError>;

    // get/return farmer's full on-chain profile. 
    fn get_farmer(env: Env, farmer: Address) -> Result<FarmerProfile, ContractError>;

    // Return all registered farmer addresses.
    fn get_all_farmers(env: Env) -> Vec<Address>;


    // --------- Ledger ---------------

    // Log a harvest, sale or expense entry.
    // run anomaly detection on submission
    // Automatically recalculates the farmer's credit score.
    fn log_entry(
        env: Env,
        farmer: Address,
        entry_type: EntryType,
        crop: String,
        qty_kg: u32,
        value: u64,
        notes: String,
        gps_hint: String,
    ) -> Result<LedgerEntry, ContractError>;

    // Oracle updates a satellite confidence score for an entry.
    // If satellite_score >= 70, status upgrades to SatelliteMatch.
    fn verify_entry(
        env: Env,
        agent: Address,
        farmer: Address,
        entry_id: u64,
    ) -> Result<(), ContractError>;

    fn flag_entry(
        env: Env,
        caller: Address,
        farmer: Address,
        entry_id: u64,
        reason: String,
    ) -> Result<(), ContractError>;

    fn set_satellite_score(
        env: Env,
        oracle: Address,
        farmer: Address,
        entry_id: u64,
        satellite_score: u32,
    ) -> Result<(), ContractError>;

    // Retrieves all, ledger entries for a farmer.
    fn get_ledger(env: Env, farmer: Address) -> Vec<LedgerEntry>;

    // Retrieves a specific ledger entry.
    fn get_entry(env: Env, farmer: Address, entry_id: u64) -> Result<LedgerEntry, ContractError>;

    // ----- Credit Score ------

    // Return the farmer's current on-chain credit score.
    fn get_credit_score(env: Env, farmer: Address) -> Result<u32, ContractError>;

    // ── Agent registry ───────────────────────────────────────────────────────
    fn register_agent(
        env:          Env,
        admin:        Address,
        agent:        Address,
        name:         String,
        organisation: String,
        country:      String,
    ) -> Result<AgentProfile, ContractError>;

    fn deactivate_agent(env: Env, admin: Address, agent: Address) -> Result<(), ContractError>;
    fn get_agent(env: Env, agent: Address) -> Result<AgentProfile, ContractError>;
    fn get_all_agents(env: Env) -> Vec<Address>;

    // ----- Loans ------
    // Farmer submits a loan application targeting a specific lender.
    fn apply_for_loan(
        env: Env,
        farmer: Address,
        lender: Address,
        amount_usdc: u64,
        period_months: u32, 
        purpose: String,
        insurance_opt: bool,
    ) -> Result<u64, ContractError>;

    // Lender approves and marks the loan as disbursed.
    fn approve_loan(
        env: Env,
        lender: Address,
        loan_id: u64,
    ) -> Result<LoanApplication, ContractError>;


    // Lender rejects a pending loan application. 
    fn reject_loan(
        env: Env,
        lender: Address,
        loan_id: u64,
    ) -> Result<(), ContractError>;

    // Farmer records a payment against an active loan.
    fn repay_loan(
        env: Env,
        lender: Address, 
        loan_id: u64,
        amount: u64,
    ) -> Result<LoanApplication, ContractError>;

    fn mark_overdue(env: Env, caller: Address, loan_id: u64) -> Result<(), ContractError>;

    // Return a loan application by ID.
    fn get_loan(env: Env, loan_id: u64) -> Result<LoanApplication, ContractError>;

    // Return the latest loan ID for a farmer.
    fn get_farmer_loan_id(env: Env, farmer: Address) -> Option<u64>;

    // ------ Admin ---------

    // Return the admin address stored at initialization.
    fn get_admin(env: Env) -> Result<Address, ContractError>;
}