"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/app/ui/Stepper";
import TokenizeStart from "@/app/ui/TokenizeStart";
import PropertyForm from "@/app/ui/PropertyForm";
// import OwnershipForm from "@/app/ui/OwnershipForm";
import FinancialForm from "@/app/ui/FinancialForm";
import TokenizeForm from "@/app/ui/TokenizationForm";
import MiscForm from "@/app/ui/MiscForm";
import TokenizeEnd from "@/app/ui/TokenizeEnd";
import { useSession } from "next-auth/react";
import { UserSession } from "@/app/api/auth/[...nextauth]/route";
import Mint from "@/app/wallet/Mint";
import MintAndList from "@/app/wallet/MintAndList";
import { List, ListItem } from "flowbite-react";

interface NewFormData {
  propertyId: string;
  images: File[];
}

export interface FormData {
  country: string;
  state: string;
  city: string;
  street1: string;
  street2: string;
  zip: string;
  year: number;
  propType: string;
  propSubtype: string;
  size: number;
  value: number;
  income: number;
  expense: number;
  tokens: number;
  tokenToList: number;
  images: FileList | null;
}

const Tokenize = () => {
  const { data: session } = useSession();
  const userSession = session?.user as UserSession;

  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    country: "United States",
    state: "",
    city: "",
    street1: "",
    street2: "",
    zip: "",
    year: 0,
    propType: "",
    propSubtype: "",
    size: 0,
    value: 0,
    income: 0,
    expense: 0,
    tokens: 100,
    tokenToList: 0,
    images: null,
  });
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [listedTokens, setListedTokens] = useState<number>(0);
  const [ETH, setETH] = useState<number | null>(null);

  useEffect(() => {
    const fetchETHPriceInUSD = async () => {
      try {
        const response = await fetch(
          "https://api.coinbase.com/v2/prices/ETH-USD/spot"
        );
        const dataETH = await response.json();
        const ethPriceInUSD = parseFloat(dataETH.data.amount);
        const ethAmount = formData.value / formData.tokens / ethPriceInUSD;
        setETH(ethAmount);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
        setETH(null);
      }
    };

    fetchETHPriceInUSD();
  }, [formData]);

  const prevStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const nextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleSubmit = (data: any) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);

    console.log(updatedFormData);
  };

  const handleSubmitAllForms = async () => {
    let propertyData;

    const postData = {
      country: formData.country,
      state: formData.state,
      city: formData.city.toLowerCase(),
      street1: formData.street1.toLowerCase(),
      street2: formData.street2.toLowerCase(),
      zip: formData.zip,
      year: +formData.year,
      propType: formData.propType,
      propSubtype: formData.propSubtype,
      size: +formData.size,
      value: +formData.value,
      income: +formData.income,
      expense: +formData.expense,
      tokensMinted: +formData.tokens,
      tokenToList: +formData.tokenToList,
      userId: userSession.id,
    };
    setListedTokens(postData.tokenToList);
    try {
      const res = await fetch("/api/property/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      if (res.ok) {
        propertyData = await res.json();
        console.log("data: ", propertyData);
        setPropertyId(propertyData.id);
        const images = formData.images;
        console.log("Images: ", images);

        if (images) {
          const newFormData = new FormData();
          newFormData.append("propertyId", propertyData.id);

          for (let i = 0; i < images.length; i++) {
            const file = images[i];
            newFormData.append("images", file);
          }

          console.log("NewFormData: ", newFormData);
          try {
            const uploadRes = await fetch("/api/property/upload", {
              method: "POST",
              body: newFormData,
            });
            if (uploadRes.ok) {
              // Handle success
              console.log("Upload successful");
            } else {
              // Handle error
              console.error("Upload failed");
            }
          } catch (error) {
            console.error("The uploading API did a little fucky-wucky");
          }
        }
      } else {
        console.log(res)
        alert("shit went wrong");
      }
    } catch (error) {
      // Handle network error or other exceptions
      console.log(error)
    }

    nextStep();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-screen max-w-screen-xl2 px-10 py-10">
        <Stepper currentStep={currentStep} />
      </div>
      <div className="flex flex-col justify-center max-w-4xl w-full mb-10">
        {currentStep === 0 && <TokenizeStart nextStep={nextStep} />}
        {currentStep === 1 && (
          <PropertyForm
            nextStep={nextStep}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            formData={formData}
          />
        )}
        {/* {currentStep === 2 && (
          <OwnershipForm
            nextStep={nextStep}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            formData={formData}
          />
        )} */}
        {currentStep === 2 && (
          <FinancialForm
            nextStep={nextStep}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            formData={formData}
          />
        )}
        {currentStep === 3 && (
          <TokenizeForm
            nextStep={nextStep}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            formData={formData}
          />
        )}
        {currentStep === 4 && (
          <MiscForm
            nextStep={nextStep}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
          />
        )}
        {currentStep === 5 && (
          <TokenizeEnd
            prevStep={prevStep}
            handleSubmitAllForms={handleSubmitAllForms}
          />
        )}
        {currentStep === 6 && listedTokens === 0 && propertyId && ETH && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-medium mb-4">
              Why mint property tokens?
            </h2>
            <p className="text-center font-medium text-gray-900 dark:text-white mb-4 mt-4">
              When you mint property tokens, you're essentially converting your
              property into a digital asset that can be traded on a blockchain.
              Each token represents a fraction of ownership in the property,
              allowing you to divide its value into smaller, more manageable
              portions.
            </p>

            <List ordered>
              <List.Item>
                Fractional Ownership: Minting property tokens allows you to sell
                fractions of your property, enabling multiple investors to own a
                share of the property.
              </List.Item>
              <List.Item>
                Liquidity: By tokenizing your property, you make it easier to
                buy, sell, and trade ownership shares, thus increasing liquidity
                in the real estate market.
              </List.Item>
              <List.Item>
                Accessibility: Property tokenization opens up real estate
                investment opportunities to a wider range of investors,
                including those with smaller budgets who may not be able to
                afford full property ownership.
              </List.Item>
            </List>
            <div className="w-full">
              <div className="flex justify-center items-center mt-4">
                <Mint
                  contractAddress={tokenAddress}
                  propertyId={propertyId}
                  pricePerTokenInEthereum={ETH}
                  tokensToMint={100}
                  uri={`/property/${propertyId}`}
                />
              </div>
            </div>
          </div>
        )}
        {currentStep === 6 && listedTokens > 0 && propertyId && ETH && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-medium mb-4">
              Why mint property tokens?
            </h2>
            <p className="text-center font-medium text-gray-900 dark:text-white mb-4 mt-4">
              When you mint property tokens, you're essentially converting your
              property into a digital asset that can be traded on a blockchain.
              Each token represents a fraction of ownership in the property,
              allowing you to divide its value into smaller, more manageable
              portions.
            </p>

            <List ordered>
              <List.Item>
                Fractional Ownership: Minting property tokens allows you to sell
                fractions of your property, enabling multiple investors to own a
                share of the property.
              </List.Item>
              <List.Item>
                Liquidity: By tokenizing your property, you make it easier to
                buy, sell, and trade ownership shares, thus increasing liquidity
                in the real estate market.
              </List.Item>
              <List.Item>
                Accessibility: Property tokenization opens up real estate
                investment opportunities to a wider range of investors,
                including those with smaller budgets who may not be able to
                afford full property ownership.
              </List.Item>
            </List>
            <div className="w-full">
              <div className="flex justify-center items-center mt-4">
                <MintAndList
                  contractAddress={tokenAddress}
                  propertyId={propertyId}
                  pricePerTokenInEthereum={ETH}
                  tokensToMint={100}
                  uri={`/property/${propertyId}`}
                  tokens={listedTokens}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tokenize;
