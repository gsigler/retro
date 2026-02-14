import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to Retro</CardTitle>
          <CardDescription>Use your Google account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <a href={`${apiUrl}/auth/google`}>
            <Button className="w-full">Sign in with Google</Button>
          </a>
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:underline"
            >
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
