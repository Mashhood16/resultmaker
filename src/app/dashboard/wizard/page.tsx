import { TermResultWizard } from '../term-result-wizard'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function WizardPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'school') {
    redirect('/login')
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">
          Result Wizard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Generate automated multi-term report cards in PDF format.</p>
      </header>
      
      <main className="w-full">
        <TermResultWizard />
      </main>
    </div>
  )
}
