'use client';

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import CreateCardForm from "../../components/CreateCardForm";

export default function CreateCard() {
  const { isAuthenticated, isLoading, address } = useAuth();
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
    // Redirect to home page after successful card creation with refresh parameter
    console.log('Card created successfully!');
    router.push('/?refresh=true');
    
    // If the user is on the "My Cards" tab, also set that tab as active
    if (isAuthenticated && address) {
      router.push('/?refresh=true&tab=my');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CreateCardForm onSuccess={handleCreateSuccess} />
        </div>
      </div>
    </div>
  );
}
