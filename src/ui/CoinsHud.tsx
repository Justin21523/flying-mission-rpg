import { useWalletStore } from '../stores/walletStore';

// POLI yokai-hunt — coin total badge (top-right). Coins are earned defeating yokai + winning hunts.
export const CoinsHud = () => {
  const coins = useWalletStore((s) => s.coins);
  return (
    <div className="pointer-events-none absolute right-3 top-16 z-[60] rounded-full bg-amber-950/70 px-3 py-1 text-sm font-bold text-amber-200 shadow backdrop-blur-md">
      🪙 {coins}
    </div>
  );
};
