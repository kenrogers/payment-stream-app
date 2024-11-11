"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Wallet, Zap, Users, Battery } from 'lucide-react';
import React, { useState, useEffect } from "react";
import { showConnect, openContractCall } from "@stacks/connect";
import { userSession } from "@/lib/userSession";
import * as stacksNetwork from '@stacks/network';
import { fetchReadOnlyFunction, standardPrincipalCV, uintCV, cvToValue } from '@stacks/transactions';

const GreenEnergyDemo = () => {
    const [walletConnected, setWalletConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [userBalance, setUserBalance] = useState(0);
    const [step, setStep] = useState(0);
    const [fundingGoal, setFundingGoal] = useState('');
    const [contributors, setContributors] = useState([]);
    const [currentContribution, setCurrentContribution] = useState('');
    const [energyConsumption, setEnergyConsumption] = useState('');
    const [totalContributed, setTotalContributed] = useState(0);
    const [error, setError] = useState('');
    const [payouts, setPayouts] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentContributor, setCurrentContributor] = useState('');

    const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS';
    const CONTRACT_NAME = 'YOUR_CONTRACT_NAME';
    
    const checkSTXBalance = async (address) => {
        try {
            const network = new stacksNetwork.StacksTestnet();
            const response = await fetchReadOnlyFunction({
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'stx-get-balance',
                functionArgs: [standardPrincipalCV(address)],
                senderAddress: address,
            });
            
            const balanceInMicroSTX = cvToValue(response);
            const balanceInSTX = balanceInMicroSTX / 1000000;
            return balanceInSTX;
        } catch (error) {
            console.error("Error checking STX balance:", error);
            throw error;
        }
    };

    const fetchUserBalance = async (address) => {
        try {
            const response = await fetch(
                `https://stacks-node-api.testnet.stacks.co/extended/v1/address/${address}/balances`
            );
            const data = await response.json();
            const balanceInSTX = parseInt(data.stx.balance) / 1000000;
            return balanceInSTX;
        } catch (error) {
            console.error("Error fetching balance:", error);
            return 0;
        }
    };

    const connectWallet = async () => {
        try {
            showConnect({
                userSession,
                appDetails: {
                    name: "Green Energy Demo",
                    icon: window.location.origin + "/favicon.ico",
                },
                onFinish: async () => {
                    const userData = userSession.loadUserData();
                    const address = userData.profile.stxAddress.testnet;
                    const balance = await fetchUserBalance(address);

                    setWalletConnected(true);
                    setUserAddress(address);
                    setUserBalance(balance);
                    setStep(1);
                },
                onCancel: () => {
                    console.log("Wallet connection cancelled");
                },
            });
        } catch (error) {
            console.error("Wallet connection error:", error);
            setError("Failed to connect wallet. Please try again.");
        }
    };

    const disconnectWallet = () => {
        userSession.signUserOut();
        setWalletConnected(false);
        setUserAddress('');
        setUserBalance(0);
        setStep(0);
        setFundingGoal('');
        setContributors([]);
        setCurrentContribution('');
        setEnergyConsumption('');
        setTotalContributed(0);
        setPayouts([]);
        setError('');
    };

    const handleInitialize = async () => {
        if (!fundingGoal || parseFloat(fundingGoal) <= 0) {
            setError('Please enter a valid funding goal');
            return;
        }

        setIsProcessing(true);
        try {
            setStep(2);
            setError('');
        } catch (error) {
            setError('Failed to initialize. Please try again.');
            console.error("Initialize error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddContribution = async () => {
        if (!currentContributor || !currentContribution) {
            setError('Please enter both contributor address and amount');
            return;
        }

        const contribution = parseFloat(currentContribution);
        const remainingToGoal = parseFloat(fundingGoal) - totalContributed;

        if (contribution > remainingToGoal) {
            setError(`Contribution exceeds remaining amount needed (${remainingToGoal} STX)`);
            return;
        }

        if (currentContributor === userAddress) {
            try {
                const currentBalance = await fetchUserBalance(currentContributor);
                if (contribution > currentBalance) {
                    setError(`Insufficient balance. Your current balance: ${currentBalance.toFixed(2)} STX`);
                    return;
                }
            } catch (error) {
                setError('Failed to verify balance. Please try again.');
                return;
            }
        }

        setIsProcessing(true);
        try {
            const newContributors = [...contributors, {
                address: currentContributor,
                amount: contribution
            }];

            if (currentContributor === userAddress) {
                const newBalance = await fetchUserBalance(userAddress);
                setUserBalance(newBalance);
            }

            setContributors(newContributors);
            setTotalContributed(prevTotal => prevTotal + contribution);
            setCurrentContribution('');
            setCurrentContributor('');
            setError('');

            if (totalContributed + contribution >= parseFloat(fundingGoal)) {
                setStep(3);
            }
        } catch (error) {
            setError('Failed to process contribution. Please try again.');
            console.error("Contribution error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEnergyConsumption = async () => {
        if (!energyConsumption || parseFloat(energyConsumption) <= 0) {
            setError('Please enter a valid energy consumption amount');
            return;
        }

        setIsProcessing(true);
        try {
            const totalEnergyCost = parseFloat(energyConsumption);
            const newPayouts = contributors.map(contributor => ({
                address: contributor.address,
                amount: (contributor.amount / totalContributed) * totalEnergyCost
            }));

            setPayouts(newPayouts);
            setStep(4);
            setError('');
        } catch (error) {
            setError('Failed to process energy consumption. Please try again.');
            console.error("Energy consumption error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const ProgressSteps = () => (
        <div className="flex justify-between mb-8">
            {[
                { title: "Connect Wallet", icon: Wallet, step: 0 },
                { title: "Set Goal", icon: Zap, step: 1 },
                { title: "Contributions", icon: Users, step: 2 },
                { title: "Energy Usage", icon: Battery, step: 3 }
            ].map((item) => (
                <div
                    key={item.title}
                    className={`flex flex-col items-center space-y-2 ${step >= item.step ? "text-blue-600" : "text-gray-400"}`}
                >
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= item.step ? "bg-blue-100" : "bg-gray-100"}`}
                    >
                        <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm">{item.title}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4">
            {walletConnected && (
                <div className="flex justify-between items-center">
                    <div className="flex flex-col text-sm text-gray-500">
                        <span>Connected: {userAddress.slice(0, 8)}...</span>
                        <span>Balance: {userBalance.toFixed(2)} STX</span>
                    </div>
                    <Button variant="outline" onClick={disconnectWallet} className="text-sm">
                        Disconnect Wallet
                    </Button>
                </div>
            )}

            <ProgressSteps />

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 0 && "Connect Your Wallet"}
                        {step === 1 && "Set Funding Goal"}
                        {step === 2 && "Add Contributions"}
                        {step === 3 && "Process Energy Consumption"}
                        {step === 4 && "Payout Distribution"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === 0 && (
                        <Button onClick={connectWallet} className="w-full">
                            Connect Leather Wallet
                        </Button>
                    )}

                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Funding Goal Amount (STX)
                                </label>
                                <Input
                                    type="number"
                                    value={fundingGoal}
                                    onChange={(e) => setFundingGoal(e.target.value)}
                                    placeholder="Enter funding goal in STX"
                                />
                            </div>
                            <Button
                                onClick={handleInitialize}
                                className="w-full"
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Initializing..." : "Set Funding Goal"}
                            </Button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="space-y-4">
                                <Progress
                                    value={(totalContributed / parseFloat(fundingGoal)) * 100}
                                    className="w-full"
                                />
                                <div className="text-sm text-gray-500 text-center">
                                    {totalContributed.toFixed(2)} / {fundingGoal} STX contributed
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Contributor Address
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={currentContributor}
                                            onChange={(e) => setCurrentContributor(e.target.value)}
                                            placeholder="Enter contributor address"
                                        />
                                        {userAddress && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentContributor(userAddress)}
                                                className="whitespace-nowrap"
                                            >
                                                Use My Address
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Contribution Amount (STX)
                                    </label>
                                    <Input
                                        type="number"
                                        value={currentContribution}
                                        onChange={(e) => setCurrentContribution(e.target.value)}
                                        placeholder="Enter contribution amount"
                                    />
                                </div>

                                <Button
                                    onClick={handleAddContribution}
                                    className="w-full"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Add Contribution"}
                                </Button>

                                {contributors.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="font-medium mb-2">Current Contributors</h3>
                                        <div className="space-y-2">
                                            {contributors.map((contributor, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center text-sm"
                                                >
                                                    <span>{contributor.address.slice(0, 8)}...</span>
                                                    <span>{contributor.amount.toFixed(2)} STX</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Energy Consumption Amount (STX)
                                </label>
                                <Input
                                    type="number"
                                    value={energyConsumption}
                                    onChange={(e) => setEnergyConsumption(e.target.value)}
                                    placeholder="Enter energy consumption in STX"
                                />
                            </div>
                            <Button
                                onClick={handleEnergyConsumption}
                                className="w-full"
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Processing..." : "Process Consumption"}
                            </Button>
                        </>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Payout Distribution</h3>
                            <div className="space-y-2">
                                {payouts.map((payout, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center text-sm"
                                    >
                                        <span>{payout.address.slice(0, 8)}...</span>
                                        <span>{payout.amount.toFixed(2)} STX</span>
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={() => {
                                    setStep(2);
                                    setEnergyConsumption('');
                                    setPayouts([]);
                                }}
                                className="w-full"
                            >
                                Process Another Consumption
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default GreenEnergyDemo;