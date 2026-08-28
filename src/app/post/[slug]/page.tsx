import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Clock,
  Eye,
  Calendar,
  Share2,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Tag,
} from "lucide-react";
import { db } from "@/lib/db";
import { getPostBySlug, getRelatedPosts, tagsList, formatViews } from "@/lib/posts";
import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { ViewTracker } from "@/components/blog/ViewTracker";
import { NewsletterForm } from "@/components/blog/NewsletterForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [post.author],
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  const related = await getRelatedPosts(post, 3);
  const tags = tagsList(post.tags);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <article className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border/60 bg-secondary/20">
          <div className="mx-auto max-w-3xl px-4 py-3 md:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to all stories
            </Link>
          </div>
        </div>

        {/* Header */}
        <header className="mx-auto max-w-3xl px-4 pt-10 md:px-6 md:pt-14">
          {post.category && (
            <Link
              href={`/category/${post.category.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-")}`}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/20"
            >
              {post.category}
            </Link>
          )}
          <h1 className="display-serif mt-4 text-3xl leading-[1.1] text-foreground md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground md:text-xl">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {post.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">{post.author}</span>
                <span className="text-xs text-muted-foreground">Editor</span>
              </div>
            </div>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min read
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {formatViews(post.views)} views
            </span>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mx-auto mt-8 max-w-5xl px-4 md:px-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5">
            <div>
              <p className="font-serif text-base font-bold">Enjoyed this story?</p>
              <p className="text-sm text-muted-foreground">Share it with your circle.</p>
            </div>
            <ShareButtons title={post.title} slug={post.slug} />
          </div>

          {/* Author bio */}
          <div className="mt-8 rounded-lg border border-border bg-secondary/30 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {post.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Written by</p>
                <p className="font-serif text-lg font-bold">{post.author}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Sanaa Thrumylens is an independent Kenyan creative-arts blog covering music,
                  literature, culture and the people shaping East Africa&apos;s creative economy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter CTA */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
            <NewsletterForm />
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-border bg-secondary/20">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
              <h2 className="font-serif text-2xl font-bold">Keep Reading</h2>
              <p className="mt-1 text-sm text-muted-foreground">More stories you might enjoy.</p>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <ArticleCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      <SiteFooter />
      <ViewTracker postId={post.id} />
    </div>
  );
}
