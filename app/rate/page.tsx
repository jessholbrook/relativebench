import { RatingWorkspace } from '@/components/rating-workspace';
import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata('/rate', 'Try the rater experience | RelativeBench',
  'Try example ratings with model names hidden. Progress stays in your browser; ratings are not submitted to a study.', false);

export default function RatePage() {
  return <RatingWorkspace packetUrl="/rating/internal-rating-packet.json" />;
}
