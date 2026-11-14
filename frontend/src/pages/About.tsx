import PageHeader from '../components/PageHeader'
import { artifacts } from '../data'
import { usePageContext } from '../hooks/usePageContext'

const STACK = [
  ['React + TypeScript + Vite', 'The website itself: reusable components with type-checked data.'],
  ['Tailwind CSS + Framer Motion', 'The space-museum look, responsive layouts and smooth animations.'],
  ['Three.js + React Three Fiber + Drei', 'The interactive 3D solar system.'],
  ['Python + FastAPI', 'The Astro AI server: safety checks, fact retrieval and the AI model connection.'],
  ['NASA Image and Video Library API', 'Real NASA photos for each artifact, loaded live.'],
]

export default function About() {
  usePageContext('about')
  const sourceCount = new Set(artifacts.flatMap((a) => a.sources.map((s) => s.url))).size

  return (
    <>
      <PageHeader eyebrow="About the project" title="About N4S4 F0R FUN">
        A story-driven digital space museum built for the 2026 NASA Space Apps Challenge, to introduce school-age space fans to
        the hardware humanity has left across the solar system.
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <section className="glass p-6 sm:p-8">
          <h2 className="text-2xl font-bold">The challenge</h2>
          <p className="mt-3 text-lg text-muted">
            Since the 1960s, NASA has left rovers, landers, descent stages and probes on the Moon, on Mars and in deep space.
            Children usually only hear about today&apos;s missions. This project tells the stories of the machines that paved
            the way, and the science they made possible.
          </p>
        </section>

        <section className="glass p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Accuracy and sources</h2>
          <p className="mt-3 text-lg text-muted">
            Every artifact record lists its sources ({sourceCount} unique references so far), mainly NASA&apos;s Space
            Science Data Coordinated Archive (NSSDCA) and NASA Science. Dates are in UTC and can differ by a day from local
            time. Spotted a mistake? Please open an issue on our{' '}
            <a href="https://github.com/Yi0711/Nasa_Hackathon_N4S4_F0R_FUN/issues" target="_blank" rel="noopener noreferrer" className="text-cyan underline">
              GitHub repository
            </a>
            .
          </p>
        </section>

        <section className="glass p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Safety and privacy for children</h2>
          <ul className="mt-3 space-y-2 text-lg text-muted">
            <li>• No accounts, sign-ups, advertising or tracking.</li>
            <li>• Astro AI does not ask for, and tries to block, personal information such as names, addresses and phone numbers.</li>
            <li>• Astro only talks about space and science, and gently redirects other topics.</li>
            <li>• Chats are not saved by our server. If an AI model is connected, questions are sent to that provider to generate an answer.</li>
            <li>• Astro cannot run code, browse the web or take actions. It can only answer questions.</li>
          </ul>
        </section>

        <section className="glass p-6 sm:p-8">
          <h2 className="text-2xl font-bold">How it is built</h2>
          <ul className="mt-3 space-y-3">
            {STACK.map(([name, why]) => (
              <li key={name}>
                <p className="font-semibold text-ink">{name}</p>
                <p className="text-muted">{why}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-6 sm:p-8 lg:col-span-2">
          <h2 className="text-2xl font-bold">Team</h2>
          <p className="mt-3 text-lg text-muted">
            Built by team N4S4 F0R FUN for the 2026 NASA Space Apps Challenge. This is a student hackathon project and is not
            affiliated with or endorsed by NASA. NASA images are used under NASA&apos;s media usage guidelines.
          </p>
        </section>
      </div>
    </>
  )
}
