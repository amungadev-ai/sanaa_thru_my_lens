import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatViews } from "@/lib/posts";
import type { PublicPost } from "@/lib/posts";

interface ArticleCardProps {
  post: PublicPost;
  variant?: "default" | "featured" | "compact" | "horizontal";
  className?: string;
  priority?: boolean;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Music Reviews": "from-rose-600 to-red-800",
  "Literature": "from-amber-500 to-orange-700",
  "Culture & Opinion": "from-emerald-600 to-teal-800",
  "Scene Reports": "from-violet-600 to-purple-800",
  "Features": "from-stone-600 to-stone-800",
};

function gradientFor(category: string | null): string {
  return CATEGORY_GRADIENTS[category ?? ""] ?? "from-stone-600 to-stone-800";
}

import { formatDateSafe } from "@/lib/date-utils";

export function ArticleCard({ post, variant = "default", className, priority }: ArticleCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/post/${post.slug}`}
        className={cn("group flex gap-3", className)}
      >
        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={post.coverImage ?? "/images/covers/default.svg"}
            alt={post.title}
            fill
            sizes="80px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {post.category}
          </span>
          <h4 className="line-clamp-2 font-serif text-sm font-bold leading-snug group-hover:text-primary">
            {post.title}
          </h4>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link
        href={`/post/${post.slug}`}
        className={cn("group grid grid-cols-1 gap-5 sm:grid-cols-[200px_1fr]", className)}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-md sm:aspect-square">
          <Image
            src={post.coverImage ?? "/images/covers/default.svg"}
            alt={post.title}
            fill
            sizes="200px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-primary">
              {post.category}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDateSafe(post.createdAt)}</span>
          </div>
          <h3 className="mt-2 font-serif text-xl font-bold leading-tight transition-colors group-hover:text-primary">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min read</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(post.views)}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={`/post/${post.slug}`}
        className={cn("group relative block overflow-hidden rounded-lg", className)}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-[16/9]">
          <Image
            src={post.coverImage ?? "/images/covers/default.svg"}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 font-semibold uppercase tracking-wider text-primary-foreground">
              Featured
            </span>
            <span className="font-semibold uppercase tracking-wider text-white/85">
              {post.category}
            </span>
          </div>
          <h2 className="mt-3 max-w-3xl font-serif text-2xl font-bold leading-tight text-white md:text-4xl">
            {post.title}
          </h2>
          <p className="mt-2 max-w-2xl line-clamp-2 text-sm text-white/80 md:text-base">
            {post.excerpt}
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-white/70">
            <span>By {post.author}</span>
            <span>·</span>
            <span>{formatDateSafe(post.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min read</span>
          </div>
        </div>
      </Link>
    );
  }

  // Default vertical card
  return (
    <Link
      href={`/post/${post.slug}`}
      className={cn("group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md", className)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={post.coverImage ?? "/images/covers/default.svg"}
          alt={post.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className={cn("absolute inset-0 bg-gradient-to-tr opacity-0 transition-opacity group-hover:opacity-20", gradientFor(post.category))} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-primary">
            {post.category}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{formatDateSafe(post.createdAt)}</span>
        </div>
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min read</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(post.views)}</span>
        </div>
      </div>
    </Link>
  );
}
