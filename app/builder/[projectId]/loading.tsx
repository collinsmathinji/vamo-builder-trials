import { Skeleton } from "@/components/ui/skeleton";

export default function BuilderLoading() {
  return (
    <div className="flex flex-col h-screen min-h-0">
      <header className="flex-shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <div className="flex-1 flex min-h-0 p-2 sm:p-3 gap-2 sm:gap-3">
        <div className="hidden lg:flex flex-col w-[280px] xl:w-[320px] flex-shrink-0 gap-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="flex-1 min-h-[200px] rounded-lg" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <Skeleton className="flex-1 min-h-[300px] rounded-lg" />
        </div>
        <div className="hidden md:flex flex-col w-[280px] xl:w-[320px] flex-shrink-0 gap-3 overflow-auto">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
