#![cfg(test)]

use soroban_sdk::{testutils::{Address as _, Ledger, LedgerInfo}, Address, Env, String };


use crate::{contract::{ShambaChain, ShambaChainClient}, types::{EntryType, LoanStatus, VerificationStatus}};

// -------- Test Helper -------------------
struct  Setup<'a> {
    env: Env,
    client: ShambaChainClient<'a>,
    admin: Address,
    jane: Address, //farmer
    bob: Address, //second farmer
    lender: Address,
    agent: Address, // field agent
} 

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set(LedgerInfo {
        timestamp: 1_700_000_000,
        protocol_version: 25,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10, 
        min_temp_entry_ttl: 16,
        min_persistent_entry_ttl: 4096,
        max_entry_ttl: 6_132_000,
    });
    let admin = Address::generate(&env);
    let jane = Address::generate(&env);
    let bob = Address::generate(&env);
    let lender = Address::generate(&env);
    let agent = Address::generate(&env);

    let contract_id = env.register(ShambaChain, ());
    let client = ShambaChainClient::new(&env, &contract_id);
    client.initialize(&admin);

    Setup { env, client, admin , jane, bob, lender, agent }

}

fn s(env: &Env, v: &str) -> String { String::from_str(env, v) }

fn register_jane(t: &Setup) {
    t.client.register_farmer(
        &t.jane,
        &s(&t.env, "Jane Wanjiku"), 
        &s(&t.env, "Kenya"),
        &s(&t.env, "Central Region"),
        &s(&t.env, "Maize"),
        &350,
    );
}

fn advance_time(env: &Env, secs: u64) {
    let ts = env.ledger().timestamp();
    env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: ts + secs,
        protocol_version: 22,
        sequence_number: env.ledger().sequence() + 1,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 16,
        min_persistent_entry_ttl: 4096,
        max_entry_ttl: 6_132_000,
    });
}

fn register_agent(t: &Setup) {
    t.client.register_agent(
        &t.admin, 
        &t.agent,
        &s(&t.env, "James Mwangi"),
        &s(&t.env, "Kenya Cooperative Creameries"),
        &s(&t.env, "Kenya"),
    );
}

// ------ Lifecycle ------------
#[test]
fn test_initialize() {
    let t = setup();
    assert_eq!(t.client.get_admin(), t.admin);
}

#[test]
fn test_double_initialize() {
    let t = setup();
    assert!(t.client.try_initialize(&t.admin).is_err());
}

// ------ Farmer -------
#[test]
fn test_register_farmer() {
    let t = setup();
    let p = t.client.register_farmer(
        &t.jane, &s(&t.env, "Jane"), &s(&t.env, "Kenya"),
        &s(&t.env, "Nakuru"), &s(&t.env, "Maize"), &350,
    );
    assert_eq!(p.credit_score, 100);
    assert_eq!(p.agent_verified_count, 0); 
    assert_eq!(p.flagged_count, 0);
}

#[test]
fn test_dublicate_registration_fails() {
    let t = setup(); 
    register_jane(&t);
    assert!(t.client.try_register_farmer(
        &t.jane, &s(&t.env, "Jane2"), &s(&t.env, "Kenya"), 
        &s(&t.env, "Nakuru"), &s(&t.env, "Maize"), &350, 
    ).is_err());
}

// ----- Ledger entries ---------------
#[test]
fn test_log_harvest_self_reported() {
    let t = setup(); register_jane(&t);
    let entry = t.client.log_entry(
        &t.jane, &EntryType::Harvest, &s(&t.env, "Maize"),
        &500, &15000, &s(&t.env, "Good harvest"), &s(&t.env, ""),
    );

    assert_eq!(entry.verification, VerificationStatus::SelfReported);
    assert_eq!(entry.satellite_score, 0);
    let score = t.client.get_credit_score(&t.jane);
    assert!(score > 100);
}

#[test]
fn test_agent_verification_boosts_score() {
    let t = setup(); register_jane(&t); register_agent(&t);

    // Log entry without agent
    t.client.log_entry(
        &t.jane, &EntryType::Harvest, &s(&t.env, "Maize"),
        &500, &15000, &s(&t.env, ""), &s(&t.env, ""),
    );
    let score_before = t.client.get_credit_score(&t.jane);

    // Agent verifies entry
    t.client.verify_entry(&t.agent, &t.jane, &1);
    let score_after = t.client.get_credit_score(&t.jane);

    assert!(score_after >= score_before, "Agent verification should maintain or boost score.");

    let entry = t.client.get_entry(&t.jane, &1);
    assert_eq!(entry.verification, VerificationStatus::AgentVerified);
    assert_eq!(entry.verified_by, Some(t.agent.clone()));

    let profile = t.client.get_farmer(&t.jane);
    assert_eq!(profile.agent_verified_count, 1);
    assert_eq!(profile.verification_ratio, 100); 
    
}

#[test]
fn test_cannot_verify_already_verified_entry() {
    let t = setup(); 
    register_jane(&t); 
    register_agent(&t);
    t.client.log_entry(&t.jane, &EntryType::Harvest, &s(&t.env, "Maize"), &500, &15000, &s(&t.env, ""), &s(&t.env, ""));
    t.client.verify_entry(&t.agent, &t.jane, &1);
    assert!(t.client.try_verify_entry(&t.agent, &t.jane, &1).is_err()); 
}

#[test]
fn test_satellite_score_upgrade_status() {
    let t = setup(); register_jane(&t);
    t.client.log_entry(&t.jane, &EntryType::Harvest, &s(&t.env, "Maize"), &500, &15000, &s(&t.env, ""), &s(&t.env, ""));

    // satellite score below threshold - stays SelfReported
    t.client.set_satellite_score(&t.admin, &t.jane, &1, &60);
    let entry = t.client.get_entry(&t.jane, &1);
    assert_eq!(entry.verification, VerificationStatus::SelfReported);
    assert_eq!(entry.satellite_score, 60);

    // satellite score above threshold - upgrades to SatelliteMatch
    t.client.set_satellite_score(&t.admin, &t.jane, &1, &85);
    let entry2 = t.client.get_entry(&t.jane, &1);
    assert_eq!(entry2.verification, VerificationStatus::SatelliteMatch);
}

