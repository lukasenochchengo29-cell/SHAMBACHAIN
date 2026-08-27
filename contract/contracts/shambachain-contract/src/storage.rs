use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Debug, Clone)]
pub struct EntryKey {
    pub farmer: Address,
    pub id: u64,
}

// All persistent storage keys 
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    // Global
    Admin,
    LoanCounter,
    FarmerList,
    AgentList,

    // Per-farmer
    FarmerProfile(Address),
    EntryCounter(Address),
    FarmerEntry(EntryKey),
    FarmerLoanId(Address),

    // Per loan 
    LoanApp(u64),

    // Agent Registry
    AgentProfile(Address), 
}