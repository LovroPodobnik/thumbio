import { useQuery } from "@tanstack/react-query";
import { getVisionCritique } from "../services/ai/visionCritique";

export const useVisionCritique = (thumbnail) =>
  useQuery({
    queryKey: ["critique", thumbnail?.id],
    queryFn: () => getVisionCritique(thumbnail),
    enabled: !!thumbnail
  }); 