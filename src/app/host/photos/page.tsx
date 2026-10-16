import { redirect } from "next/navigation";

// Стара адреса: фотографиите сега се управуваат од таблата (по најава).
export default function HostPhotosPage() {
  redirect("/host/dashboard");
}
