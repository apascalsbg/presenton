import { setLLMConfig } from "@/store/slices/userConfig";
import { store } from "@/store/store";

export const handleSaveLLMConfig = async (llmConfig: LLMConfig) => {
  if (!hasValidLLMConfig(llmConfig)) {
    throw new Error("Provided configuration is not valid");
  }
  await fetch("/api/user-config", {
    method: "POST",
    body: JSON.stringify(llmConfig),
  });

  store.dispatch(setLLMConfig(llmConfig));
};

export const hasValidLLMConfig = (llmConfig: LLMConfig) => {
  if (!llmConfig.LLM) return false;
  if (!llmConfig.IMAGE_PROVIDER) return false;
  const OPENAI_API_KEY = llmConfig.OPENAI_API_KEY;
  const GOOGLE_API_KEY = llmConfig.GOOGLE_API_KEY;

  const isOllamaConfigValid =
    llmConfig.OLLAMA_MODEL !== "" &&
    llmConfig.OLLAMA_MODEL !== null &&
    llmConfig.OLLAMA_MODEL !== undefined &&
    llmConfig.OLLAMA_URL !== "" &&
    llmConfig.OLLAMA_URL !== null &&
    llmConfig.OLLAMA_URL !== undefined;

  const isCustomConfigValid =
    llmConfig.CUSTOM_LLM_URL !== "" &&
    llmConfig.CUSTOM_LLM_URL !== null &&
    llmConfig.CUSTOM_LLM_URL !== undefined &&
    llmConfig.CUSTOM_MODEL !== "" &&
    llmConfig.CUSTOM_MODEL !== null &&
    llmConfig.CUSTOM_MODEL !== undefined;

  const isImageConfigValid = () => {
    switch (llmConfig.IMAGE_PROVIDER) {
      case "pexels":
        return llmConfig.PEXELS_API_KEY && llmConfig.PEXELS_API_KEY !== "";
      case "pixabay":
        return llmConfig.PIXABAY_API_KEY && llmConfig.PIXABAY_API_KEY !== "";
      case "dall-e-3":
        return OPENAI_API_KEY && OPENAI_API_KEY !== "";
      case "gemini_flash":
        return GOOGLE_API_KEY && GOOGLE_API_KEY !== "";
      default:
        return false;
    }
  };

  const isLLMConfigValid =
    llmConfig.LLM === "openai"
      ? OPENAI_API_KEY !== "" &&
      OPENAI_API_KEY !== null &&
      OPENAI_API_KEY !== undefined
      : llmConfig.LLM === "google"
        ? GOOGLE_API_KEY !== "" &&
        GOOGLE_API_KEY !== null &&
        GOOGLE_API_KEY !== undefined
        : llmConfig.LLM === "ollama"
          ? isOllamaConfigValid
          : llmConfig.LLM === "custom"
            ? isCustomConfigValid
            : false;

  return isLLMConfigValid && isImageConfigValid();
};
