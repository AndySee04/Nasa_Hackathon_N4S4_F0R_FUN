import PageHeader from '../components/PageHeader'
import Paper, { type PaperTone } from '../components/Paper'
import { artifacts } from '../data'
import { usePageContext } from '../hooks/usePageContext'

const STACK = [
  ['React + TypeScript + Vite', 'The website itself: reusable components with type-checked data.'],
  ['Tailwind CSS + Framer Motion', 'The crayon-and-paper look, responsive layouts and bouncy animations.'],
  ['HTML canvas', 'The crayon solar system: every planet is coloured in by code, so there are no big images to download.'],
  ['Python + FastAPI', 'The Astro AI server: safety checks, fact retrieval and the AI model connection.'],
  ['NASA Image and Video Library API', 'Real NASA photos for each artifact, loaded live.'],
  ['Supabase', 'Optional grown-up accounts with Google sign-in, which keep game stars on any device.'],
]

/** Each section is its own piece of paper. */
function Card({ title, tone, tilt, className = '', children }: { title: string; tone?: PaperTone; tilt: number; className?: string; children: React.ReactNode }) {
  return (
    <Paper as="section" tone={tone} tilt={tilt} className={className} innerClassName="h-full p-6 sm:p-8">
      <h2 className="scribble inline-block text-2xl">{title}</h2>
      {children}
    </Paper>
  )
}

export default function About() {
  usePageContext('about')
  const sourceCount = new Set(artifacts.flatMap((a) => a.sources.map((s) => s.url))).size

  return (
    <>
      <PageHeader eyebrow="About the project" title="About N4S4 F0R FUN">
        A story-driven digital space museum built for the 2026 NASA Space Apps Challenge, to introduce school-age space fans to
        the hardware humanity has left across the solar system.
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-9 px-4 sm:px-6 lg:grid-cols-2">
        <Card title="The challenge" tilt={-0.6}>
          <p className="mt-3 text-lg">
            Since the 1960s, NASA has left rovers, landers, descent stages and probes on the Moon, on Mars and in deep space.
            Children usually only hear about today&apos;s missions. This project tells the stories of the machines that paved
            the way, and the science they made possible.
          </p>
        </Card>

        <Card title="Accuracy and sources" tilt={0.7} tone="mint">
          <p className="mt-3 text-lg">
            Every artifact record lists its sources ({sourceCount} unique references so far), mainly NASA&apos;s Space
            Science Data Coordinated Archive (NSSDCA) and NASA Science. Dates are in UTC and can differ by a day from local
            time. Spotted a mistake? Please open an issue on our{' '}
            <a href="https://github.com/Yi0711/Nasa_Hackathon_N4S4_F0R_FUN/issues" target="_blank" rel="noopener noreferrer" className="link">
              GitHub repository
            </a>
            .
          </p>
        </Card>

        <Card title="Safety and privacy for children" tilt={0.5} tone="yellow">
          <ul className="mt-3 space-y-2 text-lg">
            <li>• No advertising or tracking. Everything works without an account.</li>
            <li>• Accounts are optional and for grown-ups: sign in with Google to keep game stars on any device. We keep only the name, email and profile picture Google shares, plus the game stars, and never share them.</li>
            <li>• Astro AI does not ask for, and tries to block, personal information such as names, addresses and phone numbers.</li>
            <li>• Astro only talks about space and science, and gently redirects other topics.</li>
            <li>• Chats are not saved by our server. If an AI model is connected, questions are sent to that provider to generate an answer.</li>
            <li>• Astro cannot run code, browse the web or take actions. It can only answer questions.</li>
          </ul>
        </Card>

        <Card title="How it is built" tilt={-0.5}>
          <ul className="mt-3 space-y-3">
            {STACK.map(([name, why]) => (
              <li key={name}>
                <p className="font-display text-lg">{name}</p>
                <p className="muted">{why}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Team" tilt={-0.3} tone="sky" className="lg:col-span-2">
          <p className="mt-3 text-lg">
            Built by team N4S4 F0R FUN for the 2026 NASA Space Apps Challenge. This is a student hackathon project and is not
            affiliated with or endorsed by NASA. NASA images are used under NASA&apos;s media usage guidelines.
          </p>
        </Card>
      </div>
    </>
  )
}
