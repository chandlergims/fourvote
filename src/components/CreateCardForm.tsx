'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { createCard } from '../lib/api';
import BNBvoteCard from './BNBvoteCard';

interface CreateCardFormProps {
  onSuccess?: () => void;
}

const CreateCardForm: React.FC<CreateCardFormProps> = ({
  onSuccess,
}) => {
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [bio, setBio] = useState('');
  const [devFeePercentage, setDevFeePercentage] = useState('10');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    
    if (file) {
      // Create a URL for the file for preview purposes only
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('You must be logged in with your MetaMask wallet to create a card');
      return;
    }

    // Validate ticker (8 chars max, only letters and numbers)
    if (!/^[a-zA-Z0-9]{1,8}$/.test(ticker)) {
      setError('Ticker must be 1-8 characters and contain only letters and numbers');
      return;
    }

    // Validate name
    if (name.trim().length === 0 || name.length > 18) {
      setError('Name is required and must be 18 characters or less');
      return;
    }

    // Validate image
    if (!selectedFile || !previewUrl) {
      setError('Image is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!selectedFile) {
        setError('Image is required');
        setIsSubmitting(false);
        return;
      }

      // Convert the file to a base64 string
      const fileReader = new FileReader();
      
      // Set up event handlers before reading the file
      fileReader.onload = async () => {
        try {
          // Create card data
          const cardData = {
            title: name,
            description: bio,
            imageUrl: fileReader.result as string,
            attributes: {
              ticker,
              devFeePercentage: parseInt(devFeePercentage) || 10,
              maxTicketsPerUser: 100
            }
          };

          // Submit to API
          await createCard(cardData);
          
          // Show success message
          setSuccess('Card created successfully!');
          
          if (onSuccess) {
            onSuccess();
          }
        } catch (err: any) {
          setError(err.message || 'Failed to create card');
        } finally {
          setIsSubmitting(false);
        }
      };
      
      fileReader.onerror = () => {
        setError('Failed to read the image file');
        setIsSubmitting(false);
      };
      
      // Start reading the file after setting up the event handlers
      fileReader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setError(err.message || 'Failed to create card');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-gray-800 p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Create FourVote Card</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-[rgb(134,239,172)] text-[rgb(134,239,172)] p-4 rounded-md mb-6 flex items-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Card Preview */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="w-full max-w-[350px] h-[350px]">
            <BNBvoteCard
              title={name}
              imageUrl={previewUrl}
              ticker={ticker}
              description={bio || ""}
              devFeePercentage={devFeePercentage}
            />
          </div>
        </div>

        {/* Form */}
        <div className="w-full md:w-1/2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Card name: <span className="text-red-500">* (Required)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your meme name (max 18 characters)"
                maxLength={18}
                className="w-full p-3 bg-white border border-gray-200 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[rgb(134,239,172)]"
                required
              />
            </div>

            {/* Ticker */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Ticker: <span className="text-red-500">* (Required)</span>
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter token ticker symbol (max 8 characters)"
                maxLength={8}
                className="w-full p-3 bg-white border border-gray-200 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[rgb(134,239,172)]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Letters and numbers only, 8 characters max</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Card image: <span className="text-red-500">* (Required)</span>
              </label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <label className="bg-[rgb(134,239,172)] hover:bg-[rgb(110,220,150)] text-black px-4 py-2 rounded-md cursor-pointer font-bold">
                    Choose File
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      required
                    />
                  </label>
                  <div className="ml-3 px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-800 overflow-hidden text-ellipsis max-w-xs">
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                  </div>
                </div>
                <p className="text-xs text-gray-500">Square image (1:1) recommended</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Bio: <span className="text-red-500">* (Required)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your meme and why it should win (max 100 words)"
                maxLength={500}
                rows={3}
                className="w-full p-3 bg-white border border-gray-200 rounded-md text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(134,239,172)]"
                required
                style={{ whiteSpace: 'pre-wrap' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {bio ? bio.trim().split(/\s+/).filter(Boolean).length : 0}/100 words
              </p>
            </div>

            {/* Dev Fee Percentage */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Dev Fee Percentage: <span className="text-[rgb(134,239,172)] ml-2">{devFeePercentage}%</span>
              </label>
              <input
                type="range"
                value={devFeePercentage}
                onChange={(e) => setDevFeePercentage(e.target.value)}
                min="0"
                max="15"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[rgb(134,239,172)]"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>15%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is the percentage of each trade that you'll receive if your meme card wins and gets tokenized.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[rgb(134,239,172)] hover:bg-[rgb(110,220,150)] text-black font-bold py-3 px-4 rounded-md transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create FourVote Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCardForm;
