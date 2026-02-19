"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-2", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  href: string;
} & React.ComponentProps<typeof Link>;

const PaginationLink = ({
  className,
  isActive,
  href,
  ...props
}: PaginationLinkProps) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10",
      isActive
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

type PaginationPreviousProps = {
  href: string;
  text?: string;
} & Omit<React.ComponentProps<typeof Link>, "href">;

const PaginationPrevious = ({
  className,
  href,
  text = "Previous",
  ...props
}: PaginationPreviousProps) => (
  <PaginationItem>
    <Link
      href={href}
      aria-label="Go to previous page"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground [&>span]:last:hidden sm:[&>span]:inline",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{text}</span>
    </Link>
  </PaginationItem>
);
PaginationPrevious.displayName = "PaginationPrevious";

type PaginationNextProps = {
  href: string;
  text?: string;
} & Omit<React.ComponentProps<typeof Link>, "href">;

const PaginationNext = ({
  className,
  href,
  text = "Next",
  ...props
}: PaginationNextProps) => (
  <PaginationItem>
    <Link
      href={href}
      aria-label="Go to next page"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground [&>span]:first:hidden sm:[&>span]:inline",
        className
      )}
      {...props}
    >
      <span>{text}</span>
      <ChevronRight className="h-4 w-4" />
    </Link>
  </PaginationItem>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-10 w-10 items-center justify-center", className)}
    {...props}
  >
    <span className="text-muted-foreground">…</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
