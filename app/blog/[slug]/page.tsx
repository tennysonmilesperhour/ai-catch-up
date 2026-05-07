import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { formatDate, getPost, listPosts } from "@/lib/blog";

type Params = { slug: string };
type Props = { params: Promise<Params> };

export async function generateStaticParams(): Promise<Params[]> {
  return listPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.summary || undefined,
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="aurora-page min-h-screen">
      <SiteHeader />
      <article className="px-6 md:px-12 py-20 md:py-28 max-w-2xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] mb-6">
          {formatDate(post.date)}
          {post.author ? ` / ${post.author}` : ""}
        </p>
        <h1 className="font-serif text-3xl md:text-5xl leading-[1.1] text-[var(--color-dark)] mb-8">
          {post.title}
        </h1>
        {post.summary && (
          <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-10 leading-relaxed italic">
            {post.summary}
          </p>
        )}
        <div className="prose-blog">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>
        <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex items-center justify-between gap-4 font-mono text-xs">
          <Link
            href="/blog"
            className="text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors uppercase tracking-[0.10em]"
          >
            &larr; All posts
          </Link>
          <Link
            href="/"
            className="text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors uppercase tracking-[0.10em]"
          >
            Landing
          </Link>
        </div>
      </article>
    </main>
  );
}
