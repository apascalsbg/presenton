import { toast } from "sonner";

export interface OllamaModel {
  label: string;
  value: string;
  description: string;
  size: string;
  icon: string;
}

export interface DownloadingModel {
  name: string;
  size: number | null;
  downloaded: number | null;
  status: string;
  done: boolean;
}

export interface LLMConfig {
  LLM?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  OLLAMA_URL?: string;
  OLLAMA_MODEL?: string;
  CUSTOM_LLM_URL?: string;
  CUSTOM_LLM_API_KEY?: string;
  CUSTOM_MODEL?: string;
  PEXELS_API_KEY?: string;
  PIXABAY_API_KEY?: string;
  IMAGE_PROVIDER?: string;
  USE_CUSTOM_URL?: boolean;
}

export interface OllamaModelsResult {
  models: OllamaModel[];
  updatedConfig?: LLMConfig;
}

/**
 * Updates LLM configuration based on field changes
 */
export const updateLLMConfig = (
  currentConfig: LLMConfig,
  field: string,
  value: string
): LLMConfig => {
  const fieldMappings: Record<string, keyof LLMConfig> = {
    openai_api_key: "OPENAI_API_KEY",
    google_api_key: "GOOGLE_API_KEY",
    ollama_url: "OLLAMA_URL",
    ollama_model: "OLLAMA_MODEL",
    custom_llm_url: "CUSTOM_LLM_URL",
    custom_llm_api_key: "CUSTOM_LLM_API_KEY",
    custom_model: "CUSTOM_MODEL",
    pexels_api_key: "PEXELS_API_KEY",
    pixabay_api_key: "PIXABAY_API_KEY",
    image_provider: "IMAGE_PROVIDER",
  };

  const configKey = fieldMappings[field];
  if (configKey) {
    return { ...currentConfig, [configKey]: value };
  }

  return currentConfig;
};

/**
 * Changes the provider and sets appropriate defaults
 */
export const changeProvider = (
  currentConfig: LLMConfig,
  provider: string
): LLMConfig => {
  const newConfig = { ...currentConfig, LLM: provider };

  // Auto Select appropriate image provider based on the text models
  if (provider === "openai") {
    newConfig.IMAGE_PROVIDER = "dall-e-3";
  } else if (provider === "google") {
    newConfig.IMAGE_PROVIDER = "gemini_flash";
  } else {
    newConfig.IMAGE_PROVIDER = "pexels"; // default for ollama and custom
  }

  return newConfig;
};

/**
 * Fetches supported Ollama models
 */
export const fetchOllamaModels = async (): Promise<OllamaModel[]> => {
  try {
    const response = await fetch("/api/v1/ppt/ollama/models/supported");
    const models = await response.json();
    return models || [];
  } catch (error) {
    console.error("Error fetching ollama models:", error);
    return []; // Ensure we always return an empty array on error
  }
};

/**
 * Fetches Ollama models and validates current selection
 * Returns models and updated config if needed
 */
export const fetchOllamaModelsWithConfig = async (
  config: LLMConfig
): Promise<OllamaModelsResult> => {
  try {
    const models = await fetchOllamaModels();

    // Check if currently selected model is still available
    let updatedConfig: LLMConfig | undefined;
    if (config.OLLAMA_MODEL && models && models.length > 0) {
      const isModelAvailable = models.some(
        (model: OllamaModel) => model.value === config.OLLAMA_MODEL
      );
      if (!isModelAvailable) {
        updatedConfig = { ...config, OLLAMA_MODEL: "" };
      }
    }

    return {
      models,
      updatedConfig
    };
  } catch (error) {
    console.error("Error fetching ollama models:", error);
    return {
      models: [],
      updatedConfig: { ...config, OLLAMA_MODEL: "" }
    };
  }
};

export const checkIfSelectedOllamaModelIsPulled = async (ollamaModel: string) => {
  try {
    const response = await fetch('/api/v1/ppt/ollama/models/available');
    const models = await response.json();
    const pulledModels = models.map((model: any) => model.name);
    return pulledModels.includes(ollamaModel);
  } catch (error) {
    console.error('Error checking if selected Ollama model is pulled:', error);
    return false;
  }
}

/**
 * Fetches available custom models
 */
export const fetchCustomModels = async (
  url: string,
  apiKey: string
): Promise<string[]> => {
  try {
    const response = await fetch("/api/v1/ppt/custom_llm/models/available", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url || "",
        api_key: apiKey || "",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    toast.info("Could not fetch custom models");
    console.error("Error fetching custom models:", error);
    throw error;
  }
};

/**
 * Resets downloading model state
 */
export const resetDownloadingModel = (): DownloadingModel => ({
  name: "",
  size: null,
  downloaded: null,
  status: "",
  done: false,
});

/**
 * Pulls Ollama model with progress tracking
 * Returns a promise that resolves with the final downloading model state
 */
export const pullOllamaModel = async (
  model: string,
  onProgress?: (model: DownloadingModel) => void
): Promise<DownloadingModel> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/v1/ppt/ollama/model/pull?model=${model}`
        );
        if (response.status === 200) {
          const data = await response.json();
          if (data.done && data.status !== "error") {
            clearInterval(interval);
            onProgress?.(data);
            resolve(data);
          } else if (data.status === "error") {
            clearInterval(interval);
            const resetData = resetDownloadingModel();
            onProgress?.(resetData);
            reject(new Error("Error occurred while pulling model"));
          } else {
            onProgress?.(data);
          }
        } else {
          clearInterval(interval);
          const resetData = resetDownloadingModel();
          onProgress?.(resetData);
          if (response.status === 403) {
            reject(new Error("Request to Ollama Not Authorized"));
          }
          reject(new Error("Error occurred while pulling model"));
        }
      } catch (error) {
        clearInterval(interval);
        const resetData = resetDownloadingModel();
        onProgress?.(resetData);
        reject(error);
      }
    }, 1000);
  });
};

/**
 * Sets Ollama configuration based on custom URL preference
 */
export const setOllamaConfig = (
  currentConfig: LLMConfig,
  useCustomUrl: boolean
): LLMConfig => {
  let customUrl = "http://localhost:11434";
  if (!useCustomUrl) {
    return {
      ...currentConfig,
      OLLAMA_URL: customUrl,
      USE_CUSTOM_URL: false,
    };
  } else {
    return { ...currentConfig, USE_CUSTOM_URL: true, OLLAMA_URL: customUrl };
  }
};

/**
 * Handles saving configuration with error handling
 */
export const handleSaveConfiguration = async (
  llmConfig: LLMConfig,
  handleSaveLLMConfig: (config: LLMConfig) => Promise<void>,
  pullOllamaModels?: () => Promise<void>
): Promise<void> => {
  try {
    await handleSaveLLMConfig(llmConfig);
    if (llmConfig.LLM === "ollama" && pullOllamaModels) {
      await pullOllamaModels();
    }
    toast.success("Configuration saved successfully");
  } catch (error) {
    console.error("Error:", error);
    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to save configuration",
      {
        description: "Failed to save configuration",
      }
    );
    throw error;
  }
}; 