'use client';

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import CreateCardForm from "../../components/CreateCardForm";

export default function CreateCard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to home if not authenticated with a query parameter to show auth message
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/?authRequired=true');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  const handleCreateSuccess = () => {
    // Could add a success message or other actions here
    console.log('Card created successfully!');
  };

  return (
    <div className="min-h-screen bg-[#1b1d28] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CreateCardForm onSuccess={handleCreateSuccess} />
        </div>
      </div>
    </div>
  );
}
