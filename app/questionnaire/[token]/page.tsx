import { validateToken } from '@/lib/tokens'
import { redirect } from 'next/navigation'
import QuestionnaireShell from '@/components/questionnaire/QuestionnaireShell'

interface Props {
  params: { token: string }
}

export default async function QuestionnairePage({ params }: Props) {
  const { token } = params
  const result = await validateToken(token)

  if (!result.valid) {
    redirect(`/access/${token}`)
  }

  return <QuestionnaireShell token={token} />
}
