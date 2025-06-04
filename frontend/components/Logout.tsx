"use client";

import { Button } from "@/components/ui/button";
import { useDisconnect, useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";

export default function Logout() {
    const { disconnect } = useDisconnect();
    const wallet = useActiveWallet();
    const router = useRouter();

    const handleLogout = () => {
        if (wallet) {
            disconnect(wallet);
            // Force a full page reload to clear all states
            window.location.href = '/';
        }
    };

    return (
        <Button onClick={handleLogout} className="bg-red-500 text-white">Logout</Button>
    )
}
