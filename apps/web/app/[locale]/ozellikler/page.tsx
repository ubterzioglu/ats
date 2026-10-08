import { redirect } from "@/i18n/navigation";

interface OzelliklerPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function OzelliklerPage({ params }: OzelliklerPageProps) {
  const { locale } = await params;
  redirect({ href: "/features", locale });
}
