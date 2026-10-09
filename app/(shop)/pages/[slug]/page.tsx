import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function makeDescription(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 100 ? lastSpace : max).trim()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, active: true },
  });
  if (!page) return {};

  const description = makeDescription(page.content);
  const canonical = `/pages/${page.slug}`;

  return {
    title: page.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      title: page.title,
      description,
      url: canonical,
    },
  };
}

export default async function PublicPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, active: true },
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold">{page.title}</h1>
      <div className="mt-6 whitespace-pre-line leading-relaxed text-text/80">
        {page.content}
      </div>
    </div>
  );
}
