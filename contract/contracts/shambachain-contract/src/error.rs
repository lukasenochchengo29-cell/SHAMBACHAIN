use soroban_sdk::contracterror;

#[contracterror]
#[derive(Debug, Clone, PartialEq, Eq, Copy)]
pub enum ContractError {
    // Auth 
    Unauthorized = 1,
    AlreadyInitialized = 2,

    // Farmer
    FarmerNotFound = 3,
    FarmerAlreadyExists = 4,

    // Entry
    InvalidEntryType = 5,
    InvalidAmount = 6,
    EntryNotFound = 7,
    EntryAlreadyVerified = 8,
    EntryFlagged = 9,

    // Loan
    LoanNotFound = 10,
    ActiveLoanExists = 11,
    ScoreTooLow = 12, 
    AmountExceedsLimit = 13,
    LoanNotPending = 14,
    LoanNotDisbursed = 15,
    NotLoanLender = 16,
    OverRepayment = 17,

    // Agent
    AgentNotFound = 18,
    AgentAlreadyExists = 19,
    AgentNotActive = 20,
    NotAnAgent = 21,

    // General 
    NotInitialized = 22,
}
