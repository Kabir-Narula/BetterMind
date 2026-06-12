export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F9F8F5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
        <p className="text-sm text-gray-500 tracking-wide">Loading Mindful AI...</p>
      </div>
    </div>
  )
}
