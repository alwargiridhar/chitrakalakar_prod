import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../services/api";

export default function ArtworkImage({ imageKey, alt }) {
  const { token } = useAuth();
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!imageKey) return;

    getImageUrl(imageKey, token)
      .then((res) => setUrl(res.url))
      .catch(() => setUrl(null));
  }, [imageKey, token]);

  if (!imageKey) {
    return <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>;
  }

  if (!url) {
    return <div className="w-full h-full flex items-center justify-center">Loading…</div>;
  }

  return <img src={url} alt={alt} className="w-full h-full object-cover" />;
}
