"use client";

import { useState } from "react";
import { TEMPLATE_VARIABLES } from "@/lib/email/template-variables";

interface VariableHelpProps {
  onInsert?: (variable: string) => void;
}

export function VariableHelp({ onInsert }: VariableHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Template Variables
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Available Variables</h4>
              <p className="text-xs text-gray-500 mt-1">
                Use these in your subject or body. Click to insert.
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.variable}
                  type="button"
                  onClick={() => {
                    onInsert?.(v.variable);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <code className="text-sm font-mono text-blue-600">
                    {v.variable}
                  </code>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {v.description}
                  </p>
                  <p className="text-xs text-gray-400">e.g., {v.example}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
