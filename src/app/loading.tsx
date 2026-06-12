export default function Loading() {
  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-6 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#D4D4D4]" />
            <div className="h-6 w-44 animate-pulse rounded-full bg-[#D4D4D4]" />
          </div>
          <div className="h-11 w-11 animate-pulse rounded-full bg-white shadow-sm" />
        </div>

        <div className="mt-6 h-40 animate-pulse rounded-[22px] bg-[#171717] shadow-lg shadow-black/10" />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-28 animate-pulse rounded-[18px] bg-[#E5E5E5]" />
          <div className="h-28 animate-pulse rounded-[18px] bg-[#E5E5E5]" />
          <div className="h-28 animate-pulse rounded-[18px] bg-[#E5E5E5]" />
          <div className="h-28 animate-pulse rounded-[18px] bg-[#E5E5E5]" />
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-24 animate-pulse rounded-[18px] bg-white" />
          <div className="h-24 animate-pulse rounded-[18px] bg-white" />
        </div>
      </div>
    </main>
  );
}
