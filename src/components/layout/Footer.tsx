export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-slate-50 py-8 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-7xl px-4">
        <p>© {new Date().getFullYear()} LahorePropertyGuide.com. All rights reserved.</p>
        <p className="mt-2 text-xs">Powered by Advanced AI Lead Routing</p>
      </div>
    </footer>
  );
}