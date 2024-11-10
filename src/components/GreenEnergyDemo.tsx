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

const GreenEnergyDemo = () => {
    // Mock wallet and demo state
    const [walletConnected, setWalletConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [step, setStep] = useState(0);
    const [fundingGoal, setFundingGoal] = useState('');
    const [contributors, setContributors] = useState([]);
    const [currentContribution, setCurrentContribution] = useState('');
    const [currentContributor, setCurrentContributor] = useState('');
    const [energyConsumption, setEnergyConsumption] = useState('');
    const [totalContributed, setTotalContributed] = useState(0);
    const [error, setError] = useState('');
    const [payouts, setPayouts] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

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
                    setStep(1);
                },
                onCancel: () => {
                    console.log("Wallet connection cancelled");
                },
            });
        } catch (error) {
            console.error("Wallet connection error:", error);
        }
    };

    const disconnectWallet = () => {
        setWalletConnected(false);
        setUserAddress('');
        setStep(0);
        // Reset all state
        setFundingGoal('');
        setContributors([]);
        setCurrentContribution('');
        setCurrentContributor('');
        setEnergyConsumption('');
        setTotalContributed(0);
        setPayouts([]);
        userSession.signUserOut(); // TODO where do I put this
    };

    // Mock contract interactions
    const handleInitialize = async () => {
        if (!fundingGoal || parseFloat(fundingGoal) <= 0) {
            setError('Please enter a valid funding goal');
            return;
        }

        setIsProcessing(true);
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStep(2);
        setError('');
        setIsProcessing(false);
    };

    const handleAddContribution = async () => {
        if (!currentContributor || !currentContribution) {
            setError('Please enter both contributor address and amount');
            return;
        }

        const contribution = parseInt(currentContribution);
        const remainingToGoal = parseInt(fundingGoal) - totalContributed;

        if (contribution > remainingToGoal) {
            setError(`Contribution exceeds remaining amount needed (${remainingToGoal})`);
            return;
        }

        setIsProcessing(true);
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newContributors = [...contributors, {
            address: currentContributor,
            amount: contribution
        }];
        setContributors(newContributors);
        setTotalContributed(totalContributed + contribution);
        setCurrentContribution('');
        setCurrentContributor('');
        setError('');

        if (totalContributed + contribution >= parseInt(fundingGoal)) {
            setStep(3);
        }
        setIsProcessing(false);
    };

    const handleEnergyConsumption = async () => {
        if (!energyConsumption || parseFloat(energyConsumption) <= 0) {
            setError('Please enter a valid energy consumption amount');
            return;
        }

        setIsProcessing(true);
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Calculate payouts
        const totalEnergyCost = parseInt(energyConsumption);
        const newPayouts = contributors.map(contributor => ({
            address: contributor.address,
            amount: (contributor.amount / totalContributed) * totalEnergyCost
        }));

        setPayouts(newPayouts);
        setStep(4);
        setError('');
        setIsProcessing(false);
    };

    // Progress steps component
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
                    className={`flex flex-col items-center space-y-2 ${step >= item.step ? "text-blue-600" : "text-gray-400"
                        }`}
                >
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= item.step ? "bg-blue-100" : "bg-gray-100"
                            }`}
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
                    <span className="text-sm text-gray-500">
                        Connected: {userAddress.slice(0, 8)}...
                    </span>
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
                                    Funding Goal Amount
                                </label>
                                <Input
                                    type="number"
                                    value={fundingGoal}
                                    onChange={(e) => setFundingGoal(e.target.value)}
                                    placeholder="Enter funding goal"
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
                                    value={(totalContributed / parseInt(fundingGoal)) * 100}
                                    className="w-full"
                                />
                                <div className="text-sm text-gray-500 text-center">
                                    {totalContributed} / {fundingGoal} contributed
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Contributor Address
                                    </label>
                                    <Input
                                        value={currentContributor}
                                        onChange={(e) => setCurrentContributor(e.target.value)}
                                        placeholder="Enter contributor address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Contribution Amount
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
                                                    <span>{contributor.amount}</span>
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
                                    Energy Consumption Amount
                                </label>
                                <Input
                                    type="number"
                                    value={energyConsumption}
                                    onChange={(e) => setEnergyConsumption(e.target.value)}
                                    placeholder="Enter energy consumption"
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
                                        <span>{payout.amount.toFixed(2)}</span>
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