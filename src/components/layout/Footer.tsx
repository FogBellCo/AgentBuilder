export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            UC San Diego &middot; AI Tool Request
          </p>
          <p className="text-xs text-gray-400">
            This is a guidance tool. It does not access or process your data.
          </p>
        </div>
      </div>
    </footer>
  );
}
