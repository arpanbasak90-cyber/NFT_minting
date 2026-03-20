"use client";

import { useState, useCallback } from "react";
import {
  mintNft,
  transferNft,
  listNft,
  getNft,
  getOwnerNfts,
  getTotalSupply,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function NftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── NFT Card ──────────────────────────────────────────────────

function NFTCard({ nft, onView }: { nft: any; onView: () => void }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all hover:border-white/[0.1] hover:bg-white/[0.03]">
      <div className="aspect-square bg-gradient-to-br from-[#7c6cf0]/10 to-[#4fc3f7]/10 flex items-center justify-center">
        <NftIcon />
      </div>
      <div className="p-4 space-y-2">
        <h4 className="text-sm font-medium text-white/90 truncate">{nft.name}</h4>
        <p className="text-[10px] text-white/30 truncate">{nft.description}</p>
        <div className="flex items-center justify-between">
          {nft.is_listed ? (
            <Badge variant="success">Listed</Badge>
          ) : (
            <Badge variant="info">Owned</Badge>
          )}
          <button
            onClick={onView}
            className="text-[10px] text-[#4fc3f7]/60 hover:text-[#4fc3f7]/90 flex items-center gap-1"
          >
            View <ExternalLinkIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "mint" | "view" | "transfer" | "list";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("mint");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Mint state
  const [mintName, setMintName] = useState("");
  const [mintDesc, setMintDesc] = useState("");
  const [mintUri, setMintUri] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintedNftId, setMintedNftId] = useState<number | null>(null);

  // View state
  const [viewNftId, setViewNftId] = useState("");
  const [isViewing, setIsViewing] = useState(false);
  const [viewedNft, setViewedNft] = useState<any>(null);

  // Transfer state
  const [transferNftId, setTransferNftId] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // List state
  const [listNftId, setListNftId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [isListing, setIsListing] = useState(false);

  // My NFTs
  const [myNfts, setMyNfts] = useState<any[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const refreshMyNfts = useCallback(async () => {
    if (walletAddress) {
      try {
        const nftIds = await getOwnerNfts(walletAddress);
        if (Array.isArray(nftIds)) {
          const nfts = await Promise.all(
            nftIds.map(async (id: any) => {
              const nft = await getNft(Number(id));
              return nft;
            })
          );
          setMyNfts(nfts.filter(Boolean));
        }
        const supply = await getTotalSupply();
        setTotalSupply(Number(supply) || 0);
      } catch (e) {
        console.error("Failed to fetch NFTs:", e);
      }
    }
  }, [walletAddress]);

  // Load NFTs when switching to view tab or on mount
  useState(() => {
    if (activeTab === "view") {
      refreshMyNfts();
    }
  });

  const handleMint = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!mintName.trim() || !mintDesc.trim() || !mintUri.trim()) {
      return setError("Fill in all fields");
    }
    setError(null);
    setIsMinting(true);
    setTxStatus("Awaiting signature...");
    try {
      await mintNft(
        walletAddress,
        walletAddress,
        mintName.trim(),
        mintDesc.trim(),
        mintUri.trim()
      );
      setTxStatus("NFT minted on-chain!");
      setMintName("");
      setMintDesc("");
      setMintUri("");
      refreshMyNfts();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsMinting(false);
    }
  }, [walletAddress, mintName, mintDesc, mintUri, refreshMyNfts]);

  const handleViewNft = useCallback(async () => {
    if (!viewNftId.trim()) return setError("Enter an NFT ID");
    setError(null);
    setIsViewing(true);
    try {
      const result = await getNft(parseInt(viewNftId.trim(), 10));
      if (result && typeof result === "object") {
        setViewedNft(result);
      } else {
        setError("NFT not found");
        setViewedNft(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
      setViewedNft(null);
    } finally {
      setIsViewing(false);
    }
  }, [viewNftId]);

  const handleTransfer = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!transferNftId.trim() || !transferTo.trim()) {
      return setError("Fill in all fields");
    }
    setError(null);
    setIsTransferring(true);
    setTxStatus("Awaiting signature...");
    try {
      await transferNft(
        walletAddress,
        walletAddress,
        transferTo.trim(),
        parseInt(transferNftId.trim(), 10)
      );
      setTxStatus("NFT transferred successfully!");
      setTransferNftId("");
      setTransferTo("");
      refreshMyNfts();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsTransferring(false);
    }
  }, [walletAddress, transferNftId, transferTo, refreshMyNfts]);

  const handleList = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!listNftId.trim() || !listPrice.trim()) {
      return setError("Fill in all fields");
    }
    setError(null);
    setIsListing(true);
    setTxStatus("Awaiting signature...");
    try {
      await listNft(
        walletAddress,
        walletAddress,
        parseInt(listNftId.trim(), 10),
        BigInt(listPrice.trim())
      );
      setTxStatus("NFT listed for sale!");
      setListNftId("");
      setListPrice("");
      refreshMyNfts();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsListing(false);
    }
  }, [walletAddress, listNftId, listPrice, refreshMyNfts]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "mint", label: "Mint", icon: <NftIcon />, color: "#7c6cf0" },
    { key: "view", label: "My NFTs", icon: <GridIcon />, color: "#4fc3f7" },
    { key: "transfer", label: "Transfer", icon: <SendIcon />, color: "#34d399" },
    { key: "list", label: "List", icon: <TagIcon />, color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("successfully") || txStatus.includes("listed") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <NftIcon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">NFT Minting Platform</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" className="text-[10px]">Total: {totalSupply}</Badge>
              <Badge variant="success" className="text-[10px]">Soroban</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { 
                  setActiveTab(t.key); 
                  setError(null); 
                  setViewedNft(null);
                  if (t.key === "view") refreshMyNfts();
                }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Mint */}
            {activeTab === "mint" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="mint" 
                  params="(owner: Address, name: String, description: String, uri: String)" 
                  returns="-> u64" 
                  color="#7c6cf0" 
                />
                <Input 
                  label="NFT Name" 
                  value={mintName} 
                  onChange={(e) => setMintName(e.target.value)} 
                  placeholder="e.g. Stellar Punk #001" 
                />
                <Input 
                  label="Description" 
                  value={mintDesc} 
                  onChange={(e) => setMintDesc(e.target.value)} 
                  placeholder="e.g. A unique digital collectible" 
                />
                <Input 
                  label="URI (Metadata URL)" 
                  value={mintUri} 
                  onChange={(e) => setMintUri(e.target.value)} 
                  placeholder="e.g. https://stellar.example/nft/1" 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleMint} disabled={isMinting} shimmerColor="#7c6cf0" className="w-full">
                    {isMinting ? <><SpinnerIcon /> Minting...</> : <><NftIcon /> Mint NFT</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to mint NFTs
                  </button>
                )}
              </div>
            )}

            {/* View My NFTs */}
            {activeTab === "view" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="get_owner_nfts" 
                  params="(owner: Address)" 
                  returns="-> Vec<u64>" 
                  color="#4fc3f7" 
                />
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input 
                      label="NFT ID" 
                      value={viewNftId} 
                      onChange={(e) => setViewNftId(e.target.value)} 
                      placeholder="Enter NFT ID to view" 
                    />
                  </div>
                  <div className="flex items-end">
                    <ShimmerButton onClick={handleViewNft} disabled={isViewing} shimmerColor="#4fc3f7" className="h-[46px] px-5">
                      {isViewing ? <SpinnerIcon /> : <SearchIcon />}
                    </ShimmerButton>
                  </div>
                </div>

                {viewedNft && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">NFT Details</span>
                      {viewedNft.is_listed ? (
                        <Badge variant="success">Listed for {viewedNft.price} XLM</Badge>
                      ) : (
                        <Badge variant="info">Not Listed</Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">ID</span>
                        <span className="font-mono text-sm text-white/80">#{viewedNft.id?.toString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Name</span>
                        <span className="font-mono text-sm text-white/80">{viewedNft.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Description</span>
                        <span className="font-mono text-sm text-white/80">{viewedNft.description}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Owner</span>
                        <span className="font-mono text-sm text-white/80">{truncate(viewedNft.owner)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">URI</span>
                        <span className="font-mono text-sm text-white/80 truncate max-w-[200px]">{viewedNft.uri}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* My NFT Grid */}
                {myNfts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider">Your NFTs ({myNfts.length})</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {myNfts.map((nft) => (
                        <NFTCard 
                          key={nft.id} 
                          nft={nft} 
                          onView={() => {
                            setViewNftId(nft.id?.toString() || "");
                            handleViewNft();
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transfer */}
            {activeTab === "transfer" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="transfer" 
                  params="(from: Address, to: Address, nft_id: u64)" 
                  color="#34d399" 
                />
                <Input 
                  label="NFT ID" 
                  value={transferNftId} 
                  onChange={(e) => setTransferNftId(e.target.value)} 
                  placeholder="Enter NFT ID to transfer" 
                />
                <Input 
                  label="Recipient Address" 
                  value={transferTo} 
                  onChange={(e) => setTransferTo(e.target.value)} 
                  placeholder="G..." 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleTransfer} disabled={isTransferring} shimmerColor="#34d399" className="w-full">
                    {isTransferring ? <><SpinnerIcon /> Transferring...</> : <><SendIcon /> Transfer NFT</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to transfer NFTs
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {activeTab === "list" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="list" 
                  params="(owner: Address, nft_id: u64, price: i128)" 
                  color="#fbbf24" 
                />
                <Input 
                  label="NFT ID" 
                  value={listNftId} 
                  onChange={(e) => setListNftId(e.target.value)} 
                  placeholder="Enter NFT ID to list" 
                />
                <Input 
                  label="Price (in Stroops)" 
                  value={listPrice} 
                  onChange={(e) => setListPrice(e.target.value)} 
                  placeholder="e.g. 100000000 for 100 XLM" 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleList} disabled={isListing} shimmerColor="#fbbf24" className="w-full">
                    {isListing ? <><SpinnerIcon /> Listing...</> : <><TagIcon /> List NFT for Sale</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to list NFTs
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">NFT Minting Platform &middot; Soroban</p>
            <a 
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#4fc3f7]/40 hover:text-[#4fc3f7]/70 flex items-center gap-1 transition-colors"
            >
              View on Explorer <ExternalLinkIcon />
            </a>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
