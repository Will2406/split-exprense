import CreateRoomForm from "@/components/CreateRoomForm";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-8 sm:py-12">
      <main className="w-full max-w-md lg:max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white mb-4 shadow-lg shadow-indigo-200/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dividir Gastos
          </h1>
          <p className="mt-2 text-base text-gray-600 max-w-xs mx-auto">
            Divide los gastos de tu salida con amigos de forma simple y en
            tiempo real.
          </p>
        </div>

        {/* Card with form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-8 animate-slide-up">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Crear una sala nueva
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Ingresa tu nombre y el de tus amigos para comenzar.
          </p>
          <CreateRoomForm />
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-6 px-2">
          Al crear la sala, recibiras un enlace para compartir con tus amigos.
        </p>
      </main>
    </div>
  );
}
