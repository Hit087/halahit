import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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
