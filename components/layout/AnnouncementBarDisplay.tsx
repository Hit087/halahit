"use client";

type Announcement = { id: string; message: string };

export function AnnouncementBarDisplay({
  announcements,
  scrolling,
}: {
  announcements: Announcement[];
  scrolling: boolean;
}) {
  if (announcements.length === 0) return null;

  const combinedText = announcements.map((a) => a.message).join("    ✦    ");

  if (!scrolling) {
    return (
      <div className="bg-[#E91E63] py-2 text-center text-sm font-medium text-white">
        {combinedText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-[#E91E63] py-2 text-white">
      <style>{`
        @keyframes hit-marquee-single {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div
        className="whitespace-nowrap text-sm font-medium"
        style={{ animation: "hit-marquee-single 14s linear infinite" }}
      >
        {combinedText}
      </div>
    </div>
  );
}
