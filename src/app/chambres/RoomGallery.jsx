"use client";

import { useState } from "react";
import Image from "next/image";
import AppButton from "@/components/ui/app-button";

export default function RoomGallery({ images, title }) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[index] || images[0];

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }

  function next() {
    setIndex((i) => (i + 1) % total);
  }

  return (
    <div className="room-gallery" aria-label={`Photos ${title}`}>
      <Image
        src={current}
        alt={`${title} - photo ${index + 1}`}
        width={900}
        height={620}
        className="room-photo"
      />
      {total > 1 ? (
        <>
          <AppButton className="room-gallery-btn prev" type="button" aria-label="Photo precedente" onClick={prev}>
            {"<"}
          </AppButton>
          <AppButton className="room-gallery-btn next" type="button" aria-label="Photo suivante" onClick={next}>
            {">"}
          </AppButton>
        </>
      ) : null}
    </div>
  );
}
