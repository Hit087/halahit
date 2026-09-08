import { prisma } from "@/lib/prisma";
import { NewsletterCampaignForm } from "./NewsletterCampaignForm";

export default async function AdminNewsletterPage() {
  const count = await prisma.newsletterSubscriber.count();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">النشرة البريدية</h1>
      <p className="mb-8 text-sm text-text/60">
        عدد المشتركين الحاليين: <strong>{count}</strong>
      </p>

      <NewsletterCampaignForm />
    </div>
  );
}
