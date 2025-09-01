import OfferDetailDashboard from './offer-detail-dashboard'
import { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Détail Offre ${params.id} | Admin Cledger5`,
    description: 'Détails complets d\'une offre d\'emploi avec données d\'enrichissement IA'
  }
}

export default function AdminOfferDetailPage({ params }: Props) {
  return <OfferDetailDashboard offerId={params.id} />
}