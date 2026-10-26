import { redirect } from "next/navigation";

// Стара адреса: фотографиите сега се управуваат од профилот (по најава).
export default function HostPhotosPage() {
  redirect("/host/dashboard");
}
