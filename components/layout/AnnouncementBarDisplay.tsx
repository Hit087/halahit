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
      <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap text-sm font-medium">
        <span className="mx-4">{combinedText}</span>
        <span className="mx-4">{combinedText}</span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
