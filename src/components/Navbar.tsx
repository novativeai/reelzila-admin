"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { Film, LogOut, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
  const { user, credits, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
         
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2 text-2xl font-bold">
          {/* Using a text logo as per the mockup */}
          <span>reelzila</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/explore" className="hover:text-neutral-300 transition-colors">Explore</Link>
          <Link href="/pricing" className="hover:text-neutral-300 transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-neutral-300 transition-colors">About Us</Link>
          <Link href="/blog" className="hover:text-neutral-300 transition-colors">Blog</Link>
          <Link href="/contact" className="hover:text-neutral-300 transition-colors">Contact Us</Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {/* User Icon or Login Buttons */}
          {user ? (
             <Link href="/account">
                {/* Replace with a User Icon */}
                <div className="h-6 w-6 rounded-full border border-white" />
             </Link>
          ) : (
            <Link href="/signin">
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

    </header>
  );
}