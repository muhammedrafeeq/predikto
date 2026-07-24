import { HomeSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] pt-20 pb-28 px-4 sm:px-6 max-w-[1200px] mx-auto">
      <HomeSkeleton />
    </div>
  );
}
