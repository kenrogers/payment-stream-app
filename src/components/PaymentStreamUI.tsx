"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bitcoin, ArrowRight, Timer, Wallet } from "lucide-react";
import { showConnect, openContractCall } from "@stacks/connect";
import { userSession } from "@/lib/userSession";
import {
  uintCV,
  tupleCV,
  principalCV,
  PostConditionMode,
} from "@stacks/transactions";
import StreamBalance from "@/components/StreamBalance";

interface Stream {
  id: number;
  recipient: string;
  initialBalance: number;
  timeframe: {
    startBlock: number;
    stopBlock: number;
  };
  paymentPerBlock: number;
  startedAt: string;
  status: string;
}

const PaymentStreamUI = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [btcAmount, setBtcAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState(
    "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"
  );
  const [streamDuration, setStreamDuration] = useState("2");
  const [activeStep, setActiveStep] = useState(0);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setWalletConnected(true);
      setActiveStep(1);
    }
  }, []);

  const disconnectWallet = () => {
    userSession.signUserOut();
    setWalletConnected(false);
    setActiveStep(0);
  };

  const connectWallet = async () => {
    try {
      showConnect({
        userSession,
        appDetails: {
          name: "BTC Payment Stream",
          icon: window.location.origin + "/favicon.ico",
        },
        onFinish: () => {
          setWalletConnected(true);
          setActiveStep(1);
        },
        onCancel: () => {
          console.log("Wallet connection cancelled");
        },
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const handleBTCDeposit = async () => {
    if (!btcAmount || parseFloat(btcAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Mock BTC deposit
      console.log("Mocking BTC deposit of", btcAmount, "BTC");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockBtcTxId = Math.random().toString(16).slice(2);
      console.log("Mock BTC Transaction:", mockBtcTxId);

      // Step 2: Call sBTC mint function
      await openContractCall({
        network: "devnet",
        contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        contractName: "sbtc-token",
        functionName: "mint",
        functionArgs: [
          uintCV(Math.floor(parseFloat(btcAmount) * 100000000)), // amount in sats
          principalCV("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"), // recipient
        ],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (result) => {
          console.log("sBTC mint transaction:", result);
          setIsProcessing(false);
          setActiveStep(2);
        },
        onCancel: () => {
          console.log("sBTC mint cancelled");
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("BTC deposit error:", error);
      setIsProcessing(false);
    }
  };

  const createStream = async () => {
    if (!recipientAddress || !streamDuration || !btcAmount) {
      alert("Please fill all fields");
      return;
    }

    setIsProcessing(true);
    try {
      const sbtcAmount = Math.floor(parseFloat(btcAmount) * 100000000);
      const blocksPerDay = 144;
      const durationBlocks = parseInt(streamDuration) * blocksPerDay;

      const currentBlock = await fetch("http://localhost:3999/v2/info")
        .then((res) => res.json())
        .then((data) => data.stacks_tip_height);

      const paymentPerBlock = Math.floor(sbtcAmount / durationBlocks);

      const timeframeCV = tupleCV({
        "start-block": uintCV(currentBlock),
        "stop-block": uintCV(currentBlock + durationBlocks),
      });

      await openContractCall({
        network: "devnet",
        contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        contractName: "stream",
        functionName: "stream-to",
        functionArgs: [
          principalCV(recipientAddress),
          uintCV(sbtcAmount),
          timeframeCV,
          uintCV(paymentPerBlock),
        ],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (result) => {
          console.log("Transaction ID:", result);

          // Create stream object for UI
          const newStream = {
            id: streams.length + 1,
            recipient: recipientAddress,
            initialBalance: sbtcAmount,
            timeframe: {
              startBlock: currentBlock,
              stopBlock: currentBlock + durationBlocks,
            },
            paymentPerBlock,
            startedAt: new Date().toISOString(),
            status: "active",
          };

          setStreams([...streams, newStream]);
          setActiveStep(3);
          setIsProcessing(false);
        },
        onCancel: () => {
          console.log("Transaction cancelled");
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Stream creation error:", error);
      alert("Failed to create stream. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {walletConnected && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={disconnectWallet}
            className="text-sm"
          >
            Disconnect Wallet
          </Button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {[
          { title: "Connect Wallet", icon: Wallet },
          { title: "Deposit BTC", icon: Bitcoin },
          { title: "Create Stream", icon: Timer },
          { title: "Complete", icon: ArrowRight },
        ].map((step, index) => (
          <div
            key={step.title}
            className={`flex flex-col items-center space-y-2 ${
              index <= activeStep ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index <= activeStep ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              <step.icon className="w-5 h-5" />
            </div>
            <span className="text-sm">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeStep === 0 && "Connect Your Wallet"}
            {activeStep === 1 && "Deposit BTC"}
            {activeStep === 2 && "Create Payment Stream"}
            {activeStep === 3 && "Stream Created!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeStep === 0 && (
            <Button onClick={connectWallet} className="w-full">
              Connect Leather Wallet
            </Button>
          )}

          {activeStep === 1 && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    BTC Amount to Deposit
                  </label>
                  <Input
                    type="number"
                    value={btcAmount}
                    onChange={(e) => setBtcAmount(e.target.value)}
                    placeholder="0.0"
                    step="0.00001"
                  />
                </div>
                <Button
                  onClick={handleBTCDeposit}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Deposit BTC"}
                </Button>
              </div>
            </>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  {btcAmount} BTC successfully converted to sBTC!
                </AlertDescription>
              </Alert>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Recipient Address
                </label>
                <Input
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Recipient's Stacks address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stream Duration (days)
                </label>
                <Input
                  type="number"
                  value={streamDuration}
                  onChange={(e) => setStreamDuration(e.target.value)}
                  placeholder="Number of days"
                />
              </div>

              <Button
                onClick={createStream}
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? "Creating Stream..." : "Create Stream"}
              </Button>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Payment stream created successfully!
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Stream Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{btcAmount} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <span className="truncate ml-2">{recipientAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{streamDuration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setActiveStep(1);
                  setBtcAmount("");
                  setRecipientAddress("");
                  setStreamDuration("");
                }}
                className="w-full"
              >
                Create Another Stream
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Streams */}
      {streams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {streams.map((stream) => (
                <div key={stream.id} className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Stream #{stream.id}</div>
                        <div className="text-sm text-gray-500">
                          To: {stream.recipient.slice(0, 8)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{btcAmount} BTC</div>
                        <div className="text-sm text-gray-500">
                          {streamDuration} days
                        </div>
                      </div>
                    </div>
                  </div>
                  <StreamBalance
                    streamId={stream.id}
                    recipientAddress={stream.recipient}
                    initialBalance={stream.initialBalance}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentStreamUI;
