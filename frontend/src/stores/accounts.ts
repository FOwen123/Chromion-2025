import { create } from "zustand";
import type { Account } from "thirdweb/wallets";
import { createWallet } from "thirdweb/wallets";

type AccountStoreState = {
	account: Account | null;
	isLoggedIn: boolean;
	isLoading: boolean;

	onAccountChange: (newAccount: Account | undefined) => void;
	login: (account: Account) => void;
	logout: () => void;
	initialize: () => Promise<void>;
};

export const useAccountStore = create<AccountStoreState>((set, get) => ({
	account: null,
	isLoggedIn: false,
	isLoading: true,

	initialize: async () => {
		const savedAddress = localStorage.getItem("loggedInAddress");
		if (savedAddress) {
			try {
				const wallet = createWallet("io.metamask");
				const account = await wallet.getAccount();
				if (account && account.address === savedAddress) {
					set({ account, isLoggedIn: true, isLoading: false });
				} else {
					set({ isLoading: false });
				}
			} catch (error) {
				console.error("Failed to restore wallet connection:", error);
				set({ isLoading: false });
			}
		} else {
			set({ isLoading: false });
		}
	},

	onAccountChange: (newAccount: Account | undefined) => {
		if (newAccount === undefined) {
			// Wallet disconnected
			get().logout();
			return;
		}
		// Always set the account and mark as logged in
		set({ account: newAccount, isLoggedIn: true });
		localStorage.setItem("loggedInAddress", newAccount.address);
	},

	login: (account: Account) => {
		set({ account, isLoggedIn: true, isLoading: false });
		localStorage.setItem("loggedInAddress", account.address);
	},

	logout: () => {
		localStorage.removeItem("loggedInAddress");
		set({
			account: null,
			isLoggedIn: false,
			isLoading: false,
		});
	},
}));
