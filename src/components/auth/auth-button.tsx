'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { LogIn, User } from 'lucide-react'

export default function AuthButton() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <Link href="/sign-in">
          <Button variant="outline" size="sm">
            <LogIn className="h-4 w-4 mr-2" />
            Se connecter
          </Button>
        </Link>
      </SignedOut>
      
      <SignedIn>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            }
          }}
        />
      </SignedIn>
    </div>
  )
}