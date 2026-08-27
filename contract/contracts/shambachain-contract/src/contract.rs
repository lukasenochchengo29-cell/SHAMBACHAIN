use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

use crate::{
    error::ContractError,
    events::Events,
    score,
    storage::{DataKey, EntryKey},
    trait_def::ShambaChainInterface,
    types::{
        AgentProfile, CreditTier, EntryType, FarmerProfile, LedgerEntry, LoanApplication, LoanStatus, VerificationStatus,
    },
};

// ── Anomaly detection thresholds ─────────────────────────────────────────────
/// Maximum entries a farmer can log in a single ledger period (day approximated
/// by checking entry counter — in testnet, used as total daily cap).
const MAX_ENTRIES_PER_DAY: u64 = 10;
 
/// Maximum plausible single-entry value in local currency units.
/// This is a soft flag — entries over this are reviewed, not rejected.
/// Set conservatively to 10,000 USD equivalent per entry.
/// (Kenya: 1,300,000 KES / Uganda: 37M UGX / Ethiopia: 550,000 ETB / Nigeria: 16M NGN)
/// We use a unified high cap and let the scoring engine deprioritise outliers.
const MAX_PLAUSIBLE_ENTRY_VALUE: u64 = 5_000_000_000; // 5B — nearly unreachable soft flag
 
/// A harvest quantity above 100,000 kg from a single farmer in one entry is flagged.
const MAX_PLAUSIBLE_QTY_KG: u32 = 100_000;

#[contract]
pub struct ShambaChain;

#[contractimpl]
impl ShambaChainInterface for ShambaChain {
    // ── Lifecycle ─────────────────────────────────────────────────────────────

    fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::LoanCounter, &0u64);
        Ok(())
    }

    // ── Farmer ────────────────────────────────────────────────────────────────

    fn register_farmer(
        env:             Env,
        farmer:          Address,
        name:            String,
        country:          String,
        region:          String,
        primary_crop:    String,
        farm_size_acres: u32,
    ) -> Result<FarmerProfile, ContractError> {
        farmer.require_auth();

        if env.storage().persistent().has(&DataKey::FarmerProfile(farmer.clone())) {
            return Err(ContractError::FarmerAlreadyExists);
        }

        let profile = FarmerProfile {
            address:          farmer.clone(),
            name:             name.clone(),
            country:           country.clone(),
            region:           region.clone(),
            primary_crop:     primary_crop.clone(),
            farm_size_acres,
            registered_at:    env.ledger().timestamp(),
            total_harvests:   0,
            total_sales:      0,
            total_income_local: 0,
            credit_score:     100,
            tier:             CreditTier::Unranked,
            active_loan:      false,
            total_entries:    0,
            agent_verified_count: 0,
            flagged_count:    0,
            verification_ratio: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::FarmerProfile(farmer.clone()), &profile);
        env.storage()
            .persistent()
            .set(&DataKey::EntryCounter(farmer.clone()), &0u64);

        // Append to global farmer list
        let mut list: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::FarmerList)
            .unwrap_or(Vec::new(&env));
        list.push_back(farmer.clone());
        env.storage().instance().set(&DataKey::FarmerList, &list);

        Events::farmer_registered(&env, farmer, name, country);
        Ok(profile)
    }

    fn get_farmer(env: Env, farmer: Address) -> Result<FarmerProfile, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::FarmerProfile(farmer))
            .ok_or(ContractError::FarmerNotFound)
    }

    fn get_all_farmers(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::FarmerList)
            .unwrap_or(Vec::new(&env))
    }

    // ── Ledger ────────────────────────────────────────────────────────────────

    fn log_entry(
        env:        Env,
        farmer:     Address,
        entry_type: EntryType,
        crop:       String,
        qty_kg:     u32,
        value:  u64,
        notes:      String,
        gps_hint: String,
    ) -> Result<LedgerEntry, ContractError> {
        farmer.require_auth();

        let mut profile: FarmerProfile = env
            .storage()
            .persistent()
            .get(&DataKey::FarmerProfile(farmer.clone()))
            .ok_or(ContractError::FarmerNotFound)?;

        // Increment entry counter
        let mut counter: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::EntryCounter(farmer.clone()))
            .unwrap_or(0);
        counter = counter.saturating_add(1);

        // ── Anomaly detection ─────────────────────────────────────────────────
        let mut verification = VerificationStatus::SelfReported;
        let mut flag_reason   = String::from_str(&env, "");

        if qty_kg > MAX_PLAUSIBLE_QTY_KG {
            verification  = VerificationStatus::Flagged;
            flag_reason   = String::from_str(&env, "qty_too_high");
        }

        if value > MAX_PLAUSIBLE_ENTRY_VALUE {
            verification  = VerificationStatus::Flagged;
            flag_reason   = String::from_str(&env, "value_too_high");
        }

        let days_active = (env.ledger().timestamp().saturating_sub(profile.registered_at)) / 86_400;
        if days_active == 0 && counter > MAX_ENTRIES_PER_DAY {
            verification = VerificationStatus::Flagged;
            flag_reason  = String::from_str(&env, "velocity_exceeded");
        }

        let is_flagged = verification == VerificationStatus::Flagged;
        if is_flagged {
            profile.flagged_count = profile.flagged_count.saturating_add(1);
        }

        let entry = LedgerEntry {
            id:          counter,
            entry_type:  entry_type.clone(),
            crop:        crop.clone(),
            quantity_kg: qty_kg,
            value_local: value,
            timestamp:   env.ledger().timestamp(),
            notes,
            verification: verification.clone(),
            verified_by: None,
            gps_hint,
            satellite_score: 0,
        };

        // Update profile statistics
        let type_code: u32 = match &entry_type {
            EntryType::Harvest => {
                profile.total_harvests = profile.total_harvests.saturating_add(1);
                0
            }
            EntryType::Sale => {
                profile.total_sales = profile.total_sales.saturating_add(1);
                profile.total_income_local = profile.total_income_local.saturating_add(value);
                1
            }
            EntryType::Expense => 2,
        };
        profile.total_entries = profile.total_entries.saturating_add(1);

        // ── Recalculate score with verification weights ────────────────────────
        let (w_harvests, w_sales) = Self::compute_weighted_counts(&env, &farmer, &entry, profile.total_harvests, profile.total_sales);
        let divisor               = score::income_divisor_for_soroban(&env, &profile.country);
        let old_score             = profile.credit_score;
        let new_score             = score::calculate(w_harvests, w_sales, profile.total_income_local, profile.total_entries, divisor);
        profile.credit_score      = new_score;
        profile.tier              = score::to_tier(new_score);
        profile.verification_ratio = if profile.total_entries > 0 {
            ((profile.agent_verified_count as u64 * 100) / profile.total_entries) as u32
        } else { 0 };

        // ── Persist ───────────────────────────────────────────────────────────
        let ekey = DataKey::FarmerEntry(EntryKey { farmer: farmer.clone(), id: counter });
        env.storage().persistent().set(&ekey, &entry);
        env.storage().persistent().set(&DataKey::EntryCounter(farmer.clone()), &counter);
        env.storage().persistent().set(&DataKey::FarmerProfile(farmer.clone()), &profile);

        let v_code: u32 = match verification { VerificationStatus::SelfReported => 0, VerificationStatus::AgentVerified => 1, VerificationStatus::SatelliteMatch => 2, VerificationStatus::Flagged => 3 };
        Events::entry_logged(&env, farmer.clone(), counter, type_code, value, new_score, v_code); 
        
        if is_flagged {
            Events::entry_flagged(&env, farmer, counter, flag_reason);
        } else if old_score != new_score {
            Events::score_updated(&env, farmer, old_score, new_score);
        }

        Ok(entry)
    }

    fn get_ledger(env: Env, farmer: Address) -> Vec<LedgerEntry> {
        let counter: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::EntryCounter(farmer.clone()))
            .unwrap_or(0);

        let mut entries = Vec::new(&env);
        for id in 1..=counter {
            let key = DataKey::FarmerEntry(EntryKey {
                farmer: farmer.clone(),
                id,
            });
            if let Some(e) = env.storage().persistent().get::<DataKey, LedgerEntry>(&key) {
                entries.push_back(e);
            }
        }
        entries
    }

    fn get_entry(env: Env, farmer: Address, entry_id: u64) -> Result<LedgerEntry, ContractError> {
        let key = DataKey::FarmerEntry(EntryKey {
            farmer,
            id: entry_id,
        });
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::EntryNotFound)
    }

    // ── Credit Score ──────────────────────────────────────────────────────────

    fn get_credit_score(env: Env, farmer: Address) -> Result<u32, ContractError> {
        let profile: FarmerProfile = env
            .storage()
            .persistent()
            .get(&DataKey::FarmerProfile(farmer))
            .ok_or(ContractError::FarmerNotFound)?;
        Ok(profile.credit_score)
    }

    fn verify_entry(
        env:      Env,
        agent:    Address,
        farmer:   Address,
        entry_id: u64,
    ) -> Result<(), ContractError> {
        agent.require_auth();

        let mut agent_profile: AgentProfile = env.storage().persistent()
            .get(&DataKey::AgentProfile(agent.clone()))
            .ok_or(ContractError::NotAnAgent)?;
        if !agent_profile.active {
            return Err(ContractError::AgentNotActive);
        }

        let ekey = DataKey::FarmerEntry(EntryKey { farmer: farmer.clone(), id: entry_id });
        let mut entry: LedgerEntry = env.storage().persistent()
            .get(&ekey).ok_or(ContractError::EntryNotFound)?;

        if entry.verification == VerificationStatus::AgentVerified {
            return Err(ContractError::EntryAlreadyVerified);
        }
        if entry.verification == VerificationStatus::Flagged {
            return Err(ContractError::EntryFlagged);
        }

        entry.verification = VerificationStatus::AgentVerified;
        entry.verified_by  = Some(agent.clone());
        env.storage().persistent().set(&ekey, &entry);

        let mut profile: FarmerProfile = env.storage().persistent()
            .get(&DataKey::FarmerProfile(farmer.clone()))
            .ok_or(ContractError::FarmerNotFound)?;
        profile.agent_verified_count = profile.agent_verified_count.saturating_add(1);
        profile.verification_ratio   = if profile.total_entries > 0 {
            ((profile.agent_verified_count as u64 * 100) / profile.total_entries) as u32
        } else { 0 };

        let (w_h, w_s) = Self::compute_weighted_counts(&env, &farmer, &entry, profile.total_harvests, profile.total_sales);
        let divisor    = score::income_divisor_for_soroban(&env, &profile.country);
        let old_score  = profile.credit_score;
        let new_score  = score::calculate(w_h, w_s, profile.total_income_local, profile.total_entries, divisor);
        profile.credit_score = new_score;
        profile.tier         = score::to_tier(new_score);
        env.storage().persistent().set(&DataKey::FarmerProfile(farmer.clone()), &profile);

        agent_profile.verified_entries = agent_profile.verified_entries.saturating_add(1);
        env.storage().persistent().set(&DataKey::AgentProfile(agent.clone()), &agent_profile);

        Events::entry_verified(&env, farmer.clone(), entry_id, agent);
        if old_score != new_score {
            Events::score_updated(&env, farmer, old_score, new_score);
        }
        Ok(())
    }

    // Agent verifies an entry
    fn flag_entry(
        env:      Env,
        caller:   Address,
        farmer:   Address,
        entry_id: u64,
        reason:   String,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(ContractError::NotInitialized)?;
        if caller != admin {
            return Err(ContractError::Unauthorized);
        }

        let ekey = DataKey::FarmerEntry(EntryKey { farmer: farmer.clone(), id: entry_id });
        let mut entry: LedgerEntry = env.storage().persistent().get(&ekey).ok_or(ContractError::EntryNotFound)?;
        entry.verification = VerificationStatus::Flagged;
        env.storage().persistent().set(&ekey, &entry);

        let mut profile: FarmerProfile = env.storage().persistent()
            .get(&DataKey::FarmerProfile(farmer.clone())).ok_or(ContractError::FarmerNotFound)?;
        profile.flagged_count = profile.flagged_count.saturating_add(1);

        let (w_h, w_s) = Self::compute_weighted_counts(&env, &farmer, &entry, profile.total_harvests, profile.total_sales);
        let divisor    = score::income_divisor_for_soroban(&env, &profile.country);
        let old_score  = profile.credit_score;
        let new_score  = score::calculate(w_h, w_s, profile.total_income_local, profile.total_entries, divisor);
        profile.credit_score = new_score;
        profile.tier         = score::to_tier(new_score);
        env.storage().persistent().set(&DataKey::FarmerProfile(farmer.clone()), &profile);

        Events::entry_flagged(&env, farmer.clone(), entry_id, reason);
        if old_score != new_score {
            Events::score_updated(&env, farmer, old_score, new_score);
        }
        Ok(())
    }

    fn set_satellite_score(
        env:             Env,
        oracle:          Address,
        farmer:          Address,
        entry_id:        u64,
        satellite_score: u32,
    ) -> Result<(), ContractError> {
        oracle.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(ContractError::NotInitialized)?;
        if oracle != admin {
            return Err(ContractError::Unauthorized);
        }

        let ekey = DataKey::FarmerEntry(EntryKey { farmer: farmer.clone(), id: entry_id });
        let mut entry: LedgerEntry = env.storage().persistent().get(&ekey).ok_or(ContractError::EntryNotFound)?;
        entry.satellite_score = satellite_score.min(100);

        if satellite_score >= 70 && entry.verification == VerificationStatus::SelfReported {
            entry.verification = VerificationStatus::SatelliteMatch;
        }
        env.storage().persistent().set(&ekey, &entry);
        Ok(())
    }

    // ── Agent registry ────────────────────────────────────────────────────────
    fn register_agent(
        env:          Env,
        admin:        Address,
        agent:        Address,
        name:         String,
        organisation: String,
        country:      String,
    ) -> Result<AgentProfile, ContractError> {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(ContractError::NotInitialized)?;
        if admin != stored_admin { return Err(ContractError::Unauthorized); }
    
        if env.storage().persistent().has(&DataKey::AgentProfile(agent.clone())) {
            return Err(ContractError::AgentAlreadyExists);
        }
    
        let profile = AgentProfile {
            address:          agent.clone(),
            name:             name.clone(),
            organisation:     organisation.clone(),
            country:          country.clone(),
            verified_entries: 0,
            active:           true,
            registered_at:    env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::AgentProfile(agent.clone()), &profile);
    
        let mut list: Vec<Address> = env.storage().instance()
            .get(&DataKey::AgentList).unwrap_or(Vec::new(&env));
        list.push_back(agent.clone());
        env.storage().instance().set(&DataKey::AgentList, &list);
    
        Events::agent_registered(&env, agent, organisation, country);
        Ok(profile)
    }
    
    fn deactivate_agent(env: Env, admin: Address, agent: Address) -> Result<(), ContractError> {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(ContractError::NotInitialized)?;
        if admin != stored_admin { return Err(ContractError::Unauthorized); }
    
        let mut profile: AgentProfile = env.storage().persistent()
            .get(&DataKey::AgentProfile(agent.clone())).ok_or(ContractError::AgentNotFound)?;
        profile.active = false;
        env.storage().persistent().set(&DataKey::AgentProfile(agent), &profile);
        Ok(())
    }
    
    fn get_agent(env: Env, agent: Address) -> Result<AgentProfile, ContractError> {
        env.storage().persistent().get(&DataKey::AgentProfile(agent)).ok_or(ContractError::AgentNotFound)
    }
    
    fn get_all_agents(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::AgentList).unwrap_or(Vec::new(&env))
    }

    // ── Loans ─────────────────────────────────────────────────────────────────

    fn apply_for_loan(
        env:           Env,
        farmer:        Address,
        lender:        Address,
        amount_usdc:   u64,
        period_months: u32,
        purpose:       String,
        insurance_opt: bool,
    ) -> Result<u64, ContractError> {
        farmer.require_auth();

        let profile: FarmerProfile = env
            .storage()
            .persistent()
            .get(&DataKey::FarmerProfile(farmer.clone()))
            .ok_or(ContractError::FarmerNotFound)?;

        if profile.active_loan {
            return Err(ContractError::ActiveLoanExists);
        }
        if profile.credit_score < score::MIN_LOAN_SCORE {
            return Err(ContractError::ScoreTooLow);
        }

        let max = score::max_loan_usdc(&profile.tier);
        if amount_usdc > max {
            return Err(ContractError::AmountExceedsLimit);
        }

        let premium = if insurance_opt { amount_usdc / 20} else { 0 }; // 5% premium

        let mut loan_ctr: u64 = env
            .storage()
            .instance()
            .get(&DataKey::LoanCounter)
            .unwrap_or(0);
        loan_ctr = loan_ctr.saturating_add(1);

        let loan = LoanApplication {
            id:             loan_ctr,
            farmer:         farmer.clone(),
            lender:         lender.clone(),
            amount_usdc,
            period_months,
            purpose,
            status:         LoanStatus::Pending,
            applied_at:     env.ledger().timestamp(),
            approved_at:    0,
            due_at:         0,
            repaid_amount:  0,
            credit_score_at_application: profile.credit_score,
            verification_ratio_at_app: profile.verification_ratio,
            insurance_opted: insurance_opt,
            insurance_premium_usdc:   premium,
        };

        env.storage()
            .persistent()
            .set(&DataKey::LoanApp(loan_ctr), &loan);
        env.storage()
            .instance()
            .set(&DataKey::LoanCounter, &loan_ctr);
        env.storage()
            .persistent()
            .set(&DataKey::FarmerLoanId(farmer.clone()), &loan_ctr);

        Events::loan_applied(&env, farmer, loan_ctr, amount_usdc, period_months);
        Ok(loan_ctr)
    }

    fn approve_loan(
        env:     Env,
        lender:  Address,
        loan_id: u64,
    ) -> Result<LoanApplication, ContractError> {
        lender.require_auth();

        let mut loan: LoanApplication = env
            .storage()
            .persistent()
            .get(&DataKey::LoanApp(loan_id))
            .ok_or(ContractError::LoanNotFound)?;

        if loan.lender != lender {
            return Err(ContractError::NotLoanLender);
        }
        if loan.status != LoanStatus::Pending {
            return Err(ContractError::LoanNotPending);
        }

        loan.status      = LoanStatus::Disbursed;
        loan.approved_at = env.ledger().timestamp();

        // Due date = approved_at + period_months * 30 days
        loan.due_at = loan.approved_at + (loan.period_months as u64 * 30 * 86_400);

        // Mark farmer as having an active loan
        let mut profile: FarmerProfile = env
            .storage()
            .persistent()
            .get(&DataKey::FarmerProfile(loan.farmer.clone()))
            .ok_or(ContractError::FarmerNotFound)?;
        profile.active_loan = true;
        env.storage()
            .persistent()
            .set(&DataKey::FarmerProfile(loan.farmer.clone()), &profile);
        env.storage()
            .persistent()
            .set(&DataKey::LoanApp(loan_id), &loan);

        Events::loan_approved(&env, lender, loan_id, loan.farmer.clone());
        Ok(loan)
    }

    fn reject_loan(
        env:     Env,
        lender:  Address,
        loan_id: u64,
    ) -> Result<(), ContractError> {
        lender.require_auth();

        let mut loan: LoanApplication = env
            .storage()
            .persistent()
            .get(&DataKey::LoanApp(loan_id))
            .ok_or(ContractError::LoanNotFound)?;

        if loan.lender != lender {
            return Err(ContractError::NotLoanLender);
        }
        if loan.status != LoanStatus::Pending {
            return Err(ContractError::LoanNotPending);
        }

        loan.status = LoanStatus::Rejected;
        env.storage()
            .persistent()
            .set(&DataKey::LoanApp(loan_id), &loan);
        Ok(())
    }

    fn repay_loan(
        env:     Env,
        farmer:  Address,
        loan_id: u64,
        amount:  u64,
    ) -> Result<LoanApplication, ContractError> {
        farmer.require_auth();

        let mut loan: LoanApplication = env
            .storage()
            .persistent()
            .get(&DataKey::LoanApp(loan_id))
            .ok_or(ContractError::LoanNotFound)?;

        if loan.farmer != farmer {
            return Err(ContractError::Unauthorized);
        }
        if loan.status != LoanStatus::Disbursed && loan.status != LoanStatus::Overdue {
            return Err(ContractError::LoanNotDisbursed);
        }

        let remaining = loan.amount_usdc.saturating_sub(loan.repaid_amount);
        if amount > remaining {
            return Err(ContractError::OverRepayment);
        }

        loan.repaid_amount = loan.repaid_amount.saturating_add(amount);
        let fully_repaid   = loan.repaid_amount >= loan.amount_usdc;

        if fully_repaid {
            loan.status = LoanStatus::Repaid;

            let mut profile: FarmerProfile = env
                .storage()
                .persistent()
                .get(&DataKey::FarmerProfile(farmer.clone()))
                .ok_or(ContractError::FarmerNotFound)?;
            profile.active_loan  = false;
            // Repayment bonus: +50 score capped at 850
            let boosted           = profile.credit_score.saturating_add(50).min(850);
            profile.credit_score  = boosted;
            profile.tier          = score::to_tier(boosted);
            env.storage()
                .persistent()
                .set(&DataKey::FarmerProfile(farmer.clone()), &profile);
        }

        env.storage()
            .persistent()
            .set(&DataKey::LoanApp(loan_id), &loan);

        Events::loan_repaid(&env, farmer, loan_id, amount, fully_repaid);
        Ok(loan)
    }

    fn mark_overdue(env: Env, caller: Address, loan_id: u64) -> Result<(), ContractError> {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(ContractError::NotInitialized)?;
        if caller != admin { return Err(ContractError::Unauthorized); }
 
        let mut loan: LoanApplication = env.storage().persistent()
            .get(&DataKey::LoanApp(loan_id)).ok_or(ContractError::LoanNotFound)?;
        if loan.status != LoanStatus::Disbursed { return Err(ContractError::LoanNotDisbursed); }
 
        loan.status = LoanStatus::Overdue;
        env.storage().persistent().set(&DataKey::LoanApp(loan_id), &loan);
 
        // Penalty: reduce score by 100 points
        let mut profile: FarmerProfile = env.storage().persistent()
            .get(&DataKey::FarmerProfile(loan.farmer.clone())).ok_or(ContractError::FarmerNotFound)?;
        let old = profile.credit_score;
        profile.credit_score = profile.credit_score.saturating_sub(100);
        profile.tier         = score::to_tier(profile.credit_score);
        env.storage().persistent().set(&DataKey::FarmerProfile(loan.farmer.clone()), &profile);
 
        Events::loan_overdue(&env, loan_id, loan.farmer.clone());
        Events::score_updated(&env, loan.farmer, old, profile.credit_score);
        Ok(())
    }

    fn get_loan(env: Env, loan_id: u64) -> Result<LoanApplication, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::LoanApp(loan_id))
            .ok_or(ContractError::LoanNotFound)
    }

    fn get_farmer_loan_id(env: Env, farmer: Address) -> Option<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::FarmerLoanId(farmer))
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    fn get_admin(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)
    }
}

