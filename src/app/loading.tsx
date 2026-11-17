import LoadingTile from "@/components/ui/loading-tile";

export default function Loading() {
  return (
    <main className="loading-page">
      <LoadingTile
        detail="Preparing the latest products and account data."
        label="Processing request"
      />
    </main>
  );
}
