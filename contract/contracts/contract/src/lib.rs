#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, vec, Address, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct NFT {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub uri: String,
    pub owner: Address,
    pub is_listed: bool,
    pub price: i128,
}

#[contracttype]
pub enum DataKey {
    Counter,
    NFTs,
    OwnerNFTs(Address),
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn mint(env: Env, owner: Address, name: String, description: String, uri: String) -> u64 {
        owner.require_auth();

        let counter_key = DataKey::Counter;
        let count: u64 = env.storage().instance().get(&counter_key).unwrap_or(0);
        let new_id = count + 1;

        let nft = NFT {
            id: new_id,
            name,
            description,
            uri,
            owner: owner.clone(),
            is_listed: false,
            price: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::NFTs, &Map::<u64, NFT>::new(&env));

        let mut nfts: Map<u64, NFT> = env.storage().instance().get(&DataKey::NFTs).unwrap();
        nfts.set(new_id, nft);
        env.storage().instance().set(&DataKey::NFTs, &nfts);

        let mut owner_nfts: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerNFTs(owner.clone()))
            .unwrap_or(vec![&env]);
        owner_nfts.push_back(new_id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerNFTs(owner), &owner_nfts);

        env.storage().instance().set(&counter_key, &new_id);

        new_id
    }

    pub fn transfer(env: Env, from: Address, to: Address, nft_id: u64) {
        from.require_auth();

        let mut nfts: Map<u64, NFT> = env.storage().instance().get(&DataKey::NFTs).unwrap();
        let mut nft = nfts.get(nft_id).expect("NFT not found");

        assert_eq!(nft.owner, from, "Not the owner");
        assert!(!nft.is_listed, "NFT is listed for sale");

        nft.owner = to.clone();
        nfts.set(nft_id, nft.clone());
        env.storage().instance().set(&DataKey::NFTs, &nfts);

        let from_nfts: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerNFTs(from.clone()))
            .unwrap_or(vec![&env]);
        let mut new_from_nfts: Vec<u64> = Vec::new(&env);
        for i in 0..from_nfts.len() {
            if from_nfts.get(i).unwrap() != nft_id {
                new_from_nfts.push_back(from_nfts.get(i).unwrap());
            }
        }
        env.storage()
            .persistent()
            .set(&DataKey::OwnerNFTs(from), &new_from_nfts);

        let mut to_nfts: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerNFTs(to.clone()))
            .unwrap_or(vec![&env]);
        to_nfts.push_back(nft_id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerNFTs(to), &to_nfts);
    }

    pub fn list(env: Env, owner: Address, nft_id: u64, price: i128) {
        owner.require_auth();

        let mut nfts: Map<u64, NFT> = env.storage().instance().get(&DataKey::NFTs).unwrap();
        let mut nft = nfts.get(nft_id).expect("NFT not found");

        assert_eq!(nft.owner, owner, "Not the owner");

        nft.is_listed = true;
        nft.price = price;
        nfts.set(nft_id, nft);
        env.storage().instance().set(&DataKey::NFTs, &nfts);
    }

    pub fn get_nft(env: Env, nft_id: u64) -> NFT {
        let nfts: Map<u64, NFT> = env.storage().instance().get(&DataKey::NFTs).unwrap();
        nfts.get(nft_id).expect("NFT not found")
    }

    pub fn get_owner_nfts(env: Env, owner: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::OwnerNFTs(owner))
            .unwrap_or(vec![&env])
    }

    pub fn total_supply(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }
}

mod test;
