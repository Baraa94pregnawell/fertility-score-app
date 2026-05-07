import { redirect } from 'next/navigation'
import AnalyzingScreen from '@/components/animation/AnalyzingScreen'

interface Props {
  params: { token: string }
  searchParams: { slug?: string }
}

export default function AnalyzingPage({ params, searchParams }: Props) {
  const { slug } = searchParams

  if (!slug) {
    redirect(`/access/${params.token}`)
  }

  return <AnalyzingScreen slug={slug} />
}