// ── Internal helpers ──────────────────────────────────────────────────────────
impl ShambaChain {
    /// Compute weighted harvest and sale counts for scoring.
    /// We walk the full ledger and sum weights — expensive but accurate.
    /// In production this would use an accumulator stored on the profile.
    fn compute_weighted_counts(
        env:              &Env,
        farmer:           &Address,
        _current_entry:   &LedgerEntry,
        total_h:          u32,
        total_s:          u32,
    ) -> (u32, u32) {
        let counter: u64 = env.storage().persistent()
            .get(&DataKey::EntryCounter(farmer.clone())).unwrap_or(0);
 
        let mut w_h: u32 = 0;
        let mut w_s: u32 = 0;
 
        for id in 1..=counter {
            let key = DataKey::FarmerEntry(EntryKey { farmer: farmer.clone(), id });
            if let Some(e) = env.storage().persistent().get::<DataKey, LedgerEntry>(&key) {
                let w = score::verification_weight(&e.verification);
                match e.entry_type {
                    EntryType::Harvest => w_h = w_h.saturating_add(w),
                    EntryType::Sale    => w_s = w_s.saturating_add(w),
                    EntryType::Expense => {}
                }
            }
        }
        // Divide by 10 to normalise (weight is ×10 scale)
        (w_h / 10, w_s / 10)
    }
}