import { createFileRoute } from "@tanstack/react-router";
import { CedarLotApp } from "@/components/cedar-lot-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CedarLotApp />;
}
