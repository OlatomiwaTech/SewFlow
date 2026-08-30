"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";

interface CustomerSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function CustomerSearch({
  onSearch,
  placeholder = "Search customers...",
}: CustomerSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    },
    [onSearch],
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm"
      />
    </div>
  );
}
