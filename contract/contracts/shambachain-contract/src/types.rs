use soroban_sdk::{contracttype,Address, Env, String};

// ----------- Credit Tier -----------
#[contracttype]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CreditTier {
    Unranked,
    Bronze,
    Silver,
    Gold,
    Platinum,
}

// ─── Entry verification status ────────────────────────────────────────────────
/// How much trust an entry carries.
///
/// Score weight applied per status:
///   AgentVerified  → 1.4× (agent physically confirmed the event)
///   SatelliteMatch → 1.2× (satellite imagery corroborates the claim)
///   SelfReported   → 1.0× (baseline — farmer only)
///   Flagged        → 0.3× (anomaly detected; lender review required)
#[contracttype]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VerificationStatus {
    SelfReported,   
    AgentVerified,  
    SatelliteMatch, 
    Flagged,        
}

// ----------- Farmer Profile -----------
#[contracttype]
#[derive(Debug, Clone)]
pub struct FarmerProfile {
    pub address: Address,
    pub name: String,
    pub country: String,
    pub region: String,
    pub primary_crop: String,
    // Farm size stored as acres × 1000 (e.g. 2.5 acres -> 250)
    pub farm_size_acres: u32,  
    pub registered_at: u64,
    pub total_harvests: u32,
    pub total_sales: u32,
    // Cumulate income in local currency units (integer, currency-agnostic)
    pub total_income_local: u64,
    pub credit_score : u32, // 0-850
    pub tier: CreditTier,
    pub active_loan: bool, 
    pub total_entries: u64,
    // number of entries that have been agent-verified
    pub agent_verified_count: u32, 
    // number of entires that have been flagged
    pub flagged_count: u32, 
    pub verification_ratio: u32,
}

// ----------- Ledger Entry Type ------------------------
#[contracttype]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EntryType {
    Harvest,
    Sale,
    Expense,
}

// ----------- Ledger Entry -----------
#[contracttype]
#[derive(Debug, Clone)]
pub struct LedgerEntry {
    pub id: u64,
    pub entry_type: EntryType,
    pub crop: String,
    pub quantity_kg: u32,
    pub value_local: u64,
    pub timestamp: u64,
    pub notes: String,
    pub verification: VerificationStatus,
    pub verified_by: Option<Address>,
    pub gps_hint: String, // field tracking coordinates
    pub satellite_score: u32,
}

// ------------ Loan Status ------------
#[contracttype]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LoanStatus {
    Pending,
    Approved,
    Disbursed,
    Repaid,
    Rejected,
    Overdue,
    WrittenOff,
}

// ------- Loan Application -----------
#[contracttype]
#[derive(Debug, Clone)]
pub struct LoanApplication {
    pub id: u64,
    pub farmer: Address,
    pub lender: Address,
    pub amount_usdc: u64,   // in USDC (integer units)
    pub period_months: u32, 
    pub purpose: String,
    pub status: LoanStatus,
    pub applied_at: u64,
    pub approved_at: u64,
    pub due_at: u64,
    pub repaid_amount: u64,
    pub credit_score_at_application: u32,
    pub verification_ratio_at_app: u32,
    pub insurance_opted: bool,
    pub insurance_premium_usdc: u64,
}

#[contracttype]
#[derive(Debug, Clone)]
pub struct AgentProfile {
    pub address:          Address,
    pub name:             String,
    pub organisation:     String,   
    pub country:          String,
    pub verified_entries: u32,      
    pub active:           bool,
    pub registered_at:    u64,
}