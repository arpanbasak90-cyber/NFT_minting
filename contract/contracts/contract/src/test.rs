#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mint_nft() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let nft_id = client.mint(
        &owner,
        &String::from_str(&env, "My First NFT"),
        &String::from_str(&env, "This is my first NFT on Stellar"),
        &String::from_str(&env, "https://stellar.example/nft/1"),
    );

    assert_eq!(nft_id, 1);

    let nft = client.get_nft(&1);
    assert_eq!(nft.owner, owner);
    assert_eq!(nft.name, String::from_str(&env, "My First NFT"));
    assert_eq!(
        nft.description,
        String::from_str(&env, "This is my first NFT on Stellar")
    );
    assert_eq!(
        nft.uri,
        String::from_str(&env, "https://stellar.example/nft/1")
    );
    assert_eq!(nft.is_listed, false);
}

#[test]
fn test_transfer_nft() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let new_owner = Address::generate(&env);

    client.mint(
        &owner,
        &String::from_str(&env, "Transferable NFT"),
        &String::from_str(&env, "This NFT can be transferred"),
        &String::from_str(&env, "https://stellar.example/nft/2"),
    );

    client.transfer(&owner, &new_owner, &1);

    let nft = client.get_nft(&1);
    assert_eq!(nft.owner, new_owner);
}

#[test]
fn test_list_nft() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    client.mint(
        &owner,
        &String::from_str(&env, "Listed NFT"),
        &String::from_str(&env, "NFT for sale"),
        &String::from_str(&env, "https://stellar.example/nft/3"),
    );

    client.list(&owner, &1, &500);

    let nft = client.get_nft(&1);
    assert_eq!(nft.is_listed, true);
    assert_eq!(nft.price, 500);
}

#[test]
fn test_get_owner_nfts() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    client.mint(
        &owner,
        &String::from_str(&env, "NFT One"),
        &String::from_str(&env, "First NFT"),
        &String::from_str(&env, "https://stellar.example/nft/4"),
    );

    client.mint(
        &owner,
        &String::from_str(&env, "NFT Two"),
        &String::from_str(&env, "Second NFT"),
        &String::from_str(&env, "https://stellar.example/nft/5"),
    );

    let owned_nfts = client.get_owner_nfts(&owner);
    assert_eq!(owned_nfts.len(), 2);
}

#[test]
fn test_total_supply() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    client.mint(
        &owner,
        &String::from_str(&env, "NFT One"),
        &String::from_str(&env, "First NFT"),
        &String::from_str(&env, "https://stellar.example/nft/6"),
    );

    client.mint(
        &owner,
        &String::from_str(&env, "NFT Two"),
        &String::from_str(&env, "Second NFT"),
        &String::from_str(&env, "https://stellar.example/nft/7"),
    );

    assert_eq!(client.total_supply(), 2);
}
