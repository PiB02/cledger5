import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Créer un compte Cledger5
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez la communauté et trouvez votre prochain emploi avec l'IA
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border border-gray-200",
            }
          }}
        />
      </div>
    </div>
  )
}