interface GoogleConfigProps {
  googleApiKey: string;
  onInputChange: (value: string, field: string) => void;
}

export default function GoogleConfig({ googleApiKey, onInputChange }: GoogleConfigProps) {
  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Google API Key
      </label>
      <div className="relative">
        <input
          type="text"
          value={googleApiKey}
          onChange={(e) => onInputChange(e.target.value, "google_api_key")}
          className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          placeholder="Enter your API key"
        />
      </div>
      <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
        <span className="block w-1 h-1 rounded-full bg-gray-400"></span>
        Your API key will be stored locally and never shared
      </p>
    </div>
  );
} 