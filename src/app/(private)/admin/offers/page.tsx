import OffersManagementDashboard from './offers-dashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestion des Offres | Admin Cledger5',
  description: 'Interface d\'administration pour visualiser et gérer les offres d\'emploi'
}

export default function AdminOffersPage() {
  return <OffersManagementDashboard />
}