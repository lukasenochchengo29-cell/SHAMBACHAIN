use crate::types::CreditTier;

/// ShambaChain Credit Scoring Engine
///
/// Score = 100  (base — every registered farmer starts here)
///       + harvest_frequency   (max 200) — rewards consistent harvesting
///       + sales_consistency   (max 200) — rewards converting harvest → sales
///       + income_growth       (max 200) — rewards growing local currency income
///       + record_regularity   (max 150) — rewards frequent on-chain activity
///
/// Maximum possible score = 850  (mirrors FICO scale upper range)

pub fn calculate(
    total_harvests: u32,
    total_sales: u32,
    total_income_local: u64,
    total_entries: u64,
    income_divisor: u64,
) -> u32 {
    let freq = (total_harvests.saturating_mul(25)).min(200);
    let cons = (total_sales.saturating_mul(30)).min(200);
    // Divisor 500 is calibrated for KES; other currencies scale proportionally.
    // On the frontend. The contract stores raw integer
    let grow = (((total_income_local / income_divisor.max(1)) as u32)).min(200);
    let reg  = (((total_entries.saturating_mul(10)) as u32)).min(150);

    (100_u32)
        .saturating_add(freq)
        .saturating_add(cons)
        .saturating_add(grow)
        .saturating_add(reg)
        .min(850)
}

 
/// Verification weight multiplied × 10 to stay integer arithmetic.
///   AgentVerified  → 14  (÷10 = 1.4)
///   SatelliteMatch → 12  (÷10 = 1.2)
///   SelfReported   → 10  (÷10 = 1.0)
///   Flagged        →  3  (÷10 = 0.3)
pub fn verification_weight(status: &crate::types::VerificationStatus) -> u32 {
    use crate::types::VerificationStatus::*;
    match status {
        AgentVerified  => 14,
        SatelliteMatch => 12,
        SelfReported   => 10,
        Flagged        =>  3,
    }
}
 
/// Apply verification weight to a count — returns weighted_count (integer, ÷10 scaled).
/// Caller should divide by 10 after accumulating to get the true weighted count.
pub fn apply_weight(count: u32, status: &crate::types::VerificationStatus) -> u32 {
    count.saturating_mul(verification_weight(status))
}

pub fn to_tier(score: u32) -> CreditTier {
    match score {
        750..=850 => CreditTier::Platinum,
        650..=749 => CreditTier::Gold,
        500..=649 => CreditTier::Silver,
        300..=499 => CreditTier::Bronze,
        _ => CreditTier::Unranked,
    }
}

// Maximum USDC loan permitted per tier

pub fn max_loan_usdc(tier: &CreditTier) -> u64 {
    match tier {
        CreditTier::Platinum => 5_000,
        CreditTier::Gold => 2_000,
        CreditTier::Silver => 800,
        CreditTier::Bronze => 200,
        CreditTier::Unranked => 50,
    }
}

// Minimum score required to apply for any loan
pub const MIN_LOAN_SCORE: u32 = 200;

/// Country-specific income divisor (calibrated to local currency denomination)
pub fn income_divisor_for(country: &str) -> u64 {
    // These approximate a similar "real income" threshold across currencies.
    // Base is KES 500 ≈ USDC 3.9 per point.
    // Adjusted: UGX 18000 ≈ USD 4.9, ETB 30 ≈ USD 0.54 (lower threshold), NGN 700 ≈ USD 0.44
    match country {
        "Kenya"    =>    500,
        "Uganda"   => 18_000,
        "Ethiopia" =>     30,
        "Nigeria"  =>    700,
        _          =>    500,   // default to Kenya baseline
    }
}
 
/// Soroban-compatible country divisor lookup.
/// Uses byte comparison against known country name strings since we are in no_std.
pub fn income_divisor_for_soroban(env: &soroban_sdk::Env, country: &soroban_sdk::String) -> u64 {
    let kenya    = soroban_sdk::String::from_str(env, "Kenya");
    let uganda   = soroban_sdk::String::from_str(env, "Uganda");
    let ethiopia = soroban_sdk::String::from_str(env, "Ethiopia");
    let nigeria  = soroban_sdk::String::from_str(env, "Nigeria");
 
    if *country == kenya    { return    500; }
    if *country == uganda   { return 18_000; }
    if *country == ethiopia { return     30; }
    if *country == nigeria  { return    700; }
    500  // default to Kenya baseline
}