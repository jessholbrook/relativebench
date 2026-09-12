import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata('/privacy', 'Your data | RelativeBench', 'How the example rater saves progress and what happens when you export or delete it.');

export default function Privacy() {
  return <main className="min-h-screen bg-[#f3f1ec] px-6 py-10 text-[#171715] sm:px-12">
    <nav className="mx-auto max-w-3xl text-sm" aria-label="Data information navigation"><a href="/" className="underline underline-offset-4">← RelativeBench</a></nav>
    <article className="mx-auto mt-12 max-w-3xl space-y-6 text-lg leading-8">
      <h1 className="font-serif text-4xl">Your data in the example rater</h1>
      <p>The public showcase lets you try the rating workflow. It isn’t a participant study, and your example ratings aren’t added to a benchmark result.</p>
      <h2 className="font-serif text-2xl">What stays in your browser</h2>
      <p>The rater saves your progress, choices, and a hash of your reviewer code in this browser’s local storage. The app doesn’t send those ratings or your code to a collection server. Use a made-up code, not your name, email, password, or other personal information. A hash isn’t a guarantee of anonymity, especially for an easy-to-guess code.</p>
      <h2 className="font-serif text-2xl">Exporting and deleting</h2>
      <p>Export downloads a file to your device; it doesn’t submit anything. If you share that file, the recipient can see its contents. Reset, or Delete local copy after completion, removes that session’s saved browser progress after confirmation. It doesn’t delete files you’ve downloaded. Clearing this site’s browser storage removes all locally saved sessions.</p>
      <p>Progress doesn’t sync between devices and can be lost if browser storage is cleared or unavailable. Export a copy if you want to keep it.</p>
      <h2 className="font-serif text-2xl">Visiting the site</h2>
      <p>The app doesn’t include an analytics or advertising tracker. The hosting service may process request, security, and access information to deliver the site. Following links to GitHub or research sources takes you to services with their own privacy practices.</p>
      <h2 className="font-serif text-2xl">Future studies</h2>
      <p>Real participant collection will need a separate consent process, data-retention rules, and a contact route before it begins. Trying this example isn’t consent to participate in a future study.</p>
      <a className="inline-block underline decoration-brand-coral/50 underline-offset-4" href="/rate">Try the rater experience →</a>
    </article>
  </main>;
}
