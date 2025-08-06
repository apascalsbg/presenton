"use client";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Check, ChevronsUpDown, Info } from "lucide-react";
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
import OpenAIConfig from "./OpenAIConfig";
import GoogleConfig from "./GoogleConfig";
import OllamaConfig from "./OllamaConfig";
import CustomConfig from "./CustomConfig";
import {
  OllamaModel,
  LLMConfig,
  updateLLMConfig,
  changeProvider as changeProviderUtil,
  fetchOllamaModelsWithConfig,
  setOllamaConfig,
  fetchCustomModels,
} from "@/utils/providerUtils";
import { IMAGE_PROVIDERS, LLM_PROVIDERS } from "@/utils/providerConstants";

// Button state interface
interface ButtonState {
  isLoading: boolean;
  isDisabled: boolean;
  text: string;
  showProgress: boolean;
  progressPercentage?: number;
  status?: string;
}

interface LLMProviderSelectionProps {
  initialLLMConfig: LLMConfig;
  onConfigChange: (config: LLMConfig) => void;
  buttonState: ButtonState;
  setButtonState: (state: ButtonState | ((prev: ButtonState) => ButtonState)) => void;
}

export default function LLMProviderSelection({
  initialLLMConfig,
  onConfigChange,
  setButtonState,
}: LLMProviderSelectionProps) {
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(initialLLMConfig);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [customModelsLoading, setCustomModelsLoading] = useState<boolean>(false);
  const [customModelsChecked, setCustomModelsChecked] = useState<boolean>(false);
  const [ollamaModelsLoading, setOllamaModelsLoading] = useState<boolean>(false);
  const [useCustomOllamaUrl, setUseCustomOllamaUrl] = useState<boolean>(
    initialLLMConfig.USE_CUSTOM_URL || false
  );
  const [openModelSelect, setOpenModelSelect] = useState(false);
  const [openImageProviderSelect, setOpenImageProviderSelect] = useState(false);

  useEffect(() => {
    onConfigChange(llmConfig);
  }, [llmConfig]);

  useEffect(() => {
    const needsModelSelection =
      (llmConfig.LLM === "ollama" && !llmConfig.OLLAMA_MODEL) ||
      (llmConfig.LLM === "custom" && !llmConfig.CUSTOM_MODEL);

    const needsApiKey =
      ((llmConfig.IMAGE_PROVIDER === "dall-e-3" || llmConfig.LLM === "openai") && !llmConfig.OPENAI_API_KEY) ||
      ((llmConfig.IMAGE_PROVIDER === "gemini_flash" || llmConfig.LLM === "google") && !llmConfig.GOOGLE_API_KEY) ||
      (llmConfig.IMAGE_PROVIDER === "pexels" && !llmConfig.PEXELS_API_KEY) ||
      (llmConfig.IMAGE_PROVIDER === "pixabay" && !llmConfig.PIXABAY_API_KEY);

    setButtonState({
      isLoading: false,
      isDisabled: needsModelSelection || needsApiKey,
      text: needsModelSelection ? "Please Select a Model" : needsApiKey ? "Please Enter API Key" : "Save Configuration",
      showProgress: false
    });

  }, [llmConfig]);

  const input_field_changed = (new_value: string, field: string) => {
    const updatedConfig = updateLLMConfig(llmConfig, field, new_value);
    setLlmConfig(updatedConfig);
  };

  const handleProviderChange = (provider: string) => {
    const newConfig = changeProviderUtil(llmConfig, provider);
    setLlmConfig(newConfig);
    if (provider === "ollama") {
      fetchOllamaModels();
    }
  };

  const fetchOllamaModels = async () => {
    try {
      setOllamaModelsLoading(true);
      const result = await fetchOllamaModelsWithConfig(llmConfig);
      setOllamaModels(result.models);
      if (result.updatedConfig) {
        setLlmConfig(result.updatedConfig);
      }
    } catch (error) {
      console.error("Error fetching Ollama models:", error);
      setOllamaModels([]);
    } finally {
      setOllamaModelsLoading(false);
    }
  };

  const fetchCustomModelsHandler = async () => {
    try {
      setCustomModelsLoading(true);
      const models = await fetchCustomModels(
        llmConfig.CUSTOM_LLM_URL || "",
        llmConfig.CUSTOM_LLM_API_KEY || ""
      );
      setCustomModels(models);
      setCustomModelsChecked(true);
    } catch (error) {
      console.error("Error fetching custom models:", error);
      setCustomModels([]);
    } finally {
      setCustomModelsLoading(false);
    }
  };

  const setOllamaConfigHandler = () => {
    const updatedConfig = setOllamaConfig(llmConfig, useCustomOllamaUrl);
    setLlmConfig(updatedConfig);
  };

  useEffect(() => {
    if (llmConfig.LLM === "ollama") {
      setOllamaConfigHandler();
      fetchOllamaModels();
    }
  }, [llmConfig.LLM]);

  useEffect(() => {
    setOllamaConfigHandler();
  }, [useCustomOllamaUrl]);

  useEffect(() => {
    if (llmConfig.LLM === "custom") {
      setCustomModels([]);
      setCustomModelsChecked(false);
      setLlmConfig({ ...llmConfig, CUSTOM_MODEL: "" });
    }
  }, [llmConfig.CUSTOM_LLM_URL, llmConfig.CUSTOM_LLM_API_KEY]);

  useEffect(() => {
    if (!llmConfig.IMAGE_PROVIDER) {
      if (llmConfig.LLM === "openai") {
        setLlmConfig({ ...llmConfig, IMAGE_PROVIDER: "dall-e-3" });
      } else if (llmConfig.LLM === "google") {
        setLlmConfig({ ...llmConfig, IMAGE_PROVIDER: "gemini_flash" });
      } else {
        setLlmConfig({ ...llmConfig, IMAGE_PROVIDER: "pexels" });
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col mt-10">
      {/* Provider Selection - Fixed Header */}
      <div className="p-2 rounded-2xl border border-gray-200">
        <Tabs
          value={llmConfig.LLM || "openai"}
          onValueChange={handleProviderChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 bg-transparent h-10">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="ollama">Ollama</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>


      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-0 custom_scrollbar">
        <Tabs
          value={llmConfig.LLM || "openai"}
          onValueChange={handleProviderChange}
          className="w-full"
        >
          {/* OpenAI Content */}
          <TabsContent value="openai" className="mt-6">
            <OpenAIConfig
              openaiApiKey={llmConfig.OPENAI_API_KEY || ""}
              onInputChange={input_field_changed}
            />
          </TabsContent>

          {/* Google Content */}
          <TabsContent value="google" className="mt-6">
            <GoogleConfig
              googleApiKey={llmConfig.GOOGLE_API_KEY || ""}
              onInputChange={input_field_changed}
            />
          </TabsContent>

          {/* Ollama Content */}
          <TabsContent value="ollama" className="mt-6">
            <OllamaConfig
              ollamaModel={llmConfig.OLLAMA_MODEL || ""}
              ollamaUrl={llmConfig.OLLAMA_URL || ""}
              useCustomUrl={useCustomOllamaUrl}
              ollamaModels={ollamaModels}
              ollamaModelsLoading={ollamaModelsLoading}
              onInputChange={input_field_changed}
              onUseCustomUrlChange={setUseCustomOllamaUrl}
              openModelSelect={openModelSelect}
              onOpenModelSelectChange={setOpenModelSelect}
              onModelSelect={(modelName: string) => {
                input_field_changed(modelName, "ollama_model");
              }}
            />
          </TabsContent>

          {/* Custom Content */}
          <TabsContent value="custom" className="mt-6">
            <CustomConfig
              customLlmUrl={llmConfig.CUSTOM_LLM_URL || ""}
              customLlmApiKey={llmConfig.CUSTOM_LLM_API_KEY || ""}
              customModel={llmConfig.CUSTOM_MODEL || ""}
              customModels={customModels}
              customModelsLoading={customModelsLoading}
              customModelsChecked={customModelsChecked}
              openModelSelect={openModelSelect}
              onInputChange={input_field_changed}
              onOpenModelSelectChange={setOpenModelSelect}
              onFetchCustomModels={fetchCustomModelsHandler}
            />
          </TabsContent>
        </Tabs>

        {/* Image Provider Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Image Provider
          </label>
          <div className="w-full">
            <Popover
              open={openImageProviderSelect}
              onOpenChange={setOpenImageProviderSelect}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openImageProviderSelect}
                  className="w-full h-12 px-4 py-4 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors hover:border-gray-400 justify-between"
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {llmConfig.IMAGE_PROVIDER
                        ? IMAGE_PROVIDERS[llmConfig.IMAGE_PROVIDER]?.label ||
                        llmConfig.IMAGE_PROVIDER
                        : "Select image provider"}
                    </span>
                  </div>
                  <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                align="start"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Command>
                  <CommandInput placeholder="Search provider..." />
                  <CommandList>
                    <CommandEmpty>No provider found.</CommandEmpty>
                    <CommandGroup>
                      {Object.values(IMAGE_PROVIDERS).map(
                        (provider, index) => (
                          <CommandItem
                            key={index}
                            value={provider.value}
                            onSelect={(value) => {
                              input_field_changed(value, "image_provider");
                              setOpenImageProviderSelect(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                llmConfig.IMAGE_PROVIDER === provider.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex gap-3 items-center">
                              <div className="flex flex-col space-y-1 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-gray-900 capitalize">
                                    {provider.label}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600 leading-relaxed">
                                  {provider.description}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        )
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Dynamic API Key Input for Image Provider */}
        {llmConfig.IMAGE_PROVIDER &&
          IMAGE_PROVIDERS[llmConfig.IMAGE_PROVIDER] &&
          (() => {
            const provider = IMAGE_PROVIDERS[llmConfig.IMAGE_PROVIDER];

            // Show info message when using same API key as main provider
            if (provider.value === "dall-e-3" && llmConfig.LLM === "openai") {
              return <></>;
            }

            if (provider.value === "gemini_flash" && llmConfig.LLM === "google") {
              return <></>;
            }

            // Show API key input for other providers
            return (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {provider.apiKeyFieldLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Enter your ${provider.apiKeyFieldLabel}`}
                    className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    value={
                      provider.apiKeyField === "PEXELS_API_KEY"
                        ? llmConfig.PEXELS_API_KEY || ""
                        : provider.apiKeyField === "PIXABAY_API_KEY"
                          ? llmConfig.PIXABAY_API_KEY || ""
                          : ""
                    }
                    onChange={(e) => {
                      if (provider.apiKeyField === "PEXELS_API_KEY") {
                        input_field_changed(e.target.value, "pexels_api_key");
                      } else if (provider.apiKeyField === "PIXABAY_API_KEY") {
                        input_field_changed(e.target.value, "pixabay_api_key");
                      }
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                  <span className="block w-1 h-1 rounded-full bg-gray-400"></span>
                  API key for {provider.label} image generation
                </p>
              </div>
            );
          })()}

        {/* Model Information */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Selected Models
              </h3>
              <p className="text-sm text-blue-700">
                Using{" "}
                {llmConfig.LLM === "ollama"
                  ? llmConfig.OLLAMA_MODEL ?? "xxxxx"
                  : llmConfig.LLM === "custom"
                    ? llmConfig.CUSTOM_MODEL ?? "xxxxx"
                    : LLM_PROVIDERS[llmConfig.LLM!]?.model_label || "xxxxx"}{" "}
                for text generation and{" "}
                {llmConfig.IMAGE_PROVIDER &&
                  IMAGE_PROVIDERS[llmConfig.IMAGE_PROVIDER]
                  ? IMAGE_PROVIDERS[llmConfig.IMAGE_PROVIDER].label
                  : "xxxxx"}{" "}
                for images
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
} 