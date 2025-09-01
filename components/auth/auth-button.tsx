'use client'

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export default function AuthButton() {
  return (
    <>
      <SignedOut>
        <SignInButton>
          <Button variant="default">
            Se connecter
          </Button>
        </SignInButton>
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
    </>
  )
}