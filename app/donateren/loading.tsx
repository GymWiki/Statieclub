export default function DonerenLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <div className="mx-auto h-8 w-64 animate-pulse rounded-full bg-gray-200 sm:h-10 sm:w-80" />
      <div className="mx-auto mt-3 h-4 w-72 animate-pulse rounded-full bg-gray-100" />
      <div className="mx-auto mt-8 h-12 w-full max-w-md animate-pulse rounded-xl bg-gray-100" />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
