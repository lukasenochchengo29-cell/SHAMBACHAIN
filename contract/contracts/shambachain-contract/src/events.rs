use soroban_sdk::{symbol_short, Address, Env, String};

pub struct Events;

impl Events {
    pub fn farmer_registered(env: &Env, farmer: Address, name: String, county: String) {
        let topics = (symbol_short!("f_reg"), farmer);
        env.events().publish(topics, (name, county));
    }

    pub fn entry_logged(
        env: &Env,
        farmer: Address,
        entry_id: u64,
        entry_type: u32, //0=harvest 1=scale 2=expense
        value: u64,
        new_score: u32,
        verified: u32, // 0=self 1=agent 2=settlite 3=flagged
    ){ 
        let topics = (symbol_short!("e_log"), farmer, entry_id);
        env.events().publish(topics, (entry_type, value, new_score, verified));
    }

    pub fn entry_verified(
      env:      &Env,
      farmer:   Address,
      entry_id: u64,
      agent:    Address,
  ) {
      let topics = (symbol_short!("e_verify"), farmer, entry_id);
      env.events().publish(topics, agent);
  }

  pub fn entry_flagged(env: &Env, farmer: Address, entry_id: u64, reason: String) {
      let topics = (symbol_short!("e_flag"), farmer, entry_id);
      env.events().publish(topics, reason);
  }

    pub fn loan_applied(
        env: &Env,
        farmer: Address,
        loan_id: u64,
        amount: u64,
        period: u32,
     ) {
        let topics = (symbol_short!("l_apply"), farmer, loan_id);
        env.events().publish(topics, (amount, period));
     }


     pub fn loan_approved(env: &Env, lender: Address, loan_id: u64, farmer: Address) {
        let topics = (symbol_short!("l_appr"), lender, loan_id);
        env.events().publish(topics, farmer);
     }
     pub fn loan_overdue(env: &Env, loan_id: u64, farmer: Address) {
      let topics = (symbol_short!("l_overdue"), loan_id);
      env.events().publish(topics, farmer);
  }

     pub fn loan_repaid(env: &Env, farmer: Address, loan_id: u64, amount: u64, fully_repaid: bool) {
        let topics = (symbol_short!("l_repay"), farmer, loan_id);
        env.events().publish(topics, (amount, fully_repaid));      
     }

     pub fn score_updated(env: &Env, farmer: Address, old_score: u32, new_score: u32) {
        let topics = (symbol_short!("score"), farmer);
        env.events().publish(topics, (old_score, new_score));
     }

     pub fn agent_registered(env: &Env, agent: Address, org: String, country: String) {
        let topics = (symbol_short!("ag_reg"), agent);
        env.events().publish(topics, (org, country));
     }
}