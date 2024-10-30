"use client";
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import React from "react";

type Props = { children: React.ReactNode };

const ClerkProviders = ({ children }: Props) => {
  return (
    <ClerkProvider>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </ClerkProvider>
  );
};

export default ClerkProviders;
