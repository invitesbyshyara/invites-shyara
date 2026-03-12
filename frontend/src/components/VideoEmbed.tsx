interface VideoEmbedProps {
  url: string;
}

const VideoEmbed = ({ url }: VideoEmbedProps) => {
  const embedUrl = url
    .replace(/.*youtube\.com\/watch\?v=([^&]+).*/, 'https://www.youtube.com/embed/$1')
    .replace(/.*youtu\.be\/([^?]+).*/, 'https://www.youtube.com/embed/$1');

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden border border-border">
      <iframe
        src={embedUrl}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full h-full"
        title="Video"
      />
    </div>
  );
};

export default VideoEmbed;
