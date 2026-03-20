export default function JobDetailsPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h2>Job #{params.id}</h2>
      <p>Detailed page scaffold (next push: tx hashes, receipts, verifier evidence).</p>
    </main>
  );
}
