"use client";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-primary py-3">
      <div className="flex justify-center">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-primary-foreground text-base hover:opacity-70 transition-opacity"
          aria-label="ホームに戻る"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span>ホーム</span>
        </button>
      </div>
    </footer>
  );
}
