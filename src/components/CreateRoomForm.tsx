"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRoomForm() {
  const router = useRouter();
  const [creatorName, setCreatorName] = useState("");
  const [friendNames, setFriendNames] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFriendField = () => {
    if (friendNames.length < 20) {
      setFriendNames([...friendNames, ""]);
    }
  };

  const removeFriendField = (index: number) => {
    setFriendNames(friendNames.filter((_, i) => i !== index));
  };

  const updateFriendName = (index: number, value: string) => {
    const updated = [...friendNames];
    updated[index] = value;
    setFriendNames(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCreator = creatorName.trim();
    if (!trimmedCreator) {
      setError("Ingresa tu nombre para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const validFriends = friendNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName: trimmedCreator,
          friendNames: validFriends,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear la sala.");
        setIsLoading(false);
        return;
      }

      // Store creator identity in localStorage for this room
      const creatorParticipant = data.participants.find(
        (p: { name: string }) => p.name === trimmedCreator
      );
      if (creatorParticipant) {
        localStorage.setItem(
          `room_identity_${data.code}`,
          JSON.stringify({
            participantId: creatorParticipant.id,
            participantName: creatorParticipant.name,
          })
        );
      }

      router.push(`/sala/${data.code}`);
    } catch {
      setError("Error de conexion. Verifica tu internet e intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Creator name */}
      <div>
        <label
          htmlFor="creatorName"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Tu nombre
        </label>
        <input
          id="creatorName"
          type="text"
          value={creatorName}
          onChange={(e) => {
            setCreatorName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Ej: Carlos"
          maxLength={50}
          required
          autoComplete="given-name"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
        />
      </div>

      {/* Friend names */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombres de tus amigos
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Agrega a las personas con las que vas a dividir gastos.
        </p>
        <div className="space-y-2">
          {friendNames.map((name, index) => (
            <div key={index} className="flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                value={name}
                onChange={(e) => updateFriendName(index, e.target.value)}
                placeholder={`Amigo ${index + 1}`}
                maxLength={50}
                autoComplete="off"
                className="flex-1 min-w-0 rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
              {friendNames.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFriendField(index)}
                  className="flex-shrink-0 rounded-xl p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label={`Eliminar amigo ${index + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {friendNames.length < 20 && (
          <button
            type="button"
            onClick={addFriendField}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 active:scale-95 transition-all"
            aria-label="Agregar otro campo de amigo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Agregar otro amigo
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-slide-down"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-200/50 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2 justify-center">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creando sala...
          </span>
        ) : (
          "Crear sala"
        )}
      </button>
    </form>
  );
}
