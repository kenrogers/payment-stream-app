interface Window {
  StacksProvider: {
    signTransaction: (transaction: unknown) => Promise<string>;
  };
}