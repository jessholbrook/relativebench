export default function NotFound() {
  return <main className="mx-auto min-h-screen max-w-3xl px-6 py-20 text-foreground">
    <h1 className="font-serif text-3xl">That page isn’t here</h1>
    <p className="mt-4 text-lg">The link may have changed. You can head back to RelativeBench to keep exploring.</p>
    <a className="mt-6 inline-block underline underline-offset-4" href="/">Back to RelativeBench →</a>
  </main>;
}
