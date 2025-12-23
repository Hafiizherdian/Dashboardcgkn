import { redirect } from "next/navigation";

export const metadata = { title: 'Data' };

export default function Page() {
  redirect('/dashboard');
  return null;
}
