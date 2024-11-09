"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  uintCV,
  principalCV,
  fetchCallReadOnlyFunction,
  ClarityType,
} from "@stacks/transactions";
import { userSession } from "@/lib/userSession";

interface StreamBalanceProps {
  streamId: number;
  recipientAddress: string;
  initialBalance: number;
}

const StreamBalance: React.FC<StreamBalanceProps> = ({
  streamId,
  recipientAddress,
  initialBalance,
}) => {
  const [senderBalance, setSenderBalance] = useState<number | null>(null);
  const [recipientBalance, setRecipientBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<"sender" | "recipient">(
    "sender"
  );

  const fetchBalances = useCallback(async () => {
    try {
      const userData = userSession.loadUserData();
      const userAddress =
        userData.profile.stxAddress.testnet || userData.profile.stxAddress;

      if (!userAddress || typeof userAddress !== "string") {
        throw new Error("Invalid user address");
      }

      // Fetch sender balance
      const senderResult = await fetchCallReadOnlyFunction({
        network: "devnet",
        contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        contractName: "stream",
        functionName: "balance-of",
        functionArgs: [uintCV(streamId), principalCV(userAddress)],
        senderAddress: userAddress,
      });

      // Fetch recipient balance
      const recipientResult = await fetchCallReadOnlyFunction({
        network: "devnet",
        contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        contractName: "stream",
        functionName: "balance-of",
        functionArgs: [uintCV(streamId), principalCV(recipientAddress)],
        senderAddress: userAddress,
      });

      if (senderResult.type === ClarityType.UInt) {
        setSenderBalance(Number(senderResult.value));
      }

      if (recipientResult.type === ClarityType.UInt) {
        setRecipientBalance(Number(recipientResult.value));
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setError("Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [streamId, recipientAddress]);

  useEffect(() => {
    if (streamId) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 5000);
      return () => clearInterval(interval);
    }
  }, [streamId, recipientAddress, fetchBalances]);

  const calculateProgress = (
    balance: number | null,
    view: "sender" | "recipient"
  ) => {
    if (balance === null) return 0;

    // Ensure we don't divide by zero
    if (initialBalance === 0) return 0;

    if (view === "sender") {
      // For sender, show percentage of funds remaining
      return Math.min(100, Math.max(0, (balance / initialBalance) * 100));
    } else {
      // For recipient, show percentage of funds received
      const received = initialBalance - balance;
      return Math.min(100, Math.max(0, (received / initialBalance) * 100));
    }
  };

  const formatBalance = (balance: number | null) => {
    return balance !== null ? `${balance / 100000000} sBTC` : "N/A";
  };

  const formatProgress = (progress: number) => {
    return `${progress.toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream #{streamId} Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading balances...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            <Tabs
              defaultValue="sender"
              className="w-full"
              onValueChange={(value) =>
                setActiveView(value as "sender" | "recipient")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sender">Sender View</TabsTrigger>
                <TabsTrigger value="recipient">Recipient View</TabsTrigger>
              </TabsList>
              <TabsContent value="sender" className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Remaining Balance:</span>
                  <span className="font-medium">
                    {formatBalance(senderBalance)}
                  </span>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={calculateProgress(senderBalance, "sender")}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">
                    {formatProgress(calculateProgress(senderBalance, "sender"))}{" "}
                    funds remaining
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="recipient" className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Received Balance:</span>
                  <span className="font-medium">
                    {formatBalance(
                      recipientBalance !== null
                        ? initialBalance - (senderBalance || 0)
                        : null
                    )}
                  </span>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={calculateProgress(senderBalance, "recipient")}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">
                    {formatProgress(
                      calculateProgress(senderBalance, "recipient")
                    )}{" "}
                    funds received
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-xs text-gray-500 text-center">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamBalance;
