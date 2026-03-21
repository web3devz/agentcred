export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h2>Job #{id}</h2>
      <p>Detailed page scaffold (next push: tx hashes, receipts, verifier evidence).</p>
    </main>
  );
}
