export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Classnest.mk</span>
        <span>Демо верзија – податоците се примерни.</span>
      </div>
    </footer>
  );
}
