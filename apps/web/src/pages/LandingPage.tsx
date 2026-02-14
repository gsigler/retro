import { Link } from 'react-router'
import { Brain, Link2, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description:
      'Automatically surface themes, sentiment trends, and actionable takeaways from your retro feedback.',
  },
  {
    icon: Link2,
    title: 'Zero-Friction Joining',
    description:
      'Participants join via a simple link — no account required. Start collaborating in seconds.',
  },
  {
    icon: Radio,
    title: 'Real-Time Collaboration',
    description:
      'Add cards, vote, and discuss together in real time. Everyone stays in sync, no refresh needed.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4 py-32">
        <div className="bg-primary/5 absolute -top-24 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <span className="text-primary bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium">
            Now in Early Access
          </span>
          <h1 className="max-w-3xl text-center text-5xl leading-tight font-bold tracking-tight sm:text-6xl">
            Run better retros with{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              AI-powered insights
            </span>
          </h1>
          <p className="text-muted-foreground max-w-lg text-center text-lg leading-relaxed">
            AI-powered team retrospectives with zero-friction participation.
            Share a link and start collaborating — no sign-up required for
            participants.
          </p>
          <Button asChild size="lg" className="mt-2 px-8 text-base">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-violet-600">
            Features
          </h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-xl text-center text-lg">
            Everything you need to run effective retrospectives, minus the
            hassle.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-muted-foreground border-t px-4 py-6 text-center text-sm">
        &copy; {new Date().getFullYear()} Retro. All rights reserved.
      </footer>
    </div>
  )
}
