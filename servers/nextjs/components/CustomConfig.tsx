"use client";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";

interface CustomConfigProps {
  customLlmUrl: string;
  customLlmApiKey: string;
  customModel: string;
  customModels: string[];
  customModelsLoading: boolean;
  customModelsChecked: boolean;
  openModelSelect: boolean;
  onInputChange: (value: string, field: string) => void;
  onOpenModelSelectChange: (open: boolean) => void;
  onFetchCustomModels: () => void;
}

export default function CustomConfig({
  customLlmUrl,
  customLlmApiKey,
  customModel,
  customModels,
  customModelsLoading,
  customModelsChecked,
  openModelSelect,
  onInputChange,
  onOpenModelSelectChange,
  onFetchCustomModels,
}: CustomConfigProps) {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OpenAI Compatible URL
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="Enter your URL"
            className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            value={customLlmUrl}
            onChange={(e) =>
              onInputChange(e.target.value, "custom_llm_url")
            }
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OpenAI Compatible API Key
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="Enter your API Key"
            className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            value={customLlmApiKey}
            onChange={(e) =>
              onInputChange(e.target.value, "custom_llm_api_key")
            }
          />
        </div>
      </div>

      {/* Model selection dropdown - only show if models are available */}
      {customModelsChecked && customModels.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Only models with function
              calling capabilities (tool calls) or JSON schema support
              will work.
            </p>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Model
          </label>
          <div className="w-full">
            <Popover
              open={openModelSelect}
              onOpenChange={onOpenModelSelectChange}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openModelSelect}
                  className="w-full h-12 px-4 py-4 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors hover:border-gray-400 justify-between"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {customModel || "Select a model"}
                  </span>
                  <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                align="start"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Command>
                  <CommandInput placeholder="Search model..." />
                  <CommandList>
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup>
                      {customModels.map((model, index) => (
                        <CommandItem
                          key={index}
                          value={model}
                          onSelect={(value) => {
                            onInputChange(value, "custom_model");
                            onOpenModelSelectChange(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              customModel === model
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {model}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Check for available models button - show when no models checked or no models found */}
      {(!customModelsChecked ||
        (customModelsChecked && customModels.length === 0)) && (
          <div className="mb-4">
            <button
              onClick={onFetchCustomModels}
              disabled={customModelsLoading || !customLlmUrl}
              className={`w-full py-2.5 px-4 rounded-lg transition-all duration-200 border-2 ${customModelsLoading || !customLlmUrl
                ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500"
                : "bg-white border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500/20"
                }`}
            >
              {customModelsLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking for models...
                </div>
              ) : (
                "Check for available models"
              )}
            </button>
          </div>
        )}

      {/* Show message if no models found */}
      {customModelsChecked && customModels.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            No models found. Please make sure models are available.
          </p>
        </div>
      )}
    </>
  );
} 