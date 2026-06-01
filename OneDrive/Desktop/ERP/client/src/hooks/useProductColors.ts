import { useQuery } from "@tanstack/react-query";
import { api } from "../api/http";
import { PRODUCT_COLOR_OPTIONS } from "../data/colors";

export function useProductColors() {
  const { data } = useQuery({
    queryKey: ["inventory-meta"],
    queryFn: async () => (await api.get("/inventory/meta")).data as { productColors?: string[] },
    staleTime: 60_000
  });

  const colors = data?.productColors?.length ? data.productColors : [...PRODUCT_COLOR_OPTIONS];

  async function addColor(color: string) {
    const { data: res } = await api.post("/settings/colors", { color });
    return res.productColors as string[];
  }

  return { colors, addColor };
}
