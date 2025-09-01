import { UserProfile } from '@clerk/nextjs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserProfileForm from '@/components/profile/user-profile-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Mon Profil
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gérez vos informations personnelles et professionnelles
            </p>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <Tabs defaultValue="professional" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="professional">Profil Professionnel</TabsTrigger>
              <TabsTrigger value="account">Compte & Sécurité</TabsTrigger>
            </TabsList>
            
            <TabsContent value="professional" className="space-y-6 mt-6">
              <UserProfileForm />
            </TabsContent>
            
            <TabsContent value="account" className="mt-6">
              <UserProfile 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-none",
                    navbar: "hidden",
                    pageScrollBox: "p-0"
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}