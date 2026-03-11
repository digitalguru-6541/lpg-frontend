import Link from 'next/link';
import { Building2 } from 'lucide-react'; 

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Area */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-900">
          <Building2 className="h-6 w-6" />
          <span>LahorePropertyGuide</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-8 font-medium text-gray-600 md:flex">
          <Link href="/properties" className="hover:text-blue-600 transition-colors">
            Properties
          </Link>
          <Link href="/agents" className="hover:text-blue-600 transition-colors">
            Agencies
          </Link>
          
          {/* Call to Action / B2B Login */}
          <Link 
            href="/login" 
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
          >
            Partner Portal
          </Link>
        </div>
      </div>
    </nav>
  );
}